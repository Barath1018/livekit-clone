import { useEffect, useState } from 'react';
import { Settings as SettingsIcon, Save, Loader2, Eye, EyeOff } from 'lucide-react';
import { fetchConfig, updateConfig } from '../api/client';

export default function Settings() {
  const [config, setConfig] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchConfig()
      .then(setConfig)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const [key, value] of Object.entries(editedValues)) {
        if (value !== config[key]) {
          await updateConfig({ key, value });
        }
      }
      setConfig((prev) => ({ ...prev, ...editedValues }));
      setEditedValues({});
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleSecret = (key: string) => {
    setShowSecrets((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const isSecret = (key: string) => key.includes('KEY') || key.includes('SECRET');
  const hasChanges = Object.keys(editedValues).length > 0;

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
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure environment variables and options
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || !hasChanges}
          className="btn-primary btn-sm"
        >
          {saving ? (
            <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
          ) : (
            <Save className="w-3.5 h-3.5 mr-1.5" />
          )}
          Save Changes
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-3 text-sm text-yellow-500">
          {error}
        </div>
      )}

      {hasChanges && (
        <div className="rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-3 text-sm text-yellow-500">
          You have unsaved changes.
        </div>
      )}

      {/* Environment Variables */}
      <div className="card">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <SettingsIcon className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-semibold">Environment Variables</span>
          </div>
        </div>
        <div className="p-4 space-y-3">
          {Object.keys(config).length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No configuration available
            </p>
          ) : (
            Object.entries(config).map(([key, value]) => (
              <div key={key} className="flex items-center gap-4">
                <label className="w-44 text-xs font-mono text-muted-foreground flex-shrink-0">
                  {key}
                </label>
                <div className="flex-1 relative">
                  <input
                    type={isSecret(key) && !showSecrets[key] ? 'password' : 'text'}
                    value={editedValues[key] ?? value}
                    onChange={(e) => setEditedValues((prev) => ({ ...prev, [key]: e.target.value }))}
                    className="input h-9 text-sm pr-9"
                  />
                  {isSecret(key) && (
                    <button
                      onClick={() => toggleSecret(key)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showSecrets[key] ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Help */}
      <div className="card">
        <div className="p-4 border-b border-border">
          <span className="text-sm font-semibold">Quick Setup</span>
        </div>
        <div className="p-4 space-y-4 text-sm text-muted-foreground">
          <div>
            <h4 className="font-medium text-foreground mb-1">1. LiveKit Credentials</h4>
            <p className="text-xs">
              Set LIVEKIT_URL, LIVEKIT_API_KEY, and LIVEKIT_API_SECRET from your LiveKit dashboard.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-foreground mb-1">2. AI Providers</h4>
            <p className="text-xs">
              Configure API keys for providers you use (OpenAI, Anthropic, Deepgram, etc).
            </p>
          </div>
          <div>
            <h4 className="font-medium text-foreground mb-1">3. Start Agent</h4>
            <p className="text-xs">
              Create your agent file and run:{' '}
              <code className="bg-secondary px-1.5 py-0.5 rounded text-[11px]">python myagent.py dev</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
