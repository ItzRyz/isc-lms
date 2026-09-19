from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel
from typing import Optional, List
import os

app = FastAPI(title="ISC LMS ML Service", version="1.0.0")

FASTAPI_INTERNAL_SECRET = os.getenv("FASTAPI_INTERNAL_SECRET", "dev-secret")

class RecommendationRequest(BaseModel):
    user_id: str
    learning_progress: float
    quiz_scores: List[float] = []
    assignment_scores: List[float] = []
    attendance_rate: float = 0
    completed_materials: List[str] = []
    division: Optional[str] = None
    course: Optional[str] = None

class RecommendationResponse(BaseModel):
    recommended_materials: List[str]
    recommended_next_step: Optional[str]
    risk_level: str  # low | medium | high
    explanation: str
    confidence: float

def verify_internal_secret(x_internal_secret: str = Header(None)):
    # Next.js harus kirim X-Internal-Secret dari server-only context (AGENTS.md §44)
    if x_internal_secret != FASTAPI_INTERNAL_SECRET:
        raise HTTPException(status_code=401, detail="Invalid internal secret")

@app.get("/health")
def health():
    return {"status": "ok", "service": "isc-lms-ml"}

@app.post("/api/v1/ml/recommendation", response_model=RecommendationResponse)
def recommendation(req: RecommendationRequest, x_internal_secret: str = Header(None)):
    verify_internal_secret(x_internal_secret)
    # Placeholder — ML output advisory only, tidak mutate academic records (AGENTS.md §45)
    risk = "low" if req.learning_progress > 70 else "medium" if req.learning_progress > 40 else "high"
    return RecommendationResponse(
        recommended_materials=["material_1", "material_2"],
        recommended_next_step="Lanjutkan ke modul berikutnya",
        risk_level=risk,
        explanation=f"Progress {req.learning_progress}% — risk {risk}",
        confidence=0.75,
    )

@app.post("/api/v1/ml/learning-analysis")
def learning_analysis(req: RecommendationRequest, x_internal_secret: str = Header(None)):
    verify_internal_secret(x_internal_secret)
    return {"analysis": "placeholder", "request": req.model_dump()}
