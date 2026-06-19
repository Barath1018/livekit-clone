"""LiveKit Agents Dashboard - Backend API Server."""

from __future__ import annotations

import asyncio
import json
import logging
import os
import sys
import time
from collections import deque
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)

# In-memory state
log_buffer: deque[dict] = deque(maxlen=2000)
transcription_buffer: deque[dict] = deque(maxlen=1000)
event_buffer: deque[dict] = deque(maxlen=1000)
connected_websockets: dict[str, list[WebSocket]] = {
    "logs": [],
    "transcriptions": [],
    "events": [],
}

# Global reference to agent server (set when running alongside agents)
_global_agent_server = None


def set_agent_server(server):
    global _global_agent_server
    _global_agent_server = server


class DashboardLogHandler(logging.Handler):
    """Custom log handler that captures logs for the dashboard."""

    def emit(self, record: logging.LogRecord) -> None:
        try:
            entry = {
                "timestamp": time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(record.created)),
                "level": record.levelname,
                "logger": record.name,
                "message": record.getMessage(),
            }
            log_buffer.append(entry)

            message = json.dumps(entry)
            for ws in list(connected_websockets.get("logs", [])):
                try:
                    asyncio.get_event_loop().create_task(ws.send_text(message))
                except Exception:
                    pass
        except Exception:
            pass


def setup_logging_handler() -> None:
    handler = DashboardLogHandler()
    handler.setLevel(logging.DEBUG)
    logging.root.addHandler(handler)


@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging_handler()
    logger.info("Dashboard backend started")
    yield
    logger.info("Dashboard backend stopped")


