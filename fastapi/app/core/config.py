from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    fastapi_internal_secret: str = "dev-secret"
    host: str = "0.0.0.0"
    port: int = 8000
    # Kaggle datasets paths (synthetic fallback if not downloaded)
    student_performance_dataset: str = "datasets/student_performance.csv"
    udemy_courses_dataset: str = "datasets/udemy_courses.csv"
    # Model params
    model_version: str = "1.0.0"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()
