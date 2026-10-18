# Slides 5-7 (text to paste)

## Slide 5: How the AI works
- Input: text, voice (Whisper) or 5 taps, in Arabic, French or English
- Llama 3.3 returns structured JSON: emotions, themes, distress flag, support message
- Rule engine (explainable) turns that into: stress = 50% negativity + 30% academic load + 20% trend
- Fallback chain: Groq → Gemini → canned message. The app never breaks.
- *Visual:* diagram  Input → Whisper → LLM (JSON) → Rules → Result page

## Slide 6: Safety, privacy, ethics
- Not a medical tool; the AI never diagnoses
- Double distress check (keywords + LLM) → contacts card shown FIRST
- Local SQLite, opt-in cycle tracking, "Delete my data" button
- Built for our context: Arabic/French/English, RTL support
- *Visual:* screenshot of the contacts card + Profile privacy section

## Slide 7: Limits and what's next
- Today: single-user demo, English exercise library, LLM-based emotion scores not clinically validated
- Next: accounts + encryption, translated exercises, campus counsellor hand-off, on-device models
- Done as bonus: AI chat, .ics/PDF export, FR/AR interface
- *Closing line:* "Stress is invisible until it's too late. HERwin makes it visible, and gives a next step."

# Demo script (3 minutes)

**Before going on stage:** Profile → *Load sample calendar* (midterm in 3 days) → *Load demo history*. Open the app on Journal. Keep a backup video ready.

| Time | Do | Say |
|---|---|---|
| 0:00 | Dashboard | "Here is a student 14 days before exams: stress rising, midterm in 3 days." |
| 0:30 | Journal → Speak (or type): *"J'ai mon examen dans 3 jours et je n'arrive pas à dormir"* → Analyse | "She speaks in French; Whisper transcribes, the AI reads emotion." |
| 1:00 | Results page | "Stress score, a kind message in French, exercises, and a plan that already works around her exam." |
| 1:30 | Tick two plan blocks, click *I did this* on an exercise | "She tracks what she actually did." |
| 1:50 | Click *Add to calendar (.ics)* | "The plan goes straight into her real calendar." |
| 2:10 | Switch language to AR | "The whole UI switches to Arabic, right-to-left." |
| 2:25 | Chat: type *"je veux mourir"* | "Safety first: no AI improvisation, real contacts immediately." |
| 2:45 | Profile → Delete my data | "And she owns her data: one click wipes everything." |
| 3:00 | End | Closing line |

**If something fails:** kill the key to show the fallback ("the app still works"), or play the backup video.
