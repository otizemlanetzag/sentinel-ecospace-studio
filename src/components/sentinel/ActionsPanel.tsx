import { Circle, Square, Activity, Clock } from "lucide-react";
import { CarbonTracker } from "./CarbonTracker";

export interface RecordedAction {
  id: string;
  label: string;
  time: string;
}

export function ActionsPanel({
  recording,
  actions,
  onToggle,
  co2,
  credits,
}: {
  recording: boolean;
  actions: RecordedAction[];
  onToggle: () => void;
  co2: number;
  credits: number;
}) {
  return (
    <aside className="flex h-full w-80 shrink-0 flex-col border-l border-border bg-panel">
      <div className="border-b border-border px-4 py-4">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold tracking-wide text-foreground">
            Recorded Actions
          </h2>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Capture interactions as you build
        </p>
      </div>

      <div className="px-4 py-4">
        <button
          type="button"
          onClick={onToggle}
          className={
            recording
              ? "flex w-full items-center justify-center gap-2 rounded-lg bg-secondary px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
              : "flex w-full items-center justify-center gap-2 rounded-lg bg-record px-4 py-3 text-sm font-semibold text-record-foreground shadow-[var(--shadow-glow)] transition-transform hover:scale-[1.02]"
          }
        >
          {recording ? (
            <>
              <Square className="h-4 w-4 fill-current" />
              Stop Recording
            </>
          ) : (
            <>
              <Circle className="h-4 w-4 fill-current" />
              Start Recording
            </>
          )}
        </button>

        {recording && (
          <div className="mt-3 flex items-center justify-center gap-2 text-xs font-medium text-record">
            <span className="h-2 w-2 animate-pulse rounded-full bg-record" />
            Recording in progress…
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <h3 className="pb-2 text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">
          Timeline
        </h3>
        {actions.length === 0 ? (
          <div className="mt-6 flex flex-col items-center gap-2 text-center">
            <span className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-card text-muted-foreground">
              <Clock className="h-4 w-4" />
            </span>
            <p className="text-xs text-muted-foreground">
              No actions recorded yet.
            </p>
          </div>
        ) : (
          <ol className="space-y-2">
            {actions.map((action, i) => (
              <li
                key={action.id}
                className="flex items-center gap-3 rounded-lg border border-border/60 bg-card px-3 py-2.5"
              >
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-secondary text-xs font-semibold text-primary">
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-foreground">
                    {action.label}
                  </span>
                </span>
                <span className="shrink-0 font-mono text-xs text-muted-foreground">
                  {action.time}
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </aside>
  );
}
