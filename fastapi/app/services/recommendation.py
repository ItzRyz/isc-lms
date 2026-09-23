from typing import List
import random

# Rule-based + DAG-aware recommendation (advisory, tidak mutate grades §45)
# Untuk model real, akan load dari datasets/MARS atau Udemy, tapi untuk P10 MVP gunakan heuristic yang reproducible

DAG = {
    "html": [],
    "css": ["html"],
    "javascript": ["css"],
    "react": ["javascript"],
    "nextjs": ["react", "html"],
    "backend": ["nextjs"],
    "database": ["backend"],
    "deployment": ["database"],
}

MATERIALS_BY_COURSE = {
    "web": ["html", "css", "javascript", "react", "nextjs", "backend", "database", "deployment"],
    "uiux": ["figma", "design-system", "prototyping", "user-research"],
    "ml": ["python", "numpy", "pandas", "sklearn", "pytorch", "deployment"],
}

def recommend_next_materials(
    completed: List[str],
    division: str | None = None,
    course: str | None = None,
) -> List[str]:
    completed_set = set(completed)
    candidates = MATERIALS_BY_COURSE.get(division or "web", MATERIALS_BY_COURSE["web"])
    # Filter: prereqs met and not completed
    available = []
    for mat in candidates:
        if mat in completed_set:
            continue
        prereqs = DAG.get(mat, [])
        if all(p in completed_set for p in prereqs):
            available.append(mat)
    # If no available (all done), suggest review
    if not available:
        available = [c for c in candidates if c not in completed_set]
    return available[:3]

def recommend_courses(division: str | None, completed: List[str]) -> List[str]:
    if division == "web":
        return ["frontend-development", "backend-development"] if "react" not in completed else ["backend-development"]
    if division == "ml":
        return ["ml-basics", "deep-learning"] if "python" not in completed else ["ml-advanced"]
    if division == "uiux":
        return ["uiux-fundamentals", "design-system"]
    return ["general-course"]

def risk_level(progress: float, attendance: float, quiz_avg: float) -> tuple[str, float, str]:
    # Weighted heuristic, confidence based on data completeness
    score = progress * 0.4 + attendance * 0.3 + quiz_avg * 0.3
    if score > 70:
        return "low", 0.85, f"Progress {progress:.0f}%, attendance {attendance:.0f}%, quiz avg {quiz_avg:.0f} — low risk"
    if score > 40:
        return "medium", 0.75, f"Progress {progress:.0f}% — medium risk, perlu peningkatan di prereqs"
    return "high", 0.8, f"Progress {progress:.0f}% — high risk, segera selesaikan prereqs"
