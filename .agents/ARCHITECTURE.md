# Architecture

Vite builds two independent HTML entry points with shared scoring, wireframe styles and synchronization. Relative asset paths support GitHub Pages project sites and local previews. The QR encodes the voter URL next to the current deck, with the current room ID.

| Route | Responsibilities |
| --- | --- |
| `index.html` | Six slide sections, arrow and Space navigation, touch swipes, fullscreen, QR, simulation, reset and results |
| `vote.html` | Accessible action steppers, local score, submission and confirmation |

## Ballots and rounds

A ballot contains integer counts `locked`, `fasted` and `deleted`, each from 0 to 10. A valid ballot records at least one action. The corresponding point weights are 1, 3 and 7. The board derives points, voter count and per-action totals from ballots. Each reset starts a fresh round and makes earlier votes ineligible for that round.

`src/sync.js` exposes a snapshot subscription plus submission, simulation and reset operations. Its journal uses separate localStorage keys per room, round and ballot, with storage events and BroadcastChannel for cross-tab updates. When durable browser storage is unavailable, the open tab keeps its state in memory. Web Locks serialize local submissions where supported.

## Cross-device transport

When Firebase is configured, the presenter uses a persistent, random room ID on that browser and origin, and the QR includes the ID. A modular adapter uses anonymous Firebase Auth and Realtime Database listeners. It subscribes to room metadata and either the active round's roster (presenter) or the current user's ballot (voter). The transport commits a ballot once per Firebase user and round. Database rules enforce the count bounds, active round, per-user writes, and presenter-only reset. Participants can read their own ballot. The presenter can read the round roster.

The presenter keeps the last received board in browser storage and can simulate arrivals without a network. A reset clears the visible board immediately and is sent to Firebase when connected. Simulated ballots stay in the local journal. Voters receive confirmation after a remote commit or a previously confirmed ballot. If a remote attempt cannot be confirmed, they can retry safely. Without Firebase configuration, both routes work locally within a shared browser profile and origin.
