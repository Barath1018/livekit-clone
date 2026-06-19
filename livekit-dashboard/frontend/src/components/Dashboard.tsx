import { Activity, AlertCircle, Bot, Cpu, Loader2, Users, Zap } from 'lucide-react';
import { useAgents } from '../hooks/useAgents';

export default function Dashboard() {
  const { worker, jobs, loading, error } = useAgents();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
        <div className="flex items-center gap-3 text-destructive">
          <AlertCircle className="w-5 h-5" />
          <div>
            <h3 className="font-semibold text-sm">Connection Error</h3>
            <p className="text-xs mt-0.5 opacity-80">{error}</p>
            <p className="text-xs mt-1 text-muted-foreground">
              Make sure the backend is running: <code className="bg-secondary px-1 rounded">cd backend && python run.py</code>
            </p>
          </div>
        </div>
      </div>
    );
  }

  const isConnected = worker?.status === 'available' || worker?.status === 'draining';
  const loadPercent = ((worker?.load ?? 0) * 100).toFixed(0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Monitor your LiveKit agents and sessions
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Status
            </span>
            <div
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-emerald-500' : 'bg-zinc-600'
              }`}
            />
          </div>
          <div className="text-2xl font-semibold capitalize">{worker?.status || 'Unknown'}</div>
          <p className="text-xs text-muted-foreground mt-1 font-mono">
            {worker?.id?.slice(0, 12) || 'N/A'}
          </p>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Jobs
            </span>
            <Bot className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-semibold">{worker?.active_jobs ?? jobs.length}</div>
          <p className="text-xs text-muted-foreground mt-1">
            active session{jobs.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Load
            </span>
            <Cpu className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-semibold">{loadPercent}%</div>
          <div className="mt-2 h-1 bg-secondary rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                (worker?.load ?? 0) > 0.7 ? 'bg-destructive' : 'bg-primary'
              }`}
              style={{ width: `${loadPercent}%` }}
            />
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Version
            </span>
            <Zap className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-semibold">v{worker?.sdk_version || '?'}</div>
          <p className="text-xs text-muted-foreground mt-1">SDK version</p>
        </div>
      </div>

      {/* Jobs Table */}
      <div className="card">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-semibold">Active Sessions</h2>
          <span className="text-xs text-muted-foreground">{jobs.length} total</span>
        </div>
        {jobs.length === 0 ? (
          <div className="p-8 text-center">
            <Bot className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">No active sessions</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Sessions appear when agents connect to LiveKit rooms
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Room</th>
                  <th>Agent</th>
                  <th>Identity</th>
                  <th>Status</th>
                  <th className="text-right">Type</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job.id}>
                    <td className="font-medium">{job.room_name || 'N/A'}</td>
                    <td className="text-muted-foreground">{job.agent_name || 'default'}</td>
                    <td className="font-mono text-xs text-muted-foreground">{job.identity}</td>
                    <td>
                      <span className="badge-success text-[11px]">{job.status}</span>
                    </td>
                    <td className="text-right">
                      {job.fake_job ? (
                        <span className="badge-warning text-[11px]">Simulated</span>
                      ) : (
                        <span className="badge-secondary text-[11px]">Live</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
