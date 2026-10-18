from datetime import date, datetime, timezone

from sqlmodel import JSON, Column, Field, SQLModel

from app.db import engine  # noqa: F401  (re-exported so `from .models import engine` still works)


def utcnow() -> datetime:
    """Naive UTC timestamp (datetime.utcnow() is deprecated)."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


class Profile(SQLModel, table=True):
    id: int = Field(default=1, primary_key=True)
    name: str = ""
    lang: str = "en"
    period_tracking: bool = False
    last_period: date | None = None
    cycle_len: int = 28


class Event(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    title: str
    kind: str  # exam | deadline | class | other
    start: datetime
    end: datetime
    source: str = "manual"  # seed | manual | ics


class Entry(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=utcnow)
    mode: str  # text | voice | qa
    text: str
    lang: str = "en"  # NEW: en | fr | ar
    dominant: str
    emotions: dict = Field(default_factory=dict, sa_column=Column(JSON))
    themes: list = Field(default_factory=list, sa_column=Column(JSON))
    valence: float = 0.0  # NEW: -1.0 .. 1.0
    stress: int
    distress: bool = False
    support_message: str = ""
    safety_message: str | None = None  # NEW


class Plan(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    day: date
    explanation: str = ""
    entry_id: int = Field(foreign_key="entry.id")


class Block(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    plan_id: int = Field(foreign_key="plan.id")
    start: datetime
    end: datetime
    type: str  # study | break | movement | meal | free
    title: str
    done: bool = False


class ExerciseLog(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    exercise_id: int
    entry_id: int | None = Field(default=None, foreign_key="entry.id")
    completed_at: datetime = Field(default_factory=utcnow)