# Workflow

## Run and rehearse

1. Run `npm ci` and `npm run dev`. Open the presenter and its voting link in two tabs in the same browser profile. Each round accepts one vote per browser identity.
2. Use Left or Right Arrow and Space to navigate, F for fullscreen, S to simulate a classroom response, and R to clear the board and open a new round. Touch users can swipe or use the navigation buttons.
3. Run `npm test` and `npm run build`. Run `npm run preview` to rehearse from the built app. For an offline rehearsal, launch the local preview before presenting and use its simulation.

## Connect audience phones

1. In a Firebase project, register a Web app, enable Anonymous Authentication, and create a Realtime Database in locked mode.
2. Publish [database.rules.json](../database.rules.json) contents from the database's Rules tab or run `firebase deploy --only database --project YOUR_PROJECT_ID` using the Firebase CLI from this directory.
3. Copy [.env.example](../.env.example) to `.env.local` and set `VITE_FIREBASE_CONFIG` to the Web app's JSON configuration, including `databaseURL`. Use another browser profile or phone for voting and verify its submission reaches the presenter. The presenter's browser owns the generated room.
4. To use the Firebase project on GitHub Pages, set repository Actions variable `VITE_FIREBASE_CONFIG` to that same JSON and rerun the Pages workflow. Open the deployed deck when projecting its QR, and keep the original presenter browser profile for the duration of the presentation.

## Test cross-browser voting locally

Run the Firebase emulators in one terminal and start Vite with the demo configuration in another. Use the QR link in a separate browser profile to exercise the database rules and live updates.

```sh
npm exec --package firebase-tools -- firebase emulators:start --only auth,database --project demo-comm1010
```

```sh
VITE_FIREBASE_EMULATORS=1 VITE_FIREBASE_CONFIG='{"apiKey":"demo-api-key","projectId":"demo-comm1010","databaseURL":"https://demo-comm1010-default-rtdb.firebaseio.com"}' npm run dev
```

## GitHub Pages

Pushes to `main` run the test and build jobs and deploy the Vite `dist/` artifact through GitHub Actions. The site source in **Settings → Pages** is **GitHub Actions**. The published entry point is [the COMM 1010 deck](https://khakis23.github.io/comm1010-presentation/).
