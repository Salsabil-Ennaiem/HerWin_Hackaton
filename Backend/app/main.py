from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import SQLModel, Session
from .models import engine, Profile
from .routes import router

app = FastAPI(title="HERwin")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
app.include_router(router)

@app.on_event("startup")
def init():
    SQLModel.metadata.create_all(engine)
    with Session(engine) as s:
        if not s.get(Profile, 1):
            s.add(Profile())
            s.commit()