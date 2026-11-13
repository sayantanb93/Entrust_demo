# Printer Console Demo

A standalone full-stack demo based on the provided UI references. It includes a React/TypeScript frontend and a FastAPI backend with seeded sample printer and credential data. The interface uses original generic branding and illustrations; it does not call the real identity or printer services.

## Requirements

- Node.js 18+
- Python 3.10+

## Run locally

From this directory, install frontend dependencies with `npm install`. In one terminal, create/activate a Python virtual environment, install `requirements.txt`, and run the API with `uvicorn backend.main:app --reload --port 8000`. In another terminal, run `npm run dev`. Open `http://localhost:5173`.

Vite proxies `/api` requests to `http://127.0.0.1:8000`. API docs are available at `http://localhost:8000/docs`.

Run backend tests after installing `requirements-dev.txt` with `python -m pytest -q`.

## Demo flow

The initial screen is a mock User ID sign-in. Enter any user ID, then proceed through the OTP, Alternative Authentication, or simulated push-approval views. No real code is sent or validated. After login, use the left navigation to open Credentials and Printers. Select a printer to view its dashboard; select Device Details to inspect product data and the scrollable Versions list.

## API

- `GET /api/health`
- `GET /api/printers`
- `GET /api/printers/{printer_id}`
- `GET /api/printers/{printer_id}/details`
- `GET /api/credentials`

Data currently lives in in-memory demo fixtures in `backend/main.py`; restarting the API resets it. Replace those fixtures with a database only if persistence is needed.
