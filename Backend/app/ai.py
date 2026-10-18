"""AI layer: analyze() with Groq -> Gemini -> canned fallback, and transcribe() with Groq Whisper."""
import copy
import json
import os
import re

import httpx
from dotenv import load_dotenv

load_dotenv()

GROQ_CHAT = "https://api.groq.com/openai/v1/chat/completions"
GROQ_STT = "https://api.groq.com/openai/v1/audio/transcriptions"
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")

FALLBACK = {
    "emotions": {"anxiety": 0.5, "sadness": 0.2, "neutral": 0.3},
    "dominant": "anxiety",
    "valence": -0.3,
    "themes": [],
    "distress": False,
    "support_message": "Thank you for sharing. Let's take one small step at a time.",
    "activities": {
        "indoor": ["Tidy your desk for 5 minutes", "Make a warm drink and stretch"],
        "outdoor": ["Take a 10-minute walk", "Sit in the sun for a few minutes"],
    },
}

SYSTEM_PROMPT = """You are a warm, non-diagnostic wellbeing coach for university students.
Analyse the journal entry (Arabic, French, English or mixed). Never diagnose, never give medical advice.
Reply ONLY with valid JSON, exactly this shape:
{
 "emotions": {"anxiety":0-1,"sadness":0-1,"anger":0-1,"fear":0-1,"joy":0-1,"neutral":0-1},
 "dominant": "one of the emotion keys",
 "valence": -1.0 to 1.0,
 "themes": ["max 4 short words, e.g. exam, sleep, family"],
 "distress": true only if the student mentions self-harm, suicide or hopelessness,
 "support_message": "1-2 kind sentences, written in the SAME language as the entry",
 "activities": {"indoor": ["2 short ideas"], "outdoor": ["2 short ideas"]}
}"""


def _extract_json(raw: str) -> dict:
    try:
        return json.loads(raw)
    except Exception:
        m = re.search(r"\{.*\}", raw, re.DOTALL)
        if not m:
            raise
        return json.loads(m.group(0))


def _clamp(x, lo, hi, default=0.0):
    try:
        return max(lo, min(hi, float(x)))
    except Exception:
        return default


def _clean(d: dict) -> dict:
    """Force the LLM output into the shape routes.py expects."""
    emotions = {str(k).lower(): round(_clamp(v, 0, 1), 3) for k, v in (d.get("emotions") or {}).items()}
    if not emotions:
        emotions = {"neutral": 1.0}
    dominant = str(d.get("dominant", "")).lower()
    if dominant not in emotions:
        dominant = max(emotions, key=emotions.get)
    act = d.get("activities") or {}
    return {
        "emotions": emotions,
        "dominant": dominant,
        "valence": _clamp(d.get("valence", 0), -1, 1),
        "themes": [str(t) for t in (d.get("themes") or [])][:4],
        "distress": bool(d.get("distress", False)),
        "support_message": str(d.get("support_message") or FALLBACK["support_message"]),
        "activities": {
            "indoor": [str(a) for a in (act.get("indoor") or [])][:3],
            "outdoor": [str(a) for a in (act.get("outdoor") or [])][:3],
        },
    }


def _user_prompt(text: str, context: str) -> str:
    ctx = f"\nUpcoming academic events: {context}" if context else ""
    return f'Journal entry:\n"""{text[:2000]}"""{ctx}'


async def _groq(text: str, context: str) -> dict:
    key = os.getenv("GROQ_API_KEY")
    if not key:
        raise RuntimeError("no GROQ_API_KEY")
    async with httpx.AsyncClient(timeout=25) as c:
        r = await c.post(
            GROQ_CHAT,
            headers={"Authorization": f"Bearer {key}"},
            json={
                "model": GROQ_MODEL,
                "temperature": 0.3,
                "response_format": {"type": "json_object"},
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": _user_prompt(text, context)},
                ],
            },
        )
        r.raise_for_status()
        return _extract_json(r.json()["choices"][0]["message"]["content"])


async def _gemini(text: str, context: str) -> dict:
    key = os.getenv("GEMINI_API_KEY")
    if not key:
        raise RuntimeError("no GEMINI_API_KEY")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent"
    async with httpx.AsyncClient(timeout=25) as c:
        r = await c.post(
            url,
            params={"key": key},
            json={
                "systemInstruction": {"parts": [{"text": SYSTEM_PROMPT}]},
                "contents": [{"role": "user", "parts": [{"text": _user_prompt(text, context)}]}],
                "generationConfig": {"temperature": 0.3, "responseMimeType": "application/json"},
            },
        )
        r.raise_for_status()
        return _extract_json(r.json()["candidates"][0]["content"]["parts"][0]["text"])


async def analyze(text: str, context: str = "") -> dict:
    for fn in (_groq, _gemini):
        try:
            return _clean(await fn(text, context))
        except Exception as e:
            print(f"[ai] {fn.__name__} failed: {e}")
    return copy.deepcopy(FALLBACK)


async def transcribe(audio) -> str:
    """audio is a FastAPI UploadFile. Returns '' on any failure so the UI can ask the user to type."""
    key = os.getenv("GROQ_API_KEY")
    if not key:
        return ""
    try:
        data = await audio.read()
        async with httpx.AsyncClient(timeout=60) as c:
            r = await c.post(
                GROQ_STT,
                headers={"Authorization": f"Bearer {key}"},
                files={"file": (audio.filename or "audio.webm", data, audio.content_type or "audio/webm")},
                data={"model": "whisper-large-v3"},
            )
            r.raise_for_status()
            return (r.json().get("text") or "").strip()
    except Exception as e:
        print(f"[ai] transcribe failed: {e}")
        return ""
