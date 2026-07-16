# Industrial Box Inspection System

Web application for factory production line box inspection using QR scanning, multi-angle image capture, and AI classification (LOCK/UNLOCK).

## Architecture

| Service | Port | Tech |
|---------|------|------|
| Frontend | 3100 | Next.js + Tailwind CSS |
| Backend | 3101 | Express + Prisma |
| AI Service | 8000 | Python FastAPI |
| Database | 1433 | Microsoft SQL Server |

```
iPad → Frontend → Backend → AI Service
                      ↓
                    MSSQL
```

## Quick Start (Local Development)

### Prerequisites

- Node.js 20+
- Python 3.11+
- Docker Desktop (for MSSQL)

### 1. Start Database + AI Service (Docker)

```bash
docker compose up mssql ai-service -d
```

Wait ~30 seconds for MSSQL to become healthy.

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env   # if .env doesn't exist
npx prisma db push
npx prisma db seed
npm run dev
```

### 3. AI Service (if not using Docker)

```bash
cd ai-service
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 4. Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local   # if .env.local doesn't exist
npm run dev
```

Open http://localhost:3100

### iPhone / iPad Testing

iPhone Safari **requires HTTPS** for camera access. Use the built-in HTTPS dev server:

```bash
# 1. Start backend (Docker or local)
docker compose up -d

# 2. Start frontend with HTTPS (from project root)
npm run dev:iphone
```

Terminal shows URLs like:
```
- Local:   https://localhost:3100
- Network: https://192.168.x.x:3100
```

**On iPhone (same Wi-Fi):**
1. Open `https://192.168.x.x:3100` in Safari
2. Tap **Advanced → Proceed** if certificate warning appears (self-signed dev cert)
3. Tap camera box → **Allow** camera
4. Scan QR or **type Lot No** manually
5. Use **Camera** button on each angle to take photos

API calls go through Next.js proxy (`/api/*` → backend) — no separate backend URL needed on phone.

**If camera still blocked:** type Lot No manually and use Upload for images.

## Full Docker Deployment

```bash
docker compose up --build
```

Runs everything — MSSQL, AI service, backend, and frontend — in containers on a shared Docker network. Open http://localhost:3100.

## API Endpoints

### GET /api/box-types

Returns available box types for dropdown.

### POST /api/inspection/predict

- Content-Type: `multipart/form-data`
- Field: `image` (file)
- Response: `{ "result": "LOCK", "path": "angle_xxx.jpg" }`

### POST /api/inspection

```json
{
  "lot_no": "LOT001",
  "box_type": "Type A",
  "images": [
    { "path": "angle_xxx.jpg", "result": "LOCK" },
    { "path": "angle_yyy.jpg", "result": "LOCK" },
    { "path": "angle_zzz.jpg", "result": "UNLOCK" },
    { "path": "angle_aaa.jpg", "result": "LOCK" }
  ]
}
```

Response includes `overall_result`: PASS (all LOCK) or FAIL (any UNLOCK).

## AI Model Integration

The AI service ships with a **mock predictor** for development. To use your trained model:

1. Place model file in `ai-service/models/box_lock_model.pt` (or `.onnx`)
2. Add inference dependency to `ai-service/requirements.txt`:
   - PyTorch: `torch torchvision`
   - ONNX: `onnxruntime`
3. Implement `BoxLockPredictor.predict()` in `ai-service/predictor.py`
4. Set environment variable `AI_MOCK=false`
5. Restart AI service

Test:

```bash
curl -F "image=@test.jpg" http://localhost:8000/predict
```

No frontend or backend changes needed.

## Database Schema

**box_types** — dropdown options (seeded: Type A, B, C)

**box_inspection** — inspection records with 4 images, 4 results, overall PASS/FAIL

## Project Structure

```
TSL_AI/
├── frontend/       Next.js iPad UI
├── backend/        Express REST API + Prisma
├── ai-service/     Python FastAPI inference
└── docker-compose.yml
```
