async def transcribe(file) -> str:
    return "I can't sleep and I'm stressed about my exam."

async def analyze(text: str, context: str = "") -> dict:
    return {"emotions": {"anxiety": 0.6, "sadness": 0.2, "joy": 0.05},
            "dominant": "anxiety", "valence": -0.4, "themes": ["exam", "sleep"],
            "distress": 0,
            "support_message": "Thank you for sharing. One small step at a time.",
            "activities": {"indoor": ["Stretching, 10 min"], "outdoor": ["Walk, 15 min"]}}
