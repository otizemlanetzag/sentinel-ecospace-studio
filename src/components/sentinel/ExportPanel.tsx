import { useState } from "react";
import JSZip from "jszip";
import { toast } from "sonner";
import {
  X,
  Globe,
  Smartphone,
  Apple,
  Monitor,
  Download,
  Lock,
  HeartHandshake,
} from "lucide-react";
import type { CanvasNode } from "./Canvas";
import {
  generateWebApp,
  generateAndroidApp,
  type ExportNode,
} from "@/lib/export/generateProject";

const DONATION_URL = "https://secured.israelgives.org/he/pay/ecoocean";
const PAID_KEY = "sentinel_paid_unlock";

function toExportNodes(nodes: CanvasNode[]): ExportNode[] {
  return nodes.map((n) => ({
    uid: n.uid,
    name: n.name,
    itemId: n.item.id,
    label: n.item.label,
    hint: n.item.hint,
  }));
}

async function downloadZip(files: Record<string, string>, fileName: string) {
  const zip = new JSZip();
  for (const [path, content] of Object.entries(files)) {
    zip.file(path, content);
  }
  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function ExportPanel({
  open,
  nodes,
  appName,
  onClose,
}: {
  open: boolean;
  nodes: CanvasNode[];
  appName: string;
  onClose: () => void;
}) {
  const [paid, setPaid] = useState(
    () =>
      typeof window !== "undefined" &&
      localStorage.getItem(PAID_KEY) === "true",
  );

  if (!open) return null;

  const slug = appName.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "app";

  const exportWeb = async () => {
    await downloadZip(generateWebApp(appName, toExportNodes(nodes)), `${slug}-web.zip`);
    toast.success("Web app downloaded", { description: "Full-stack ZIP ready." });
  };

  const exportAndroid = async () => {
    await downloadZip(
      generateAndroidApp(appName, toExportNodes(nodes)),
      `${slug}-android.zip`,
    );
    toast.success("Android app downloaded", { description: "Android Studio ZIP ready." });
  };

  const goDonate = () => {
    window.open(DONATION_URL, "_blank", "noopener");
    toast("Complete your donation to Eco Ocean", {
      description: "Return here and confirm to unlock iOS & Windows exports.",
    });
  };

  const confirmPaid = () => {
    localStorage.setItem(PAID_KEY, "true");
    setPaid(true);
    toast.success("Premium unlocked", { description: "iOS & Windows exports enabled. 🌊" });
  };

  const exportPremium = async (platform: "ios" | "windows") => {
    if (!paid) {
      goDonate();
      return;
    }
    const files =
      platform === "ios"
        ? generateAndroidApp(appName, toExportNodes(nodes))
        : generateWebApp(appName, toExportNodes(nodes));
    await downloadZip(files, `${slug}-${platform}.zip`);
    toast.success(`${platform === "ios" ? "iOS" : "Windows"} app downloaded`);
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-panel)]">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">Export your app</h2>
            <p className="text-xs text-muted-foreground">
              {nodes.length} component{nodes.length === 1 ? "" : "s"} on canvas
            </p>
          </div>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-secondary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3 p-5">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={exportWeb}
              className="flex flex-col items-start gap-2 rounded-xl border border-border bg-secondary/40 p-4 text-left transition-colors hover:border-primary"
            >
              <Globe className="h-5 w-5 text-primary" />
              <span className="text-sm font-semibold text-foreground">Web App</span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Download className="h-3 w-3" /> Free ZIP
              </span>
            </button>
            <button
              onClick={exportAndroid}
              className="flex flex-col items-start gap-2 rounded-xl border border-border bg-secondary/40 p-4 text-left transition-colors hover:border-primary"
            >
              <Smartphone className="h-5 w-5 text-primary" />
              <span className="text-sm font-semibold text-foreground">Android App</span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Download className="h-3 w-3" /> Free ZIP
              </span>
            </button>
          </div>

          <div className="rounded-xl border border-border bg-secondary/20 p-4">
            <div className="mb-3 flex items-center gap-2">
              <HeartHandshake className="h-4 w-4 text-record" />
              <span className="text-sm font-semibold text-foreground">
                Premium platforms
              </span>
              {paid ? (
                <span className="ml-auto rounded-md bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
                  Unlocked
                </span>
              ) : (
                <span className="ml-auto rounded-md bg-record/15 px-2 py-0.5 text-xs font-medium text-record">
                  $5 / 2 months
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => exportPremium("ios")}
                className="flex flex-col items-start gap-2 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-primary"
              >
                <Apple className="h-5 w-5 text-foreground" />
                <span className="text-sm font-semibold text-foreground">iOS App</span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  {paid ? <Download className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                  {paid ? "Download ZIP" : "Requires plan"}
                </span>
              </button>
              <button
                onClick={() => exportPremium("windows")}
                className="flex flex-col items-start gap-2 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-primary"
              >
                <Monitor className="h-5 w-5 text-foreground" />
                <span className="text-sm font-semibold text-foreground">Windows App</span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  {paid ? <Download className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                  {paid ? "Download ZIP" : "Requires plan"}
                </span>
              </button>
            </div>

            {!paid && (
              <div className="mt-3 space-y-2">
                <p className="text-xs text-muted-foreground">
                  Unlock iOS & Windows for $5 / 10₪ / 5€ (2 months). Payment goes
                  directly to Eco Ocean.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={goDonate}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-record px-3 py-2 text-sm font-semibold text-record-foreground shadow-[var(--shadow-glow)] transition-transform hover:scale-[1.02]"
                  >
                    <HeartHandshake className="h-4 w-4" /> Donate & unlock
                  </button>
                  <button
                    onClick={confirmPaid}
                    className="rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary"
                  >
                    I've paid
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
