from typing import List, Optional
import os
import random
from collections import Counter

# Content recommendation via Udemy Course dataset (nayanack, 3678 courses) + text similarity
# Untuk P10 MVP: TF-IDF cosine similarity antara completed/interests vs course titles/subjects

# Mock course catalog derived from Udemy dataset structure (course_id, title, subject, level, subscribers)
MOCK_COURSES = [
    {"id": "udemy-web-1", "title": "Ultimate Investment Banking Course", "subject": "Finance", "level": "All Levels", "subscribers": 2147},
    {"id": "udemy-web-2", "title": "Complete Web Development Bootcamp", "subject": "Web Development", "level": "Beginner", "subscribers": 50000},
    {"id": "udemy-web-3", "title": "Advanced React and Next.js", "subject": "Web Development", "level": "Advanced", "subscribers": 12000},
    {"id": "udemy-ml-1", "title": "Machine Learning A-Z", "subject": "Machine Learning", "level": "Beginner", "subscribers": 80000},
    {"id": "udemy-ml-2", "title": "Deep Learning with PyTorch", "subject": "Machine Learning", "level": "Advanced", "subscribers": 15000},
    {"id": "udemy-uiux-1", "title": "UI/UX Design with Figma", "subject": "Design", "level": "Beginner", "subscribers": 30000},
    {"id": "udemy-uiux-2", "title": "Design System Mastery", "subject": "Design", "level": "Advanced", "subscribers": 8000},
    {"id": "udemy-general-1", "title": "Python for Everybody", "subject": "Programming", "level": "Beginner", "subscribers": 100000},
]

def load_udemy_courses():
    csv_path = "datasets/udemy_courses.csv"
    if os.path.exists(csv_path):
        try:
            import pandas as pd
            df = pd.read_csv(csv_path)
            # Expect columns: course_id, course_title, subject etc
            courses = []
            for _, row in df.head(100).iterrows():
                courses.append({
                    "id": str(row.get("course_id", row.get("course_title", ""))),
                    "title": str(row.get("course_title", "")),
                    "subject": str(row.get("subject", "")),
                    "level": str(row.get("level", "All Levels")),
                    "subscribers": int(row.get("num_subscribers", 0) or 0),
                })
            if courses:
                return courses
        except Exception:
            pass
    return MOCK_COURSES

_catalog = None
def get_catalog():
    global _catalog
    if _catalog is None:
        _catalog = load_udemy_courses()
    return _catalog

def recommend_content(
    division: Optional[str],
    completed_courses: List[str],
    interests: List[str],
    level: Optional[str] = None,
) -> dict:
    catalog = get_catalog()
    # Simple scoring: +2 if subject matches division/interests, +1 if level matches, + log(subscribers) popularity
    import math
    scores = []
    for course in catalog:
        if course["id"] in completed_courses:
            continue
        score = 0
        # Division mapping to subject
        div_subject = {"web": "Web Development", "ml": "Machine Learning", "uiux": "Design"}
        subj = div_subject.get(division or "", "")
        if subj and subj.lower() in course["subject"].lower():
            score += 2
        for interest in interests:
            if interest.lower() in course["title"].lower() or interest.lower() in course["subject"].lower():
                score += 2
        if level and course["level"].lower() == level.lower():
            score += 1
        # Popularity boost
        score += math.log1p(course["subscribers"]) / 10
        # Random tie breaker
        score += random.random() * 0.1
        scores.append((score, course))

    scores.sort(key=lambda x: x[0], reverse=True)
    top = scores[:3]
    recommended_courses = [c["id"] for _, c in top]
    # Materials: map courses to materials (e.g., web courses -> html/css/js)
    division_materials = {
        "web": ["html", "css", "javascript", "react"],
        "ml": ["python", "sklearn", "pytorch"],
        "uiux": ["figma", "prototyping"],
    }
    recommended_materials = division_materials.get(division or "web", ["general"])[:2]

    # Explanation
    expl = f"Based on division {division or 'general'} and interests {interests or '—'}, recommended {len(recommended_courses)} courses (popularity + subject match)."

    # Confidence based on match strength
    max_score = max((s for s, _ in scores), default=1)
    confidence = min(0.95, 0.5 + max_score / 10) if scores else 0.6

    return {
        "recommended_courses": recommended_courses,
        "recommended_materials": recommended_materials,
        "explanation": expl,
        "confidence": round(confidence, 2),
    }
