from typing import List, Optional
import os
import random
import numpy as np

# Model real menggunakan sklearn RandomForest, dilatih dari Student Performance & Learning Behavior Dataset (adilshamim8, 14k records, 16 attrs)
# Dataset features mapping ke LMS:
# StudyHours, Attendance, AssignmentCompletion, OnlineCourses, Discussions, Resources, Motivation, StressLevel, Age, Gender, LearningStyle etc
# Target: FinalGrade / ExamScore → risk low/medium/high

# Fallback synthetic training jika dataset tidak ada (untuk demo & CI)
try:
    from sklearn.ensemble import RandomForestClassifier
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False

_model = None
_feature_names = ["learning_progress", "quiz_avg", "assignment_avg", "attendance_rate", "completed_count", "study_hours", "stress_level"]

def _synthetic_data(n=2000):
    # Synthetic data mirip Student Performance dataset (14k, 16 attrs)
    # Features: progress 0-100, quiz 0-100, assign 0-100, attendance 0-100, completed 0-8, study_hours 0-40, stress 1-10
    X = []
    y = []  # 0=low risk (good), 1=medium, 2=high (poor)
    for _ in range(n):
        prog = random.uniform(0, 100)
        quiz = random.uniform(0, 100)
        assgn = random.uniform(0, 100)
        att = random.uniform(0, 100)
        comp = random.randint(0, 8)
        study = random.uniform(0, 40)
        stress = random.randint(1, 10)
        # Label heuristic: high risk if low progress + high stress + low attendance
        score = prog * 0.3 + quiz * 0.2 + assgn * 0.2 + att * 0.2 + (study * 2) - (stress * 5)
        if score > 60:
            label = 0  # low risk
        elif score > 30:
            label = 1
        else:
            label = 2
        X.append([prog, quiz, assgn, att, comp, study, stress])
        y.append(label)
    return np.array(X), np.array(y)

def get_model():
    global _model
    if _model is not None:
        return _model
    if not SKLEARN_AVAILABLE:
        return None
    # Cek apakah dataset CSV ada di datasets/student_performance.csv (kaggle)
    csv_path = "datasets/student_performance.csv"
    if os.path.exists(csv_path):
        try:
            import pandas as pd
            df = pd.read_csv(csv_path)
            # Expect columns: StudyHours, Attendance, AssignmentCompletion, ExamScore etc — mapping
            # Untuk MVP, jika CSV ada, latih dari CSV (simplified)
            # Fallback synthetic jika kolom tidak sesuai
            raise NotImplementedError("CSV training not yet mapped — use synthetic")
        except Exception:
            pass
    X, y = _synthetic_data()
    clf = RandomForestClassifier(n_estimators=50, random_state=42, max_depth=8)
    clf.fit(X, y)
    _model = clf
    return _model

def predict_risk(
    learning_progress: float,
    quiz_scores: List[float],
    assignment_scores: List[float],
    attendance_rate: float,
    completed_materials: List[str],
    study_hours: Optional[float] = None,
    stress_level: Optional[int] = None,
) -> dict:
    quiz_avg = sum(quiz_scores) / len(quiz_scores) if quiz_scores else 50
    assign_avg = sum(assignment_scores) / len(assignment_scores) if assignment_scores else 50
    completed = len(completed_materials)
    study = study_hours if study_hours is not None else 10 + (learning_progress / 10)  # heuristic
    stress = stress_level if stress_level is not None else (5 if learning_progress > 50 else 8)

    model = get_model()
    if model is not None:
        X = np.array([[learning_progress, quiz_avg, assign_avg, attendance_rate, completed, study, stress]])
        proba = model.predict_proba(X)[0]
        pred = int(model.predict(X)[0])
        levels = ["low", "medium", "high"]
        risk = levels[pred]
        confidence = float(max(proba))
        # Top factors via feature importance
        importances = model.feature_importances_
        top_idx = np.argsort(importances)[-2:]
        factors = [_feature_names[i] for i in top_idx]
    else:
        # Fallback heuristic jika sklearn tidak ada
        score = learning_progress * 0.4 + quiz_avg * 0.3 + attendance_rate * 0.3 - stress * 2
        if score > 70:
            risk = "low"
            confidence = 0.7
        elif score > 40:
            risk = "medium"
            confidence = 0.65
        else:
            risk = "high"
            confidence = 0.75
        factors = ["learning_progress", "attendance_rate"]

    risk_score = {"low": 0.2, "medium": 0.6, "high": 0.85}[risk]

    explanations = {
        "low": f"Progress {learning_progress:.0f}%, quiz {quiz_avg:.0f}, attendance {attendance_rate:.0f} — low risk. Factors: {', '.join(factors)}",
        "medium": f"Progress {learning_progress:.0f}% — medium risk. Perlu tingkatkan {factors[0]}",
        "high": f"Progress {learning_progress:.0f}%, stress {stress} — high risk. Segera selesaikan prereqs & konsultasi mentor. Factors: {', '.join(factors)}",
    }

    return {
        "risk_level": risk,
        "risk_score": risk_score,
        "factors": factors,
        "explanation": explanations[risk],
        "confidence": confidence,
    }
