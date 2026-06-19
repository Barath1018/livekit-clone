import { useCallback, useState } from 'react';
import { MessageSquare, User, Bot } from 'lucide-react';
import { useWebSocket } from '../hooks/useWebSocket';
import type { TranscriptionEvent } from '../api/client';

export default function Transcription() {
  const [entries, setEntries] = useState<TranscriptionEvent[]>([]);
  const [filter, setFilter] = useState('');

  const handleMessage = useCallback((data: TranscriptionEvent) => {
    setEntries((prev) => [...prev.slice(-200), data]);
  }, []);

  const { isConnected } = useWebSocket<TranscriptionEvent>('/ws/transcriptions', handleMessage);

  const filtered = entries.filter(
    (e) =>
      !filter ||
      e.transcript.toLowerCase().includes(filter.toLowerCase()) ||
      e.room_name?.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Transcript</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time speech-to-text display
          </p>
        </div>
        <div className="flex items-center gap-4">
          <input
            type="text"
            placeholder="Filter..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="input w-56 h-9 text-sm"
          />
          <button onClick={() => setEntries([])} className="btn-outline btn-sm">
            Clear
          </button>
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-emerald-500' : 'bg-zinc-600'
              }`}
            />
            <span className="text-xs text-muted-foreground">
              {isConnected ? 'Live' : 'Disconnected'}
            </span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-semibold">Conversation</span>
          </div>
          <span className="text-xs text-muted-foreground">{filtered.length} messages</span>
        </div>

        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <MessageSquare className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">Waiting for transcriptions...</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Transcripts appear in real-time when agents process speech
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
            {filtered.map((entry, i) => (
              <div key={i} className="p-4 hover:bg-accent/30 transition-colors">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      entry.type === 'user_input_transcribed'
                        ? 'bg-blue-500/10 text-blue-500'
                        : 'bg-primary/10 text-primary'
                    }`}
                  >
                    {entry.type === 'user_input_transcribed' ? (
                      <User className="w-4 h-4" />
                    ) : (
                      <Bot className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium">
                        {entry.type === 'user_input_transcribed' ? 'User' : 'Agent'}
                      </span>
                      {entry.room_name && (
                        <span className="badge-secondary text-[10px] px-1.5 py-0">
                          {entry.room_name}
                        </span>
                      )}
                      {!entry.is_final && (
                        <span className="badge-warning text-[10px] px-1.5 py-0">
                          interim
                        </span>
                      )}
                    </div>
                    <p className="text-sm mt-1">{entry.transcript}</p>
                  </div>
                  <span className="text-[11px] text-muted-foreground flex-shrink-0 tabular-nums">
                    {new Date(entry.timestamp * 1000).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
