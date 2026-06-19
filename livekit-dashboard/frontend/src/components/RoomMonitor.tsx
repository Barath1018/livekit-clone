import { useState } from 'react';
import { Loader2, Users, RefreshCw, Radio, Plus, Trash2 } from 'lucide-react';
import { useAgents } from '../hooks/useAgents';
import { createRoom, deleteRoom } from '../api/client';

export default function RoomMonitor() {
  const { jobs, loading, refresh } = useAgents();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newRoom, setNewRoom] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreateRoom = async () => {
    if (!newRoom) return;
    setCreating(true);
    try {
      await createRoom({ name: newRoom });
      setShowCreateForm(false);
      setNewRoom('');
      setTimeout(refresh, 1000);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    try {
      await deleteRoom(roomId);
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Rooms</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create and manage LiveKit rooms
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={refresh} className="btn-outline btn-sm">
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Refresh
          </button>
          <button onClick={() => setShowCreateForm(true)} className="btn-primary btn-sm">
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            New Room
          </button>
        </div>
      </div>

      {/* Create Room Form */}
      {showCreateForm && (
        <div className="card border-primary/50">
          <div className="p-4 border-b border-border">
            <h2 className="text-sm font-semibold">Create Room</h2>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Room Name *
              </label>
              <input
                type="text"
                placeholder="my-room"
                value={newRoom}
                onChange={(e) => setNewRoom(e.target.value)}
                className="input h-9 text-sm"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowCreateForm(false)} className="btn-outline btn-sm">
                Cancel
              </button>
              <button
                onClick={handleCreateRoom}
                disabled={!newRoom || creating}
                className="btn-primary btn-sm"
              >
                {creating ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : null}
                Create Room
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rooms Table */}
      <div className="card">
        <div className="p-4 border-b border-border">
          <h2 className="text-sm font-semibold">Active Rooms</h2>
        </div>
        {jobs.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">No active rooms</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Create a room or start an agent to see rooms here
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Room Name</th>
                  <th>SID</th>
                  <th>Agent</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job.id}>
                    <td className="font-medium">
                      <div className="flex items-center gap-2">
                        <Radio className="w-4 h-4 text-emerald-500" />
                        {job.room_name || 'Unnamed Room'}
                      </div>
                    </td>
                    <td className="font-mono text-xs text-muted-foreground">{job.room_sid}</td>
                    <td className="text-muted-foreground">{job.agent_name || 'default'}</td>
                    <td>
                      <span className="badge-success text-[11px]">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5" />
                        Live
                      </span>
                    </td>
                    <td className="text-right">
                      <button
                        onClick={() => handleDeleteRoom(job.room_sid)}
                        className="btn-ghost btn-sm text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
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
