"""
Hybrid emotion analysis:
1. Local HuggingFace model (fast, free, offline)
2. Gemini / Groq LLM in JSON mode (nuance + themes)
3. Fusion
"""

from typing import Dict, Any
import os

# TODO: load your HF model once at startup
# from transformers import pipeline
# emotion_pipe = pipeline("text-classification", model="...", top_k=None)

async def analyze_emotion(text: str, lang: str = "en") -> Dict[str, Any]:
    """
    Returns:
    {
        "emotions": {"anxiety": 0.61, "sadness": 0.18, "joy": 0.05, ...},
        "dominant": "anxiety",
        "valence": -0.45,
        "themes": ["exam", "sleep"],
        "distress_flag": False
    }
    """
    # --- Signal 1: local model ---
    local = await _local_emotion(text)

    # --- Signal 2: LLM ---
    llm = await _llm_emotion(text, lang)

    # --- Fusion ---
    fused = _fuse(local, llm)
    return fused


async def _local_emotion(text: str) -> Dict:
    # Temporary fallback until HF model is loaded
    # Replace with real model call
    return {
        "emotions": {"anxiety": 0.5, "sadness": 0.2, "neutral": 0.3},
        "dominant": "anxiety",
        "valence": -0.3
    }


async def _llm_emotion(text: str, lang: str) -> Dict:
    # Call Gemini or Groq with a strict JSON prompt
    # See services/ai/llm.py
    from .llm import call_llm_json
    prompt = f"""
You are an emotion analyst for a student mental-wellbeing app.
Analyze this journal entry. Reply ONLY with valid JSON:
{{
  "emotions": {{"anxiety": 0.0-1.0, "sadness": ..., "anger": ..., "fear": ..., "joy": ..., "neutral": ...}},
  "dominant": "one word",
  "valence": -1.0 to 1.0,
  "themes": ["exam", "family", ...],
  "distress_flag": true/false
}}
Language of entry: {lang}
Entry:
\"\"\"{text}\"\"\"
"""
    return await call_llm_json(prompt)


def _fuse(local: Dict, llm: Dict) -> Dict:
    # Simple average of overlapping keys + take LLM themes & distress
    emotions = {}
    all_keys = set(local.get("emotions", {})) | set(llm.get("emotions", {}))
    for k in all_keys:
        emotions[k] = round(
            (local.get("emotions", {}).get(k, 0) + llm.get("emotions", {}).get(k, 0)) / 2, 3
        )
    dominant = max(emotions, key=emotions.get) if emotions else "neutral"
    valence = (local.get("valence", 0) + llm.get("valence", 0)) / 2
    return {
        "emotions": emotions,
        "dominant": dominant,
        "valence": round(valence, 3),
        "themes": llm.get("themes", []),
        "distress_flag": llm.get("distress_flag", False)
    }