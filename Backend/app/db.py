"""Single source of truth for the database engine."""
import os
from typing import Generator

from sqlmodel import Session, SQLModel, create_engine

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./herwin.db")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},  # needed for SQLite + FastAPI
    echo=False,  # set True if you want to see SQL in the terminal
)


def init_db() -> None:
    """Create all tables and make sure the single Profile row (id=1) exists."""
    from app.models import Profile  # import registers every table on the metadata

    SQLModel.metadata.create_all(engine)
    with Session(engine) as s:
        if s.get(Profile, 1) is None:
            s.add(Profile(id=1))
            s.commit()


def get_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session