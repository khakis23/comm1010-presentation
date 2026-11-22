# Project Brief: COMM1010 Call-to-Action Presentation & Real-Time Voting System

## 1. Project Overview & Goal
This repository powers Tyler's final presentation in COMM 1010: a 7–9 minute Call-to-Action speech focused on reclaiming digital agency from predatory social media apps. 

Instead of traditional PowerPoint slides, Tyler will present from this web application running on his laptop (and deployed to GitHub Pages), featuring:
1. A presentation slide deck with keyboard controls (arrows/space) and full-screen view.
2. A live QR code on screen directing audience members (using iPhones or Android devices) to a mobile voting page (`/vote.html`).
3. An audience participation counter where students log their actions (+1 pt for locking an app behind Face ID / Secure Folder, +3 pts for deleting an app for a 7-day fast, +7 pts for deleting an account).
4. A live results screen on the presentation deck that aggregates points in real-time towards a classroom goal (Target: 20 points).
5. A bulletproof offline safety net (keyboard shortcut like 's') to simulate realistic audience submissions if the classroom Wi-Fi fails.

## 2. Division of Labor & Strict Rules
- **Lead Designer & Director:** Antigravity (Gemini). Antigravity owns all visual design, themes, typography, color palettes, animations, and narrative speech text.
- **Infrastructure & Logic Engineer:** Codex (OpenAI). Codex owns repository setup, build tools, CI/CD, state management, QR code generation, mobile touch logic, data synchronization, and test reliability.
- **CRITICAL RESTRICTION ON CODEX:** Codex MUST NOT write major visual design elements, elaborate decorative styling, or final CSS presentation themes. All HTML elements must be semantic, accessible wireframes with clear IDs and classes so Antigravity can style them later. Use minimal, functional reset/wireframe CSS only.

## 3. Required Environment Setup
Codex must create:
1. `AGENTS.md` — The canonical instruction file for Codex CLI, documenting the project, architecture, command workflows, and the strict division of labor.
2. `GEMINI.md` — The complementary instruction file for Antigravity / Gemini.
3. `.agents/` directory containing:
   - `.agents/ROLES.md` — Detailed definition of roles and boundaries.
   - `.agents/ARCHITECTURE.md` — System architecture, data flow, routes, and sync protocols.
   - `.agents/WORKFLOW.md` — Build, run, test, and deployment steps.

## 4. Git & GitHub Setup
1. Initialize a git repository in this directory (`presentation/`).
2. Create a public GitHub repository under account `khakis23` named `comm1010-presentation` using `gh repo create khakis23/comm1010-presentation --public --source=. --remote=origin --push`.
3. Set up a GitHub Actions workflow in `.github/workflows/deploy.yml` that builds the project and deploys it to GitHub Pages on every push to `main`.

## 5. Web Application & Voting System Implementation
Use a modern, ultra-fast, zero-bloat stack: **Vite** (Vanilla JavaScript or TypeScript).

### Routes & Structure:
- `index.html` (Presenter View):
  - Presentation container with discrete slide sections (`#slide-1`, `#slide-2`, etc.).
  - Slide navigation system (Keyboard: `ArrowRight`, `ArrowLeft`, `Space`, `KeyF` for fullscreen; Touch swipe support).
  - Slide deck outline:
    - Slide 1: Attention / Cognitive Impact Hook wireframe.
    - Slide 2: Memory Experiment wireframe (YouTube vs Short-form).
    - Slide 3: 11-Year Glass Rectangle Stat wireframe.
    - Slide 4: Real-world Before & After Stories wireframe.
    - Slide 5: The Call to Action & Dynamic QR Code wireframe (dynamically renders QR code pointing to the live voter URL).
    - Slide 6: Live Goal Reveal wireframe (Goal: 20 Points; displays live total points, voter count, breakdown, and "Goal Achieved" state).
  - Presenter Features:
    - Offline safety net: Pressing `KeyS` simulates realistic incoming votes (+1, +3, etc.) gradually hitting ~28–34 points.
    - Reset: Pressing `KeyR` resets the live counter.
    - Current slide indicator and presentation progress bar.

- `vote.html` (Mobile Voter View):
  - Optimized for iOS (Safari) and Android (Chrome) touch screens.
  - Three interactive steppers:
    - Apps locked behind Face ID / Secure Folder (+1 pt each)
    - Apps deleted for 7-day fast (+3 pts each)
    - Accounts permanently deleted (+7 pts each)
  - Live local point counter: "Your Score: X Points".
  - Action button: "SUBMIT POINTS TO THE BOARD".
  - Confirmation screen after submission preventing duplicate spam while confirming submission.

- `src/sync.js` (Real-Time Sync Engine):
  - Hybrid synchronization layer:
    - Local / Cross-tab sync: `BroadcastChannel` + `localStorage` (works instantly for testing and offline).
    - Remote sync abstraction: A clean event-driven sync interface capable of connecting to a remote endpoint (e.g. Firebase Realtime DB, Supabase, or a lightweight free pubsub/REST endpoint) when configured, and falling back gracefully without crashing.
  - Generates QR code using a lightweight client library (e.g. `qrcode` or `qrcode-generator`).

## 6. Execution Steps for Codex
1. Read this briefing.
2. Create `AGENTS.md`, `GEMINI.md`, and `.agents/` documentation.
3. Scaffold Vite project with `package.json`, `vite.config.js`, `index.html`, `vote.html`, and `src/`.
4. Install necessary dependencies (e.g., `qrcode`, `vite`).
5. Implement presenter slide logic, QR code generator, voter mobile interface, and sync engine.
6. Verify local build runs without errors (`npm run build`).
7. Initialize git, commit all files, create GitHub repository `khakis23/comm1010-presentation`, push to main, and configure GitHub Pages deployment.
8. Output a concise summary of the architecture and instructions for Antigravity to begin styling.
