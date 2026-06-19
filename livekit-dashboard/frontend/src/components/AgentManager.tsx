import { useState } from 'react';
import {
  Bot,
  Loader2,
  Play,
  Square,
  RefreshCw,
  AlertCircle,
  Plus,
  Trash2,
} from 'lucide-react';
import { useAgents } from '../hooks/useAgents';
import { simulateJob, startDrain, startAgent, stopAgent } from '../api/client';

export default function AgentManager() {
  const { worker, jobs, loading, error, refresh } = useAgents();
  const [simulating, setSimulating] = useState(false);
  const [draining, setDraining] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newAgent, setNewAgent] = useState({ name: '', room: '' });
  const [creating, setCreating] = useState(false);

  const handleSimulate = async () => {
    setSimulating(true);
    try {
      await simulateJob();
      setTimeout(refresh, 1000);
    } finally {
      setSimulating(false);
    }
  };

  const handleDrain = async () => {
    setDraining(true);
    try {
      await startDrain();
      setTimeout(refresh, 1000);
    } finally {
      setDraining(false);
    }
  };

  const handleCreateAgent = async () => {
    if (!newAgent.name) return;
    setCreating(true);
    try {
      await startAgent(newAgent);
      setShowCreateForm(false);
      setNewAgent({ name: '', room: '' });
      setTimeout(refresh, 1000);
    } finally {
      setCreating(false);
    }
  };

  const handleStopAgent = async (jobId: string) => {
    try {
      await stopAgent({ id: jobId });
      setTimeout(refresh, 1000);
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isRunning = worker?.status === 'available' || worker?.status === 'draining';
  const loadPercent = ((worker?.load ?? 0) * 100).toFixed(0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Agents</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create, start, and manage your voice agents
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={refresh} className="btn-outline btn-sm">
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Refresh
          </button>
          <button onClick={() => setShowCreateForm(true)} className="btn-primary btn-sm">
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            New Agent
          </button>
          <button
            onClick={handleSimulate}
            disabled={simulating}
            className="btn-secondary btn-sm"
          >
            {simulating ? (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5 mr-1.5" />
            )}
            Simulate
          </button>
          {isRunning && (
            <button
              onClick={handleDrain}
              disabled={draining}
              className="btn-destructive btn-sm"
            >
              {draining ? (
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              ) : (
                <Square className="w-3.5 h-3.5 mr-1.5" />
              )}
              Drain
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 flex items-center gap-3 text-destructive text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Create Agent Form */}
      {showCreateForm && (
        <div className="card border-primary/50">
          <div className="p-4 border-b border-border">
            <h2 className="text-sm font-semibold">Create New Agent</h2>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Agent Name *
              </label>
              <input
                type="text"
                placeholder="my-voice-agent"
                value={newAgent.name}
                onChange={(e) => setNewAgent((p) => ({ ...p, name: e.target.value }))}
                className="input h-9 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Room Name (optional)
              </label>
              <input
                type="text"
                placeholder="my-room"
                value={newAgent.room}
                onChange={(e) => setNewAgent((p) => ({ ...p, room: e.target.value }))}
                className="input h-9 text-sm"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowCreateForm(false)} className="btn-outline btn-sm">
                Cancel
              </button>
              <button
                onClick={handleCreateAgent}
                disabled={!newAgent.name || creating}
                className="btn-primary btn-sm"
              >
                {creating ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : null}
                Create Agent
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Worker Info */}
      <div className="card">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-md bg-secondary flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold">Agent Server</h2>
                <p className="text-xs text-muted-foreground font-mono">{worker?.id || 'Not connected'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  isRunning ? 'bg-emerald-500' : 'bg-zinc-600'
                }`}
              />
              <span className="text-xs font-medium capitalize">{worker?.status || 'unknown'}</span>
            </div>
          </div>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-3 gap-6">
            <div>
              <div className="text-xs text-muted-foreground">Load</div>
              <div className="text-lg font-semibold mt-1">{loadPercent}%</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Active Jobs</div>
              <div className="text-lg font-semibold mt-1">{worker?.active_jobs ?? 0}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Agent Name</div>
              <div className="text-lg font-semibold mt-1">{worker?.agent_name || '(default)'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Running Jobs */}
      <div className="card">
        <div className="p-4 border-b border-border">
          <h2 className="text-sm font-semibold">Running Jobs</h2>
        </div>
        {jobs.length === 0 ? (
          <div className="p-8 text-center">
            <Bot className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">No active jobs</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Create an agent or simulate a job to get started
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {jobs.map((job) => (
              <div key={job.id} className="p-4 flex items-center justify-between hover:bg-accent/30">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md bg-secondary flex items-center justify-center">
                    <Bot className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">{job.room_name || 'Unnamed Room'}</div>
                    <div className="text-xs text-muted-foreground">
                      {job.agent_name || 'default'} &middot; {job.identity}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="badge-success text-[11px]">{job.status}</span>
                  {job.fake_job && <span className="badge-warning text-[11px]">Simulated</span>}
                  <button
                    onClick={() => handleStopAgent(job.id)}
                    className="btn-ghost btn-sm text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
