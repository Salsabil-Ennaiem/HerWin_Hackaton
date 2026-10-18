"""Test the AI pipeline on AR / FR / EN text and (optionally) real voice notes.

Run from the Backend folder:
  uv run python scripts/test_ai.py                      # text tests (3 sentences x 3 languages)
  uv run python scripts/test_ai.py voice1.m4a note.webm # also transcribe these audio files
  uv run python scripts/test_ai.py --nokey              # simulate missing keys -> local text analysis
"""
import asyncio
import json
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

if "--nokey" in sys.argv:
    os.environ["GROQ_API_KEY"] = ""
    os.environ["GEMINI_API_KEY"] = ""

from app import ai, logic  # noqa: E402

SAMPLES = {
    "en": ["I have a midterm in 3 days and I can't sleep, my heart is racing.",
           "Today was fine, I studied with friends and felt calm.",
           "I feel so alone and everything is pointless."],
    "fr": ["J'ai un examen dans 3 jours et je n'arrive pas à dormir.",
           "Belle journée, j'ai bien avancé et je suis de bonne humeur.",
           "Je suis épuisée, je n'en peux plus de la pression."],
    "ar": ["عندي امتحان بعد ثلاثة أيام ولا أستطيع النوم، أشعر بالقلق.",
           "كان يومي جيداً وأنجزت الكثير من الدراسة.",
           "أشعر بحزن شديد ولا أريد أن أتحدث مع أحد."],
}


class FakeUpload:
    def __init__(self, path: Path):
        self.filename, self.content_type = path.name, "audio/webm" if path.suffix == ".webm" else "audio/mpeg"
        self._data = path.read_bytes()

    async def read(self):
        return self._data


async def main():
    keys = {k: bool(os.getenv(k)) for k in ("GROQ_API_KEY", "GEMINI_API_KEY")}
    print("keys loaded:", keys, "\n")
    for lang, texts in SAMPLES.items():
        for t in texts:
            res = await ai.analyze(t)
            unsafe = logic.check_safety(t, res)
            print(f"[{lang}] {t}\n   -> emotions={res['emotions']} dominant={res['dominant']} "
                  f"valence={res['valence']} "
                  f"distress_flag={unsafe}\n   -> {res['support_message']}")
            assert res["emotions"] and res["dominant"] in res["emotions"], "bad JSON shape"
        print()
    for p in [Path(a) for a in sys.argv[1:] if not a.startswith("--")]:
        text = await ai.transcribe(FakeUpload(p))
        print(f"VOICE {p.name}: {json.dumps(text, ensure_ascii=False) or 'EMPTY (check key/format)'}")


asyncio.run(main())
