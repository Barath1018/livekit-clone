import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import AgentManager from './components/AgentManager';
import RoomMonitor from './components/RoomMonitor';
import Transcription from './components/Transcription';
import PluginManager from './components/PluginManager';
import Logs from './components/Logs';
import Settings from './components/Settings';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/agents" element={<AgentManager />} />
        <Route path="/rooms" element={<RoomMonitor />} />
        <Route path="/transcription" element={<Transcription />} />
        <Route path="/plugins" element={<PluginManager />} />
        <Route path="/logs" element={<Logs />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}
