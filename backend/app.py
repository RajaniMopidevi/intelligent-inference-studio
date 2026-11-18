
"""FastAPI inference service for the AI4Mars DeepLabV3+ (ResNet-50) baseline model.

Run:
  python -m uvicorn app:app --host 0.0.0.0 --port 8000

Environment variables:
  CHECKPOINT_PATH  Path to the trained checkpoint.
  CHECKPOINT_URL   Optional URL to download the checkpoint if missing.
  MODEL_FACTORY    Optional "module:function" model factory.
  API_KEY          Optional shared secret sent as x-api-key.
"""

import base64
import io
import os
import time
import importlib
import urllib.request

import numpy as np
import torch

from fastapi import FastAPI, File, Header, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image, UnidentifiedImageError


# --------------------------------------------------
# MODEL CONFIGURATION
# --------------------------------------------------

NUM_CLASSES = 4

CLASS_KEYS = ["soil", "bedrock", "sand", "big_rock"]

PALETTE = np.array(
    [
        [214, 118, 62],
        [110, 160, 220],
        [235, 205, 90],
        [220, 60, 150],
    ],
    dtype=np.uint8,
)

SIZE = 512

MEAN = np.array([0.485, 0.456, 0.406], dtype=np.float32)
STD = np.array([0.229, 0.224, 0.225], dtype=np.float32)

EXPECTED_CKPT = "mars_resume_20261114T163234Z_step_00000622.pth"

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

app = FastAPI(title="AI4Mars Terrain Inference")

_model = None


# --------------------------------------------------
# CORS CONFIGURATION
# Allows the Lovable frontend to call this API.
# --------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------------------------------
# MODEL BUILDING
# --------------------------------------------------

def build_model():
    factory = os.environ.get("MODEL_FACTORY")

    if factory:
        mod, fn = factory.split(":")
        return getattr(importlib.import_module(mod), fn)()

    import segmentation_models_pytorch as smp

    return smp.DeepLabV3Plus(
        encoder_name="resnet50",
        encoder_weights=None,
        in_channels=3,
        classes=NUM_CLASSES,
    )


# --------------------------------------------------
# LOAD TRAINED CHECKPOINT
# --------------------------------------------------

def load_model():
    global _model

    if _model is not None:
        return _model

    path = os.environ.get(
        "CHECKPOINT_PATH",
        f"./checkpoints/{EXPECTED_CKPT}",
    )

    if not os.path.exists(path):
        url = os.environ.get("CHECKPOINT_URL")

        if not url:
            raise RuntimeError(f"Checkpoint not found at {path}")

        os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
        urllib.request.urlretrieve(url, path)

    if os.path.basename(path) != EXPECTED_CKPT:
        print(
            f"WARNING: expected baseline checkpoint {EXPECTED_CKPT}, "
            f"got {os.path.basename(path)}"
        )

    ckpt = torch.load(
        path,
        map_location="cpu",
        weights_only=False,
    )

    state = ckpt

    if isinstance(ckpt, dict):
        for key in ("model_state_dict", "model", "state_dict"):
            if key in ckpt and isinstance(ckpt[key], dict):
                state = ckpt[key]
                break

    state = {
        key.removeprefix("module."): value
        for key, value in state.items()
    }

    model = build_model()
    model.load_state_dict(state, strict=True)

    model.to(device).eval()

    _model = model

    return model


# --------------------------------------------------
# IMAGE PREPROCESSING
# --------------------------------------------------

def preprocess(img: Image.Image) -> torch.Tensor:

    arr = np.asarray(
        img.convert("RGB").resize(
            (SIZE, SIZE),
            Image.BILINEAR,
        ),
        dtype=np.float32,
    ) / 255.0

    arr = (arr - MEAN) / STD

    return torch.from_numpy(
        arr.transpose(2, 0, 1)
    ).unsqueeze(0)


# --------------------------------------------------
# CONVERT IMAGE TO BASE64 PNG
# --------------------------------------------------

def png_b64(arr: np.ndarray) -> str:

    buf = io.BytesIO()

    Image.fromarray(arr).save(
        buf,
        format="PNG",
    )

    return base64.b64encode(
        buf.getvalue()
    ).decode()


# --------------------------------------------------
# STARTUP
# --------------------------------------------------

@app.on_event("startup")
def _startup():

    try:
        load_model()
        print("AI4Mars model loaded successfully!")

    except Exception as e:
        print("Model failed to load:", e)


# --------------------------------------------------
# HEALTH CHECK ENDPOINT
# --------------------------------------------------

@app.get("/health")
def health():

    return {
        "status": "ok" if _model is not None else "model_not_loaded",
        "device": str(device),
    }


# --------------------------------------------------
# PREDICTION ENDPOINT
# --------------------------------------------------

@app.post("/predict")
async def predict(
    file: UploadFile = File(...),
    x_api_key: str | None = Header(default=None),
):

    # Optional API key verification
    if (
        os.environ.get("API_KEY")
        and x_api_key != os.environ["API_KEY"]
    ):
        raise HTTPException(401, "Unauthorized")

    # Validate image format
    if file.content_type not in (
        "image/jpeg",
        "image/png",
    ):
        raise HTTPException(
            415,
            "Only JPG, JPEG or PNG images are supported.",
        )

    raw = await file.read()

    if len(raw) > 10 * 1024 * 1024:
        raise HTTPException(
            413,
            "Image is larger than 10 MB.",
        )

    try:
        img = Image.open(io.BytesIO(raw))
        img.load()

    except (UnidentifiedImageError, OSError):
        raise HTTPException(
            400,
            "The file could not be read as an image.",
        )

    # Load model if not already loaded
    try:
        model = load_model()

    except Exception as e:
        raise HTTPException(
            503,
            f"Model unavailable: {e}",
        )

    # Run inference
    t0 = time.perf_counter()

    try:
        with torch.inference_mode():

            out = model(
                preprocess(img).to(device)
            )

            if isinstance(out, dict):
                out = out["out"]

            pred = (
                out.argmax(1)[0]
                .cpu()
                .numpy()
                .astype(np.uint8)
            )

    except Exception as e:
        raise HTTPException(
            500,
            f"Inference failed: {e}",
        )

    ms = (time.perf_counter() - t0) * 1000

    # Calculate terrain distribution
    counts = np.bincount(
        pred.ravel(),
        minlength=NUM_CLASSES,
    )[:NUM_CLASSES]

    dist = {
        key: float(count) * 100.0 / pred.size
        for key, count in zip(CLASS_KEYS, counts)
    }

    # Generate segmentation mask
    mask = PALETTE[pred]

    # Generate overlay
    base = np.asarray(
        img.convert("RGB").resize(
            (SIZE, SIZE),
            Image.BILINEAR,
        )
    )

    overlay = (
        base * 0.55 + mask * 0.45
    ).astype(np.uint8)

    # Return prediction results
    return {
        "width": SIZE,
        "height": SIZE,
        "mask_png": png_b64(mask),
        "overlay_png": png_b64(overlay),
        "distribution": dist,
        "checkpoint": EXPECTED_CKPT,
        "inference_ms": ms,
    }
