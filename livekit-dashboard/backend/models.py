from __future__ import annotations

from pydantic import BaseModel


class WorkerStatus(BaseModel):
    id: str
    agent_name: str
    status: str
    load: float
    active_jobs: int
    draining: bool
    sdk_version: str
    http_port: int


class JobInfo(BaseModel):
    id: str
    room_name: str
    room_sid: str
    agent_name: str
    identity: str
    participant_name: str
    status: str
    fake_job: bool


class PluginInfo(BaseModel):
    title: str
    version: str
    package: str
    plugin_type: str


class LogEntry(BaseModel):
    timestamp: str
    level: str
    logger: str
    message: str
    extra: dict | None = None


class TranscriptionEvent(BaseModel):
    type: str
    transcript: str
    is_final: bool
    speaker_id: str | None = None
    language: str | None = None
    room_name: str | None = None
    agent_name: str | None = None
    timestamp: float


class AgentStateEvent(BaseModel):
    type: str
    old_state: str | None = None
    new_state: str
    agent_name: str | None = None
    room_name: str | None = None
    timestamp: float


class ConfigUpdate(BaseModel):
    key: str
    value: str


class SimulateJobRequest(BaseModel):
    room_name: str | None = None
