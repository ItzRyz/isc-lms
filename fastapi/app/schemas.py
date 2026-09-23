from pydantic import BaseModel, Field
from typing import Optional, List, Literal

# Shared inputs per AGENTS.md §45
class BaseMLRequest(BaseModel):
    user_id: str = Field(..., description="User ID")
    learning_progress: float = Field(..., ge=0, le=100, description="Overall learning progress %")
    quiz_scores: List[float] = Field(default_factory=list, description="Quiz scores 0-100")
    assignment_scores: List[float] = Field(default_factory=list)
    attendance_rate: float = Field(default=0, ge=0, le=100)
    completed_materials: List[str] = Field(default_factory=list)
    prerequisites: List[str] = Field(default_factory=list, description="Prerequisite material IDs (DAG)")
    learning_history: List[str] = Field(default_factory=list, description="Viewed/completed history")
    division: Optional[str] = None
    course: Optional[str] = None

class RecommendationRequest(BaseMLRequest):
    pass

class RecommendationResponse(BaseModel):
    recommended_materials: List[str]
    recommended_courses: List[str] = Field(default_factory=list)
    recommended_next_step: Optional[str] = None
    risk_level: Literal["low", "medium", "high"]
    explanation: str
    confidence: float = Field(ge=0, le=1)

class LearningAnalysisRequest(BaseMLRequest):
    pass

class LearningAnalysisResponse(BaseModel):
    overall_progress: float
    strengths: List[str]
    weaknesses: List[str]
    risk_level: Literal["low", "medium", "high"]
    explanation: str
    confidence: float

class StudentRiskRequest(BaseMLRequest):
    study_hours_per_week: Optional[float] = None
    stress_level: Optional[int] = None  # from Kaggle Student Performance dataset

class StudentRiskResponse(BaseModel):
    risk_level: Literal["low", "medium", "high"]
    risk_score: float = Field(ge=0, le=1, description="Probability of poor performance")
    factors: List[str] = Field(description="Top contributing factors")
    explanation: str
    confidence: float

class ContentRecommendationRequest(BaseModel):
    user_id: str
    division: Optional[str] = None
    completed_courses: List[str] = Field(default_factory=list)
    interests: List[str] = Field(default_factory=list, description="Subjects of interest")
    level: Optional[Literal["Beginner", "Intermediate", "Advanced"]] = None

class ContentRecommendationResponse(BaseModel):
    recommended_courses: List[str]
    recommended_materials: List[str]
    explanation: str
    confidence: float
