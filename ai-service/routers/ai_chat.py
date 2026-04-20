# ai-service/routers/ai_chat.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict
from services.llm_service import get_llm_response

router = APIRouter()

class Message(BaseModel):
    role: str  # user | assistant
    content: str

class ChatRequest(BaseModel):
    messages: List[Message]
    school_context: Optional[Dict] = None
    user_role: str = "STUDENT"
    provider: Optional[str] = None
    api_key: Optional[str] = None

@router.post("/message")
async def chat(request: ChatRequest):
    school_info = ""
    if request.school_context:
        school_info = f"""
School: {request.school_context.get('name', 'Unknown')}
Board: {request.school_context.get('boardType', 'CBSE')}
"""

    system_prompt = f"""You are SchoolBot, an intelligent AI assistant for a school ERP system.
{school_info}
User Role: {request.user_role}

You can help with:
- Answering questions about school policies
- Study tips and subject guidance
- Explaining results and attendance
- Administrative queries
- Academic guidance

Be helpful, friendly, and appropriate for school context.
For sensitive matters (fees, personal data), direct to relevant office."""

    conversation = "\n".join([
        f"{'User' if m.role == 'user' else 'Assistant'}: {m.content}"
        for m in request.messages
    ])

    last_message = request.messages[-1].content if request.messages else ""

    try:
        response = await get_llm_response(
            prompt=last_message,
            system_prompt=system_prompt + f"\n\nConversation so far:\n{conversation[:-len(last_message)-6]}",
            max_tokens=800,
            provider=request.provider,
            api_key=request.api_key,
        )
        return {"success": True, "response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
