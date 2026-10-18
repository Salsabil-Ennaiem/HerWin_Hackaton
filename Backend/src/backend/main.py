from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text
from sqlmodel import Session, SQLModel

from app.models import engine, Profile
from app.routes import router


@asynccontextmanager
async def lifespan(_: FastAPI):
    SQLModel.metadata.create_all(engine)
    with engine.begin() as connection:
        entry_columns = {
            column["name"] for column in inspect(connection).get_columns("entry")
        }
        for name, definition in (
            ("lang", "VARCHAR NOT NULL DEFAULT 'en'"),
            ("valence", "FLOAT NOT NULL DEFAULT 0"),
            ("safety_message", "VARCHAR"),
        ):
            if name not in entry_columns:
                connection.execute(text(f"ALTER TABLE entry ADD COLUMN {name} {definition}"))

    with Session(engine) as s:
        if not s.get(Profile, 1):      # GET/PUT /api/profile need row id=1
            s.add(Profile(id=1))
            s.commit()
    yield


app = FastAPI(title="HERwin / CalmCampus", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)   # /api/health lives in routes.py
