# Architecture

Vite builds three independent HTML entry points with shared wireframe styles and synchronization. Relative asset paths support GitHub Pages project sites and local previews.

| Route | Responsibilities |
| --- | --- |
| `index.html` | A CSS 3D camera, five stations, keyboard controls, interactive widgets, QR, and live voting telemetry |
| `clicker.html` | Paired remote navigation, station readback, haptic taps, speech timer, and board commands |
| `vote.html` | Audience action steppers, ballot scoring, submission, and confirmation |

## Spatial stage

`src/spatial-camera.js` places all five stations inside `#stage-world` and applies the inverse station pose to the world to move the camera. The viewport clips the world, and the active station's heading receives focus on a navigation command. Inactive stations are inert. The camera respects reduced motion and only advances or reverses one station per command.

## Ballots and rounds

A ballot contains integer counts `locked`, `fasted` and `deleted`, each from 0 to 10. A valid ballot records at least one action. The corresponding point weights are 1, 3 and 7. The board derives points, voter count and per-action totals from ballots. Each reset starts a fresh round and makes earlier votes ineligible for that round.

`src/sync.js` exposes a snapshot subscription plus submission, simulation and reset operations. Its journal uses separate localStorage keys per room, round and ballot, with storage events and BroadcastChannel for cross-tab updates. When durable browser storage is unavailable, the open tab keeps its state in memory. Web Locks serialize local submissions where supported.

## Cross-device transport

When Firebase is configured, the presenter uses a persistent, random room ID on that browser and origin, and the QR includes the ID. A modular adapter uses anonymous Firebase Auth and Realtime Database listeners. It subscribes to room metadata and either the active round's roster (presenter) or the current user's ballot (voter). The transport commits a ballot once per Firebase user and round. Database rules enforce the count bounds, active round, per-user writes, and presenter-only reset. Participants can read their own ballot. The presenter can read the round roster.

The presenter keeps the last received board in browser storage and can simulate arrivals without a network. A reset clears the visible board immediately and is sent to Firebase when connected. Simulated ballots stay in the local journal. Voters receive confirmation after a remote commit or a previously confirmed ballot. If a remote attempt cannot be confirmed, they can retry safely. Without Firebase configuration, both routes work locally within a shared browser profile and origin.

## Presenter control

The HUD pairs the clicker using a per-page random key in the URL fragment and the room ID in the query string. Share this link with the presenter only. A presenter reload starts a new pairing.

- The presenter writes station index and title to `rooms/{room}/control/{key}`. An authenticated clicker can subscribe to that exact key.
- The clicker appends commands to `rooms/{room}/commands/{key}`. The rules require a live pairing and a short expiry. Only the room owner can read and clear the queue.
- The presenter handles commands as they arrive and clears consumed entries. Firebase removes the published station and command queue when the presenter disconnects.
- The presenter checks that Firebase denies listing the control and command collections before it publishes a pairing.
- Same-browser clickers with a live local presenter use transient BroadcastChannel messages. Storage events provide the same behavior when BroadcastChannel is unavailable. The physical keyboard drives the camera directly.
