"""AI layer: analyze() with Groq -> Gemini -> local text fallback, and transcribe() with Groq Whisper."""
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

DEFAULT_SUPPORT_MESSAGE = "Thank you for sharing. Let's take one small step at a time."
DEFAULT_ACTIVITIES = {
    "indoor": ["Tidy your desk for 5 minutes", "Make a warm drink and stretch"],
    "outdoor": ["Take a 10-minute walk", "Sit in the sun for a few minutes"],
}

EMOTION_TERMS = {
    "anxiety": (
        "anxious", "anxiety", "worried", "worry", "worrying", "stressed", "stress",
        "overwhelmed", "nervous", "panic", "exam", "midterm", "deadline",
        "can't sleep", "heart is racing",
        "anxieux", "anxieuse", "anxiété", "inquiet", "inquiète", "inquiétude",
        "stressé", "stressée", "examen", "échéance", "pression",
        "قلق", "متوتر", "متوترة", "توتر", "امتحان", "ضغط",
    ),
    "sadness": (
        "sad", "sadness", "lonely", "alone", "hopeless", "down",
        "triste", "tristesse", "seul", "seule", "épuisé", "épuisée",
        "حزين", "حزينة", "حزن", "وحيد", "وحيدة",
    ),
    "anger": (
        "angry", "anger", "furious", "frustrated", "annoyed",
        "colère", "fâché", "fâchée", "énervé", "énervée",
        "غاضب", "غاضبة", "منزعج", "منزعجة",
    ),
    "fear": (
        "afraid", "scared", "fear", "terrified",
        "peur", "effrayé", "effrayée", "terrifié", "terrifiée",
        "خائف", "خائفة", "خوف",
    ),
    "joy": (
        "happy", "happiness", "joy", "glad", "grateful", "proud", "excited",
        "calm", "peaceful", "fine", "good",
        "heureux", "heureuse", "content", "contente", "joie", "reconnaissant",
        "reconnaissante", "fier", "fière", "calme", "bien", "bonne humeur",
        "سعيد", "سعيدة", "فرح", "فرحة", "مرتاح", "مرتاحة", "جيد", "جيدة",
    ),
}

THEME_TERMS = {
    "exam": ("exam", "examen", "midterm", "deadline", "امتحان"),
    "sleep": ("sleep", "can't sleep", "insomnia", "dormir", "sommeil", "نوم"),
    "study": ("study", "studying", "étudier", "études", "دراسة"),
    "family": ("family", "famille", "عائلة", "أسرة"),
    "relationships": ("friend", "friends", "family", "ami", "amie", "أصدقاء"),
}

SUPPORT_MESSAGES = {
    "en": {
        "anxiety": "It sounds like a lot is weighing on you. Try taking one thing at a time.",
        "sadness": "It sounds like today feels heavy. You do not have to handle everything at once.",
        "anger": "It sounds frustrating. A short pause may help you decide what you need next.",
        "fear": "It sounds unsettling. Focus on one small step you can take right now.",
        "joy": "It is good to hear something went well. Take a moment to appreciate that.",
        "neutral": "Thank you for checking in. Notice what would help you feel supported today.",
    },
    "fr": {
        "anxiety": "Tu sembles avoir beaucoup de choses en tête. Essaie de les prendre une par une.",
        "sadness": "Cette journée semble pesante. Tu n'as pas à tout gérer d'un seul coup.",
        "anger": "La situation semble frustrante. Une petite pause peut aider à voir ce dont tu as besoin.",
        "fear": "Cela semble inquiétant. Concentre-toi sur une petite étape possible maintenant.",
        "joy": "C'est agréable de savoir que quelque chose s'est bien passé. Prends le temps de l'apprécier.",
        "neutral": "Merci pour ce partage. Demande-toi ce qui pourrait te soutenir aujourd'hui.",
    },
    "ar": {
        "anxiety": "يبدو أن هناك الكثير مما يشغل بالك. حاولي التعامل مع الأمور خطوةً خطوة.",
        "sadness": "يبدو أن هذا اليوم ثقيل عليك. ليس عليك التعامل مع كل شيء دفعة واحدة.",
        "anger": "يبدو أن الموقف محبط. قد تساعدك استراحة قصيرة على معرفة ما تحتاجينه.",
        "fear": "يبدو أن الأمر مقلق. ركزي على خطوة صغيرة يمكنك القيام بها الآن.",
        "joy": "يسعدني أن بعض الأمور سارت جيدًا. خذي لحظة لتقدير ذلك.",
        "neutral": "شكرًا لمشاركتك. فكري فيما قد يساعدك اليوم.",
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
        "support_message": str(d.get("support_message") or DEFAULT_SUPPORT_MESSAGE),
        "activities": {
            "indoor": [str(a) for a in (act.get("indoor") or DEFAULT_ACTIVITIES["indoor"])][:3],
            "outdoor": [str(a) for a in (act.get("outdoor") or DEFAULT_ACTIVITIES["outdoor"])][:3],
        },
    }


def _contains_term(text: str, term: str) -> bool:
    if re.search(r"[\u0600-\u06ff]", term):
        return term in text
    return re.search(rf"(?<!\w){re.escape(term)}(?!\w)", text) is not None


def _local_fallback(text: str) -> dict:
    """Provide a transparent, approximate keyword analysis when both AI providers fail."""
    normalized = text.casefold()
    language = "ar" if re.search(r"[\u0600-\u06ff]", normalized) else (
        "fr" if any(_contains_term(normalized, term) for term in (
            "je", "j'", "suis", "mon", "ma", "mes", "une", "triste", "heureux",
            "heureuse", "inquiet", "inquiète", "examen", "journée",
        )) else "en"
    )

    emotions = {
        emotion: round(min(0.95, 0.2 + 0.15 * sum(
            _contains_term(normalized, term) for term in terms
        )), 2)
        for emotion, terms in EMOTION_TERMS.items()
    }
    emotions = {emotion: score for emotion, score in emotions.items() if score > 0.2}
    if not emotions:
        emotions = {"neutral": 0.75}
    else:
        strongest_emotion = max(emotions.values())
        emotions["neutral"] = round(max(0.05, 0.5 * (1 - strongest_emotion)), 2)

    dominant = max(emotions, key=emotions.get)
    negative = sum(emotions.get(emotion, 0) for emotion in ("anxiety", "sadness", "anger", "fear"))
    valence = round(max(-1.0, min(1.0, emotions.get("joy", 0) - negative)), 2)
    themes = [
        theme for theme, terms in THEME_TERMS.items()
        if any(_contains_term(normalized, term) for term in terms)
    ][:4]
    return {
        "emotions": emotions,
        "dominant": dominant,
        "valence": valence,
        "themes": themes,
        "distress": False,
        "support_message": SUPPORT_MESSAGES[language][dominant],
        "activities": DEFAULT_ACTIVITIES,
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
    return _local_fallback(text)


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
