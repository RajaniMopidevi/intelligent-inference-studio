# MARS // Terrain Intelligence

Interactive web app for an AI4Mars terrain segmentation model (DeepLabV3+, ResNet-50, 4 classes).
Independent project using the public AI4Mars dataset — not an official NASA system.

## Architecture
```
Browser ──► web app server function (scanTerrain) ──► FastAPI /predict (PyTorch)
```
The browser never sees the backend URL: it lives in the `INFERENCE_API_URL` secret, read only on the server.

## 1. Inference backend (`backend/`)
1. Get the baseline checkpoint `mars_resume_20261114T163234Z_step_00000622.pth` (~306 MB) from your training outputs
   or a private bucket. Never commit it. Do **not** use the oversampling checkpoint.
2. Put it at `backend/checkpoints/` or set `CHECKPOINT_PATH`; alternatively set `CHECKPOINT_URL` to auto-download on first start.
3. To reuse your repo's exact model code, copy/install it next to `app.py` and set `MODEL_FACTORY=your_module:build_model`.
   Otherwise the default is `segmentation_models_pytorch.DeepLabV3Plus("resnet50", classes=4)`; loading uses `strict=True`, so a mismatch fails loudly instead of silently.
4. Run:
   ```bash
   cd backend && python -m venv .venv && source .venv/bin/activate
   pip install -r requirements.txt
   uvicorn app:app --host 0.0.0.0 --port 8000
   curl -F "file=@sample.jpg;type=image/jpeg" http://localhost:8000/predict
   ```
   Or `docker build -t ai4mars-api backend` and host it (Render, Fly.io, Railway, Hugging Face Spaces, a GPU VM…).
5. Optional: set `API_KEY` on the backend.

### API
- `GET /health` → `{status, device}`
- `POST /predict` (multipart `file`, JPG/PNG ≤10 MB, optional `x-api-key` header) →
  `{width, height, mask_png, overlay_png (base64 PNG), distribution: {soil, bedrock, sand, big_rock} (%), checkpoint, inference_ms}`
- Preprocessing matches training: RGB → 512×512 → ImageNet mean/std; `model.eval()` + `torch.inference_mode()`.

## 2. Connect the web app
Add secrets `INFERENCE_API_URL` (e.g. `https://your-api.example.com`) and, if used, `INFERENCE_API_KEY`.

## 3. Sample missions
Export real validation triplets into `public/samples/` and list them in `public/samples/manifest.json`:
```json
[{ "id": "s1", "title": "Curiosity NAVCAM – sol 1234", "image": "/samples/s1.jpg", "groundTruth": "/samples/s1_gt.png", "prediction": "/samples/s1_pred.png" }]
```
Nothing is shown until real outputs are added.
