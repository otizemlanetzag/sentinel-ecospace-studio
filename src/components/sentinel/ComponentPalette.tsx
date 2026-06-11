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
import type { LucideIcon } from "lucide-react";

export interface PaletteItem {
  id: string;
  label: string;
  icon: LucideIcon;
  hint: string;
}

const groups: { title: string; items: PaletteItem[] }[] = [
  {
    title: "Basics",
    items: [
      { id: "button", label: "Button", icon: RectangleHorizontal, hint: "Clickable action" },
      { id: "input", label: "Input", icon: TextCursorInput, hint: "Text field" },
      { id: "text", label: "Text", icon: Type, hint: "Label or paragraph" },
      { id: "toggle", label: "Toggle", icon: ToggleLeft, hint: "On / off switch" },
    ],
  },
  {
    title: "Layout",
    items: [
      { id: "container", label: "Container", icon: Square, hint: "Group elements" },
      { id: "grid", label: "Grid", icon: LayoutGrid, hint: "Responsive grid" },
    ],
  },
  {
    title: "Media & Data",
    items: [
      { id: "image", label: "Image", icon: Image, hint: "Picture block" },
      { id: "list", label: "List", icon: ListChecks, hint: "Repeating items" },
    ],
  },
];

export function ComponentPalette({
  onAdd,
}: {
  onAdd: (item: PaletteItem) => void;
}) {
  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-border bg-panel">
      <div className="border-b border-border px-4 py-4">
        <h2 className="text-sm font-semibold tracking-wide text-foreground">
          Components
        </h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Drag onto the canvas
        </p>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
        {groups.map((group) => (
          <div key={group.title}>
            <h3 className="px-1 pb-2 text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">
              {group.title}
            </h3>
            <div className="space-y-1.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    draggable
                    onDragStart={(e) =>
                      e.dataTransfer.setData("application/sentinel", item.id)
                    }
                    onClick={() => onAdd(item)}
                    className="group flex w-full cursor-grab items-center gap-3 rounded-lg border border-border/60 bg-card px-3 py-2.5 text-left transition-all hover:border-primary/50 hover:bg-secondary active:cursor-grabbing"
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-secondary text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-foreground">
                        {item.label}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {item.hint}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
