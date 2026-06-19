const API_BASE = '';

export interface WorkerStatus {
  id: string | null;
  agent_name: string;
  status: string;
  load: number;
  active_jobs: number;
  draining: boolean;
  sdk_version: string;
  http_port: number;
}

export interface JobInfo {
  id: string;
  room_name: string;
  room_sid: string;
  agent_name: string;
  identity: string;
  participant_name: string;
  status: string;
  fake_job: boolean;
}

export interface PluginInfo {
  title: string;
  version: string;
  package: string;
  plugin_type: string;
}

export interface LogEntry {
  timestamp: string;
  level: string;
  logger: string;
  message: string;
}

export interface TranscriptionEvent {
  type: string;
  transcript: string;
  is_final: boolean;
  speaker_id: string | null;
  language: string | null;
  room_name: string | null;
  agent_name: string | null;
  timestamp: number;
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, options);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API error ${res.status}: ${text}`);
  }
  const text = await res.text();
  if (!text) return {} as T;
  return JSON.parse(text);
}

export async function fetchWorker(): Promise<WorkerStatus> {
  return apiFetch<WorkerStatus>('/api/worker');
}

export async function fetchJobs(): Promise<JobInfo[]> {
  const result = await apiFetch<JobInfo[] | { error: string }>('/api/jobs');
  return Array.isArray(result) ? result : [];
}

export async function simulateJob(roomName?: string): Promise<void> {
  await apiFetch('/api/jobs/simulate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ room_name: roomName }),
  });
}

export async function fetchPlugins(): Promise<PluginInfo[]> {
  const result = await apiFetch<PluginInfo[] | { error: string }>('/api/plugins');
  return Array.isArray(result) ? result : [];
}

export async function fetchConfig(): Promise<Record<string, string>> {
  return apiFetch<Record<string, string>>('/api/config');
}

export async function updateConfig(update: { key: string; value: string }): Promise<void> {
  await apiFetch('/api/config', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(update),
  });
}

export async function fetchLogs(): Promise<LogEntry[]> {
  const result = await apiFetch<LogEntry[] | { error: string }>('/api/logs');
  return Array.isArray(result) ? result : [];
}

export async function startDrain(): Promise<void> {
  await apiFetch('/api/drain', { method: 'POST' });
}

export async function startAgent(config: { name: string; room?: string }): Promise<any> {
  return apiFetch('/api/agents/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });
}

export async function stopAgent(config: { id: string }): Promise<any> {
  return apiFetch('/api/agents/stop', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });
}

export async function createRoom(config: { name: string }): Promise<any> {
  return apiFetch('/api/rooms/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });
}

export async function deleteRoom(roomId: string): Promise<any> {
  return apiFetch(`/api/rooms/${roomId}`, { method: 'DELETE' });
}

export async function fetchMetrics(): Promise<any> {
  return apiFetch('/api/metrics');
}

export async function fetchSessions(): Promise<any[]> {
  const result = await apiFetch<any[] | { error: string }>('/api/sessions');
  return Array.isArray(result) ? result : [];
}

export function createWebSocket(path: string): WebSocket {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  return new WebSocket(`${protocol}//${host}${path}`);
}
