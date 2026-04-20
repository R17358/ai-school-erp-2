# ai-service/routers/seating.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import math
import random

router = APIRouter()

class StudentInfo(BaseModel):
    student_id: str
    name: str
    roll_no: str
    class_name: str

class SeatingRequest(BaseModel):
    exam_id: str
    rooms: List[Dict]  # [{room_no, rows, cols, capacity}]
    students: List[StudentInfo]
    strategy: str = "roll_number"  # roll_number | random | interleaved_class

@router.post("/generate")
async def generate_seating(request: SeatingRequest):
    students = request.students.copy()

    if request.strategy == "roll_number":
        students.sort(key=lambda s: s.roll_no)
    elif request.strategy == "random":
        random.shuffle(students)
    elif request.strategy == "interleaved_class":
        # Group by class, then interleave
        class_groups: Dict[str, List] = {}
        for s in students:
            class_groups.setdefault(s.class_name, []).append(s)

        interleaved = []
        class_lists = list(class_groups.values())
        max_len = max(len(lst) for lst in class_lists)
        for i in range(max_len):
            for lst in class_lists:
                if i < len(lst):
                    interleaved.append(lst[i])
        students = interleaved

    arrangements = []
    student_idx = 0

    for room in request.rooms:
        room_no = room["room_no"]
        rows = room["rows"]
        cols = room["cols"]
        capacity = min(room.get("capacity", rows * cols), rows * cols)

        grid = [[None for _ in range(cols)] for _ in range(rows)]
        seat_count = 0

        for r in range(rows):
            for c in range(cols):
                if seat_count >= capacity:
                    break
                if student_idx < len(students):
                    s = students[student_idx]
                    grid[r][c] = {
                        "student_id": s.student_id,
                        "name": s.name,
                        "roll_no": s.roll_no,
                        "class_name": s.class_name,
                        "seat": f"{chr(65 + r)}{c + 1}",  # A1, A2, B1...
                    }
                    student_idx += 1
                    seat_count += 1

        arrangements.append({
            "room_no": room_no,
            "rows": rows,
            "cols": cols,
            "arrangement": grid,
            "students_seated": seat_count,
        })

    remaining = len(students) - student_idx
    return {
        "success": True,
        "exam_id": request.exam_id,
        "arrangements": arrangements,
        "total_students": len(students),
        "seated": student_idx,
        "remaining": remaining,
        "strategy": request.strategy,
    }
