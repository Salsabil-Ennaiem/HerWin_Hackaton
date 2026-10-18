from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="My API")

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