# ai-service/routers/qp_generator.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from services.llm_service import get_llm_response
import json

router = APIRouter()

class QPRequest(BaseModel):
    subject: str
    class_name: str
    board: str = "CBSE"
    exam_type: str = "Mid Term"
    topics: List[str]
    total_marks: int = 80
    duration_minutes: int = 180
    difficulty: str = "medium"  # easy | medium | hard
    provider: Optional[str] = None
    api_key: Optional[str] = None

class QPSection(BaseModel):
    section: str
    marks_per_question: int
    total_questions: int
    bloom_levels: List[str]

@router.post("/generate")
async def generate_question_paper(request: QPRequest):
    system_prompt = """You are an expert question paper setter for school examinations.
You create balanced, syllabus-aligned question papers following Bloom's Taxonomy.
Always respond in valid JSON format."""

    prompt = f"""Generate a complete question paper for:
Subject: {request.subject}
Class: {request.class_name}
Board: {request.board}
Exam: {request.exam_type}
Total Marks: {request.total_marks}
Duration: {request.duration_minutes} minutes
Difficulty: {request.difficulty}
Topics: {', '.join(request.topics)}

Generate the question paper with these sections:
- Section A: MCQ / 1-mark questions (20% marks)
- Section B: Short answer (30% marks) 
- Section C: Long answer / problem solving (50% marks)

For each question, include:
- question text
- marks
- bloom_level (Remember/Understand/Apply/Analyze/Evaluate/Create)
- topic
- answer_hint (brief)

Return JSON with this structure:
{{
  "title": "...",
  "instructions": "...",
  "sections": [
    {{
      "name": "Section A",
      "instructions": "...",
      "marks": 20,
      "questions": [
        {{
          "no": 1,
          "text": "...",
          "marks": 1,
          "bloom_level": "Remember",
          "topic": "...",
          "type": "MCQ",
          "options": ["A", "B", "C", "D"],
          "answer_hint": "..."
        }}
      ]
    }}
  ],
  "total_marks": {request.total_marks},
  "duration": "{request.duration_minutes} minutes"
}}"""

    try:
        response = await get_llm_response(
            prompt=prompt,
            system_prompt=system_prompt,
            max_tokens=4000,
            json_mode=True,
            provider=request.provider,
            api_key=request.api_key,
        )
        
        try:
            qp_data = json.loads(response)
        except json.JSONDecodeError:
            import re
            json_match = re.search(r'\{.*\}', response, re.DOTALL)
            if json_match:
                qp_data = json.loads(json_match.group())
            else:
                raise HTTPException(status_code=500, detail="AI returned invalid JSON")

        return {"success": True, "question_paper": qp_data}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/notes")
async def generate_notes(
    subject: str,
    topic: str,
    class_name: str,
    detail_level: str = "medium",
    provider: Optional[str] = None,
    api_key: Optional[str] = None,
):
    system_prompt = """You are an expert teacher who creates clear, simple, student-friendly study notes.
Use simple language, real-world examples, and structured format with headings."""

    prompt = f"""Create detailed study notes for:
Subject: {subject}
Topic: {topic}
Class: {class_name}
Detail Level: {detail_level}

Format the notes in Markdown with:
1. Overview / Introduction
2. Key Concepts (with simple explanations)
3. Important Definitions
4. Examples with solutions
5. Diagrams description (where applicable)
6. Summary (bullet points)
7. Practice Questions (5 questions with answers)
8. Memory Tips / Mnemonics

Keep language simple and age-appropriate for class {class_name} students."""

    try:
        notes = await get_llm_response(
            prompt=prompt,
            system_prompt=system_prompt,
            max_tokens=3000,
            provider=provider,
            api_key=api_key,
        )
        return {"success": True, "notes": notes, "topic": topic, "subject": subject}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
