import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Shield, Save, Download, LogIn, LogOut } from "lucide-react";
import {
  ComponentPalette,
  type PaletteItem,
} from "@/components/sentinel/ComponentPalette";
import {
  Canvas,
  type CanvasNode,
  type DeviceKind,
} from "@/components/sentinel/Canvas";
import {
  ActionsPanel,
  type RecordedAction,
} from "@/components/sentinel/ActionsPanel";
import { ExportPanel } from "@/components/sentinel/ExportPanel";
import { useAuth } from "@/hooks/useAuth";

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

const CO2_PER_ACTION = 5;
const BONUS_THRESHOLD = 20;
const BONUS_AMOUNT = 2;

function Index() {
  const { user, signOut } = useAuth();
  const [nodes, setNodes] = useState<CanvasNode[]>([]);
  const [recording, setRecording] = useState(false);
  const [actions, setActions] = useState<RecordedAction[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [co2, setCo2] = useState(0);
  const [credits, setCredits] = useState(0);
  const [exportOpen, setExportOpen] = useState(false);
  const [device, setDevice] = useState<DeviceKind>("phone");
  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  // Cached active trigger while recording a conditional event.
  const [activeTriggerUid, setActiveTriggerUid] = useState<string | null>(null);

  // Records an action AND rewards eco-credits for clean builder activity.
  const recordAction = (label: string) => {
    setActions((prev) => [...prev, { id: uid(), label, time: stamp() }]);

    setCo2((prevCo2) => {
      const nextCo2 = prevCo2 + CO2_PER_ACTION;
      const earnedBefore = Math.floor(prevCo2 / BONUS_THRESHOLD);
      const earnedAfter = Math.floor(nextCo2 / BONUS_THRESHOLD);
      if (earnedAfter > earnedBefore) {
        const gained = (earnedAfter - earnedBefore) * BONUS_AMOUNT;
        setCredits((c) => c + gained);
        toast.success(`Eco milestone reached! +${gained} Bonus Credits`, {
          description: `You've saved ${nextCo2}g of CO₂ building clean. ♻️`,
        });
      }
      return nextCo2;
    });
  };

  const defaultText = (item: PaletteItem) => {
    switch (item.id) {
      case "button":
        return "Click me";
      case "input":
        return "Enter text…";
      case "text":
        return "Text label";
      case "image":
        return "Image";
      default:
        return item.label;
    }
  };

  const addItem = (item: PaletteItem) => {
    let name = "";
    setCounts((prev) => {
      const next = (prev[item.id] ?? 0) + 1;
      name = `${item.label}_${next}`;
      return { ...prev, [item.id]: next };
    });
    const newUid = uid();
    const elementId = name.toLowerCase().replace(/[^a-z0-9]+/g, "_");

    // Conditional recording: if recording with a cached trigger, bind this
    // newly dropped component so it stays hidden until that trigger is clicked.
    let hiddenUntilTriggerUid: string | null = null;
    if (recording && activeTriggerUid) {
      const trigger = nodes.find((n) => n.uid === activeTriggerUid);
      if (trigger) {
        hiddenUntilTriggerUid = activeTriggerUid;
        recordAction(
          `When ${trigger.name} is clicked \u2192 Dynamically render ${name}`,
        );
      }
    } else if (recording) {
      recordAction(`Added ${name}`);
    }

    setNodes((prev) => [
      ...prev,
      {
        uid: newUid,
        name,
        item,
        elementId,
        text: defaultText(item),
        bgColor: "",
        hiddenUntilTriggerUid,
      },
    ]);
  };

  const handleDrop = (id: string) => {
    const item = catalog[id];
    if (item) addItem(item);
  };

  const removeNode = (target: string) => {
    const removed = nodes.find((n) => n.uid === target);
    setNodes((prev) =>
      prev
        .filter((n) => n.uid !== target)
        .map((n) =>
          n.hiddenUntilTriggerUid === target
            ? { ...n, hiddenUntilTriggerUid: null }
            : n,
        ),
    );
    if (selectedUid === target) setSelectedUid(null);
    if (activeTriggerUid === target) setActiveTriggerUid(null);
    if (removed && recording) recordAction(`Removed ${removed.name}`);
  };

  const updateNode = (target: string, patch: Partial<CanvasNode>) => {
    setNodes((prev) =>
      prev.map((n) => (n.uid === target ? { ...n, ...patch } : n)),
    );
  };

  // Clicking an element selects it for editing, and (while recording) caches
  // it as the active trigger for the next dropped component.
  const handleNodeClick = (node: CanvasNode) => {
    setSelectedUid((cur) => (cur === node.uid ? null : node.uid));
    if (recording) {
      setActiveTriggerUid(node.uid);
      if (node.item.id === "button") {
        recordAction(`Trigger set: ${node.name} clicked`);
      }
    }
  };

  const toggleRecording = () => {
    setRecording((r) => {
      const next = !r;
      if (!next) setActiveTriggerUid(null);
      setActions((prev) => [
        ...prev,
        {
          id: uid(),
          label: next ? "Recording started" : "Recording stopped",
          time: stamp(),
        },
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
          <button
            onClick={() => setExportOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.03]"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export App</span>
          </button>
          {user ? (
            <button
              onClick={() => {
                signOut();
                toast("Signed out");
              }}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
              title={user.email ?? undefined}
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          ) : (
            <Link
              to="/auth"
              className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
            >
              <LogIn className="h-4 w-4" />
              <span className="hidden sm:inline">Sign in</span>
            </Link>
          )}
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <ComponentPalette onAdd={addItem} />
        <Canvas
          nodes={nodes}
          recording={recording}
          onDropItem={handleDrop}
          onRemove={removeNode}
          onRecordClick={handleRecordClick}
        />
        <ActionsPanel
          recording={recording}
          actions={actions}
          onToggle={toggleRecording}
          co2={co2}
          credits={credits}
        />
      </div>

      <ExportPanel
        open={exportOpen}
        nodes={nodes}
        appName="Untitled Project"
        onClose={() => setExportOpen(false)}
      />
    </div>
  );
}
