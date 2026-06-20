# Ground Control Station Simulator

This is a **simulation-only** portfolio software project for demonstrating a Ground Control Station (GCS). It consists of a Rust/Axum backend and a React/TypeScript/Vite frontend.

**Important Safety Boundary:**
This project is simulation-only. It does not and should not contain real drone control, aircraft control, hardware control, targeting, interception, weapon logic, evasion logic, launch logic, or operational UAV control.

## Status

**DevOps Phase 1 Complete:** The project includes a clean local production/development setup using Docker, Docker Compose, and environment files.

## Environment Variables

This project uses `.env` files to manage configuration.
* `.env.example` at the root contains the shared variables (used by Docker Compose).
* `backend/.env.example` contains backend-specific configurations.
* `frontend/.env.example` contains frontend-specific configurations.

To use custom environment variables, copy the `.env.example` files to `.env` and modify as needed:
```bash
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### Key Variables:
* `GCS_PORT` (Backend): The port the backend listens on (default: `3001`).
* `VITE_API_BASE_URL` (Frontend): The base URL of the API (default: `http://localhost:3001`).
* `VITE_WS_URL` (Frontend): The WebSocket URL for telemetry (default: `ws://localhost:3001/ws/telemetry`).

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

## Troubleshooting

* **Ports already in use:** If port 3001, 5173, or 4173 are already in use by another application, the servers will fail to start. Update the `.env` files to use different ports and ensure the frontend's `VITE_API_BASE_URL` matches the new backend port.
* **CORS Issues:** The backend is configured to allow `Any` origin, which works great for local development. If you encounter CORS errors, double-check that your frontend is pointing to the correct backend URL (e.g., `http://localhost:3001`) and not an incorrect port or HTTPS.
* **WebSocket Connection Fails:** Ensure the backend is fully running before starting the frontend. Check the `VITE_WS_URL` in your frontend environment variables to make sure it matches your backend address.
* **Node/Rust Version Errors:** 
  * If `cargo run` fails to compile, update Rust using `rustup update`.
  * If `npm install` or `npm run dev` fails, ensure you are using Node.js v20 or later. Use `nvm install 20` or equivalent.

## Replay API (Phase 5)

*   `GET /events` - Returns latest persisted system events.
*   `GET /replay/sessions` - Returns a list of all simulation sessions.
*   `GET /replay/{session_id}` - Returns all events for a specific simulation session.
