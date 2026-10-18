"""Supportive chat reply (Groq -> Gemini -> canned fallback)."""
import os

import httpx

from .ai import GEMINI_MODEL, GROQ_CHAT, GROQ_MODEL

SYSTEM = """You are a warm, supportive companion for university students, inside a wellbeing app.
Reply in the SAME language as the student (Arabic, French or English), in at most 3 short sentences.
Listen first, validate feelings, offer at most one small practical idea.
Never diagnose, never give medical advice, never mention medication.
If the student seems in danger, encourage them to contact someone they trust or emergency services."""

FALLBACK = {
    "en": [
        "I'm sorry this feels so heavy. Would you like to tell me what has been hardest today?",
        "I hear how sad you feel. What do you think has been weighing on you most?",
        "You don't have to sort everything out at once. What might help you feel a little supported right now?",
    ],
    "fr": [
        "Je suis désolé(e) que ce soit si lourd. Tu veux me raconter ce qui a été le plus difficile aujourd'hui ?",
        "Je t'entends : tu te sens vraiment triste. Qu'est-ce qui te pèse le plus en ce moment ?",
        "Tu n'as pas besoin de tout régler d'un coup. Qu'est-ce qui pourrait t'apporter un peu de soutien maintenant ?",
    ],
    "ar": [
        "آسف لأن هذا يبدو ثقيلاً عليك. هل ترغب في إخباري بما كان الأصعب اليوم؟",
        "أسمع مدى حزنك. ما أكثر شيء يشغل بالك الآن؟",
        "ليس عليك حل كل شيء دفعة واحدة. ما الذي قد يمنحك بعض الدعم الآن؟",
    ],
}


async def _groq(msgs, system):
    key = os.getenv("GROQ_API_KEY")
    if not key:
        raise RuntimeError("no GROQ_API_KEY")
    async with httpx.AsyncClient(timeout=25) as c:
        r = await c.post(
            GROQ_CHAT,
            headers={"Authorization": f"Bearer {key}"},
            json={"model": GROQ_MODEL, "temperature": 0.6, "max_tokens": 250,
                  "messages": [{"role": "system", "content": system}] + msgs},
        )
        r.raise_for_status()
        return r.json()["choices"][0]["message"]["content"].strip()


async def _gemini(msgs, system):
    key = os.getenv("GEMINI_API_KEY")
    if not key:
        raise RuntimeError("no GEMINI_API_KEY")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent"
    contents = [{"role": "model" if m["role"] == "assistant" else "user",
                 "parts": [{"text": m["content"]}]} for m in msgs]
    async with httpx.AsyncClient(timeout=25) as c:
        r = await c.post(url, params={"key": key}, json={
            "systemInstruction": {"parts": [{"text": system}]},
            "contents": contents,
            "generationConfig": {"temperature": 0.6, "maxOutputTokens": 250},
        })
        r.raise_for_status()
        return r.json()["candidates"][0]["content"]["parts"][0]["text"].strip()


async def chat_reply(history: list, message: str, lang: str, context: str = "") -> str:
    msgs = [{"role": m["role"], "content": str(m["content"])[:1500]}
            for m in history[-10:]
            if m.get("role") in ("user", "assistant") and m.get("content")]
    msgs.append({"role": "user", "content": message[:1500]})
    system = SYSTEM + (f"\nContext about the student: {context}" if context else "")
    for fn in (_groq, _gemini):
        try:
            return await fn(msgs, system)
        except Exception as e:
            print(f"[chat] {fn.__name__} failed: {e}")
    fallback_lang = lang
    if any("\u0600" <= char <= "\u06ff" for char in message):
        fallback_lang = "ar"
    elif any(word in message.lower().split() for word in ("je", "suis", "tu", "triste", "déprimé", "déprimée", "deprime", "dépression", "ça", "pas")):
        fallback_lang = "fr"
    replies = FALLBACK.get(fallback_lang, FALLBACK["en"])
    reply_count = sum(m.get("role") == "assistant" for m in history)
    return replies[reply_count % len(replies)]
