# backend/app/api/journal.py

from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, Query
from sqlmodel import Session, select
from datetime import datetime, date
from typing import Optional

from app.db import get_session
from app.models import Entry, Event
from app.schemas import (
    JournalTextIn, JournalQAIn, JournalEntryOut, JournalListOut, EmotionResult
)
from app.services.ai.emotion import analyze_emotion
from app.services.ai.safety import check_safety
from app.services.ai.llm import support_message
from app.services.ai.transcribe import transcribe
from app.services.stress import academic_load, compute_stress

router = APIRouter(prefix="/api/journal", tags=["journal"])


def _entry_to_out(entry: Entry) -> JournalEntryOut:
    return JournalEntryOut(
        id=entry.id,
        created_at=entry.created_at,
        text=entry.text,
        source=entry.mode,          # "text" | "voice" | "qa"
        lang=entry.lang,
        emotion=EmotionResult(
            emotions=entry.emotions,
            dominant=entry.dominant,
            valence=entry.valence,
            themes=entry.themes,
            distress_flag=entry.distress
        ),
        stress_score=float(entry.stress),
        support_message=entry.support_message,
        safety_message=entry.safety_message
    )


async def _run_pipeline(
    text: str,
    mode: str,
    lang: str,
    session: Session
) -> Entry:
    """The single pipeline used by text, voice and questionnaire."""

    # 1. Emotion
    emotion = await analyze_emotion(text, lang)

    # 2. Safety
    safety = check_safety(text, emotion, lang)

    # 3. Academic load + recent stress
    today = date.today()
    load = academic_load(session, today)

    recent = session.exec(
        select(Entry.stress)
        .order_by(Entry.created_at.desc())
        .limit(7)
    ).all()
    stress = compute_stress(emotion, load, list(recent))

    # 4. Support message (skip or soften if distress)
    if safety["distress_flag"]:
        msg = safety["safety_message"]
    else:
        msg = await support_message(text, emotion, lang)

    # 5. Save
    entry = Entry(
        mode=mode,
        text=text,
        lang=lang,
        dominant=emotion["dominant"],
        emotions=emotion["emotions"],
        themes=emotion.get("themes", []),
        valence=emotion.get("valence", 0.0),
        stress=stress,
        distress=safety["distress_flag"],
        support_message=msg,
        safety_message=safety["safety_message"]
    )
    session.add(entry)
    session.commit()
    session.refresh(entry)
    return entry


# ---------- TEXT ----------
@router.post("/text", response_model=JournalEntryOut)
async def journal_text(
    body: JournalTextIn,
    session: Session = Depends(get_session)
):
    if not body.text.strip():
        raise HTTPException(400, "Text cannot be empty")
    entry = await _run_pipeline(body.text.strip(), "text", body.lang or "en", session)
    return _entry_to_out(entry)


# ---------- AUDIO ----------
@router.post("/audio", response_model=JournalEntryOut)
async def journal_audio(
    file: UploadFile = File(...),
    lang: str = Form("en"),
    session: Session = Depends(get_session)
):
    audio = await file.read()
    text = await transcribe(audio, file.filename or "audio.webm")
    if not text.strip():
        raise HTTPException(400, "Could not transcribe audio. Please type instead.")
    entry = await _run_pipeline(text.strip(), "voice", lang, session)
    return _entry_to_out(entry)


# ---------- QUESTIONNAIRE ----------
@router.get("/questionnaire")
async def get_questionnaire(lang: str = "en"):
    """Return 5–6 tap questions. Frontend shows them when user chooses 'help me answer'."""
    # Keep simple for MVP
    questions = {
        "en": [
            {"id": "energy", "q": "How is your energy right now?", "options": ["Very low", "Low", "OK", "Good", "High"]},
            {"id": "worry", "q": "How worried do you feel about studies?", "options": ["Not at all", "A little", "Quite a bit", "Very"]},
            {"id": "sleep", "q": "How did you sleep last night?", "options": ["Badly", "OK", "Well"]},
            {"id": "support", "q": "Do you feel supported today?", "options": ["No", "A little", "Yes"]},
            {"id": "body", "q": "Any physical tension?", "options": ["Yes, strong", "Yes, mild", "No"]},
        ],
        # add fr / ar later
    }
    return {"questions": questions.get(lang, questions["en"])}


@router.post("/questionnaire", response_model=JournalEntryOut)
async def journal_questionnaire(
    body: JournalQAIn,
    session: Session = Depends(get_session)
):
    # Convert answers into a synthetic text the emotion pipeline can understand
    text = " | ".join(f"{k}: {v}" for k, v in body.answers.items())
    entry = await _run_pipeline(text, "qa", body.lang or "en", session)
    return _entry_to_out(entry)


# ---------- HISTORY ----------
@router.get("", response_model=JournalListOut)
async def list_journal(
    limit: int = Query(20, ge=1, le=100),
    session: Session = Depends(get_session)
):
    rows = session.exec(
        select(Entry).order_by(Entry.created_at.desc()).limit(limit)
    ).all()
    return JournalListOut(
        entries=[_entry_to_out(e) for e in rows],
        total=len(rows)
    )


@router.get("/{entry_id}", response_model=JournalEntryOut)
async def get_one(entry_id: int, session: Session = Depends(get_session)):
    entry = session.get(Entry, entry_id)
    if not entry:
        raise HTTPException(404, "Entry not found")
    return _entry_to_out(entry)