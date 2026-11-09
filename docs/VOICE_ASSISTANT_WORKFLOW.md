# 🎙️ SmartFace Voice Assistant & Speech Integration Architecture

## 1. Executive Summary & Design Rationale

This document defines the production implementation and operational workflow for voice capabilities across the **SmartFace Attendance & Biometric Security Suite**.

### 1.1 Where Voice Is Required vs. Not Required

| Feature Module | Voice Required? | Purpose & UX Value | Implementation Strategy |
| :--- | :---: | :--- | :--- |
| **Nexa AI Assistant (Student/Teacher Portal)** | **YES** | Hands-free natural queries: "What is my attendance in OS?", "Can I bunk Friday lab?", "Show timetable". | Client-side Web Speech Recognition + SpeechSynthesis |
| **Biometric Podium / Kiosk Announcements** | **YES** | Instant audio confirmation: "Attendance verified for [Name]" or "Security alert: unregistered face". | Browser SpeechSynthesis (Web Kiosk) / `pyttsx3` (Python core) |
| **Biometric Authentication (Voice Biometrics)** | **NO** | Voice is easily replayed or spoofed by phone speakers. Face (ArcFace ONNX) + Anti-Proxy Rotating QR provides true 2FA. | **Rejected** (Security risk & redundant) |
| **Heavy Local Voice Cloning (e.g. VoiceStudio)** | **NO** | 10+ GB VRAM requirement, 2-4s latency, and AGPL-3.0 license pollution. | **Rejected** (Extreme resource overhead) |

---

## 2. End-to-End Architecture

```
[ User Speaks ]
      │
      ▼
[ Browser Microphone ]
      │ (Hardware Audio Capture)
      ▼
[ Web Speech API (webkitSpeechRecognition) ] ──▶ Real-time transcription into input state
      │
      ▼
[ GlobalChatbot (Next.js 15 Client) ]
      │ (Sends JSON payload via REST)
      ▼
[ Node.js Express Gateway (Port 8000) ]
      │ (JWT Authentication & Route Protection)
      ▼
[ FastAPI AI Microservice (Port 8001) ]
      │ (Groq Llama-3 / Gemini Flash inference)
      ▼
[ Student Attendance & Academic Context ]
      │
      ▼
[ AI Response JSON ] ──▶ [ GlobalChatbot UI ]
                                │
                                ▼
                   [ Web SpeechSynthesisUtterance ]
                                │
                                ▼
                       [ Audio Readout via Speaker ]
```

---

## 3. Component Details & Implementation

### 3.1 Web Portal (`frontend/web/components/portal/global-chatbot.tsx`)

* **Speech-to-Text (STT):**
  * Uses standard `window.webkitSpeechRecognition` / `window.SpeechRecognition`.
  * Activated by clicking the microphone button next to the prompt input.
  * Live status banner indicates active recording (`Listening... Speak your academic query`).
  * Live transcript binds directly to the input state, with an automatic stop hook on message send or manual toggle.
  * Handles permission denials (`not-allowed`) gracefully without crash.

* **Text-to-Speech (TTS):**
  * Uses `window.speechSynthesis` with `SpeechSynthesisUtterance`.
  * **Global Auto-Voice Toggle:** Top bar volume icon (`Volume2` / `VolumeX`) allows users to toggle auto-speech for all incoming AI answers.
  * **Individual Read-Aloud:** Each AI message bubble includes an inline speaker icon to vocalize that specific response on demand.
  * **Clean Sanitizer:** Automatically strips Markdown tokens (`*`, `#`, `` ` ``, URLs) prior to sending text to the audio synthesizer to ensure smooth, natural speech cadence.

### 3.2 Mobile App Implementation (`mobile/`)

Implemented in clean architecture via `VoiceAssistantService` (`lib/features/chatbot/services/voice_assistant_service.dart`) and integrated directly into `NexaChatSheet` (`lib/features/chatbot/widgets/nexa_chat_sheet.dart`):

* **Input (STT):** `speech_to_text` plugin (bridges to Google Speech on Android and Apple Dictation on iOS).
  * Microphone toggle button beside the text input with active pulsing red state and haptic feedback.
  * Real-time text streaming directly into `_textController` with dynamic selection cursor management.
  * Active recording banner with animated progress indicator and quick `DONE` tap handler.
  * Native permission declarations in `AndroidManifest.xml` (`RECORD_AUDIO` and `android.speech.RecognitionService` intent filter in `<queries>`) and iOS `Info.plist` (`NSMicrophoneUsageDescription`, `NSSpeechRecognitionUsageDescription`).
* **Output (TTS):** `flutter_tts` plugin (bridges to Android TextToSpeech and iOS `AVSpeechSynthesizer`).
  * Inline speaker button on every bot message bubble to listen or stop playback.
  * Header Auto-Voice toggle button (`volume_up` / `volume_off`) for continuous vocal responses.
  * Automatic Markdown sanitizer stripping asterisks, headers, URLs, and code blocks for crisp vocal delivery.
* **Zero Cloud Cost & Latency:** 100% on-device speech processing with 0ms server queue and zero external API fees.

---

## 4. Security & Performance Guardrails

1. **Permission Isolation:** Microphones are only activated upon explicit user interaction (`onClick`). No background listening or passive recording occurs.
2. **Zero Audio Exfiltration:** Audio waveform stays in the user's browser/device OS. Only the transcribed text string is transmitted to the authenticated backend.
3. **No GPU Resource Contention:** Keeps GPU resources fully dedicated to ArcFace 512-dimensional facial embedding extraction and ONNX model inference.
4. **License Compliance:** 100% MIT-compatible standard Web APIs, avoiding AGPL-3.0 copyleft contamination.

