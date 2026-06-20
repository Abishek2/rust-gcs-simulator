# GCS Simulator Operator Interface (Simulation-Only)

Welcome to the safe, simulation-only Frontend Operator Interface for the **Rust Ground Control Station Simulator** portfolio project. This dashboard serves as an interactive telemetry console simulating flight metrics, payload cell launches, video streams, and command confirmations.

## ⚠️ Important Safety Notice
This interface is **purely for local simulation**. It contains no real UAV controls, targeting sensors, or physical autopilot triggers. It is built as a portfolio-grade demonstration of real-time front-end system interfaces.

## 🚀 Key Features (Phase 1)
- **Interactive Tactical Radar:** A canvas-based radar scope centering the primary vehicle. Renders moving tracks color-coded by classification (friendly, hostile, neutral, unknown). Clicking targets selects them for detailed inspection.
- **Operator Cockpit Instrumentation:** Custom-drawn telemetry widgets displaying altitude tapes, flight speeds, heading directions, and battery parameters. Features a scrolling visual compass band.
- **Simulated Multi-Cell Launcher:** Visualizes 6 launcher cells tracking cell status (LOADED, EMPTY, FIRED, ARMED) and temperatures. Implements strict client-side safety interlocks: firing triggers are disabled unless the simulation key is inserted and the safety switch is toggled.
- **Live Video Stream Simulation:** Simulates camera feed telemetry. Renders an animated flight HUD (Heads-Up Display) overlaying active reticle locks. Supports connection degraded states (rendering digital scanlines) and link lost state (rendering animated television static noise).
- **Diagnostics Monitor:** Plots host resource charts tracking simulated CPU, Memory, Disk, and Network IO packet rates.
- **Flight Event Logs:** Chronologically appends simulated warnings, errors, and system changes with severity indicators and filter tags.
- **Flight Replay Terminal:** Allows browsing mock flight logs, seeking through timelines via scrubs, and adjusting playback speeds (1x, 2x, 5x).

---

## 🛠️ Stack & Technology
- **Framework:** React + TypeScript (Vite bundler)
- **Styling:** Custom CSS Grid & tactical theme tokens
- **Rendering:** HTML5 Canvas (smooth sweeps and vectors)

---

## 📦 Getting Started

### Prerequisites
- Node.js LTS
- Fast Node Manager (`fnm`) (optional)

### Setup & Run
1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Boot the development server:
   ```bash
   npm run dev
   ```
4. Build client assets:
   ```bash
   npm run build
   ```
