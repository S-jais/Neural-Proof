import React from 'react';
import { PipelineEvent } from '../types';
import { Terminal } from 'lucide-react';

interface EventFeedProps {
  events: PipelineEvent[];
}

export const EventFeed: React.FC<EventFeedProps> = ({ events }) => {
  return (
    <div className="rounded-xl border border-navy-750 bg-navy-950 p-4 space-y-2">
      <div className="flex items-center justify-between border-b border-navy-800 pb-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 font-mono">
          <Terminal className="h-3.5 w-3.5 text-accent-cyan" />
          Live Pipeline Event Stream
        </div>
        <span className="text-[11px] font-mono text-slate-500">{events.length} events</span>
      </div>

      <div className="max-h-56 overflow-y-auto space-y-1.5 font-mono text-xs pr-1">
        {events.length === 0 ? (
          <div className="text-slate-500 italic py-2 text-center text-[11px]">
            Awaiting pipeline events...
          </div>
        ) : (
          events.map((ev) => {
            const timeStr = new Date(ev.createdAt).toLocaleTimeString([], {
              hour12: false,
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            });

            const isWarn = ev.level === 'WARN';
            const isError = ev.level === 'ERROR';

            return (
              <div
                key={ev.id}
                className={`flex items-start gap-2 py-1 px-1.5 rounded transition-colors ${
                  isError
                    ? 'bg-rose-950/30 text-rose-300'
                    : isWarn
                    ? 'bg-amber-950/30 text-amber-300'
                    : 'hover:bg-navy-900 text-slate-300'
                }`}
              >
                <span className="text-slate-500 shrink-0 text-[10px] pt-0.5">{timeStr}</span>
                <span className="px-1 py-0.2 rounded bg-navy-850 text-accent-cyan text-[10px] border border-navy-750 shrink-0">
                  {ev.stage}
                </span>
                <span className="flex-1 break-words text-[11px] leading-relaxed">{ev.message}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
