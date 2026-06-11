import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Shield, Play, Save } from "lucide-react";
import {
  ComponentPalette,
  type PaletteItem,
} from "@/components/sentinel/ComponentPalette";
import { Canvas, type CanvasNode } from "@/components/sentinel/Canvas";
import {
  ActionsPanel,
  type RecordedAction,
} from "@/components/sentinel/ActionsPanel";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SENTINEL — No-Code App Builder" },
      {
        name: "description",
        content:
          "Drag-and-drop no-code workspace with a component palette, live canvas, and interaction recorder.",
      },
    ],
  }),
  component: Index,
});

// Flat catalog used to resolve palette items by id (for drag-and-drop).
import {
  RectangleHorizontal,
  TextCursorInput,
  Square,
  Type,
  Image,
  ListChecks,
  ToggleLeft,
  LayoutGrid,
} from "lucide-react";

const catalog: Record<string, PaletteItem> = {
  button: { id: "button", label: "Button", icon: RectangleHorizontal, hint: "Clickable action" },
  input: { id: "input", label: "Input", icon: TextCursorInput, hint: "Text field" },
  text: { id: "text", label: "Text", icon: Type, hint: "Label or paragraph" },
  toggle: { id: "toggle", label: "Toggle", icon: ToggleLeft, hint: "On / off switch" },
  container: { id: "container", label: "Container", icon: Square, hint: "Group elements" },
  grid: { id: "grid", label: "Grid", icon: LayoutGrid, hint: "Responsive grid" },
  image: { id: "image", label: "Image", icon: Image, hint: "Picture block" },
  list: { id: "list", label: "List", icon: ListChecks, hint: "Repeating items" },
};

let counter = 0;
const uid = () => `n-${Date.now()}-${counter++}`;
const stamp = () =>
  new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

function Index() {
  const [nodes, setNodes] = useState<CanvasNode[]>([]);
  const [recording, setRecording] = useState(false);
  const [actions, setActions] = useState<RecordedAction[]>([]);

  const log = (label: string) => {
    if (!recording) return;
    setActions((prev) => [...prev, { id: uid(), label, time: stamp() }]);
  };

  const addItem = (item: PaletteItem) => {
    setNodes((prev) => [...prev, { uid: uid(), item }]);
    log(`Added ${item.label}`);
  };

  const handleDrop = (id: string) => {
    const item = catalog[id];
    if (item) addItem(item);
  };

  const removeNode = (target: string) => {
    const removed = nodes.find((n) => n.uid === target);
    setNodes((prev) => prev.filter((n) => n.uid !== target));
    if (removed) log(`Removed ${removed.item.label}`);
  };

  const toggleRecording = () => {
    setRecording((r) => {
      const next = !r;
      setActions((prev) => [
        ...prev,
        { id: uid(), label: next ? "Recording started" : "Recording stopped", time: stamp() },
      ]);
      return next;
    });
  };

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-panel px-5">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground shadow-[var(--shadow-glow)]">
            <Shield className="h-4 w-4" />
          </span>
          <span className="text-lg font-bold tracking-tight text-foreground">
            SENTINEL
          </span>
          <span className="ml-2 hidden rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground sm:inline">
            No-Code Builder
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary">
            <Save className="h-4 w-4" />
            <span className="hidden sm:inline">Save</span>
          </button>
          <button className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.03]">
            <Play className="h-4 w-4" />
            <span className="hidden sm:inline">Preview</span>
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <ComponentPalette onAdd={addItem} />
        <Canvas nodes={nodes} onDropItem={handleDrop} onRemove={removeNode} />
        <ActionsPanel
          recording={recording}
          actions={actions}
          onToggle={toggleRecording}
        />
      </div>
    </div>
  );
}
