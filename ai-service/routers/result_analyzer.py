# ai-service/routers/result_analyzer.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional, Any
from services.llm_service import get_llm_response
import json
import random

router = APIRouter()

class StudentResult(BaseModel):
    student_id: str
    name: str
    roll_no: str
    marks: Dict[str, Dict]  # {subject: {obtained, max, grade}}
    total_obtained: float
    total_max: float
    percentage: float

class ResultAnalysisRequest(BaseModel):
    class_name: str
    exam_name: str
    results: List[StudentResult]
    previous_results: Optional[List[StudentResult]] = None
    provider: Optional[str] = None
    api_key: Optional[str] = None

@router.post("/analyze")
async def analyze_results(request: ResultAnalysisRequest):
    # Compute class stats
    percentages = [r.percentage for r in request.results]
    avg = sum(percentages) / len(percentages) if percentages else 0
    passed = sum(1 for p in percentages if p >= 33)

    # Sort for rank
    sorted_results = sorted(request.results, key=lambda x: x.percentage, reverse=True)
    ranks = {r.student_id: i + 1 for i, r in enumerate(sorted_results)}

    # Subject-wise analysis
    subjects = list(request.results[0].marks.keys()) if request.results else []
    subject_stats = {}
    for subj in subjects:
        subj_scores = [r.marks[subj]["obtained"] / r.marks[subj]["max"] * 100
                      for r in request.results if subj in r.marks]
        if subj_scores:
            subject_stats[subj] = {
                "avg": round(sum(subj_scores) / len(subj_scores), 1),
                "highest": round(max(subj_scores), 1),
                "lowest": round(min(subj_scores), 1),
                "pass_rate": round(sum(1 for s in subj_scores if s >= 33) / len(subj_scores) * 100, 1)
            }

    # AI analysis
    ai_prompt = f"""Analyze these exam results for {request.class_name} in {request.exam_name}:

Class Statistics:
- Total Students: {len(request.results)}
- Class Average: {avg:.1f}%
- Pass Rate: {passed}/{len(request.results)} ({passed/len(request.results)*100:.1f}%)
- Highest Score: {max(percentages):.1f}%
- Lowest Score: {min(percentages):.1f}%

Subject-wise Performance:
{json.dumps(subject_stats, indent=2)}

Top 3 Students: {[r.name for r in sorted_results[:3]]}
Bottom 3 Students (need attention): {[r.name for r in sorted_results[-3:]]}

Provide:
1. Overall class performance summary (2-3 lines)
2. Subjects needing focus (which subjects are weak class-wide)
3. Students needing special attention (low performers)
4. Recommendations for teachers
5. Encouraging message for students

Keep it constructive and actionable. Return plain text (not JSON)."""

    try:
        ai_analysis = await get_llm_response(
            prompt=ai_prompt,
            system_prompt="You are an experienced academic counselor analyzing student performance data.",
            max_tokens=1000,
            provider=request.provider,
            api_key=request.api_key,
        )
    except Exception:
        ai_analysis = "AI analysis not available. Please check AI configuration."

    return {
        "success": True,
        "class_stats": {
            "total": len(request.results),
            "average": round(avg, 1),
            "passed": passed,
            "failed": len(request.results) - passed,
            "pass_rate": round(passed / len(request.results) * 100, 1) if request.results else 0,
            "highest": round(max(percentages), 1) if percentages else 0,
            "lowest": round(min(percentages), 1) if percentages else 0,
        },
        "subject_stats": subject_stats,
        "ranks": ranks,
        "ai_analysis": ai_analysis,
    }


# ─── Seating Arrangement ─────────────────────────────────
from routers.seating import generate_seating as _gen_seating
