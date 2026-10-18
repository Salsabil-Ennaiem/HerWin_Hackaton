import json
import re
from datetime import datetime, date, time, timedelta
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from pydantic import BaseModel, NaiveDatetime
from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, select

from . import ai, logic
from .auth import current_user
from .models import engine, utcnow, Profile, Event, Entry, Plan, Block, ExerciseLog

router = APIRouter(prefix="/api")
SEED = Path(__file__).resolve().parent.parent / "seed"

FALLBACK = {
    "emotions": {"anxiety": 0.5}, "dominant": "anxiety", "valence": -0.3,
    "themes": [], "distress": 0,
    "support_message": "Thank you for sharing. Let's take one small step at a time.",
    "activities": {"indoor": [], "outdoor": []},
}


def get_session():
    with Session(engine) as s:
        yield s


def load(name: str):
    return json.loads((SEED / name).read_text(encoding="utf-8-sig"))


def wipe(s: Session, model, *conds):
    for row in s.exec(select(model).where(*conds)).all():
        s.delete(row)


def profile_for_user(s: Session, email: str) -> Profile:
    profile = s.exec(select(Profile).where(Profile.user_email == email)).first()
    if profile is None:
        profile = Profile(user_email=email)
        s.add(profile)
        try:
            s.commit()
        except IntegrityError:
            s.rollback()
            profile = s.exec(select(Profile).where(Profile.user_email == email)).first()
            if profile is None:
                raise
        s.refresh(profile)
    return profile


def cycle_lighter(p: Profile, day: date) -> bool:
    """True if the plan should be lighter (menstrual or pre-period days)."""
    if not (p.period_tracking and p.last_period):
        return False
    d = (day - p.last_period).days % p.cycle_len + 1
    return d <= 5 or d > p.cycle_len - 5


def qa_to_text(answers: str | None) -> str:
    try:
        data = json.loads(answers or "[]")
    except json.JSONDecodeError:
        return answers or ""
    if isinstance(data, dict):
        data = list(data.values())
    parts = []
    for it in data:
        parts.append(f"{it.get('q', '')} {it.get('a', '')}" if isinstance(it, dict) else str(it))
    return " ".join(parts).strip()


def block_out(b: Block) -> dict:
    return {"id": b.id, "start": b.start.isoformat(), "end": b.end.isoformat(),
            "type": b.type, "title": b.title, "done": b.done}


def result(entry, plan, blocks, exercises, activities, contacts) -> dict:
    """The frozen JSON contract. Do not change its shape."""
    return {
        "entry_id": entry.id,
        "transcript": entry.text,
        "mood": {"dominant": entry.dominant, "emotions": entry.emotions, "themes": entry.themes},
        "stress_score": entry.stress,
        "distress_flag": entry.distress,
        "support_message": entry.support_message,
        "exercises": exercises,
        "activities": activities,
        "plan": {"explanation": plan.explanation if plan else "",
                 "blocks": [block_out(b) for b in blocks]},
        "contacts": contacts,
    }


@router.get("/health")
def health():
    return {"ok": True}


# ---------------------------------------------------------------- JOURNAL (P0)
@router.post("/journal")
async def journal(mode: str = Form(...), text: str | None = Form(None),
                  audio: UploadFile | None = File(None), answers: str | None = Form(None),
                  s: Session = Depends(get_session),
                  user: dict = Depends(current_user)):
    if mode == "voice" and audio:
        text = await ai.transcribe(audio)
    elif mode == "qa":
        text = qa_to_text(answers)
    text = (text or "").strip()
    if not text:
        raise HTTPException(400, "Empty entry: type, record or answer first.")

    today = date.today()
    email = user["email"]
    profile = profile_for_user(s, email)
    events = s.exec(select(Event).where(
                        Event.user_email == email,
                        Event.start >= datetime.combine(today, time.min))
                    .order_by(Event.start)).all()
    past = s.exec(select(Entry).where(Entry.user_email == email)
                  .order_by(Entry.id.desc()).limit(7)).all()
    trend = [e.stress for e in reversed(past)]
    context = "; ".join(f"{e.title} ({e.kind}) in {(e.start.date() - today).days} days"
                        for e in events[:5])

    try:
        res = await ai.analyze(text, context)
    except Exception:
        res = dict(FALLBACK)

    load_score = logic.academic_load(events, today)
    stress = int(logic.compute_stress(res.get("emotions", {}), load_score, trend))
    distress = bool(res.get("distress")) or bool(logic.check_safety(text, res))
    plan_data = logic.build_plan(events, stress, lighter=cycle_lighter(profile, today), day=today)
    exercises = logic.recommend_exercises(res.get("dominant", "anxiety"), stress)
    contacts = load("contacts.json") if distress else []

    entry = Entry(user_email=email, mode=mode, text=text, dominant=res.get("dominant", "anxiety"),
                  emotions=res.get("emotions", {}), themes=res.get("themes", []),
                  stress=stress, distress=distress,
                  support_message=res.get("support_message", ""))
    s.add(entry); s.commit(); s.refresh(entry)

    plan = Plan(user_email=email, day=today,
                explanation=plan_data.get("explanation", ""), entry_id=entry.id)
    s.add(plan); s.commit(); s.refresh(plan)

    blocks = []
    for b in plan_data.get("blocks", []):
        row = Block(user_email=email, plan_id=plan.id, start=datetime.fromisoformat(b["start"]),
                    end=datetime.fromisoformat(b["end"]), type=b["type"], title=b["title"])
        s.add(row); s.commit(); s.refresh(row)
        blocks.append(row)

    activities = res.get("activities", {"indoor": [], "outdoor": []})
    return result(entry, plan, blocks, exercises, activities, contacts)


