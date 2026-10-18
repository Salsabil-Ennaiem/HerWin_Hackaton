# 🌸 HERwin / CalmCampus

A supportive wellbeing companion for university students. **Not a medical tool.**

## Problem
Students, especially during exam periods, carry stress they rarely express and rarely get support for. Counselling services are overbooked, stigma is high, and generic wellbeing apps ignore the student's actual academic calendar.

## Solution
The student checks in by **writing, speaking (Arabic, French, English) or tapping 5 questions**. In seconds HERwin returns:
- the detected mood and a **stress score (0-100)** that combines emotion, upcoming exams/deadlines and recent trend,
- a short, kind support message in the student's language,
- 3 targeted micro-exercises (breathing, grounding, movement…),
- a **realistic plan for today** built around classes and exams (lighter on high-stress days or, if opted in, cycle-sensitive days),
- a **dashboard** with the 14-day stress trend and a countdown to the next exam.

Extras: AI chat, plan export to `.ics` calendar or PDF, `.ics` calendar import, EN/FR/AR interface (RTL for Arabic), one-click "Delete my data".

## AI integration
| Step | Tech | Fallback |
|---|---|---|
| Speech to text | Groq Whisper large-v3 | UI asks the user to type |
| Emotion, themes, support message, activities | Llama 3.3 70B (Groq) in strict JSON mode | Gemini Flash, then a canned response |
| Stress score, plan, exercise choice | Deterministic rules (`logic.py`), explainable and offline | n/a |
| Chat | Same LLM chain with a supportive, non-diagnostic system prompt | Canned reply |

The app never crashes without an AI key: every LLM call has a fallback chain.

## Safety and privacy
- Distress is detected by **keyword lists (EN/FR/AR) AND the LLM flag**. Either one switches the UI to a **contacts card first**; the AI chat also bypasses the LLM and shows contacts.
- The AI is prompted never to diagnose or give medical advice.
- Data stays in a local SQLite file. Cycle tracking is **opt-in**. **Delete my data** wipes everything.
- Journal text is sent to Groq/Gemini for analysis; mention this to users in a production version.

## Tech stack
FastAPI + SQLModel (SQLite) · React 19 + Vite · Tailwind + DaisyUI · Recharts · Docker + nginx · uv

## Run it
**Docker (3 commands)**
```bash
git clone <repo> && cd <repo>
cp Backend/.env.example Backend/.env   # add Google client ID and optional AI keys
cp .env.example .env                   # set VITE_GOOGLE_CLIENT_ID
docker compose up --build              # open http://localhost:3000
```
**Dev**
```bash
cp Backend/.env.example Backend/.env   # set GOOGLE_CLIENT_ID
cp Frontend/.env.example Frontend/.env # set VITE_GOOGLE_CLIENT_ID to the same value
# In separate terminals:
cd Backend && uv run uvicorn backend.main:app --reload --port 8000
cd Frontend && npm ci && npm run dev   # http://localhost:5173
```
Create a Google Cloud OAuth **Web application** client and add
`http://localhost:5173` and `http://localhost:3000` as authorized JavaScript
origins. Set the same client ID in all three environment files above. The
frontend ID is public and is embedded at build time; do not put a client secret
in the frontend. For Docker, rebuild after changing the root `.env`.

Every API route requires a verified Google sign-in. Profiles, journals,
calendar events, plans, and exercise logs are scoped to the verified account.
Pre-existing database rows are retained under an inaccessible
`legacy-unassigned` owner rather than being exposed to the first account or
deleted during startup.
Then Profile → *Load sample calendar* and *Load demo history*. API docs: http://localhost:8000/docs

## Test the AI
```bash
cd Backend
uv run python scripts/test_ai.py                 # 9 sentences AR/FR/EN
uv run python scripts/test_ai.py note.m4a        # + transcribe real voice notes
uv run python scripts/test_ai.py --nokey         # check the canned fallback
```

## Limits and roadmap
- Exercise titles are English only; the LLM messages follow the user's language.
- SQLite data is separated by Google account but is not encrypted at rest; secure the database and backups in production.
- Emotion scores come from an LLM and have not been clinically validated.
- Next: translated exercise library, accounts, campus counsellor hand-off, on-device models.
