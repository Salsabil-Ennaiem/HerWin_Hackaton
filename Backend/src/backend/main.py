from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text
from sqlmodel import SQLModel

from app.extras import router as extras_router
from app.auth import current_user
from app.models import engine
from app.routes import router

LEGACY_OWNER = "legacy-unassigned"


@asynccontextmanager
async def lifespan(_: FastAPI):
    SQLModel.metadata.create_all(engine)
    with engine.begin() as connection:
        inspector = inspect(connection)
        entry_columns = {column["name"] for column in inspector.get_columns("entry")}
        for name, definition in (
            ("lang", "VARCHAR NOT NULL DEFAULT 'en'"),
            ("valence", "FLOAT NOT NULL DEFAULT 0"),
            ("safety_message", "VARCHAR"),
        ):
            if name not in entry_columns:
                connection.execute(text(f"ALTER TABLE entry ADD COLUMN {name} {definition}"))

        owner_tables = ("profile", "event", "entry", "plan", "block", "exerciselog")
        for table in owner_tables:
            columns = {column["name"] for column in inspector.get_columns(table)}
            if "user_email" not in columns:
                connection.execute(
                    text(
                        f"ALTER TABLE {table} ADD COLUMN user_email "
                        f"VARCHAR NOT NULL DEFAULT '{LEGACY_OWNER}'"
                    )
                )
            if table != "profile":
                connection.execute(
                    text(
                        f"CREATE INDEX IF NOT EXISTS ix_{table}_user_email "
                        f"ON {table} (user_email)"
                    )
                )
        connection.execute(
            text(
                "CREATE UNIQUE INDEX IF NOT EXISTS ix_profile_user_email "
                "ON profile (user_email)"
            )
        )
    yield


app = FastAPI(title="HERwin / CalmCampus", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, dependencies=[Depends(current_user)])
app.include_router(extras_router, dependencies=[Depends(current_user)])
