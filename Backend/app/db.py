# app/db.py
from sqlmodel import SQLModel, create_engine, Session
from typing import Generator

# SQLite file will be created next to the backend folder
DATABASE_URL = "sqlite:///./herwin.db"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},  # needed for SQLite + FastAPI
    echo=False,  # set True if you want to see SQL in the terminal
)


def init_db() -> None:
    """Create all tables that inherit from SQLModel."""
    # Import models so SQLModel knows about them
    from app.models import Profile, Event, Entry, Plan, Block, ExerciseLog  # noqa: F401
    SQLModel.metadata.create_all(engine)


def get_session() -> Generator[Session, None, None]:
    """FastAPI dependency that gives a database session."""
    with Session(engine) as session:
        yield session