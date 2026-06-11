import { Leaf, Sparkles } from "lucide-react";

export function CarbonTracker({
  co2,
  credits,
}: {
  co2: number;
  credits: number;
}) {
  const progress = co2 % 20;
  const pct = (progress / 20) * 100;

  return (
    <div className="mx-4 mb-2 mt-4 rounded-xl border border-primary/30 bg-gradient-to-br from-card to-secondary p-4 shadow-[var(--shadow-panel)]">
      <div className="flex items-center gap-2">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/20 text-primary">
          <Leaf className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-foreground">
            Carbon Saved Tracker
          </h3>
          <p className="truncate text-xs text-muted-foreground">
            Build clean, earn eco-credits
          </p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-background/40 px-3 py-2">
          <p className="text-[0.7rem] uppercase tracking-wide text-muted-foreground">
            ♻️ CO₂ Saved
          </p>
          <p className="font-display text-lg font-bold text-primary">
            {co2}
            <span className="ml-1 text-xs font-medium text-muted-foreground">
              grams
            </span>
          </p>
        </div>
        <div className="rounded-lg bg-background/40 px-3 py-2">
          <p className="flex items-center gap-1 text-[0.7rem] uppercase tracking-wide text-muted-foreground">
            <Sparkles className="h-3 w-3" /> Bonus Credits
          </p>
          <p className="font-display text-lg font-bold text-accent-foreground">
            +{credits}
          </p>
        </div>
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between text-[0.7rem] text-muted-foreground">
          <span>Next bonus</span>
          <span>{progress}/20g</span>
        </div>
        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-background/50">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}
