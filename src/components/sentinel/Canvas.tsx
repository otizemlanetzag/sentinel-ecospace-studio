import { useState } from "react";
import { MousePointerClick, Trash2, Zap } from "lucide-react";
import type { PaletteItem } from "./ComponentPalette";

export interface CanvasNode {
  uid: string;
  name: string;
  item: PaletteItem;
}

const ACTION_OPTIONS = [
  { id: "alert", label: "Alert Message", trigger: "Trigger Alert" },
  { id: "link", label: "Open Link", trigger: "Open Link" },
  { id: "custom", label: "Custom Action", trigger: "Custom Action" },
];

export function Canvas({
  nodes,
  recording,
  onDropItem,
  onRemove,
  onRecordClick,
}: {
  nodes: CanvasNode[];
  recording: boolean;
  onDropItem: (id: string) => void;
  onRemove: (uid: string) => void;
  onRecordClick: (node: CanvasNode, trigger: string) => void;
}) {
  const [activeUid, setActiveUid] = useState<string | null>(null);

  const handleNodeClick = (node: CanvasNode) => {
    if (!recording) return;
    setActiveUid((cur) => (cur === node.uid ? null : node.uid));
  };

  return (
    <main className="flex h-full flex-1 flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-border bg-panel px-5 py-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_var(--color-primary)]" />
          <span className="font-medium text-foreground">Untitled Project</span>
          <span className="text-muted-foreground">/ Canvas</span>
        </div>
        <div className="flex items-center gap-2">
          {recording && (
            <span className="flex items-center gap-1.5 rounded-md bg-record/15 px-2.5 py-1 text-xs font-medium text-record">
              <Zap className="h-3 w-3" />
              Click components to record
            </span>
          )}
          <span className="rounded-md bg-secondary px-2.5 py-1 text-xs font-medium text-muted-foreground">
            {nodes.length} element{nodes.length === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-8">
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const id = e.dataTransfer.getData("application/sentinel");
            if (id) onDropItem(id);
          }}
          className="canvas-grid relative mx-auto min-h-full w-full max-w-4xl rounded-xl border border-border/70"
          style={{ background: "var(--gradient-canvas)" }}
        >
          {nodes.length === 0 ? (
            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              <div className="flex flex-col items-center gap-3 text-center">
                <span className="grid h-14 w-14 place-items-center rounded-2xl border border-border bg-card text-primary">
                  <MousePointerClick className="h-6 w-6" />
                </span>
                <p className="text-sm font-medium text-foreground">
                  Drop components here
                </p>
                <p className="max-w-xs text-xs text-muted-foreground">
                  Drag from the palette or click an element to add it to your
                  canvas.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap content-start gap-4 p-6">
              {nodes.map((node) => {
                const Icon = node.item.icon;
                const open = activeUid === node.uid;
                return (
                  <div key={node.uid} className="relative">
                    <button
                      type="button"
                      onClick={() => handleNodeClick(node)}
                      className={
                        "group relative flex min-w-44 items-center gap-3 rounded-lg border bg-card px-4 py-3 text-left shadow-[var(--shadow-panel)] transition-all " +
                        (recording
                          ? "cursor-pointer border-record/50 hover:border-record hover:shadow-[var(--shadow-glow)]"
                          : "cursor-default border-border")
                      }
                    >
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-secondary text-primary">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {node.name}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {node.item.hint}
                        </p>
                      </div>
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemove(node.uid);
                          setActiveUid(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.stopPropagation();
                            onRemove(node.uid);
                            setActiveUid(null);
                          }
                        }}
                        aria-label={`Remove ${node.name}`}
                        className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-md text-muted-foreground opacity-0 transition-all hover:bg-destructive hover:text-destructive-foreground group-hover:opacity-100"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </span>
                    </button>

                    {open && (
                      <div className="absolute left-0 top-full z-20 mt-2 w-52 overflow-hidden rounded-lg border border-border bg-popover shadow-[var(--shadow-panel)]">
                        <p className="border-b border-border px-3 py-2 text-xs font-semibold text-muted-foreground">
                          Choose interaction
                        </p>
                        {ACTION_OPTIONS.map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => {
                              onRecordClick(node, opt.trigger);
                              setActiveUid(null);
                            }}
                            className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-secondary"
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
