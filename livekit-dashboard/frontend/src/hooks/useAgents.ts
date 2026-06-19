import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchWorker, fetchJobs, type WorkerStatus, type JobInfo } from '../api/client';

export function useAgents(pollInterval = 3000) {
  const [worker, setWorker] = useState<WorkerStatus | null>(null);
  const [jobs, setJobs] = useState<JobInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<number>();

  const refresh = useCallback(async () => {
    try {
      const [w, j] = await Promise.all([fetchWorker(), fetchJobs()]);
      setWorker(w);
      setJobs(j);
      setError(null);
    } catch (e: any) {
      setError(e.message || 'Failed to fetch');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    intervalRef.current = window.setInterval(refresh, pollInterval);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [refresh, pollInterval]);

  return { worker, jobs, loading, error, refresh };
}
