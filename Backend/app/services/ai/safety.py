SAFETY_KEYWORDS = {
    "en": ["suicide", "kill myself", "want to die", "self-harm", "end it all"],
    "fr": ["suicide", "me tuer", "veux mourir", "me faire du mal"],
    "ar": ["انتحار", "أقتل نفسي", "أريد أن أموت"]
}

def check_safety(text: str, emotion: dict, lang: str = "en") -> dict:
    """
    Returns:
    {
        "distress_flag": bool,
        "safety_message": str | None
    }
    """
    text_lower = text.lower()
    keywords = SAFETY_KEYWORDS.get(lang, SAFETY_KEYWORDS["en"])
    keyword_hit = any(kw in text_lower for kw in keywords)

    score_hit = emotion.get("distress_flag", False) or emotion.get("emotions", {}).get("sadness", 0) > 0.85

    if keyword_hit or score_hit:
        return {
            "distress_flag": True,
            "safety_message": (
                "It sounds like you're going through a really hard time. "
                "Please reach out to someone you trust or a professional. "
                "You are not alone. (This app is not a crisis service.)"
            )
        }
    return {"distress_flag": False, "safety_message": None}