@router.get("/journal")
def list_journal(s: Session = Depends(get_session), user: dict = Depends(current_user)):
    rows = s.exec(select(Entry).where(Entry.user_email == user["email"])
                  .order_by(Entry.id.desc()).limit(50)).all()
    return [e.model_dump(mode="json") for e in rows]


@router.get("/journal/{entry_id}")
def get_entry(entry_id: int, s: Session = Depends(get_session),
              user: dict = Depends(current_user)):
    e = s.exec(select(Entry).where(
        Entry.id == entry_id, Entry.user_email == user["email"]
    )).first()
    if not e:
        raise HTTPException(404, "Entry not found")
    plan = s.exec(select(Plan).where(
        Plan.entry_id == e.id, Plan.user_email == user["email"]
    )).first()
    blocks = s.exec(select(Block).where(
        Block.plan_id == plan.id, Block.user_email == user["email"]
    ).order_by(Block.start)).all() if plan else []
    contacts = load("contacts.json") if e.distress else []
    return result(e, plan, blocks, logic.recommend_exercises(e.dominant, e.stress),
                  {"indoor": [], "outdoor": []}, contacts)


# ---------------------------------------------------------------- CALENDAR (P1)
class EventIn(BaseModel):
    title: str
    kind: str = "other"
    start: NaiveDatetime
    end: NaiveDatetime


@router.post("/calendar/seed")
def seed_calendar(s: Session = Depends(get_session), user: dict = Depends(current_user)):
    email = user["email"]
    wipe(s, Event, Event.user_email == email, Event.source == "seed")
    items = load("sample_calendar.json")
    for it in items:
        d = date.today() + timedelta(days=it["in_days"])
        s.add(Event(user_email=email, title=it["title"], kind=it["kind"], source="seed",
                    start=datetime.combine(d, time.fromisoformat(it["start"])),
                    end=datetime.combine(d, time.fromisoformat(it["end"]))))
    s.commit()
    return {"added": len(items)}


@router.get("/calendar/events")
def list_events(s: Session = Depends(get_session), user: dict = Depends(current_user)):
    rows = s.exec(select(Event).where(Event.user_email == user["email"])
                  .order_by(Event.start)).all()
    return [e.model_dump(mode="json") for e in rows]


@router.post("/calendar/events")
def add_event(body: EventIn, s: Session = Depends(get_session),
              user: dict = Depends(current_user)):
    ev = Event(user_email=user["email"], **body.model_dump(), source="manual")
    s.add(ev); s.commit(); s.refresh(ev)
    return ev.model_dump(mode="json")


@router.delete("/calendar/events/{event_id}")
def delete_event(event_id: int, s: Session = Depends(get_session),
                 user: dict = Depends(current_user)):
    ev = s.exec(select(Event).where(
        Event.id == event_id, Event.user_email == user["email"]
    )).first()
    if not ev:
        raise HTTPException(404, "Event not found")
    s.delete(ev); s.commit()
    return {"deleted": event_id}


# ---------------------------------------------------------------- PROFILE (P1)
class ProfileIn(BaseModel):
    name: str = ""
    lang: str = "en"
    period_tracking: bool = False
    last_period: date | None = None
    cycle_len: int = 28


@router.get("/profile")
def get_profile(s: Session = Depends(get_session), user: dict = Depends(current_user)):
    return profile_for_user(s, user["email"]).model_dump(mode="json")


@router.put("/profile")
def put_profile(body: ProfileIn, s: Session = Depends(get_session),
                user: dict = Depends(current_user)):
    p = profile_for_user(s, user["email"])
    for k, v in body.model_dump().items():
        setattr(p, k, v)
    s.add(p); s.commit(); s.refresh(p)
    return p.model_dump(mode="json")


