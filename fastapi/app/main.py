from fastapi import FastAPI, Header, HTTPException
from app.schemas import (
    RecommendationRequest, RecommendationResponse,
    LearningAnalysisRequest, LearningAnalysisResponse,
    StudentRiskRequest, StudentRiskResponse,
    ContentRecommendationRequest, ContentRecommendationResponse,
)
from app.core.config import settings
from app.services.recommendation import recommend_next_materials, recommend_courses, risk_level
from app.services.learning_analysis import analyze_learning
from app.services.student_risk import predict_risk
from app.services.content_recommendation import recommend_content

app = FastAPI(title="ISC LMS ML Service", version="1.0.0", description="P10 ML — advisory only, tidak mutate grades (§45)")

def verify_internal_secret(x_internal_secret: str = Header(None)):
    if x_internal_secret != settings.fastapi_internal_secret:
        raise HTTPException(status_code=401, detail="Invalid internal secret")

@app.get("/health")
def health():
    return {"status": "ok", "service": "isc-lms-ml", "version": settings.model_version}

@app.post("/api/v1/ml/recommendation", response_model=RecommendationResponse)
def recommendation(req: RecommendationRequest, x_internal_secret: str = Header(None)):
    verify_internal_secret(x_internal_secret)
    quiz_avg = sum(req.quiz_scores) / len(req.quiz_scores) if req.quiz_scores else 50
    assign_avg = sum(req.assignment_scores) / len(req.assignment_scores) if req.assignment_scores else 50
    mats = recommend_next_materials(req.completed_materials, req.division, req.course)
    courses = recommend_courses(req.division, req.completed_materials)
    risk, conf, expl = risk_level(req.learning_progress, req.attendance_rate, quiz_avg)
    # Advisory only §45
    return RecommendationResponse(
        recommended_materials=mats,
        recommended_courses=courses,
        recommended_next_step=f"Lanjutkan ke {mats[0] if mats else 'next module'}",
        risk_level=risk,
        explanation=expl,
        confidence=conf,
    )

@app.post("/api/v1/ml/learning-analysis", response_model=LearningAnalysisResponse)
def learning_analysis(req: LearningAnalysisRequest, x_internal_secret: str = Header(None)):
    verify_internal_secret(x_internal_secret)
    result = analyze_learning(req.learning_progress, req.quiz_scores, req.assignment_scores, req.attendance_rate, req.completed_materials)
    return LearningAnalysisResponse(**result)

@app.post("/api/v1/ml/student-risk", response_model=StudentRiskResponse)
def student_risk(req: StudentRiskRequest, x_internal_secret: str = Header(None)):
    verify_internal_secret(x_internal_secret)
    result = predict_risk(
        req.learning_progress, req.quiz_scores, req.assignment_scores, req.attendance_rate,
        req.completed_materials, req.study_hours_per_week, req.stress_level
    )
    return StudentRiskResponse(**result)

@app.post("/api/v1/ml/content-recommendation", response_model=ContentRecommendationResponse)
def content_recommendation(req: ContentRecommendationRequest, x_internal_secret: str = Header(None)):
    verify_internal_secret(x_internal_secret)
    result = recommend_content(req.division, req.completed_courses, req.interests, req.level)
    return ContentRecommendationResponse(**result)
