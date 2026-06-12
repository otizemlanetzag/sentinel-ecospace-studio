import { useState } from "react";
import {
  MousePointerClick,
  Trash2,
  Zap,
  Smartphone,
  Monitor,
  Eye,
  Pencil,
  Link2,
} from "lucide-react";
import type { PaletteItem } from "./ComponentPalette";

export type DeviceKind = "phone" | "web";

export interface CanvasNode {
  uid: string;
  name: string;
  item: PaletteItem;
  /** Editable element identifier used in generated code. */
  elementId: string;
  /** Editable text / label of the element. */
  text: string;
  /** Editable background color (hex). */
  bgColor: string;
  /** If set, this element stays hidden until the trigger node is clicked. */
  hiddenUntilTriggerUid?: string | null;
}

/** Renders a dropped node as a realistic preview element. */
function NodePreview({
  node,
  onPreviewTrigger,
}: {
  node: CanvasNode;
  onPreviewTrigger?: (uid: string) => void;
}) {
  const style = { backgroundColor: node.bgColor || undefined };
  switch (node.item.id) {
    case "button":
      return (
        <button
          type="button"
          onClick={() => onPreviewTrigger?.(node.uid)}
          className="rounded-lg px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm"
          style={style.backgroundColor ? style : undefined}
        >
          <span className={style.backgroundColor ? "" : "text-primary-foreground"}>
            {node.text}
          </span>
        </button>
      );
    case "input":
      return (
        <input
          readOnly={!onPreviewTrigger}
          placeholder={node.text}
          className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
          style={style.backgroundColor ? style : undefined}
        />
      );
    case "text":
      return <p className="text-sm text-foreground">{node.text}</p>;
    case "toggle":
      return (
        <div className="flex items-center gap-2 text-sm text-foreground">
          <span className="relative inline-flex h-5 w-9 items-center rounded-full bg-secondary">
            <span className="ml-0.5 h-4 w-4 rounded-full bg-primary" />
          </span>
          {node.text}
        </div>
      );
    case "image":
      return (
        <div
          className="grid h-24 w-full place-items-center rounded-lg border border-dashed border-border bg-secondary text-xs text-muted-foreground"
          style={style.backgroundColor ? style : undefined}
        >
          {node.text}
        </div>
      );
    case "list":
      return (
        <ul className="w-full space-y-1 text-sm text-foreground">
          {[1, 2, 3].map((i) => (
            <li key={i} className="rounded-md bg-secondary px-3 py-1.5">
              {node.text} {i}
            </li>
          ))}
        </ul>
      );
    default:
      // container / grid
      return (
        <div
          className="grid min-h-16 w-full place-items-center rounded-lg border border-dashed border-border text-xs text-muted-foreground"
          style={style.backgroundColor ? style : undefined}
        >
          {node.text}
        </div>
      );
  }
}

