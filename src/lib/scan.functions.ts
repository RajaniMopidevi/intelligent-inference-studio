import { createServerFn } from "@tanstack/react-start";
import type { ClassKey } from "./mission-data";

export type ScanResult = {
  width: number;
  height: number;
  maskPng: string; // data URL
  overlayPng: string; // data URL
  distribution: Record<ClassKey, number>; // percent 0-100
  checkpoint?: string;
  inferenceMs?: number;
};

type ScanInput = { filename: string; contentType: string; dataBase64: string };

const ALLOWED = ["image/jpeg", "image/png"];
const MAX_BYTES = 10 * 1024 * 1024;

// Proxies the upload to the external FastAPI service. The service URL stays server-side.
export const scanTerrain = createServerFn({ method: "POST" })
  .inputValidator((input: ScanInput) => {
    if (!input || typeof input.dataBase64 !== "string") throw new Error("No image received.");
    if (!ALLOWED.includes(input.contentType)) throw new Error("Only JPG, JPEG or PNG images are supported.");
    if (input.dataBase64.length * 0.75 > MAX_BYTES) throw new Error("Image is larger than 10 MB.");
    return input;
  })
  .handler(async ({ data }): Promise<{ ok: true; result: ScanResult } | { ok: false; error: string }> => {
    const base = process.env["INFERENCE_API_URL"];
    if (!base) {
      return { ok: false, error: "The inference service is not connected yet. Set the INFERENCE_API_URL secret to your FastAPI backend." };
    }
    const bytes = Uint8Array.from(atob(data.dataBase64), (c) => c.charCodeAt(0));
    const form = new FormData();
    form.append("file", new Blob([bytes], { type: data.contentType }), data.filename || "upload");
    const headers: Record<string, string> = {};
    const key = process.env["INFERENCE_API_KEY"];
    if (key) headers["x-api-key"] = key;
    try {
      const res = await fetch(`${base.replace(/\/$/, "")}/predict`, { method: "POST", body: form, headers, signal: AbortSignal.timeout(90_000) });
      const body = (await res.json().catch(() => null)) as any;
      if (!res.ok || !body) return { ok: false, error: body?.detail ?? `Inference service responded with ${res.status}.` };
      return {
        ok: true,
        result: {
          width: body.width,
          height: body.height,
          maskPng: `data:image/png;base64,${body.mask_png}`,
          overlayPng: `data:image/png;base64,${body.overlay_png}`,
          distribution: body.distribution,
          checkpoint: body.checkpoint,
          inferenceMs: body.inference_ms,
        },
      };
    } catch (e) {
      return { ok: false, error: "Could not reach the inference service. It may be offline or waking up — try again in a moment." };
    }
  });
