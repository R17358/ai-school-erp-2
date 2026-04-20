# ai-service/main.py
from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
from dotenv import load_dotenv

load_dotenv()

from routers import timetable, seating, study_planner, notes_generator, qp_generator, result_analyzer, ai_chat

app = FastAPI(
    title="SchoolSphere AI Microservice",
    description="AI-powered features for SchoolSphere ERP",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # restrict to backend only in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Internal service authentication
async def verify_service_key(x_service_key: str = Header(...)):
    if x_service_key != os.getenv("AI_SERVICE_KEY"):
        raise HTTPException(status_code=403, detail="Invalid service key")
    return True

@app.get("/health")
async def health():
    return {"status": "ok", "service": "SchoolSphere AI", "version": "1.0.0"}

# Mount routers
app.include_router(timetable.router, prefix="/ai/timetable", tags=["Timetable AI"], dependencies=[Depends(verify_service_key)])
app.include_router(seating.router, prefix="/ai/seating", tags=["Seating AI"], dependencies=[Depends(verify_service_key)])
app.include_router(study_planner.router, prefix="/ai/study", tags=["Study Planner"], dependencies=[Depends(verify_service_key)])
app.include_router(notes_generator.router, prefix="/ai/notes", tags=["Notes Generator"], dependencies=[Depends(verify_service_key)])
app.include_router(qp_generator.router, prefix="/ai/qp", tags=["Question Paper"], dependencies=[Depends(verify_service_key)])
app.include_router(result_analyzer.router, prefix="/ai/results", tags=["Result Analyzer"], dependencies=[Depends(verify_service_key)])
app.include_router(ai_chat.router, prefix="/ai/chat", tags=["AI Chat"], dependencies=[Depends(verify_service_key)])

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