# ---------------------------------------------------------------- DASHBOARD (P1)
@router.get("/dashboard")
def dashboard(s: Session = Depends(get_session), user: dict = Depends(current_user)):
    email, today = user["email"], date.today()
    now = utcnow()
    rows = s.exec(select(Entry).where(
                      Entry.user_email == email,
                      Entry.created_at >= now - timedelta(days=14))
                  .order_by(Entry.created_at)).all()
    by_day = {}
    for e in rows:
        d = e.created_at.date().isoformat()
        by_day[d] = {"date": d, "stress": e.stress, "dominant": e.dominant}
    trend = list(by_day.values())

    plan = s.exec(select(Plan).where(
        Plan.user_email == email, Plan.day == today
    ).order_by(Plan.id.desc())).first()
    blocks = s.exec(select(Block).where(
        Block.plan_id == plan.id, Block.user_email == email
    ).order_by(Block.start)).all() if plan else []
    nxt = s.exec(select(Event).where(
                     Event.user_email == email,
                     Event.start >= datetime.now(), Event.kind.in_(["exam", "deadline"]))
                 .order_by(Event.start)).first()
    return {
        "mood_trend": trend,
        "stress_strip": [t["stress"] for t in trend[-7:]],
        "today_plan": {"explanation": plan.explanation if plan else "",
                       "blocks": [block_out(b) for b in blocks]},
        "next_event": {"title": nxt.title, "days_left": (nxt.start.date() - today).days} if nxt else None,
    }


# ---------------------------------------------------------------- PRIVACY + DEMO (P1)
@router.delete("/me/data")
def delete_my_data(s: Session = Depends(get_session), user: dict = Depends(current_user)):
    email = user["email"]
    for model in (ExerciseLog, Block, Plan, Entry, Event):
        wipe(s, model, model.user_email == email)
    p = profile_for_user(s, email)
    p.name, p.lang, p.period_tracking, p.last_period, p.cycle_len = "", "en", False, None, 28
    s.add(p); s.commit()
    return {"deleted": True}


DEMO_STRESS = [45, 50, 48, 55, 60, 58, 62, 66, 64, 70, 72, 69, 74, 78]
DEMO_MOODS = ["anxiety", "sadness", "anxiety", "fear", "anxiety", "joy", "anxiety"]


@router.post("/demo/seed")
def demo_seed(s: Session = Depends(get_session), user: dict = Depends(current_user)):
    """14 days of history + calendar, for the live demo."""
    email = user["email"]
    for model in (ExerciseLog, Block, Plan, Entry):
        wipe(s, model, model.user_email == email)
    n = len(DEMO_STRESS)
    for i, st in enumerate(DEMO_STRESS):
        dom = DEMO_MOODS[i % len(DEMO_MOODS)]
        s.add(Entry(user_email=email, created_at=utcnow() - timedelta(days=n - 1 - i), mode="text",
                    text="Demo entry", dominant=dom, emotions={dom: 0.6}, themes=["exam"],
                    stress=st, distress=False, support_message="Demo message."))
    p = profile_for_user(s, email)
    p.name = p.name or "Demo"
    s.add(p); s.commit()
    seed_calendar(s, user)
    return {"entries": n}


# ---------------------------------------------------------------- P2 (only if P1 is done)
class BlockPatch(BaseModel):
    done: bool


@router.patch("/plan/blocks/{block_id}")
def patch_block(block_id: int, body: BlockPatch, s: Session = Depends(get_session),
                user: dict = Depends(current_user)):
    b = s.exec(select(Block).where(
        Block.id == block_id, Block.user_email == user["email"]
    )).first()
    if not b:
        raise HTTPException(404, "Block not found")
    b.done = body.done
    s.add(b); s.commit(); s.refresh(b)
    return block_out(b)


@router.post("/exercises/{exercise_id}/complete")
def complete_exercise(exercise_id: int, entry_id: int | None = None,
                      s: Session = Depends(get_session),
                      user: dict = Depends(current_user)):
    email = user["email"]
    if entry_id is not None and not s.exec(select(Entry.id).where(
        Entry.id == entry_id, Entry.user_email == email
    )).first():
        raise HTTPException(404, "Entry not found")
    log = ExerciseLog(user_email=email, exercise_id=exercise_id, entry_id=entry_id)
    s.add(log); s.commit(); s.refresh(log)
    return {"id": log.id}


@router.post("/calendar/import-ics")
async def import_ics(file: UploadFile = File(...), s: Session = Depends(get_session),
                     user: dict = Depends(current_user)):
    from icalendar import Calendar
    cal = Calendar.from_ical(await file.read())
    n = 0
    for c in cal.walk("VEVENT"):
        st = c.decoded("DTSTART")
        en = c.decoded("DTEND") if c.get("DTEND") else st
        if not isinstance(st, datetime):
            st, en = datetime.combine(st, time(9)), datetime.combine(st, time(10))
        title = str(c.get("SUMMARY", "Event"))
        low = title.lower()
        kind = ("exam" if re.search(r"\b(exam|midterm|examen|ds)\b", low)
                else "deadline" if re.search(r"\b(due|deadline|rendu)\b", low)
                else "class")
        s.add(Event(user_email=user["email"], title=title, kind=kind, source="ics",
                    start=st.replace(tzinfo=None), end=en.replace(tzinfo=None)))
        n += 1
    s.commit()
    return {"imported": n}