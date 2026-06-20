# Ground Control Station Simulator

This is a **simulation-only** portfolio software project for demonstrating a Ground Control Station (GCS). It consists of a Rust/Axum backend and a React/TypeScript/Vite frontend.

**Important Safety Boundary:**
This project is simulation-only. It does not and should not contain real drone control, aircraft control, hardware control, targeting, interception, weapon logic, evasion logic, launch logic, or operational UAV control.

## Status

**DevOps Phase 1 Complete:** The project includes a clean local production/development setup using Docker, Docker Compose, and environment files.

## Environment Variables

This project uses `.env` files to manage configuration.
* `.env.example` at the root contains shared variables (used by Docker Compose).
* `.env.production.example` files show exactly what variables are needed for cloud deployment.
* `backend/.env.example` contains backend-specific configurations.
* `frontend/.env.example` contains frontend-specific configurations.

To use custom environment variables locally, copy the `.env.example` files to `.env` and modify as needed:
```bash
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### Key Local Variables:
* `GCS_PORT` (Backend): The port the backend listens on (default: `3001`).
* `VITE_API_BASE_URL` (Frontend): The base URL of the API (default: `http://localhost:3001`).
* `VITE_WS_URL` (Frontend): The WebSocket URL for telemetry (default: `ws://localhost:3001/ws/telemetry`).

### Key Production Variables:
* `DATABASE_URL` (Backend): Production SQLite path (e.g., `sqlite:///data/gcs_simulator.db`).
* `CORS_ALLOWED_ORIGINS` (Backend): Comma-separated frontend URLs (e.g., `https://your-frontend-domain.com`).
* `VITE_API_BASE_URL` (Frontend): Production backend API URL (e.g., `https://your-backend-domain.com`).
* `VITE_WS_URL` (Frontend): Production backend WebSocket URL (e.g., `wss://your-backend-domain.com/ws/telemetry`).

## How to Run Locally Without Docker

You will need **Rust (1.80+)** and **Node.js (20+)** installed.

1. **Start the Backend:**
   ```bash
   cd backend
   cargo run
   ```
   The backend will automatically create the `gcs_simulator.db` SQLite database using migrations and begin simulating telemetry data on `http://localhost:3001`.

2. **Start the Frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   The frontend will run on `http://localhost:5173`.

## How to Run with Docker Compose

Ensure you have Docker and Docker Compose installed.

From the root of the project:
```bash
docker compose up --build
```

* The backend will be exposed on `http://localhost:3001`. The database is automatically persisted using the `gcs_data` Docker volume.
* The frontend preview server will be exposed on `http://localhost:4173`.

*Note: You can stop the containers using `docker compose down`.*

## Testing

* **Backend Health:** Open `http://localhost:3001/health` in your browser. It should return a health check JSON object.
* **Frontend:** Open `http://localhost:5173` (if running locally) or `http://localhost:4173` (if using Docker). You should see the GCS dashboard.
* **WebSocket:** The frontend should automatically connect to the WebSocket upon loading. You can look at your browser's Network tab (filtering by "WS") to verify the telemetry stream is active.

## Deployment Guide

This repository is structured to easily deploy the **simulation-only** frontend and backend to portfolio-friendly cloud services.

### Backend Deployment (e.g., Render, Fly.io, Railway, VPS)
1. Point your cloud platform to the `backend/Dockerfile`.
2. Configure the following environment variables:
   * `GCS_HOST=0.0.0.0`
   * `GCS_PORT=3001` (Or map your provider's expected port)
   * `CORS_ALLOWED_ORIGINS=https://<your-frontend-domain.com>`
   * `DATABASE_URL=sqlite:///data/gcs_simulator.db`
3. Make sure you mount a persistent volume to `/data` if you want simulation event history to persist across redeploys. If you skip this, the SQLite database resets on every restart (which is acceptable for a simple demo).

### Frontend Deployment (e.g., Vercel, Netlify)
1. Point your cloud platform to the `frontend/` directory.
2. Build command: `npm run build`
3. Output directory: `dist`
4. Configure the following environment variables at **build time**:
   * `VITE_API_BASE_URL=https://<your-backend-domain.com>`
   * `VITE_WS_URL=wss://<your-backend-domain.com>/ws/telemetry`

### Verifying the Public Deployment

**Backend Checks:**
* Visit `https://<your-backend-domain.com>/health` and ensure you see a JSON health payload.

**Frontend Checks:**
* Open `https://<your-frontend-domain.com>`.
* Ensure the telemetry LINK status says **CONNECTED**.
* Check the browser console. If there are connection errors, see the troubleshooting section below.

### Deployment Checklist
Before finalizing your portfolio showcase, verify:
- [ ] Git status clean and changes pushed.
- [ ] Backend `/health` works publicly.
- [ ] Frontend URL opens and successfully loads.
- [ ] Frontend LINK status is CONNECTED.
- [ ] API is OK and subsystems report healthy.
- [ ] Operator command buttons work and send successful simulated commands.
- [ ] Event history log displays data.
- [ ] Replay sessions load.

## Troubleshooting

* **Ports already in use (Local):** If port 3001, 5173, or 4173 are already in use, update the `.env` files and ensure `VITE_API_BASE_URL` matches the new backend port.
* **CORS Blocked:** If the frontend is blocked from accessing the backend API, ensure `CORS_ALLOWED_ORIGINS` on the backend matches the frontend's deployment URL exactly.
* **Mixed Content (ws:// vs wss://):** When your frontend is deployed with HTTPS, your WebSocket connection must use `wss://` instead of `ws://` in `VITE_WS_URL`.
* **Backend Sleeping:** Free cloud tiers (like Render free tier) spin down after inactivity. The first request may take 30-50 seconds to wake the backend up.
* **SQLite Not Persisted:** If replay events disappear after deploying an update to the backend, it means your cloud provider restarted the container and you didn't mount a persistent disk to `/data`.
* **Wrong API/WS URLs:** Verify that `VITE_API_BASE_URL` and `VITE_WS_URL` do not end with trailing slashes, except where intended.

## Next Steps

Now that the application is deployment-ready, the final phase will involve **Video & Portfolio Polish**. This includes adding screenshots, screen recordings, UI gloss, and final repository styling to showcase the system effectively on a resume or portfolio. session.

## Replay API (Phase 5)

*   `GET /events` - Returns latest persisted system events.
*   `GET /replay/sessions` - Returns a list of all simulation sessions.
*   `GET /replay/{session_id}` - Returns all events for a specific simulation session.