export function Canvas({
  nodes,
  recording,
  device,
  onDeviceChange,
  onDropItem,
  onRemove,
  onUpdateNode,
  selectedUid,
  onNodeClick,
  activeTriggerUid,
}: {
  nodes: CanvasNode[];
  recording: boolean;
  device: DeviceKind;
  onDeviceChange: (d: DeviceKind) => void;
  onDropItem: (id: string) => void;
  onRemove: (uid: string) => void;
  onUpdateNode: (uid: string, patch: Partial<CanvasNode>) => void;
  selectedUid: string | null;
  onNodeClick: (node: CanvasNode) => void;
  activeTriggerUid: string | null;
}) {
  const [preview, setPreview] = useState(false);
  const [triggered, setTriggered] = useState<Set<string>>(new Set());

  const selected = nodes.find((n) => n.uid === selectedUid) ?? null;

  const handlePreviewTrigger = (uid: string) => {
    setTriggered((prev) => new Set(prev).add(uid));
  };

  const isVisibleInPreview = (node: CanvasNode) =>
    !node.hiddenUntilTriggerUid || triggered.has(node.hiddenUntilTriggerUid);

  const deviceFrame =
    device === "phone"
      ? "w-[375px] min-h-[680px] rounded-[2.5rem] border-8 border-foreground/80 p-3"
      : "w-full max-w-3xl min-h-[560px] rounded-xl border border-border";

  return (
    <main className="flex h-full flex-1 flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-border bg-panel px-5 py-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_var(--color-primary)]" />
          <span className="font-medium text-foreground">Untitled Project</span>
          <span className="text-muted-foreground">/ {preview ? "Preview" : "Canvas"}</span>
        </div>
        <div className="flex items-center gap-2">
          {recording && !preview && (
            <span className="flex items-center gap-1.5 rounded-md bg-record/15 px-2.5 py-1 text-xs font-medium text-record">
              <Zap className="h-3 w-3" />
              {activeTriggerUid
                ? "Drop a component to bind it"
                : "Click an element to set a trigger"}
            </span>
          )}
          <div className="flex overflow-hidden rounded-md border border-border">
            <button
              type="button"
              onClick={() => onDeviceChange("phone")}
              className={
                "grid h-7 w-8 place-items-center transition-colors " +
                (device === "phone"
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground hover:bg-secondary")
              }
              aria-label="Phone viewport"
            >
              <Smartphone className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onDeviceChange("web")}
              className={
                "grid h-7 w-8 place-items-center transition-colors " +
                (device === "web"
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground hover:bg-secondary")
              }
              aria-label="Web viewport"
            >
              <Monitor className="h-3.5 w-3.5" />
            </button>
          </div>
          <button
            type="button"
            onClick={() => {
              setPreview((p) => !p);
              setTriggered(new Set());
            }}
            className={
              "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors " +
              (preview
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:bg-muted")
            }
          >
            {preview ? <Pencil className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            {preview ? "Edit" : "Preview"}
          </button>
        </div>
      </div>

      <div className="relative flex flex-1 overflow-auto p-8">
        <div className="mx-auto">
          <div
            onDragOver={(e) => !preview && e.preventDefault()}
            onDrop={(e) => {
              if (preview) return;
              e.preventDefault();
              const id = e.dataTransfer.getData("application/sentinel");
              if (id) onDropItem(id);
            }}
            className={"canvas-grid relative bg-background " + deviceFrame}
            style={{ background: "var(--gradient-canvas)" }}
          >
            <div className="h-full overflow-hidden rounded-2xl">
              {nodes.length === 0 ? (
                <div className="grid min-h-[500px] place-items-center">
                  <div className="flex flex-col items-center gap-3 text-center">
                    <span className="grid h-14 w-14 place-items-center rounded-2xl border border-border bg-card text-primary">
                      <MousePointerClick className="h-6 w-6" />
                    </span>
                    <p className="text-sm font-medium text-foreground">
                      Drop components here
                    </p>
                    <p className="max-w-xs text-xs text-muted-foreground">
                      Drag from the palette into the device viewport.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3 p-4">
                  {nodes.map((node) => {
                    if (preview) {
                      if (!isVisibleInPreview(node)) return null;
                      return (
                        <div key={node.uid}>
                          <NodePreview
                            node={node}
                            onPreviewTrigger={handlePreviewTrigger}
                          />
                        </div>
                      );
                    }

                    const isSelected = selectedUid === node.uid;
                    const isTrigger = activeTriggerUid === node.uid;
                    return (
                      <div
                        key={node.uid}
                        onClick={() => onNodeClick(node)}
                        className={
                          "group relative cursor-pointer rounded-lg border-2 p-3 transition-all " +
                          (isSelected
                            ? "border-primary shadow-[var(--shadow-glow)]"
                            : isTrigger
                              ? "border-record"
                              : "border-transparent hover:border-border")
                        }
                      >
                        <NodePreview node={node} />

                        {(isTrigger || node.hiddenUntilTriggerUid) && (
                          <span className="absolute -top-2 left-2 flex items-center gap-1 rounded-full bg-record px-2 py-0.5 text-[0.6rem] font-semibold text-record-foreground">
                            {isTrigger ? (
                              <>
                                <Zap className="h-2.5 w-2.5" /> Trigger
                              </>
                            ) : (
                              <>
                                <Link2 className="h-2.5 w-2.5" /> Conditional
                              </>
                            )}
                          </span>
                        )}

                        <span className="pointer-events-none absolute -top-2 right-10 rounded-full bg-secondary px-2 py-0.5 text-[0.6rem] font-medium text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                          {node.name}
                        </span>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemove(node.uid);
                          }}
                          aria-label={`Remove ${node.name}`}
                          className="absolute -top-2 right-2 grid h-6 w-6 place-items-center rounded-md bg-card text-muted-foreground opacity-0 transition-all hover:bg-destructive hover:text-destructive-foreground group-hover:opacity-100"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Property editor overlay */}
        {selected && !preview && (
          <div className="absolute right-6 top-6 z-30 w-64 overflow-hidden rounded-xl border border-border bg-popover shadow-[var(--shadow-panel)]">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="flex items-center gap-2">
                <Pencil className="h-3.5 w-3.5 text-primary" />
                <span className="text-sm font-semibold text-foreground">
                  Edit {selected.item.label}
                </span>
              </div>
              <button
                type="button"
                onClick={() => onNodeClick(selected)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Close
              </button>
            </div>
            <div className="space-y-3 p-4">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-muted-foreground">
                  Text / Label
                </span>
                <input
                  value={selected.text}
                  onChange={(e) =>
                    onUpdateNode(selected.uid, { text: e.target.value })
                  }
                  className="w-full rounded-md border border-border bg-card px-2.5 py-1.5 text-sm text-foreground"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-muted-foreground">
                  Background Color
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={selected.bgColor || "#000000"}
                    onChange={(e) =>
                      onUpdateNode(selected.uid, { bgColor: e.target.value })
                    }
                    className="h-8 w-10 cursor-pointer rounded border border-border bg-card"
                  />
                  <input
                    value={selected.bgColor}
                    placeholder="default"
                    onChange={(e) =>
                      onUpdateNode(selected.uid, { bgColor: e.target.value })
                    }
                    className="w-full rounded-md border border-border bg-card px-2.5 py-1.5 text-sm text-foreground"
                  />
                </div>
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-muted-foreground">
                  Element ID
                </span>
                <input
                  value={selected.elementId}
                  onChange={(e) =>
                    onUpdateNode(selected.uid, { elementId: e.target.value })
                  }
                  className="w-full rounded-md border border-border bg-card px-2.5 py-1.5 font-mono text-xs text-foreground"
                />
              </label>
              {selected.hiddenUntilTriggerUid && (
                <p className="rounded-md bg-record/10 px-2.5 py-2 text-[0.7rem] text-record">
                  Hidden until its trigger is clicked by the end-user.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
