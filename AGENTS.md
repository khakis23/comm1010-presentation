# COMM 1010 presentation

This Vite project supports a 7–9 minute call-to-action speech about reclaiming digital agency. The presenter opens `index.html`, the phone opens `clicker.html` via the presenter’s pairing link, and the audience opens `vote.html` via the Action Hub QR code. The classroom goal is 20 points.

## Responsibilities

Codex owns the repository, CI, semantic HTML, accessibility, interactions, QR generation, voting and synchronization. Antigravity (Gemini) owns visual design, themes, typography, motion and final speech or station copy. Codex keeps CSS to functional wireframes, reset rules, and accessible controls. Preserve the page landmarks, station IDs, form labels, live announcements, focus behavior and JavaScript hooks during design changes.

## Project guide

- [.agents/ROLES.md](.agents/ROLES.md) defines the handoff.
- [.agents/ARCHITECTURE.md](.agents/ARCHITECTURE.md) describes the routes, scoring and sync protocol.
- [.agents/WORKFLOW.md](.agents/WORKFLOW.md) covers local development, voting setup and deployment.
- [GEMINI.md](GEMINI.md) is the design brief for Antigravity.

Use Node 22.12+ and run `npm ci`, `npm run dev`, `npm test`, and `npm run build`. Use `npm run preview` to rehearse from the built site. Keep public Firebase web configuration in `.env.local` or the documented repository variable.
