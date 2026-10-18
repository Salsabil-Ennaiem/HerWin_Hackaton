"""P3: AI chat + .ics export of today's plan."""
from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel
from sqlmodel import Session, select

from . import logic
from .chat_ai import chat_reply
from .models import Block, Entry, Plan
from .routes import get_session, load

router = APIRouter(prefix="/api")

SAFETY_MSG = {
    "en": "I'm really glad you told me. You deserve support from a real person right now. Please contact someone you trust or one of the numbers below.",
    "fr": "Je suis vraiment content(e) que tu m'en parles. Tu mérites le soutien d'une vraie personne maintenant. Contacte quelqu'un de confiance ou l'un des numéros ci-dessous.",
    "ar": "يسعدني أنك أخبرتني. تستحق دعماً من شخص حقيقي الآن. تواصل مع شخص تثق به أو مع أحد الأرقام أدناه.",
}


class ChatIn(BaseModel):
    message: str
    history: list[dict] = []
    lang: str = "en"


@router.post("/chat")
async def chat(body: ChatIn, s: Session = Depends(get_session)):
    msg = body.message.strip()
    if not msg:
        raise HTTPException(400, "Empty message")
    if logic.check_safety(msg, {}):
        return {"reply": SAFETY_MSG.get(body.lang, SAFETY_MSG["en"]),
                "distress": True, "contacts": load("contacts.json")}
    last = s.exec(select(Entry).order_by(Entry.id.desc())).first()
    ctx = f"Latest check-in: dominant emotion {last.dominant}, stress {last.stress}/100." if last else ""
    reply = await chat_reply(body.history, msg, body.lang, ctx)
    return {"reply": reply, "distress": False, "contacts": []}


@router.get("/plan/today.ics")
def plan_ics(s: Session = Depends(get_session)):
    from icalendar import Calendar, Event as IEvent

    plan = s.exec(select(Plan).where(Plan.day == date.today()).order_by(Plan.id.desc())).first()
    if not plan:
        raise HTTPException(404, "No plan for today. Write a journal entry first.")
    blocks = s.exec(select(Block).where(Block.plan_id == plan.id).order_by(Block.start)).all()
    cal = Calendar()
    cal.add("prodid", "-//HERwin//Plan//EN")
    cal.add("version", "2.0")
    for b in blocks:
        ev = IEvent()
        ev.add("summary", b.title)
        ev.add("dtstart", b.start)
        ev.add("dtend", b.end)
        ev.add("dtstamp", datetime.utcnow())
        ev.add("uid", f"herwin-block-{b.id}@herwin.local")
        cal.add_component(ev)
    return Response(cal.to_ical(), media_type="text/calendar",
                    headers={"Content-Disposition": 'attachment; filename="herwin-plan.ics"'})
