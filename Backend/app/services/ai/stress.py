from datetime import datetime, timedelta
from sqlmodel import Session, select
from app.models import Entry, Event

def academic_load(session: Session, today: datetime.date) -> float:
    """0.0 – 1.0 based on exams/deadlines in the next 14 days."""
    end = today + timedelta(days=14)
    events = session.exec(
        select(Event).where(Event.start >= today, Event.start <= end)
    ).all()
    if not events:
        return 0.0
    score = 0.0
    for e in events:
        days_left = (e.start.date() - today).days
        weight = 1.0 if e.kind in ("exam", "deadline") else 0.4
        proximity = max(0, 1 - days_left / 14)
        score += weight * proximity
    return min(1.0, score / 3)   # normalize roughly


def compute_stress(emotion: dict, load: float, recent_stress: list[int]) -> int:
    """
    stress = 100 * (0.5 * negativity + 0.3 * academic_load + 0.2 * trend_ema)
    """
    emotions = emotion.get("emotions", {})
    negativity = (
        emotions.get("anxiety", 0) +
        emotions.get("sadness", 0) +
        emotions.get("anger", 0) +
        emotions.get("fear", 0) -
        emotions.get("joy", 0)
    )
    negativity = max(0.0, min(1.0, negativity))

    # EMA of last 7 stress scores
    if recent_stress:
        alpha = 0.3
        ema = recent_stress[0]
        for s in recent_stress[1:]:
            ema = alpha * s + (1 - alpha) * ema
        trend = ema / 100
    else:
        trend = 0.3

    raw = 0.5 * negativity + 0.3 * load + 0.2 * trend
    return int(round(min(100, max(0, raw * 100))))