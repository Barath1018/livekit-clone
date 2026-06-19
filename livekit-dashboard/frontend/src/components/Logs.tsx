import { useCallback, useEffect, useState } from 'react';
import { ScrollText, Loader2 } from 'lucide-react';
import { useWebSocket } from '../hooks/useWebSocket';
import { fetchLogs, type LogEntry } from '../api/client';

export default function Logs() {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs()
      .then((logs) => setEntries(logs))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleMessage = useCallback((data: LogEntry) => {
    setEntries((prev) => [...prev.slice(-500), data]);
  }, []);

  const { isConnected } = useWebSocket<LogEntry>('/ws/logs', handleMessage);

  const filtered = entries.filter((e) => {
    if (levelFilter !== 'all' && e.level !== levelFilter) return false;
    if (search && !e.message.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const stats = {
    total: entries.length,
    debug: entries.filter((e) => e.level === 'DEBUG').length,
    info: entries.filter((e) => e.level === 'INFO').length,
    warning: entries.filter((e) => e.level === 'WARNING').length,
    error: entries.filter((e) => e.level === 'ERROR' || e.level === 'CRITICAL').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Logs</h1>
          <p className="text-sm text-muted-foreground mt-1">Real-time log viewer</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-zinc-600'}`} />
            <span className="text-xs text-muted-foreground">{isConnected ? 'Live' : 'Disconnected'}</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: 'Total', value: stats.total, cls: 'text-foreground' },
          { label: 'Debug', value: stats.debug, cls: 'text-muted-foreground' },
          { label: 'Info', value: stats.info, cls: 'text-blue-500' },
          { label: 'Warning', value: stats.warning, cls: 'text-yellow-500' },
          { label: 'Error', value: stats.error, cls: 'text-destructive' },
        ].map((s) => (
          <div key={s.label} className="card p-3 text-center">
            <div className={`text-xl font-semibold ${s.cls}`}>{s.value}</div>
            <div className="text-[11px] text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder="Search logs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input w-64 h-9 text-sm"
        />
        <div className="flex items-center gap-1">
          {['all', 'DEBUG', 'INFO', 'WARNING', 'ERROR'].map((level) => (
            <button
              key={level}
              onClick={() => setLevelFilter(level)}
              className={`btn-xs ${
                levelFilter === level
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground'
              }`}
            >
              {level === 'all' ? 'All' : level}
            </button>
          ))}
        </div>
        <button onClick={() => setEntries([])} className="btn-outline btn-xs ml-auto">
          Clear
        </button>
      </div>

      {/* Log Entries */}
      <div className="card">
        <div className="p-4 border-b border-border flex items-center gap-2">
          <ScrollText className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-semibold">Log Entries</span>
          <span className="badge-secondary text-[10px] ml-1">{filtered.length}</span>
        </div>

        {filtered.length === 0 ? (
          <div className="p-8 text-center">
            <ScrollText className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">No log entries</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Logs will appear here when agents are running
            </p>
          </div>
        ) : (
          <div className="font-mono text-[11px] max-h-[500px] overflow-y-auto">
            {filtered.map((entry, i) => (
              <div
                key={i}
                className="flex gap-3 px-4 py-1.5 hover:bg-accent/30 border-b border-border/50 last:border-0"
              >
                <span className="text-muted-foreground/60 w-[140px] flex-shrink-0 tabular-nums">
                  {entry.timestamp}
                </span>
                <span
                  className={`w-[60px] flex-shrink-0 ${
                    entry.level === 'ERROR' || entry.level === 'CRITICAL'
                      ? 'text-destructive'
                      : entry.level === 'WARNING'
                      ? 'text-yellow-500'
                      : entry.level === 'INFO'
                      ? 'text-blue-500'
                      : 'text-muted-foreground/60'
                  }`}
                >
                  {entry.level}
                </span>
                <span className="text-muted-foreground/50 w-[120px] flex-shrink-0 truncate">
                  {entry.logger}
                </span>
                <span className="text-foreground/80 break-all">{entry.message}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
