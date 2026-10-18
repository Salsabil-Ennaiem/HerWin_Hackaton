"""Pure functions: safety, academic load, stress, exercises, daily plan."""
import json
from datetime import date, datetime, time, timedelta
from pathlib import Path

SEED = Path(__file__).resolve().parent.parent / "seed"

SAFETY_KEYWORDS = [
    "suicide", "kill myself", "want to die", "self-harm", "self harm", "end it all", "hurt myself",
    "me tuer", "veux mourir", "veux plus vivre", "me faire du mal", "en finir",
    "انتحار", "أقتل نفسي", "اقتل نفسي", "أريد أن أموت", "اريد ان اموت", "أؤذي نفسي",
]


def check_safety(text: str, res: dict) -> bool:
    low = (text or "").lower()
    if any(k in low for k in SAFETY_KEYWORDS):
        return True
    return bool(res.get("distress")) or res.get("emotions", {}).get("sadness", 0) > 0.9


def academic_load(events, today: date) -> float:
    """0..1 from exams/deadlines in the next 14 days."""
    end = today + timedelta(days=14)
    score = 0.0
    for e in events:
        d = e.start.date()
        if d < today or d > end:
            continue
        weight = 1.0 if e.kind in ("exam", "deadline") else 0.2
        score += weight * max(0.0, 1 - (d - today).days / 14)
    return min(1.0, score / 2)


def compute_stress(emotions: dict, load: float, trend: list) -> int:
    """stress = 100 * (0.5*negativity + 0.3*academic_load + 0.2*trend). trend is oldest -> newest."""
    neg = sum(emotions.get(k, 0) for k in ("anxiety", "sadness", "anger", "fear")) - 0.5 * emotions.get("joy", 0)
    neg = max(0.0, min(1.0, neg))
    if trend:
        ema = trend[0]
        for s in trend[1:]:
            ema = 0.3 * s + 0.7 * ema
        t = ema / 100
    else:
        t = 0.3
    raw = 0.5 * neg + 0.3 * load + 0.2 * t
    return int(round(max(0, min(100, raw * 100))))


def recommend_exercises(dominant: str, stress: int) -> list:
    items = json.loads((SEED / "exercises.json").read_text(encoding="utf-8-sig"))

    def score(x):
        s = 0
        if dominant in x["tags"]:
            s += 2
        if stress >= 70 and "high_stress" in x["tags"]:
            s += 2
        if "any" in x["tags"]:
            s += 1
        return -s, x["id"]

    return sorted(items, key=score)[:3]


def build_plan(events, stress: int, lighter: bool = False, day: date | None = None) -> dict:
    day = day or date.today()
    study = 50 if stress < 40 else 35 if stress < 70 else 25
    if lighter:
        study = max(20, study - 10)
    sessions = 2 if stress < 70 else 1

    upcoming = sorted((e for e in events if e.kind in ("exam", "deadline") and e.start.date() >= day),
                      key=lambda e: e.start)
    nxt = upcoming[0] if upcoming else None
    label = f"Study: {nxt.title}" if nxt else "Focused study"
    busy = [(e.start, e.end) for e in events if e.start.date() == day]

    blocks, cursor = [], datetime.combine(day, time(9, 0))

    def add(mins, typ, title):
        nonlocal cursor
        while True:
            end = cursor + timedelta(minutes=mins)
            clash = [b for b in busy if cursor < b[1] and end > b[0]]
            if not clash:
                break
            cursor = max(b[1] for b in clash)
        blocks.append({"start": cursor.isoformat(), "end": end.isoformat(), "type": typ, "title": title})
        cursor = end

    def half(prefix):
        for _ in range(sessions):
            add(study, "study", label)
            add(10, "break", "Short break: water + stretch")
        add(15, "movement", f"{prefix} movement: walk or stretch")

    half("Morning")
    cursor = max(cursor, datetime.combine(day, time(12, 30)))
    add(45, "meal", "Lunch, away from your desk")
    half("Afternoon")
    cursor = max(cursor, datetime.combine(day, time(18, 0)))
    add(60, "free", "Free time: do something you enjoy")

    parts = []
    if nxt:
        d = (nxt.start.date() - day).days
        when = "today" if d == 0 else f"in {d} day{'s' if d != 1 else ''}"
        parts.append(f"{nxt.title} is {when}.")
    if stress >= 70:
        parts.append("Your stress is high, so study blocks are short with extra breaks.")
    elif stress >= 40:
        parts.append("Moderate stress: balanced study blocks with regular breaks.")
    else:
        parts.append("You are in a good place: longer focus blocks are fine today.")
    if lighter:
        parts.append("The plan is lighter because of your cycle phase.")
    return {"explanation": " ".join(parts), "blocks": blocks}
