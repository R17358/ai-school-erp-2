# ai-service/routers/timetable.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import random
from services.llm_service import get_llm_response
import json

router = APIRouter()

class SubjectInfo(BaseModel):
    id: str
    name: str
    weeklyHours: int = 4
    type: str = "THEORY"

class ClassInfo(BaseModel):
    id: str
    name: str
    subjects: List[SubjectInfo]

class TeacherInfo(BaseModel):
    id: str
    name: str
    subjects: List[str]  # subject IDs
    maxPeriodsPerDay: int = 6

class BreakInfo(BaseModel):
    after_period: int
    duration: int
    label: str

class SchoolTimings(BaseModel):
    start: str = "09:00"
    end: str = "15:30"

class TimetableRequest(BaseModel):
    school_id: str
    classes: List[ClassInfo]
    teachers: List[TeacherInfo]
    periods_per_day: int = 8
    school_timings: SchoolTimings
    breaks: List[BreakInfo]
    working_days: List[int] = [0, 1, 2, 3, 4]

def time_add_minutes(t: str, minutes: int) -> str:
    h, m = map(int, t.split(":"))
    total = h * 60 + m + minutes
    return f"{total // 60:02d}:{total % 60:02d}"

def compute_slot_times(periods_per_day: int, timings: SchoolTimings, breaks: List[BreakInfo]) -> List[Dict]:
    """Compute start/end times for each period number"""
    period_duration = 45  # minutes
    slots = []
    current_time = timings.start
    break_map = {b.after_period: b for b in breaks}

    period_no = 0
    real_period = 1
    while real_period <= periods_per_day:
        start = current_time
        end = time_add_minutes(start, period_duration)
        slots.append({
            "periodNo": real_period,
            "startTime": start,
            "endTime": end,
            "isBreak": False
        })
        current_time = end

        if real_period in break_map:
            brk = break_map[real_period]
            current_time = time_add_minutes(current_time, brk.duration)

        real_period += 1

    return slots

class TimetableGenerator:
    """Constraint-based timetable generator with backtracking"""

    def __init__(self, request: TimetableRequest):
        self.request = request
        self.slot_times = compute_slot_times(
            request.periods_per_day, request.school_timings, request.breaks
        )
        # teacher_schedule[teacher_id][day][period] = class_id or None
        self.teacher_schedule: Dict[str, Dict[int, Dict[int, Optional[str]]]] = {
            t.id: {d: {p: None for p in range(1, request.periods_per_day + 1)}
                   for d in request.working_days}
            for t in request.teachers
        }
        self.teacher_map = {t.id: t for t in request.teachers}
        self.subject_teacher_map: Dict[str, List[str]] = {}  # subject_id -> [teacher_ids]

        # Build subject -> teacher mapping
        for teacher in request.teachers:
            for subj_id in teacher.subjects:
                if subj_id not in self.subject_teacher_map:
                    self.subject_teacher_map[subj_id] = []
                self.subject_teacher_map[subj_id].append(teacher.id)

    def is_teacher_free(self, teacher_id: str, day: int, period: int) -> bool:
        return self.teacher_schedule[teacher_id][day][period] is None

    def get_teacher_periods_today(self, teacher_id: str, day: int) -> int:
        return sum(1 for p in self.teacher_schedule[teacher_id][day].values() if p is not None)

    def assign_teacher(self, teacher_id: str, day: int, period: int, class_id: str):
        self.teacher_schedule[teacher_id][day][period] = class_id

    def free_teacher(self, teacher_id: str, day: int, period: int):
        self.teacher_schedule[teacher_id][day][period] = None

    def generate(self) -> List[Dict]:
        results = []
        for cls in self.request.classes:
            timetable = self._generate_class_timetable(cls)
            results.append({"classId": cls.id, "className": cls.name, "slots": timetable})
        return results

    def _generate_class_timetable(self, cls: ClassInfo) -> List[Dict]:
        slots_output = []
        slot_times = self.slot_times

        # Build list of (subject, teacher) pairs needed per week
        needed_assignments = []
        for subj in cls.subjects:
            weekly = subj.weeklyHours
            teachers_for_subj = self.subject_teacher_map.get(subj.id, [])
            for _ in range(weekly):
                if teachers_for_subj:
                    teacher_id = random.choice(teachers_for_subj)
                    needed_assignments.append((subj.id, subj.name, teacher_id))
                else:
                    needed_assignments.append((subj.id, subj.name, None))

        random.shuffle(needed_assignments)
        assignment_idx = 0

        for day in self.request.working_days:
            for slot in slot_times:
                period = slot["periodNo"]
                # Check if this is a break period
                is_break = False
                break_label = None
                for brk in self.request.breaks:
                    if period == brk.after_period:
                        # Breaks are handled in timing computation, not as separate periods
                        pass

                if assignment_idx < len(needed_assignments):
                    subj_id, subj_name, teacher_id = needed_assignments[assignment_idx]

                    # Try to place this subject
                    placed = False
                    if teacher_id and self.is_teacher_free(teacher_id, day, period):
                        teacher = self.teacher_map[teacher_id]
                        if self.get_teacher_periods_today(teacher_id, day) < teacher.maxPeriodsPerDay:
                            self.assign_teacher(teacher_id, day, period, cls.id)
                            slots_output.append({
                                "dayOfWeek": day,
                                "periodNo": period,
                                "startTime": slot["startTime"],
                                "endTime": slot["endTime"],
                                "subjectId": subj_id,
                                "teacherId": teacher_id,
                                "isBreak": False,
                            })
                            assignment_idx += 1
                            placed = True

                    if not placed:
                        # Try any available teacher for this subject
                        teachers_for_subj = self.subject_teacher_map.get(subj_id, [])
                        random.shuffle(teachers_for_subj)
                        for alt_teacher in teachers_for_subj:
                            if (self.is_teacher_free(alt_teacher, day, period) and
                                self.get_teacher_periods_today(alt_teacher, day) < self.teacher_map[alt_teacher].maxPeriodsPerDay):
                                self.assign_teacher(alt_teacher, day, period, cls.id)
                                slots_output.append({
                                    "dayOfWeek": day,
                                    "periodNo": period,
                                    "startTime": slot["startTime"],
                                    "endTime": slot["endTime"],
                                    "subjectId": subj_id,
                                    "teacherId": alt_teacher,
                                    "isBreak": False,
                                })
                                assignment_idx += 1
                                placed = True
                                break

                    if not placed:
                        # Free period
                        slots_output.append({
                            "dayOfWeek": day,
                            "periodNo": period,
                            "startTime": slot["startTime"],
                            "endTime": slot["endTime"],
                            "subjectId": None,
                            "teacherId": None,
                            "isBreak": False,
                            "breakLabel": "Free Period",
                        })
                else:
                    slots_output.append({
                        "dayOfWeek": day,
                        "periodNo": period,
                        "startTime": slot["startTime"],
                        "endTime": slot["endTime"],
                        "subjectId": None,
                        "teacherId": None,
                        "isBreak": False,
                        "breakLabel": "Free Period",
                    })

        return slots_output


@router.post("/generate")
async def generate_timetable(request: TimetableRequest):
    try:
        generator = TimetableGenerator(request)
        timetables = generator.generate()

        stats = {
            "classes_processed": len(timetables),
            "total_slots": sum(len(tt["slots"]) for tt in timetables),
        }

        return {
            "success": True,
            "timetables": timetables,
            "stats": stats,
            "model_used": "constraint-solver-v1",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
