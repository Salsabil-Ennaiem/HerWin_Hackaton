# backend/app/schemas.py

from datetime import datetime, date
from typing import Optional, List, Dict, Literal
from pydantic import BaseModel, Field


# ---------- Emotion ----------
class EmotionResult(BaseModel):
    emotions: Dict[str, float]          # {"anxiety": 0.62, "sadness": 0.2, ...}
    dominant: str
    valence: float                      # -1.0 .. 1.0
    themes: List[str] = []
    distress_flag: bool = False


# ---------- Journal ----------
class JournalTextIn(BaseModel):
    text: str = Field(..., min_length=1)
    lang: Optional[str] = "en"          # en | fr | ar


class JournalQAIn(BaseModel):
    answers: Dict[str, str]             # {"q1": "yes", "q2": "tired", ...}
    lang: Optional[str] = "en"


class JournalEntryOut(BaseModel):
    id: int
    created_at: datetime
    text: str
    source: Literal["text", "voice", "questionnaire"]
    lang: str
    emotion: EmotionResult
    stress_score: float                 # 0..100
    support_message: str
    safety_message: Optional[str] = None


class JournalListOut(BaseModel):
    entries: List[JournalEntryOut]
    total: int