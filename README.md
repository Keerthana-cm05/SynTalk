# SynTalk — Speak Without Words

> AI-powered assistive communication platform for mute and speech-impaired people

## Overview

SynTalk bridges the communication gap between mute and non-mute people using:

* **Smart wearable hardware** (Arduino glove with flex sensors)
* **Machine learning** (MediaPipe Hands + TensorFlow.js KNN classifier)
* **Real-time gesture recognition** converting signs to text and speech
* **AI sentence completion** (Claude Haiku)

---

## Tech Stack

| Layer    | Technology                                        |
| -------- | ------------------------------------------------- |
| Frontend | React.js, Tailwind CSS, Framer Motion, Three.js   |
| Backend  | Node.js, Express.js, WebSocket                    |
| Database | Firebase Firestore                                |
| Auth     | Firebase Authentication                           |
| ML       | MediaPipe Hands, TensorFlow.js KNN                |
| AI       | Claude Haiku                                      |
| Hardware | Arduino Uno, Flex Sensors ×4, HM-10 BLE, LCD 16×2 |

---

## Hardware Connections

| Component                 | Pin |
| ------------------------- | --- |
| Flex Sensor — Index       | A0  |
| Flex Sensor — Middle      | A1  |
| Flex Sensor — Ring        | A2  |
| Flex Sensor — Pinky       | A3  |
| HM-10 BLE TX → Arduino RX | D2  |
| HM-10 BLE RX → Arduino TX | D3  |
| LCD SDA                   | A4  |
| LCD SCL                   | A5  |

---

## Setup

### Prerequisites

* Node.js 18+
* Arduino IDE
* Firebase Project

---

### Backend

```bash
cd server
npm install
cp .env.example .env
npm run dev
```

Fill in:

* Firebase Admin credentials
* Anthropic API Key
* WebSocket configuration

---

### Frontend

```bash
cd client
npm install
cp .env.example .env
npm run dev
```

Fill in:

* Firebase Web Config
* Backend URL
* WebSocket URL

---

### Arduino

1. Open `syntalk_glove.ino`
2. Set:

```cpp
#define CALIBRATE true
```

3. Upload and record sensor values
4. Update:

```cpp
CAL_OPEN[]
CAL_CLOSE[]
```

5. Set:

```cpp
#define CALIBRATE false
```

6. Upload again

---

## Features

### Dashboard Modes

#### Hardware Mode

* Real-time glove sensor reading
* Finger bend visualization
* Gesture recognition
* Text generation
* Speech output

#### ML Camera Mode

* Webcam input
* MediaPipe hand tracking
* Skeleton overlay
* Gesture prediction

#### Hybrid Mode

* Combines glove + camera
* Increased accuracy
* Better robustness

---

## Training Studio

* Record 40 samples per gesture
* Browser-based KNN training
* Hardware model training
* Camera model training
* Real-time testing

Supported Gestures:

* Hello
* Yes
* No
* Help
* Water
* Food
* Thank You
* Emergency SOS

---

## AI Assistant

* Claude-powered sentence completion
* Smart phrase suggestions
* Context-aware communication
* Conversation history
* One-click speech synthesis

Example:

Input:

```text
I need...
```

Suggestions:

```text
I need water.
I need help.
I need medicine.
I need assistance.
I need to call someone.
```

---

## Safety Features

### Emergency SOS Gesture

When a predefined emergency gesture is detected:

1. Countdown begins (10 seconds)
2. User can cancel
3. Emergency contact notified
4. Alert stored in database

Works in:

* Hardware Mode
* Camera Mode
* Hybrid Mode

---

## Architecture

```text
Arduino Glove
(Flex Sensors + HM-10)

        │
        │ USB Serial (9600 baud)
        ▼

Node.js Server
(Express + WebSocket)

        │
        │ ws://localhost:5000/ws
        ▼

React Frontend

├── useGloveWebSocket
│     └── Sensor Normalization
│     └── KNN Prediction
│
├── Hand3DLive
│     └── Three.js Hand Model
│
├── useMediaPipe
│     └── Camera Tracking
│     └── Gesture Prediction
│
└── Firebase
      ├── Authentication
      ├── Firestore
      └── Storage
```

---

## Project Structure

```text
syntalk/

├── client/
│   ├── public/
│   │
│   └── src/
│       ├── components/
│       ├── hooks/
│       ├── pages/
│       ├── context/
│       ├── firebase/
│       ├── utils/
│       └── assets/
│
├── server/
│   ├── src/
│   │   ├── config/
│   │   ├── routes/
│   │   ├── services/
│   │   └── middleware/
│   │
│   └── index.js
│
├── hardware/
│   └── syntalk_glove.ino
│
└── README.md
```

---

## Workflow

1. User performs gesture
2. Flex sensors or camera capture movement
3. Data sent to frontend
4. KNN classifier predicts gesture
5. Gesture converted into text
6. Text displayed on dashboard
7. Text spoken using speech synthesis
8. Claude generates smart suggestions

---

## Future Enhancements

* Multi-language support
* Mobile application
* Offline AI model
* Advanced deep-learning recognition
* Custom gesture creation
* Cloud model synchronization
* Doctor/Caregiver dashboard
* Wearable PCB version

---

## Impact

SynTalk aims to empower mute and speech-impaired individuals by providing a seamless, intelligent, and affordable communication platform that converts gestures into understandable speech and text in real time.

---

## Team

**C M Keerthana**
Electronics and Communication Engineering
Reva University

**Academic Project — 2026**

*"Speak Without Words."*
