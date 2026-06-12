import { useEffect, useRef, useState } from "react";
import JSZip from "jszip";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
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
  Upload,
  Sparkles,
  LogIn,
} from "lucide-react";
import type { CanvasNode } from "./Canvas";
import {
  generateWebApp,
  generateAndroidApp,
  type ExportNode,
} from "@/lib/export/generateProject";
import {
  verifyReceiptWithAI,
  getMyEntitlement,
} from "@/lib/verifyReceipt.functions";
import { useAuth } from "@/hooks/useAuth";

const DONATION_URL = "https://teamtrees.org";
const GREENGEEKS_URL = "https://www.greengeeks.com/";
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

type PremiumPlatform = "ios" | "mac" | "windows";

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
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
  const { user, loading: authLoading } = useAuth();
  const verifyReceipt = useServerFn(verifyReceiptWithAI);
  const fetchEntitlement = useServerFn(getMyEntitlement);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [paidUntil, setPaidUntil] = useState<string | null>(null);
  const [loadingEntitlement, setLoadingEntitlement] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (!open || !user) {
      setPaidUntil(null);
      return;
    }
    let active = true;
    setLoadingEntitlement(true);
    fetchEntitlement()
      .then((res) => {
        if (active) setPaidUntil(res.paidUntil);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoadingEntitlement(false);
      });
    return () => {
      active = false;
    };
  }, [open, user, fetchEntitlement]);

  if (!open) return null;

  const paid = !!paidUntil;
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
      description: "Then upload your receipt image to verify with AI.",
    });
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image of your receipt.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error("Image too large", { description: "Max 8 MB." });
      return;
    }
    try {
      const url = await fileToDataUrl(file);
      setDataUrl(url);
      setPreview(url);
      setFileName(file.name);
    } catch {
      toast.error("Could not read that image.");
    }
  };

  const handleVerify = async () => {
    if (!dataUrl) {
      toast.error("Upload your receipt image first.");
      return;
    }
    setVerifying(true);
    try {
      const result = await verifyReceipt({ data: { imageDataUrl: dataUrl } });
      if (!result.verified) {
        toast.error("Receipt not verified", { description: result.reason });
        return;
      }
      setPaidUntil(result.paidUntil ?? null);
      setPreview(null);
      setDataUrl(null);
      setFileName(null);
      toast.success("Donation verified by AI — premium unlocked! 🌲", {
        description: "iOS, Mac & Windows exports are enabled for 60 days.",
      });
    } catch {
      toast.error("Verification failed", { description: "Please try again." });
    } finally {
      setVerifying(false);
    }
  };

  const exportPremium = async (platform: PremiumPlatform) => {
    if (!paid) {
      toast("Donate to unlock", {
        description: "Upload and verify your receipt to enable this export.",
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

  const paidUntilLabel = paidUntil
    ? new Date(paidUntil).toLocaleDateString()
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

          {/* Green Deploy — eco-friendly hosting */}
          <button
            onClick={() => window.open(GREENGEEKS_URL, "_blank", "noopener")}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-green-600/40 bg-green-600/10 px-4 py-3 text-sm font-semibold text-green-400 transition-colors hover:bg-green-600/20 hover:border-green-500"
          >
            <TreePine className="h-4 w-4" />
            Green Deploy
            <ExternalLink className="h-3.5 w-3.5 opacity-70" />
          </button>

          {/* Premium platforms — unlocked via AI-verified Team Trees donation */}
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

            {authLoading || (user && loadingEntitlement) ? (
              <div className="flex items-center gap-2 border-t border-border/60 px-4 py-4 text-xs text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Checking your access…
              </div>
            ) : !user ? (
              <div className="space-y-3 border-t border-border/60 px-4 py-4">
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Sign in to unlock premium iOS, Mac & Windows exports. Your access
                  is saved to your account and follows you across devices.
                </p>
                <Link
                  to="/auth"
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition-transform hover:scale-[1.01]"
                >
                  <LogIn className="h-4 w-4" /> Sign in to continue
                </Link>
              </div>
            ) : paid ? (
              <div className="border-t border-border/60 px-4 py-3 text-xs text-muted-foreground">
                Thanks for planting trees! Premium access active until{" "}
                <span className="font-medium text-foreground">{paidUntilLabel}</span>.
              </div>
            ) : (
              <div className="space-y-3 border-t border-border/60 px-4 py-4">
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Donate <span className="font-semibold text-foreground">$5</span> to
                  plant <span className="font-semibold text-foreground">5 trees</span>{" "}
                  on Team Trees, then upload your receipt — our built-in AI verifies
                  it and unlocks iOS, Mac & Windows exports for 60 days.
                </p>

                <button
                  onClick={goDonate}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition-transform hover:scale-[1.01]"
                >
                  <TreePine className="h-4 w-4" /> Donate $5 on teamtrees.org
                  <ExternalLink className="h-3.5 w-3.5 opacity-70" />
                </button>

                <div className="space-y-2">
                  <span className="text-xs font-medium text-foreground">
                    Upload your official donation receipt
                  </span>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFile(e.target.files?.[0])}
                  />

                  {preview ? (
                    <div className="flex items-center gap-3 rounded-lg border border-border bg-background p-2">
                      <img
                        src={preview}
                        alt="Receipt preview"
                        className="h-14 w-14 rounded-md object-cover"
                      />
                      <span className="flex-1 truncate text-xs text-muted-foreground">
                        {fileName}
                      </span>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={verifying}
                        className="rounded-md border border-border px-2 py-1 text-xs text-foreground hover:bg-secondary disabled:opacity-60"
                      >
                        Change
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex w-full flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-border bg-background/60 px-3 py-5 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
                    >
                      <Upload className="h-5 w-5" />
                      Click to upload receipt image (PNG/JPG, max 8 MB)
                    </button>
                  )}

                  <button
                    onClick={handleVerify}
                    disabled={verifying || !dataUrl}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-primary bg-primary/10 px-3 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/20 disabled:opacity-50"
                  >
                    {verifying ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> AI reviewing
                        receipt…
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" /> Verify with AI
                      </>
                    )}
                  </button>

                  <p className="text-[11px] text-muted-foreground/80">
                    Your receipt is analyzed by Lovable AI to confirm a valid $5+
                    donation before unlocking.
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
