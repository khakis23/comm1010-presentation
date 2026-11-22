# Reclaim

An interactive web application and live audience telemetry system for demonstrating algorithmic attention traps, visualizing cognitive time loss, and coordinating real-time collective action.

[![Deploy](https://github.com/khakis23/comm1010-presentation/actions/workflows/deploy.yml/badge.svg)](https://github.com/khakis23/comm1010-presentation/actions/workflows/deploy.yml)

## Overview

Reclaim replaces conventional static presentation slides with an interactive, full-viewport web application designed for live demonstrations. It couples a five-station presenter stage with a paired phone clicker (`/clicker.html`) and a live audience voting page (`/vote.html`).

- **Live Stage:** [https://khakis23.github.io/comm1010-presentation/](https://khakis23.github.io/comm1010-presentation/)
- **Mobile Telemetry Input:** [https://khakis23.github.io/comm1010-presentation/vote.html](https://khakis23.github.io/comm1010-presentation/vote.html)

---

## Tech Stack & Architecture

- **Runtime & Bundler:** Vite + Vanilla ES Modules (zero-bloat, sub-50ms HMR).
- **Presentation Engine:** A CSS 3D camera with keyboard or paired phone control.
- **Dynamic Telemetry & Sync:**
  - `BroadcastChannel` + `localStorage` event pump for instant local multi-window and offline testing.
  - Firebase Realtime Database for cross-device voting and presenter commands.
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
- Open or copy the presenter clicker pairing link in the stage HUD.
- Scan the QR code or follow the audience voting link at Station 5.

---

## Testing Real-Time Telemetry

1. Open `http://localhost:5173/` in your main browser window.
2. Open the paired clicker link in a second tab and use **Next** to reach the **Action and Telemetry Hub** at Station 5.
3. Open the voting link in another tab. Press `R` on the presenter to start a fresh round.
4. In the voter tab, increment actions (+1, +3, +7) and click **Submit Points to the Board**. The tally updates in the hub.

For cross-device rehearsal, configure Firebase and publish the database rules. See [.agents/WORKFLOW.md](.agents/WORKFLOW.md).

---

## Presenter Keybindings

| Key | Function |
| :--- | :--- |
| `→` / `Space` | Advance to next station |
| `←` | Return to previous station |
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
