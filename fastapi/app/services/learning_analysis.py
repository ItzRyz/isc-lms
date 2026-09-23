from typing import List, Literal

def analyze_learning(
    progress: float,
    quiz_scores: List[float],
    assignment_scores: List[float],
    attendance: float,
    completed: List[str],
) -> dict:
    avg_quiz = sum(quiz_scores) / len(quiz_scores) if quiz_scores else 0
    avg_assign = sum(assignment_scores) / len(assignment_scores) if assignment_scores else 0

    strengths = []
    weaknesses = []
    if avg_quiz >= 80:
        strengths.append("Quiz")
    else:
        weaknesses.append("Quiz")
    if avg_assign >= 80:
        strengths.append("Assignment")
    else:
        weaknesses.append("Assignment")
    if attendance >= 80:
        strengths.append("Attendance")
    else:
        weaknesses.append("Attendance")
    if progress >= 70:
        strengths.append("Progress")
    else:
        weaknesses.append("Progress")

    # Risk via same heuristic as recommendation
    overall = progress * 0.4 + attendance * 0.3 + (avg_quiz * 0.3 if quiz_scores else 0)
    if overall > 70:
        risk: Literal["low", "medium", "high"] = "low"
        conf = 0.85
        expl = f"Overall {overall:.0f}% — strong di {', '.join(strengths) or '—'}"
    elif overall > 40:
        risk = "medium"
        conf = 0.75
        expl = f"Overall {overall:.0f}% — perlu fokus di {', '.join(weaknesses)}"
    else:
        risk = "high"
        conf = 0.8
        expl = f"Overall {overall:.0f}% — high risk, segera lengkapi {', '.join(weaknesses)}"

    return {
        "overall_progress": round(overall, 2),
        "strengths": strengths,
        "weaknesses": weaknesses,
        "risk_level": risk,
        "explanation": expl,
        "confidence": conf,
    }
