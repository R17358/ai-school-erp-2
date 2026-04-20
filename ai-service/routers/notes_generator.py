# ai-service/routers/notes_generator.py
from fastapi import APIRouter
from routers.qp_generator import generate_notes

router = APIRouter()
router.add_api_route("/generate", generate_notes, methods=["POST"])
