# MARS // Terrain Intelligence

Interactive web app for an AI4Mars terrain segmentation model (DeepLabV3+, ResNet-50, 4 classes).
Independent project using the public AI4Mars dataset — not an official NASA system.

## Architecture
```
Browser ──(FormData "file")──► FastAPI /predict (PyTorch)   ·   /health polled on the Scanner page
```
API client: `src/lib/inference-api.ts` (timeouts, offline/CORS errors, base64 PNG decoding). No secrets live in the frontend.

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
5. The checkpoint, `.venv` and caches are git-ignored. Use `CHECKPOINT_URL` (private/signed link) to download it on the host.

### API
- `GET /health` → `{status, device}`
- `POST /predict` (multipart `file`, JPG/PNG ≤10 MB, optional `x-api-key` header) →
  `{width, height, mask_png, overlay_png (base64 PNG), distribution: {soil, bedrock, sand, big_rock} (%), checkpoint, inference_ms}`
- Preprocessing matches training: RGB → 512×512 → ImageNet mean/std; `model.eval()` + `torch.inference_mode()`.

## 2. Connect the web app
Set `VITE_API_BASE_URL` (see `.env.example`):
- Local: `VITE_API_BASE_URL=http://localhost:8000` in `.env`, then run the web app and the backend.
- Production: set it to your deployed HTTPS backend URL and rebuild. Make sure the backend's CORS allows your site's origin.

`VITE_*` values are public by design — never put keys in them.

## Local test
1. Start the backend (section 1) and confirm `curl http://localhost:8000/health` shows `"status":"ok"`.
2. Start the web app, open `/scanner`: the badge should say "online · model loaded".
3. Upload an AI4Mars JPG/PNG → Scan Terrain → switch Original / Mask / Overlay, check percentages and inference time.

## 3. Sample missions
Export real validation triplets into `public/samples/` and list them in `public/samples/manifest.json`:
```json
[{ "id": "s1", "title": "Curiosity NAVCAM – sol 1234", "image": "/samples/s1.jpg", "groundTruth": "/samples/s1_gt.png", "prediction": "/samples/s1_pred.png", "overlay": "/samples/s1_overlay.png", "distribution": {"soil": 52.1, "bedrock": 30.4, "sand": 15.2, "big_rock": 2.3}, "description": "Short scene description" }]
```
Nothing is shown until real outputs are added.
