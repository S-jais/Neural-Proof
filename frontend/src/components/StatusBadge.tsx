import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { HealthStatus } from '../types';
import { Activity, CheckCircle2, AlertTriangle } from 'lucide-react';

export const StatusBadge: React.FC = () => {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    api.getHealth()
      .then((data) => {
        if (mounted) setHealth(data);
      })
      .catch(() => {
        if (mounted) setHealth(null);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-navy-800 text-[11px] text-slate-400 border border-navy-700 animate-pulse">
        <Activity className="h-3 w-3 animate-spin text-accent-cyan" />
        Checking services...
      </div>
    );
  }

  const tfOk = health?.tinyFish === 'CONFIGURED';
  const llmOk = health?.llm === 'CONFIGURED';

  return (
    <div className="flex items-center gap-2">
      <div
        className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border ${
          tfOk
            ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40'
            : 'bg-amber-950/40 text-amber-400 border-amber-800/40'
        }`}
        title={tfOk ? 'TinyFish Search & Fetch connected' : 'TINYFISH_API_KEY missing in .env'}
      >
        {tfOk ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
        <span>TinyFish: {tfOk ? 'Connected' : 'Missing Key'}</span>
      </div>

      <div
        className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border ${
          llmOk
            ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40'
            : 'bg-slate-800/80 text-slate-400 border-slate-700/60'
        }`}
        title={llmOk ? 'LLM Provider configured' : 'LLM_API_KEY missing (Degraded paste mode active)'}
      >
        {llmOk ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
        <span>LLM: {llmOk ? 'Ready' : 'Degraded'}</span>
      </div>
    </div>
  );
};
