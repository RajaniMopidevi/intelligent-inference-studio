
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  UploadCloud,
  ScanLine,
  RotateCcw,
  AlertTriangle,
  Info,
} from "lucide-react";
import { PageHeader, ClassLegend } from "@/components/mars/Shell";
import type { ScanResult } from "@/lib/inference-api";
import { predictInBrowser } from "@/lib/inference";
import { CLASSES } from "@/lib/mission-data";

export const Route = createFileRoute("/scanner")({
  head: () => ({
    meta: [
      { title: "Terrain Scanner — Mars Terrain Intelligence" },
      {
        name: "description",
        content:
          "Upload a Mars rover image and run DeepLabV3+ terrain segmentation directly in your browser.",
      },
      {
        property: "og:title",
        content: "Terrain Scanner — Mars Terrain Intelligence",
      },
      {
        property: "og:description",
        content:
          "Browser-based Mars terrain segmentation using DeepLabV3+.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Scanner,
});

const OK_TYPES = ["image/jpeg", "image/png"];

function Scanner() {
  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null);
  const [view, setView] = useState<"original" | "mask" | "overlay">("overlay");

  // Clean up browser object URLs.
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const pick = useCallback((f: File | undefined) => {
    setError(null);
    setResult(null);

    if (!f) return;

    if (!OK_TYPES.includes(f.type)) {
      setError("Unsupported file. Please upload a JPG, JPEG or PNG image.");
      return;
    }

    if (f.size > 10 * 1024 * 1024) {
      setError("This image is larger than 10 MB.");
      return;
    }

    const url = URL.createObjectURL(f);

    setFile(f);
    setPreview(url);
    setDims(null);
    setView("overlay");

    const im = new Image();
    im.onload = () => {
      setDims({ w: im.naturalWidth, h: im.naturalHeight });
    };
    im.src = url;
  }, []);

  const reset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
    setDims(null);
    setView("overlay");

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const run = async () => {
    if (!file || loading) return;

    setLoading(true);
    setError(null);

    try {
      const prediction = await predictInBrowser(file);
      setResult(prediction);
      setView("overlay");
    } catch (e) {
      console.error("Browser inference failed:", e);

      setError(
        e instanceof Error
          ? e.message
          : "Browser inference failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const shown = !result
    ? preview
    : view === "original"
      ? preview
      : view === "mask"
        ? result.maskPng
        : result.overlayPng;

  return (
    <>
      <PageHeader kicker="Live inference" title="Terrain Scanner">
        Upload a Mars rover image and run DeepLabV3+ terrain segmentation
        directly in your browser.
      </PageHeader>

      <div className="mx-auto max-w-7xl px-5">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 font-mono text-xs text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-primary" />
          Browser inference enabled · No server required
        </div>

        <div className="glass mb-6 flex gap-3 p-4 text-sm text-muted-foreground">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p>
            This model is built for AI4Mars-style rover imagery
            (grayscale NAVCAM/MASTCAM terrain). Other photos may receive
            meaningless predictions. Without a ground-truth mask, accuracy
            cannot be measured for uploaded images. The first scan downloads
            the model to your browser, which may take some time.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div className="glass p-4">
            {!preview ? (
              <label
                onDragOver={(e) => {
                  e.preventDefault();
                  setDrag(true);
                }}
                onDragLeave={() => setDrag(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDrag(false);
                  pick(e.dataTransfer.files[0]);
                }}
                className={`flex aspect-[4/3] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed text-center transition ${
                  drag
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/60"
                }`}
              >
                <UploadCloud className="h-12 w-12 text-primary" />

                <p className="mt-4 font-display text-sm tracking-widest">
                  DROP ROVER IMAGE
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  or click to browse · JPG, JPEG, PNG · up to 10 MB
                </p>

                <input
                  ref={inputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                  className="hidden"
                  onChange={(e) => pick(e.target.files?.[0])}
                />
              </label>
            ) : (
              <div>
                {result && (
                  <div className="mb-3 flex gap-1 rounded-lg bg-muted p-1 text-xs">
                    {(["original", "mask", "overlay"] as const).map((v) => (
                      <button
                        key={v}
                        onClick={() => setView(v)}
                        className={`flex-1 rounded-md px-3 py-2 uppercase tracking-widest ${
                          view === v
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground"
                        }`}
                      >
                        {v === "mask" ? "Predicted mask" : v}
                      </button>
                    ))}
                  </div>
                )}

                <div className="relative overflow-hidden rounded-lg bg-background">
                  <img
                    src={shown ?? ""}
                    alt={view}
                    className="mx-auto max-h-[520px] w-full object-contain"
                  />

                  {loading && (
                    <>
                      <div className="absolute inset-0 bg-background/50" />
                      <div className="scanline" />

                      <p className="absolute inset-x-0 bottom-4 text-center font-mono text-xs tracking-widest text-primary">
                        ANALYSING TERRAIN…
                      </p>
                    </>
                  )}
                </div>

                {result && (
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {[
                      ["Original", preview],
                      ["Mask", result.maskPng],
                      ["Overlay", result.overlayPng],
                    ].map(([label, src]) => (
                      <figure key={label} className="text-center">
                        <img
                          src={src!}
                          alt={label!}
                          className="aspect-square w-full rounded-md object-cover"
                        />

                        <figcaption className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">
                          {label}
                        </figcaption>
                      </figure>
                    ))}
                  </div>
                )}
              </div>
            )}

            {error && (
              <div
                role="alert"
                className="mt-4 flex gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm"
              >
                <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" />
                {error}
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-3">
              {preview && !result && (
                <button
                  disabled={loading}
                  onClick={run}
                  className="bg-cta inline-flex items-center gap-2 rounded-lg px-6 py-3 font-display text-sm font-bold tracking-widest text-primary-foreground disabled:opacity-60"
                >
                  <ScanLine className="h-4 w-4" />
                  {loading ? "SCANNING…" : "SCAN TERRAIN"}
                </button>
              )}

              {preview && (
                <button
                  disabled={loading}
                  onClick={reset}
                  className="glass inline-flex items-center gap-2 px-5 py-3 text-sm hover:text-primary"
                >
                  <RotateCcw className="h-4 w-4" />
                  {result ? "Scan another image" : "Choose different image"}
                </button>
              )}
            </div>
          </div>

          <aside className="glass p-6">
            <h2 className="text-sm tracking-widest">
              TERRAIN COMPOSITION
            </h2>

            <p className="mt-1 text-xs text-muted-foreground">
              {result
                ? "Share of predicted pixels per class (your upload — not a validation result)."
                : "Run a scan to see the class distribution."}
            </p>

            <div className="mt-6 space-y-5">
              {CLASSES.map((c) => {
                const pct = result?.distribution?.[c.key] ?? 0;

                return (
                  <div key={c.key}>
                    <div className="flex justify-between text-sm">
                      <span>{c.label}</span>
                      <span className="font-mono">
                        {result ? `${pct.toFixed(1)}%` : "—"}
                      </span>
                    </div>

                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${pct}%`,
                          background: `rgb(${c.rgb.join(",")})`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-8">
              <ClassLegend />
            </div>

            {dims && (
              <p className="mt-6 font-mono text-xs text-muted-foreground">
                Uploaded image {dims.w}×{dims.h} px
              </p>
            )}

            {result?.inferenceMs != null && (
              <p className="mt-1 font-mono text-xs text-muted-foreground">
                Inference time {Math.round(result.inferenceMs)} ms · Output{" "}
                {result.width}×{result.height} px
              </p>
            )}
          </aside>
        </div>
      </div>
    </>
  );
}
