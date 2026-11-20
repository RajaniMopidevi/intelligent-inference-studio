import type { ClassKey } from "./mission-data";

export type ScanResult = {
  width: number;
  height: number;
  maskPng: string;
  overlayPng: string;
  distribution: Record<ClassKey, number>;
  checkpoint?: string;
  inferenceMs?: number;
};

export class InferenceError extends Error {}

const TIMEOUT_MS = 90_000;

export function getApiBaseUrl(): string | null {
  const url = import.meta.env['VITE_API_BASE_URL'] as string | undefined;
  return url ? url.replace(/\/$/, "") : null;
}

const toDataUrl = (b64: string) => (b64.startsWith("data:") ? b64 : `data:image/png;base64,${b64}`);

async function request(path: string, init: RequestInit, timeout = TIMEOUT_MS) {
  const base = getApiBaseUrl();
  if (!base) throw new InferenceError("The inference backend isn't configured yet (VITE_API_BASE_URL is not set).");
  try {
    return await fetch(`${base}${path}`, { ...init, signal: AbortSignal.timeout(timeout) });
  } catch (e) {
    if (e instanceof DOMException && (e.name === "TimeoutError" || e.name === "AbortError"))
      throw new InferenceError("The inference backend took too long to respond. It may be waking up — try again.");
    throw new InferenceError("Couldn't reach the inference backend. It may be offline or blocking this site (CORS).");
  }
}

export async function checkHealth(): Promise<{ online: boolean; modelLoaded: boolean; device?: string }> {
  try {
    const res = await request("/health", { method: "GET" }, 8_000);
    if (!res.ok) return { online: false, modelLoaded: false };
    const body = await res.json();
    return { online: true, modelLoaded: body.status === "ok", device: body.device };
  } catch {
    return { online: false, modelLoaded: false };
  }
}

export async function predict(file: File): Promise<ScanResult> {
  const form = new FormData();
  form.append("file", file, file.name); // browser sets the multipart boundary header
  const res = await request("/predict", { method: "POST", body: form });
  const body = (await res.json().catch(() => null)) as any;
  if (!res.ok || !body) {
    const detail = typeof body?.detail === "string" ? body.detail : null;
    throw new InferenceError(detail ?? `Inference failed (HTTP ${res.status}).`);
  }
  if (!body.mask_png || !body.overlay_png || !body.distribution) throw new InferenceError("The backend returned an incomplete result.");
  return {
    width: body.width,
    height: body.height,
    maskPng: toDataUrl(body.mask_png),
    overlayPng: toDataUrl(body.overlay_png),
    distribution: body.distribution,
    checkpoint: body.checkpoint,
    inferenceMs: body.inference_ms,
  };
}
