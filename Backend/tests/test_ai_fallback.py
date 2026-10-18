import asyncio
import unittest
from unittest.mock import AsyncMock, patch

from app import ai, logic


class LocalFallbackTests(unittest.TestCase):
    def test_emotions_and_message_change_with_journal_text(self):
        worried = ai._local_fallback("I am anxious, worried and stressed about my exam")
        happy = ai._local_fallback("I feel happy and calm")
        sad = ai._local_fallback("Je suis triste")

        self.assertEqual(worried["dominant"], "anxiety")
        self.assertEqual(happy["dominant"], "joy")
        self.assertEqual(sad["dominant"], "sadness")
        self.assertNotEqual(worried["emotions"], happy["emotions"])
        self.assertNotEqual(worried["support_message"], happy["support_message"])
        self.assertNotEqual(worried["emotions"]["neutral"], happy["emotions"]["neutral"])

    def test_recognizes_arabic_and_neutral_text(self):
        arabic = ai._local_fallback("أشعر بالحزن")
        neutral = ai._local_fallback("Nothing special to report")

        self.assertEqual(arabic["dominant"], "sadness")
        self.assertEqual(neutral["dominant"], "neutral")

    def test_hopelessness_triggers_the_safety_check_without_an_ai_key(self):
        result = ai._local_fallback("I feel so alone and everything is pointless.")

        self.assertTrue(logic.check_safety("I feel so alone and everything is pointless.", result))

    def test_analyze_uses_text_fallback_when_both_providers_fail(self):
        with (
            patch.object(ai, "_groq", new=AsyncMock(side_effect=RuntimeError("offline"))),
            patch.object(ai, "_gemini", new=AsyncMock(side_effect=RuntimeError("offline"))),
        ):
            worried = asyncio.run(ai.analyze("I am worried about my exam"))
            happy = asyncio.run(ai.analyze("I feel happy and calm"))

        self.assertNotEqual(worried["emotions"], happy["emotions"])
        self.assertEqual(worried["dominant"], "anxiety")
        self.assertEqual(happy["dominant"], "joy")


if __name__ == "__main__":
    unittest.main()
