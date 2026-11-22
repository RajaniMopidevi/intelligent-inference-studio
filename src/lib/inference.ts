
import * as ort from "onnxruntime-web/wasm";
import type { ScanResult } from "./inference-api";
import type { ClassKey } from "./mission-data";

const SIZE = 512;

const MODEL_URL =
  "https://huggingface.co/Rajani25/mars-terrain-deeplabv3-onnx/resolve/main/mars_terrain.onnx";

const MEAN: [number, number, number] = [
  0.485, 0.456, 0.406,
];

const STD: [number, number, number] = [
  0.229, 0.224, 0.225,
];

const KEYS: ClassKey[] = [
  "soil",
  "bedrock",
  "sand",
  "big_rock",
];

const PALETTE: [number, number, number][] = [
  [214, 118, 62],
  [110, 160, 220],
  [235, 205, 90],
  [220, 60, 150],
];

// ONNX Runtime 1.31.1, matching your installed package.
ort.env.wasm.wasmPaths =
  "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.31.1/dist/";

ort.env.wasm.numThreads = 1;

let sessionPromise: Promise<ort.InferenceSession> | null = null;

function getSession(): Promise<ort.InferenceSession> {
  if (!sessionPromise) {
    sessionPromise = (async () => {
      // Download the model from Hugging Face.
      const response = await fetch(MODEL_URL);

      if (!response.ok) {
        throw new Error(
          `Model download failed: HTTP ${response.status}`,
        );
      }

      const modelBytes = new Uint8Array(
        await response.arrayBuffer(),
      );

      // Run the downloaded model locally in the browser.
      return ort.InferenceSession.create(modelBytes, {
        executionProviders: ["wasm"],
      });
    })().catch((error) => {
      sessionPromise = null;
      throw error;
    });
  }

  return sessionPromise;
}

function canvasToDataUrl(
  canvas: HTMLCanvasElement,
): string {
  return canvas.toDataURL("image/png");
}

export async function predictInBrowser(
  file: File,
): Promise<ScanResult> {
  const bitmap = await createImageBitmap(file);

  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;

  const ctx = canvas.getContext("2d", {
    willReadFrequently: true,
  });

  if (!ctx) {
    bitmap.close();
    throw new Error("Canvas is not supported.");
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "medium";

  ctx.drawImage(bitmap, 0, 0, SIZE, SIZE);
  bitmap.close();

  const rgba = ctx.getImageData(
    0,
    0,
    SIZE,
    SIZE,
  ).data;

  const pixels = SIZE * SIZE;
  const input = new Float32Array(3 * pixels);

  for (let i = 0; i < pixels; i++) {
    for (let c = 0; c < 3; c++) {
      input[c * pixels + i] =
        (rgba[i * 4 + c]! / 255 - MEAN[c]!) /
        STD[c]!;
    }
  }

  const tensor = new ort.Tensor(
    "float32",
    input,
    [1, 3, SIZE, SIZE],
  );

  const session = await getSession();

  const start = performance.now();

  const output = await session.run({
    image: tensor,
  });

  const outputTensor =
    output["logits"] ?? Object.values(output)[0];

  if (!outputTensor) {
    throw new Error(
      "ONNX model returned no output.",
    );
  }

  const logits = outputTensor.data as Float32Array;
  const inferenceMs = performance.now() - start;

  const counts = [0, 0, 0, 0];

  const maskCanvas = document.createElement("canvas");
  maskCanvas.width = SIZE;
  maskCanvas.height = SIZE;

  const maskCtx = maskCanvas.getContext("2d");

  if (!maskCtx) {
    throw new Error("Cannot create mask.");
  }

  const maskImage = maskCtx.createImageData(
    SIZE,
    SIZE,
  );

  const overlayImage = ctx.createImageData(
    SIZE,
    SIZE,
  );

  for (let i = 0; i < pixels; i++) {
    let best = 0;
    let bestValue = logits[i]!;

    for (let c = 1; c < 4; c++) {
      const value = logits[c * pixels + i]!;

      if (value > bestValue) {
        best = c;
        bestValue = value;
      }
    }

    counts[best] = (counts[best] ?? 0) + 1;

    const color = PALETTE[best]!;

    for (let c = 0; c < 3; c++) {
      maskImage.data[i * 4 + c] = color[c]!;

      overlayImage.data[i * 4 + c] = Math.floor(
        rgba[i * 4 + c]! * 0.55 +
          color[c]! * 0.45,
      );
    }

    maskImage.data[i * 4 + 3] = 255;
    overlayImage.data[i * 4 + 3] = 255;
  }

  maskCtx.putImageData(maskImage, 0, 0);

  const overlayCanvas = document.createElement(
    "canvas",
  );

  overlayCanvas.width = SIZE;
  overlayCanvas.height = SIZE;

  const overlayCtx = overlayCanvas.getContext("2d");

  if (!overlayCtx) {
    throw new Error(
      "Cannot create overlay.",
    );
  }

  overlayCtx.putImageData(
    overlayImage,
    0,
    0,
  );

  const distribution = {} as Record<
    ClassKey,
    number
  >;

  KEYS.forEach((key, i) => {
    distribution[key] =
      ((counts[i] ?? 0) / pixels) * 100;
  });

  return {
    width: SIZE,
    height: SIZE,
    maskPng: canvasToDataUrl(maskCanvas),
    overlayPng: canvasToDataUrl(overlayCanvas),
    distribution,
    checkpoint: "AI4Mars DeepLabV3+ ONNX",
    inferenceMs,
  };
}
