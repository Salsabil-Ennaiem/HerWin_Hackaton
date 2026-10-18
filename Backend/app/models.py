from datetime import datetime, date
from sqlmodel import SQLModel, Field, Column, JSON, create_engine

engine = create_engine("sqlite:///herwin.db", connect_args={"check_same_thread": False})

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
    kind: str                      # exam | deadline | class | other
    start: datetime
    end: datetime
    source: str = "manual"         # seed | manual | ics

class Entry(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    mode: str                      # text | voice | qa
    text: str
    dominant: str
    emotions: dict = Field(default_factory=dict, sa_column=Column(JSON))
    themes: list = Field(default_factory=list, sa_column=Column(JSON))
    stress: int
    distress: bool = False
    support_message: str = ""

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
    type: str                      # study | break | movement | meal | free
    title: str
    done: bool = False

class ExerciseLog(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    exercise_id: int
    entry_id: int | None = Field(default=None, foreign_key="entry.id")
    completed_at: datetime = Field(default_factory=datetime.utcnow)