# backend/app/models.py  (add these classes)

from datetime import datetime, date
from typing import Optional, List, Dict, Any
from sqlmodel import SQLModel, Field, Column, JSON, Relationship
from sqlalchemy import Column as SAColumn

class Entry(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    mode: str                          # "text" | "voice" | "qa"
    text: str                          # original text or transcript
    lang: str = "en"                   # en | fr | ar
    dominant: str                      # e.g. "anxiety"
    emotions: Dict[str, float] = Field(default_factory=dict, sa_column=Column(JSON))
    themes: List[str] = Field(default_factory=list, sa_column=Column(JSON))
    valence: float = 0.0               # -1 .. 1
    stress: int = 0                    # 0..100
    distress: bool = False
    support_message: str = ""
    safety_message: Optional[str] = None

    # relationships (optional but useful later)
    # plans: List["Plan"] = Relationship(back_populates="entry")
    # exercise_logs: List["ExerciseLog"] = Relationship(back_populates="entry")


class Plan(SQLModel, table=True):
    """Will be filled by the schedule person later. Keep the FK ready."""
    id: Optional[int] = Field(default=None, primary_key=True)
    day: date
    explanation: str = ""
    entry_id: int = Field(foreign_key="entry.id")


class Block(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    plan_id: int = Field(foreign_key="plan.id")
    start: datetime
    end: datetime
    type: str                          # study | break | movement | meal | free | exercise
    title: str
    done: bool = False


class ExerciseLog(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    exercise_id: int                   # points to exercises.json (not a real FK)
    entry_id: Optional[int] = Field(default=None, foreign_key="entry.id")
    completed_at: datetime = Field(default_factory=datetime.utcnow)