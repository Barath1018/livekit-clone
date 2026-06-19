import { useEffect, useState } from 'react';
import { Puzzle, Loader2, Mic, Volume2, Brain, Shield } from 'lucide-react';
import { fetchPlugins, type PluginInfo } from '../api/client';

const typeIcons: Record<string, React.ReactNode> = {
  stt: <Mic className="w-4 h-4" />,
  tts: <Volume2 className="w-4 h-4" />,
  llm: <Brain className="w-4 h-4" />,
  vad: <Shield className="w-4 h-4" />,
  unknown: <Puzzle className="w-4 h-4" />,
};

const typeBadge: Record<string, string> = {
  stt: 'badge-info',
  tts: 'badge-secondary',
  llm: 'badge-success',
  vad: 'badge-warning',
  unknown: 'badge-outline',
};

export default function PluginManager() {
  const [plugins, setPlugins] = useState<PluginInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchPlugins()
      .then((data) => setPlugins(data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const filtered = filter === 'all' ? plugins : plugins.filter((p) => p.plugin_type === filter);
  const types = [...new Set(plugins.map((p) => p.plugin_type))];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Plugins</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Installed STT, TTS, LLM, and VAD providers
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-3 text-sm text-yellow-500">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`btn-xs ${filter === 'all' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}
        >
          All ({plugins.length})
        </button>
        {types.map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`btn-xs capitalize ${
              filter === type ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
            }`}
          >
            {type} ({plugins.filter((p) => p.plugin_type === type).length})
          </button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="card">
          <div className="p-8 text-center">
            <Puzzle className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">No plugins found</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Install with: <code className="bg-secondary px-1 rounded">pip install livekit-plugins-&lt;provider&gt;</code>
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((plugin) => (
            <div key={`${plugin.package}-${plugin.title}`} className="card p-4 hover:border-border/80 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-md bg-secondary flex items-center justify-center">
                    {typeIcons[plugin.plugin_type] || typeIcons.unknown}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">{plugin.title}</h3>
                    <p className="text-[11px] text-muted-foreground font-mono">{plugin.package}</p>
                  </div>
                </div>
                <span className="badge-secondary text-[10px]">v{plugin.version}</span>
              </div>
              <div className="mt-3 pt-3 border-t border-border">
                <span className={`${typeBadge[plugin.plugin_type] || 'badge-outline'} text-[10px] capitalize`}>
                  {plugin.plugin_type}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
