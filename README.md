# SynTalk — Speak Without Words

> AI-powered assistive communication platform for mute and speech-impaired people

## Overview

SynTalk bridges the communication gap between mute and non-mute people using:
- **Smart wearable hardware** (Arduino glove with flex sensors)
- **Machine learning** (MediaPipe Hands + TensorFlow.js KNN classifier)
- **Real-time gesture recognition** converting signs to text and speech
- **AI sentence completion** (Claude Haiku)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js, Tailwind CSS, Framer Motion, Three.js |
| Backend | Node.js, Express.js, WebSocket |
| Database | Firebase Firestore |
| Auth | Firebase Authentication |
| ML | MediaPipe Hands, TensorFlow.js KNN |
| AI | Anthropic Claude Haiku |
| Hardware | Arduino Uno, Flex Sensors ×4, HM-10 BLE, LCD 16×2 |

---

## Hardware Connections

| Component | Pin |
|-----------|-----|
| Flex Sensor — Index  | A0 |
| Flex Sensor — Middle | A1 |
| Flex Sensor — Ring   | A2 |
| Flex Sensor — Pinky  | A3 |
| HM-10 BLE TX → Arduino RX | D2 |
| HM-10 BLE RX → Arduino TX | D3 |
| LCD SDA | A4 |
| LCD SCL | A5 |

---

## Setup

### Prerequisites
- Node.js 18+
- Arduino IDE
- Firebase project

### Backend
```bash
cd server
npm install
cp .env.example .env   # fill in Firebase + Anthropic keys
npm run dev
```

### Frontend
```bash
cd client
npm install
cp .env.example .env   # fill in Firebase config
npm run dev
```

### Arduino
1. Open `syntalk_glove.ino` in Arduino IDE
2. Set `CALIBRATE = true`, upload, record your sensor range
3. Update `CAL_OPEN` and `CAL_CLOSE` with your values
4. Set `CALIBRATE = false`, upload

---

## Features

### Dashboard Modes
- **Hardware Mode** — Real-time glove data → 3D hand mirroring → gesture recognition
- **ML Camera Mode** — Webcam + MediaPipe → skeleton overlay → gesture recognition
- **Hybrid Mode** — Both sources combined for maximum accuracy

### Training Studio
- Record 40 samples per gesture
- KNN in-browser classifier
- Separate models for camera and hardware
- Test predictions before using

### AI Assistant
- Sentence completion from partial gestures
- 5 AI-powered word suggestions
- Text-to-speech output
- Conversation history

### Safety
- Emergency SOS gesture
- 10-second countdown with cancel
- Emergency contacts notified
- Works in all modes

---

## Architecture