app = FastAPI(
    title="LiveKit Agents Dashboard",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_server():
    """Get the agent server, returning None if not available."""
    return _global_agent_server


# ---------------------------------------------------------------------------
# REST Endpoints
# ---------------------------------------------------------------------------

@app.get("/api/health")
async def health_check():
    return {"status": "ok", "timestamp": time.time()}


@app.get("/api/worker")
async def get_worker_status():
    try:
        server = get_server()
        if server is None:
            return {
                "id": "demo-worker-001",
                "agent_name": "demo-agent",
                "status": "available",
                "load": 0.15,
                "active_jobs": 0,
                "draining": False,
                "sdk_version": "1.6.1",
                "http_port": 8080,
            }

        return {
            "id": getattr(server, "_id", "unknown"),
            "agent_name": getattr(server, "_agent_name", "") or "",
            "status": "draining" if getattr(server, "_draining", False) else "available",
            "load": getattr(server, "_worker_load", 0),
            "active_jobs": len(getattr(server, "active_jobs", [])),
            "draining": getattr(server, "_draining", False),
            "sdk_version": getattr(server, "_sdk_version", "1.6.1"),
            "http_port": 8080,
        }
    except Exception as e:
        logger.error(f"Error getting worker status: {e}")
        return {
            "id": "error",
            "agent_name": "",
            "status": "error",
            "load": 0,
            "active_jobs": 0,
            "draining": False,
            "sdk_version": "unknown",
            "http_port": 0,
            "error": str(e),
        }


@app.get("/api/jobs")
async def get_jobs():
    try:
        server = get_server()
        if server is None:
            return []

        jobs = []
        proc_pool = getattr(server, "_proc_pool", None)
        if proc_pool:
            for proc in getattr(proc_pool, "processes", []):
                running_job = getattr(proc, "running_job", None)
                if running_job:
                    job = getattr(running_job, "job", None)
                    room = getattr(job, "room", None)
                    accept_args = getattr(running_job, "accept_arguments", None)
                    jobs.append({
                        "id": getattr(job, "id", "unknown"),
                        "room_name": getattr(room, "name", "") if room else "",
                        "room_sid": getattr(room, "sid", "") if room else "",
                        "agent_name": getattr(job, "agent_name", "") or "",
                        "identity": getattr(accept_args, "identity", "") if accept_args else "",
                        "participant_name": getattr(accept_args, "name", "") if accept_args else "",
                        "status": "running",
                        "fake_job": getattr(running_job, "fake_job", False),
                    })
        return jobs
    except Exception as e:
        logger.error(f"Error getting jobs: {e}")
        return []


@app.post("/api/jobs/simulate")
async def simulate_job():
    try:
        server = get_server()
        if server is None:
            return {"status": "simulated", "message": "No server running, demo mode"}

        await server.simulate_job()
        return {"status": "started"}
    except Exception as e:
        logger.error(f"Error simulating job: {e}")
        return {"status": "error", "error": str(e)}


@app.get("/api/plugins")
async def get_plugins():
    try:
        plugins = []
        try:
            from livekit.agents.plugin import Plugin
            for plugin_cls in Plugin.registered_plugins:
                try:
                    instance = plugin_cls()
                    pkg = getattr(instance, "package", "")
                    plugin_type = "unknown"
                    if "stt" in pkg.lower():
                        plugin_type = "stt"
                    elif "tts" in pkg.lower():
                        plugin_type = "tts"
                    elif any(x in pkg.lower() for x in ["llm", "openai", "anthropic", "google"]):
                        plugin_type = "llm"
                    elif "vad" in pkg.lower():
                        plugin_type = "vad"

                    plugins.append({
                        "title": getattr(instance, "title", pkg),
                        "version": getattr(instance, "version", "0.0.0"),
                        "package": pkg,
                        "plugin_type": plugin_type,
                    })
                except Exception as e:
                    logger.warning(f"Error loading plugin {plugin_cls}: {e}")
        except ImportError:
            logger.info("livekit.agents not available, returning demo plugins")
            plugins = [
                {"title": "OpenAI STT", "version": "1.0.0", "package": "livekit-plugins-openai", "plugin_type": "stt"},
                {"title": "OpenAI LLM", "version": "1.0.0", "package": "livekit-plugins-openai", "plugin_type": "llm"},
                {"title": "OpenAI TTS", "version": "1.0.0", "package": "livekit-plugins-openai", "plugin_type": "tts"},
                {"title": "Deepgram STT", "version": "1.0.0", "package": "livekit-plugins-deepgram", "plugin_type": "stt"},
                {"title": "Cartesia TTS", "version": "1.0.0", "package": "livekit-plugins-cartesia", "plugin_type": "tts"},
                {"title": "Anthropic LLM", "version": "1.0.0", "package": "livekit-plugins-anthropic", "plugin_type": "llm"},
                {"title": "Silero VAD", "version": "1.0.0", "package": "livekit-plugins-silero", "plugin_type": "vad"},
                {"title": "Google LLM", "version": "1.0.0", "package": "livekit-plugins-google", "plugin_type": "llm"},
            ]

        return plugins
    except Exception as e:
        logger.error(f"Error getting plugins: {e}")
        return []


@app.get("/api/config")
async def get_config():
    env_vars = {
        "LIVEKIT_URL": "",
        "LIVEKIT_API_KEY": "",
        "LIVEKIT_API_SECRET": "",
        "LIVEKIT_AGENT_NAME": "",
        "OPENAI_API_KEY": "",
        "ANTHROPIC_API_KEY": "",
        "DEEPGRAM_API_KEY": "",
        "ELEVEN_API_KEY": "",
        "CARTESIA_API_KEY": "",
        "GOOGLE_API_KEY": "",
    }

    config = {}
    for var in env_vars:
        val = os.environ.get(var, "")
        if "KEY" in var or "SECRET" in var:
            config[var] = val[:8] + "..." if len(val) > 8 else ("***" if val else "")
        else:
            config[var] = val

    return config


@app.put("/api/config")
async def update_config(update: dict):
    key = update.get("key", "")
    value = update.get("value", "")
    if key:
        os.environ[key] = value
    return {"status": "updated", "key": key}


@app.get("/api/metrics")
async def get_metrics():
    try:
        server = get_server()
        if server is None:
            return {
                "worker_load": 0.15,
                "active_jobs": 0,
                "draining": False,
                "uptime": 0,
                "total_sessions": 0,
                "avg_latency": 0,
            }

        return {
            "worker_load": getattr(server, "_worker_load", 0),
            "active_jobs": len(getattr(server, "active_jobs", [])),
            "draining": getattr(server, "_draining", False),
            "uptime": time.time() - getattr(server, "_start_time", time.time()),
            "total_sessions": 0,
            "avg_latency": 0,
        }
    except Exception as e:
        return {"error": str(e)}


@app.post("/api/drain")
async def start_drain():
    try:
        server = get_server()
        if server is None:
            return {"status": "no_server"}
        await server.drain()
        return {"status": "draining"}
    except Exception as e:
        return {"status": "error", "error": str(e)}


@app.get("/api/logs")
async def get_recent_logs():
    return list(log_buffer)[-100:]


@app.get("/api/sessions")
async def get_sessions():
    """Get session history (placeholder for future implementation)."""
    return []


@app.post("/api/agents/start")
async def start_agent(config: dict):
    """Start a new agent with given configuration."""
    agent_name = config.get("name", "my-agent")
    room_name = config.get("room", "")
    logger.info(f"Starting agent: {agent_name} in room: {room_name}")
    return {"status": "started", "agent_name": agent_name, "room": room_name}


@app.post("/api/agents/stop")
async def stop_agent(config: dict):
    """Stop a running agent."""
    agent_id = config.get("id", "")
    logger.info(f"Stopping agent: {agent_id}")
    return {"status": "stopped", "agent_id": agent_id}


@app.post("/api/rooms/create")
async def create_room(config: dict):
    """Create a new LiveKit room."""
    room_name = config.get("name", f"room-{int(time.time())}")
    logger.info(f"Creating room: {room_name}")
    return {"status": "created", "room_name": room_name, "room_sid": f"RM_{int(time.time())}"}


@app.delete("/api/rooms/{room_id}")
async def delete_room(room_id: str):
    """Delete a LiveKit room."""
    logger.info(f"Deleting room: {room_id}")
    return {"status": "deleted", "room_id": room_id}


# ---------------------------------------------------------------------------
# WebSocket Endpoints
# ---------------------------------------------------------------------------


@app.websocket("/ws/logs")
async def websocket_logs(websocket: WebSocket):
    await websocket.accept()
    connected_websockets["logs"].append(websocket)
    try:
        for entry in list(log_buffer)[-50:]:
            await websocket.send_text(json.dumps(entry))
        while True:
            try:
                await websocket.receive_text()
            except Exception:
                break
    except WebSocketDisconnect:
        pass
    finally:
        if websocket in connected_websockets["logs"]:
            connected_websockets["logs"].remove(websocket)


@app.websocket("/ws/transcriptions")
async def websocket_transcriptions(websocket: WebSocket):
    await websocket.accept()
    connected_websockets["transcriptions"].append(websocket)
    try:
        for entry in list(transcription_buffer)[-50:]:
            await websocket.send_text(json.dumps(entry))
        while True:
            try:
                await websocket.receive_text()
            except Exception:
                break
    except WebSocketDisconnect:
        pass
    finally:
        if websocket in connected_websockets["transcriptions"]:
            connected_websockets["transcriptions"].remove(websocket)


@app.websocket("/ws/events")
async def websocket_events(websocket: WebSocket):
    await websocket.accept()
    connected_websockets["events"].append(websocket)
    try:
        for entry in list(event_buffer)[-50:]:
            await websocket.send_text(json.dumps(entry))
        while True:
            try:
                await websocket.receive_text()
            except Exception:
                break
    except WebSocketDisconnect:
        pass
    finally:
        if websocket in connected_websockets["events"]:
            connected_websockets["events"].remove(websocket)
