# Antigravity design handoff

Own the visual treatment, type, palette, motion, imagery and narrative of the COMM 1010 presentation. The presenter, audience voter, and phone clicker are functional wireframes.

## Presenter stage

- `#presenter-lobby` holds the Start button, clicker QR and connection states. `#emergency-controls` holds the pairing link, station navigation, simulation, reset and animation controls. Preserve the paired clicker QR's white margin.
- `#stage-viewport` fills the viewport and provides perspective. `#stage-world` contains `#station-1` through `#station-15`, each marked with `data-station`. Style station interiors, leaving the world and station transforms under camera control. The active station has `data-active`. The other stations use `inert`.
- `#flynn-effect` holds the cognitive metric. `#memory-experiment[data-state]` switches between `baseline` and `decayed`. Add `data-memory-card` to each example item and `data-decays` to the items hidden by the simulation.
- `#lifespan-hours` and `#lifespan-result` form the attention calculator. `#friction-protocol[data-state]` switches between `default` and `shielded`.
- `#action-hub[data-goal]` switches between `pending` and `achieved`. `#action-instructions` holds the QR and voting link. `#action-telemetry` holds the tally, goal progress, and action breakdown. Preserve the QR's full white margin and the plain voting link.

Station headings are shared with the clicker. Keep the heading IDs, focus behavior, reduced-motion support, and live feedback. Keep the viewport and world transforms on their existing elements so all stations retain their relative positions.

## Mobile routes

- `clicker.html` uses `[data-command]` buttons and `#speech-timer`, with `data-running` and `data-target` for elapsed time state. `#clicker-navigation` offers two large tap zones. Keep them reachable and visually distinct.
- `vote.html` uses `[data-action]` fieldsets and `[data-step]` buttons. Preserve visible labels, minimum touch sizes, focus visibility, and confirmation behavior.

See [.agents/ROLES.md](.agents/ROLES.md), [.agents/ARCHITECTURE.md](.agents/ARCHITECTURE.md), and [.agents/WORKFLOW.md](.agents/WORKFLOW.md) for responsibilities, synchronization, and rehearsal.
