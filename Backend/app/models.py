import os
from datetime import date, datetime, timezone

from pydantic import NaiveDatetime
from sqlmodel import JSON, Column, Field, SQLModel, create_engine

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./herwin.db")
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
    echo=False,
)


def utcnow() -> datetime:
    """Naive UTC timestamp (datetime.utcnow() is deprecated)."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


class Profile(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    user_email: str = Field(index=True, unique=True)
    name: str = ""
    lang: str = "en"
    period_tracking: bool = False
    last_period: date | None = None
    cycle_len: int = 28


class Event(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    user_email: str = Field(index=True)
    title: str
    kind: str  # exam | deadline | class | other
    start: NaiveDatetime
    end: NaiveDatetime
    source: str = "manual"  # seed | manual | ics


class Entry(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    user_email: str = Field(index=True)
    created_at: NaiveDatetime = Field(default_factory=utcnow)
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
    user_email: str = Field(index=True)
    day: date
    explanation: str = ""
    entry_id: int = Field(foreign_key="entry.id")


class Block(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    user_email: str = Field(index=True)
    plan_id: int = Field(foreign_key="plan.id")
    start: NaiveDatetime
    end: NaiveDatetime
    type: str  # study | break | movement | meal | free
    title: str
    done: bool = False


class ExerciseLog(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    user_email: str = Field(index=True)
    exercise_id: int
    entry_id: int | None = Field(default=None, foreign_key="entry.id")
    completed_at: NaiveDatetime = Field(default_factory=utcnow)