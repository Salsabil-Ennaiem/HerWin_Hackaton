from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db import init_db
from app.api import journal   # and later profile, calendar, etc.

app = FastAPI(title="HERwin / CalmCampus")

# Allow React (Frontend) to talk to us
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",   # when running with npm run dev
        "http://localhost:3000",   # when running with Docker
        ],  # Vite default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Hello from FastAPI Backend!"}

@app.get("/api/health")
def health():
    return {"status": "ok"}





@app.on_event("startup")
def on_startup():
    init_db()

app.include_router(journal.router)

# later:
# app.include_router(profile.router)
# app.include_router(calendar.router)
# ...