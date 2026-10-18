import os
import json
from typing import Any

# Prefer Gemini free tier, fallback Groq
async def call_llm_json(prompt: str) -> dict:
    # Implement with google-generativeai or groq SDK
    # Always force JSON mode
    # On failure return a safe default
    try:
        # ... real call ...
        return parsed_json
    except Exception:
        return {
            "emotions": {"neutral": 0.7},
            "dominant": "neutral",
            "valence": 0.0,
            "themes": [],
            "distress_flag": False
        }


async def support_message(text: str, emotion: dict, lang: str) -> str:
    prompt = f"""
You are a warm, non-diagnostic supportive coach for university students.
Write 1-2 short sentences reacting to this journal entry.
Never diagnose. Never give medical advice.
Language: {lang}
Dominant emotion: {emotion.get('dominant')}
Entry: \"\"\"{text[:400]}\"\"\"
"""
    result = await call_llm_json(prompt + "\nReply only with: {\"message\": \"...\"}")
    return result.get("message", "Thank you for sharing. You're taking a good step by checking in with yourself.")