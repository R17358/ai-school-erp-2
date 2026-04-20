# ai-service/routers/study_planner.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict
from services.llm_service import get_llm_response
import json

router = APIRouter()

class StudyPlanRequest(BaseModel):
    student_name: str
    class_name: str
    board: str = "CBSE"
    subjects: List[str]
    exam_date: str
    current_date: str
    weak_subjects: Optional[List[str]] = []
    daily_study_hours: int = 4
    previous_performance: Optional[Dict] = None
    provider: Optional[str] = None
    api_key: Optional[str] = None

@router.post("/plan")
async def generate_study_plan(request: StudyPlanRequest):
    prompt = f"""Create a personalized study plan for:
Student: {request.student_name}
Class: {request.class_name}, Board: {request.board}
Subjects: {', '.join(request.subjects)}
Exam Date: {request.exam_date}
Current Date: {request.current_date}
Daily Study Hours Available: {request.daily_study_hours}
Weak Subjects: {', '.join(request.weak_subjects) if request.weak_subjects else 'None specified'}
Previous Performance: {json.dumps(request.previous_performance) if request.previous_performance else 'Not provided'}

Create a day-by-day study plan until exam. Include:
1. Daily schedule with subject allocation
2. More time for weak subjects
3. Revision days
4. Mock test days
5. Break reminders (Pomodoro technique)
6. Tips for each subject

Return JSON:
{{
  "total_days": 30,
  "daily_hours": {request.daily_study_hours},
  "weekly_schedule": {{
    "Monday": [{{"time": "6:00-7:30", "subject": "Math", "topic": "Algebra", "type": "study"}}],
    ...
  }},
  "subject_allocation": {{"Math": 35, "Science": 25, ...}},
  "milestones": [{{"week": 1, "goal": "Complete chapters 1-3 of each subject"}}],
  "tips": {{"Math": "Practice 10 problems daily", ...}},
  "revision_strategy": "..."
}}"""

    try:
        response = await get_llm_response(
            prompt=prompt,
            system_prompt="You are an expert academic counselor creating personalized study plans.",
            max_tokens=3000,
            json_mode=True,
            provider=request.provider,
            api_key=request.api_key,
        )
        plan = json.loads(response)
        return {"success": True, "plan": plan}
    except json.JSONDecodeError:
        return {"success": True, "plan": {"raw": response}}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
