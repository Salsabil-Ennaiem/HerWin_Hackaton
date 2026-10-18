async def transcribe(audio_bytes: bytes, filename: str = "audio.webm") -> str:
    """
    Use Groq Whisper large-v3 free tier.
    Fallback: return empty string so the UI can ask the user to type.
    """
    try:
        # from groq import Groq
        # client = Groq(api_key=os.getenv("GROQ_API_KEY"))
        # ... call whisper ...
        return transcript_text
    except Exception:
        return ""