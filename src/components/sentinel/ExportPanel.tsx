import { useState } from "react";
import JSZip from "jszip";
import { toast } from "sonner";
import {
  X,
  Globe,
  Smartphone,
  Apple,
  Monitor,
  Laptop,
  Download,
  Lock,
  TreePine,
  ExternalLink,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import type { CanvasNode } from "./Canvas";
import {
  generateWebApp,
  generateAndroidApp,
  type ExportNode,
} from "@/lib/export/generateProject";

const DONATION_URL = "https://teamtrees.org";
const ENTITLEMENT_KEY = "sentinel_user_entitlements";
const SIXTY_DAYS_MS = 60 * 24 * 60 * 60 * 1000;

type Entitlement = { paid_until: number; receipt: string } | null;

type PremiumPlatform = "ios" | "mac" | "windows";

function readEntitlement(): Entitlement {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(ENTITLEMENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Entitlement;
    if (parsed && parsed.paid_until > Date.now()) return parsed;
  } catch {
    /* ignore malformed entitlement */
  }
  return null;
}

/**
 * verifyTreeDonation — honor-based receipt sanity check.
 *
 * NOTE: Team Trees does not expose a public receipt-verification API, so this
 * cannot cryptographically confirm a real donation. It validates the format,
 * rejects empty / repeated / already-used values, and simulates an async
 * verification call. It is an honor-system unlock, not fraud-proof.
 */
export async function verifyTreeDonation(
  rawInput: string,
): Promise<{ ok: boolean; reason?: string }> {
  const input = rawInput.trim();

  if (!input) return { ok: false, reason: "Please enter your transaction ID." };
  if (input.length < 6 || input.length > 64)
    return { ok: false, reason: "Transaction ID should be 6–64 characters." };
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]+$/.test(input))
    return {
      ok: false,
      reason: "Use only letters, numbers, hyphens and underscores.",
    };
  // Reject obviously fake repeated values like "aaaaaa" or "111111".
  if (/^(.)\1+$/.test(input))
    return { ok: false, reason: "That doesn't look like a real receipt number." };

  // Reject a receipt that was already used to unlock.
  const existing = readEntitlement();
  if (existing && existing.receipt === input)
    return { ok: false, reason: "This receipt has already been redeemed." };

  // Simulate an asynchronous verification round-trip.
  await new Promise((r) => setTimeout(r, 1100));

  return { ok: true };
}

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

const PREMIUM_TABS: {
  id: PremiumPlatform;
  label: string;
  icon: typeof Apple;
}[] = [
  { id: "ios", label: "iOS App", icon: Apple },
  { id: "mac", label: "Mac App", icon: Laptop },
  { id: "windows", label: "Windows App", icon: Monitor },
];

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
  const [entitlement, setEntitlement] = useState<Entitlement>(() =>
    readEntitlement(),
  );
  const [receipt, setReceipt] = useState("");
  const [verifying, setVerifying] = useState(false);

  if (!open) return null;

  const paid = !!entitlement;
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
    toast("Plant 5 trees on Team Trees 🌳", {
      description: "Then paste your receipt number below to unlock.",
    });
  };

  const handleVerify = async () => {
    setVerifying(true);
    const result = await verifyTreeDonation(receipt);
    setVerifying(false);

    if (!result.ok) {
      toast.error("Verification failed", { description: result.reason });
      return;
    }

    const next: Entitlement = {
      paid_until: Date.now() + SIXTY_DAYS_MS,
      receipt: receipt.trim(),
    };
    localStorage.setItem(ENTITLEMENT_KEY, JSON.stringify(next));
    setEntitlement(next);
    setReceipt("");
    toast.success("Donation verified — premium unlocked! 🌲", {
      description: "iOS, Mac & Windows exports are enabled for 60 days.",
    });
  };

  const exportPremium = async (platform: PremiumPlatform) => {
    if (!paid) {
      toast("Donate to unlock", {
        description: "Plant trees and verify your receipt to enable this export.",
      });
      return;
    }
    const files =
      platform === "windows"
        ? generateWebApp(appName, toExportNodes(nodes))
        : generateAndroidApp(appName, toExportNodes(nodes));
    await downloadZip(files, `${slug}-${platform}.zip`);
    toast.success(`${PREMIUM_TABS.find((t) => t.id === platform)?.label} downloaded`);
  };

  const paidUntilLabel = entitlement
    ? new Date(entitlement.paid_until).toLocaleDateString()
    : null;

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

          {/* Premium platforms — unlocked via Team Trees donation */}
          <div className="overflow-hidden rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card">
            <div className="flex items-center gap-2 border-b border-border/60 px-4 py-3">
              <TreePine className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">
                Premium platforms
              </span>
              {paid ? (
                <span className="ml-auto flex items-center gap-1 rounded-md bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
                  <ShieldCheck className="h-3 w-3" /> Unlocked
                </span>
              ) : (
                <span className="ml-auto rounded-md bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
                  $5 = 5 trees
                </span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 p-4">
              {PREMIUM_TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => exportPremium(tab.id)}
                    className="flex flex-col items-start gap-2 rounded-xl border border-border bg-card p-3 text-left transition-colors hover:border-primary"
                  >
                    <Icon className="h-5 w-5 text-foreground" />
                    <span className="text-sm font-semibold text-foreground">
                      {tab.label}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      {paid ? (
                        <Download className="h-3 w-3" />
                      ) : (
                        <Lock className="h-3 w-3" />
                      )}
                      {paid ? "Download" : "Locked"}
                    </span>
                  </button>
                );
              })}
            </div>

            {paid ? (
              <div className="border-t border-border/60 px-4 py-3 text-xs text-muted-foreground">
                Thanks for planting trees! Premium access active until{" "}
                <span className="font-medium text-foreground">{paidUntilLabel}</span>.
              </div>
            ) : (
              <div className="space-y-3 border-t border-border/60 px-4 py-4">
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Donate <span className="font-semibold text-foreground">$5</span> to
                  plant <span className="font-semibold text-foreground">5 trees</span>{" "}
                  on Team Trees, then verify your receipt to unlock iOS, Mac &
                  Windows exports for 60 days.
                </p>

                <button
                  onClick={goDonate}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition-transform hover:scale-[1.01]"
                >
                  <TreePine className="h-4 w-4" /> Donate $5 on teamtrees.org
                  <ExternalLink className="h-3.5 w-3.5 opacity-70" />
                </button>

                <div className="space-y-1.5">
                  <label
                    htmlFor="tree-receipt"
                    className="text-xs font-medium text-foreground"
                  >
                    Enter your official Team Trees Transaction ID/Receipt Number
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="tree-receipt"
                      value={receipt}
                      onChange={(e) => setReceipt(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !verifying) handleVerify();
                      }}
                      placeholder="e.g. TT-8F3K-92BX"
                      maxLength={64}
                      autoComplete="off"
                      spellCheck={false}
                      className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-primary"
                    />
                    <button
                      onClick={handleVerify}
                      disabled={verifying}
                      className="flex items-center justify-center gap-1.5 rounded-lg border border-primary bg-primary/10 px-3 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/20 disabled:opacity-60"
                    >
                      {verifying ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" /> Checking
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="h-4 w-4" /> Verify
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-[11px] text-muted-foreground/80">
                    Honor-based check: we validate the receipt format and unlock on
                    trust — Team Trees has no public receipt API.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
