# Reclaim

An interactive web application and live audience telemetry system for demonstrating algorithmic attention traps, visualizing cognitive time loss, and coordinating real-time collective action.

[![Deploy](https://github.com/khakis23/comm1010-presentation/actions/workflows/deploy.yml/badge.svg)](https://github.com/khakis23/comm1010-presentation/actions/workflows/deploy.yml)

## Overview

Reclaim replaces conventional static presentation slides with an interactive, full-viewport web application designed for live demonstrations. It couples a presenter stage with a real-time mobile interface (`/vote.html`) allowing audiences to log actions on their own devices with sub-second synchronization.

- **Live Stage:** [https://khakis23.github.io/comm1010-presentation/](https://khakis23.github.io/comm1010-presentation/)
- **Mobile Telemetry Input:** [https://khakis23.github.io/comm1010-presentation/vote.html](https://khakis23.github.io/comm1010-presentation/vote.html)

---

## Tech Stack & Architecture

- **Runtime & Bundler:** Vite + Vanilla ES Modules (zero-bloat, sub-50ms HMR).
- **Presentation Engine:** Keyboard/touch-driven full-bleed stage transitions with hardware-accelerated transforms.
- **Dynamic Telemetry & Sync:**
  - `BroadcastChannel` + `localStorage` event pump for instant local multi-window and offline testing.
  - Pluggable WebSocket / Firebase Realtime transport layer for remote multi-device ingestion.
  - Client-side dynamic QR code generation encoding session room identifiers.
- **Fail-Safe Offline Simulation:** Built-in presenter telemetry simulation (`KeyS`) generating realistic staggered incoming action streams without network dependency.

---

## Quickstart

Requires **Node.js 22.12+**.

```bash
# Clone and install dependencies
git clone https://github.com/khakis23/comm1010-presentation.git
cd comm1010-presentation
npm ci

# Start local dev server
npm run dev
```

- **Presenter Stage:** [http://localhost:5173/](http://localhost:5173/)
- **Mobile Client:** [http://localhost:5173/vote.html](http://localhost:5173/vote.html)

---

## Testing Real-Time Telemetry

1. Open `http://localhost:5173/` in your main browser window.
2. Open `http://localhost:5173/vote.html` in a second window or mobile viewport (same profile).
3. On the presenter stage, navigate to the **Action Hub** (Stage 5) to see the live-rendered session QR code.
4. Advance to the **Live Telemetry Board** (Stage 6) and press `R` to ensure a clean board.
5. In the mobile voter window, increment actions (+1, +3, +7) and click **Submit Points to the Board**.
6. The presenter board updates instantly without page reload via the cross-tab sync bus.

---

## Presenter Keybindings

| Key | Function |
| :--- | :--- |
| `→` / `Space` | Advance to next stage |
| `←` | Return to previous stage |
| `F` | Toggle native fullscreen |
| `S` | **Offline Telemetry Simulator:** Triggers realistic incoming audience submissions |
| `R` | **Reset Telemetry Board:** Clears active tally and opens a fresh round |

---

## Action Scoring Engine

| Action | Points | Impact |
| :--- | :---: | :--- |
| **Biometric Isolation** | +1 | App locked behind Face ID / Secure Folder; breaks subconscious muscle-memory loops. |
| **7-Day Deletion** | +3 | Full device app removal; eliminates daily proximity triggers. |
| **Account Termination** | +7 | Permanent account purge; total reclamation of attention capital. |

---

## Deployment & CI/CD

Pushes to `main` trigger a GitHub Actions workflow (`.github/workflows/deploy.yml`) that validates syntax, executes unit tests, builds the production bundle, and deploys directly to GitHub Pages.
