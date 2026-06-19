# LiveKit Agents Dashboard

A self-hosted web dashboard for managing LiveKit voice agents.

## Features

- **Dashboard** - Worker status, load, active jobs overview
- **Agent Manager** - Start/stop/simulate agents, view running jobs
- **Room Monitor** - Active rooms and participants
- **Live Transcription** - Real-time speech-to-text display
- **Plugin Manager** - STT/TTS/LLM/VAD provider management
- **Logs & Metrics** - Real-time log viewer with filtering
- **Settings** - Environment variable configuration

## Quick Start

### 1. Install Dependencies

```bash
# Backend
cd livekit-dashboard/backend
pip install -r requirements.txt

# Frontend
cd livekit-dashboard/frontend
npm install
```

### 2. Start the Backend

```bash
cd livekit-dashboard/backend
python run.py
```

Backend runs on http://localhost:8080

### 3. Start the Frontend

```bash
cd livekit-dashboard/frontend
npm run dev
```

Frontend runs on http://localhost:5173

### 4. Open the Dashboard

Open http://localhost:5173 in your browser.

## Prerequisites

- Python 3.10+
- Node.js 18+
- A LiveKit server (local or remote)
- LiveKit credentials (URL, API key, API secret)

## Configuration

Set environment variables before starting your agents:

```bash
export LIVEKIT_URL=ws://localhost:7880
export LIVEKIT_API_KEY=your_api_key
export LIVEKIT_API_SECRET=your_api_secret
```

Or configure them through the Settings page in the dashboard.

## Architecture

```
React UI (5173) ←→ FastAPI Backend (8080) ←→ livekit-agents
     ↕                    ↕                        ↕
  Browser            REST + WebSocket        AgentServer
```

## Development

The dashboard communicates with the `livekit-agents` framework through:

- **REST API** - Worker status, jobs, plugins, configuration
- **WebSocket** - Real-time logs, transcriptions, events

The backend captures logs from the agent framework and broadcasts them to connected clients.
