# Technical Specification: Continuous Spatial Web Application & Remote Presenter Clicker

## 1. Core Vision & Paradigm Shift
This project is an **interactive spatial web application**, NOT a slide deck. There are NO "slides", NO "Slide 1 of 6" footers, and NO carousel steppers.

The application operates as a **Continuous Spatial Canvas** with a GPU-accelerated CSS 3D transform camera that smoothly translates and navigates between fixed interactive stations in a 3D coordinate space.

The presentation can be driven via laptop keyboard shortcuts OR remotely via a dedicated, mobile-optimized presenter clicker on Tyler's Google Pixel 10a (`clicker.html`), syncing commands through Firebase Realtime Database.

## 2. Division of Labor & Strict Rule on Styling
- **Lead Designer & Stylist:** Antigravity (Gemini). Antigravity will design all visual themes, color schemes, animations, and typography later.
- **Infrastructure & Logic Engineer:** Codex (OpenAI). Codex implements the spatial camera engine, remote clicker logic, Firebase command sync, interactive widget logic, and accessibility.
- **CRITICAL RULE FOR CODEX:** DO NOT apply finished visual themes, decorative styling, or custom color palettes. All components must be clean, semantic HTML wireframes with clear IDs, data attributes, and minimal functional CSS only.

## 3. Architecture & Components to Build

### A. The Presenter Stage (`index.html` + `src/presenter.js` + `src/spatial-camera.js`)
1. **Spatial 3D Viewport:**
   - Container `#stage-viewport` with 3D perspective.
   - World `#stage-world` with hardware-accelerated CSS `transform: translate3d(...) rotateY(...)`.
   - 5 Spatial Stations positioned in 3D coordinates:
     - `Station 1 (#station-1)`: Cognitive Metric Wireframe (Flynn Effect container).
     - `Station 2 (#station-2)`: Memory Experiment Sandbox (Interactive card container with a trigger button to simulate memory decay).
     - `Station 3 (#station-3)`: Lifetime Attention Drain Calculator (Interactive HTML range slider: `1.0` to `10.0` hrs/day; live output computing cumulative conscious years lost).
     - `Station 4 (#station-4)`: Friction Protocol (Interactive toggle button: Default OS state vs Biometric Shield state).
     - `Station 5 (#station-5)`: Action & Telemetry Hub (Dynamic QR code pointing to `/vote.html?room=ROOM_ID`, live point tally toward 20-pt goal, voter count, action breakdown, and goal achieved state).
2. **Camera Controls & Spatial Navigation:**
   - Predefined spatial coordinates for stations 1 through 5.
   - Navigation is **Forward / Backward ONLY** (no accidental drag or pinch-to-zoom).
   - Driven by:
     - Laptop Keyboard: `ArrowRight` / `Space` (Next), `ArrowLeft` (Prev), `KeyF` (Fullscreen), `KeyS` (Simulate incoming votes), `KeyR` (Reset board).
     - Remote Clicker: Real-time command stream from Firebase.
3. **HUD Overlay:**
   - Minimal status bar: Current station indicator (e.g. `STATION 1 / 5`), Firebase connection status, remote clicker link (URL to copy `/clicker.html?room=ROOM_ID`).
   - Hidden emergency controls (Fullscreen, Simulate, Reset).

### B. The Presenter Remote Clicker (`clicker.html` + `src/clicker.js`)
A mobile web client tailored for Tyler's Google Pixel 10a:
1. **Direct Room Connection:**
   - Opens via `/clicker.html?room=ROOM_ID`.
   - Connects to the active room via Firebase Realtime Database.
2. **Blind-Tap Tactile Controls:**
   - Large touch zones: `[ PREV ]` and `[ NEXT ]`.
   - Haptic vibration feedback on tap (`navigator.vibrate?.(50)`).
3. **Presenter Utilities:**
   - Running Speech Timer: Stopwatch counting up to 7–9 minutes with Start / Pause / Reset.
   - Current Station Display: Shows current active station name and index (synced with laptop).
   - Discreet action buttons:
     - `[ SIMULATE VOTES (S) ]`
     - `[ RESET BOARD (R) ]`
4. **Command Protocol:**
   - Sends commands (`next`, `prev`, `simulate`, `reset`) to Firebase at `rooms/${room}/commands`.
   - Laptop presenter listens and immediately executes the transition.

### C. The Audience Mobile Voter (`vote.html` + `src/voter.js`)
- Retain the existing, working mobile voting form:
  - Steppers for +1 (locked app), +3 (deleted app), +7 (deleted account).
  - Live calculated personal score.
  - Submit button to push ballot to Firebase.
  - Confirmation state.

### D. Real-Time Sync & Remote Command Engine (`src/sync.js` + `src/firebase-transport.js`)
1. Extend Firebase transport to handle remote presenter commands (`rooms/${room}/commands`).
2. Retain local fallback (`BroadcastChannel` / `localStorage`) for offline testing on a single machine.
3. Laptop presenter remains always controllable via physical keyboard as an instant fail-safe even if phone network drops.

## 4. Execution Steps for Codex
1. Refactor `index.html` to eliminate all slide carousel markup, "Slide 1 of 6" text, and carousel buttons. Replace with the 3D spatial viewport and stations 1–5.
2. Implement `src/spatial-camera.js` to manage the 3D camera navigation and coordinates.
3. Create `clicker.html` and `src/clicker.js` for the Google Pixel 10a remote clicker with haptics, timer, big tap zones, and command sync.
4. Update `src/sync.js` and `src/firebase-transport.js` to route remote clicker commands between phone and laptop.
5. Wire up the interactive widgets (Lifespan slider, Memory decay toggle, Friction toggle, Action Hub).
6. Verify unit tests (`npm test`) and build (`npm run build`).
7. Commit all changes and push to `main` to trigger the GitHub Pages deployment.
8. Output a clear summary for Antigravity explaining the DOM structure and hooks ready for visual design.
