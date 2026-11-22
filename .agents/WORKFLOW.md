# Workflow

## Run and rehearse

1. Run `npm ci` and `npm run dev`. Open the presenter, its paired clicker link, and the Station 5 voting link in separate tabs in the same browser profile. To force an offline rehearsal when `.env.local` is configured, start Vite with `VITE_FIREBASE_CONFIG="" npm run dev`. Each round accepts one vote per browser identity.
2. Use Left or Right Arrow and Space to navigate, F for fullscreen, S to simulate a classroom response, and R to clear the board and open a new round. The paired clicker has large Prev and Next zones, a speech timer, and a disclosure for board controls.
3. Run `npm test` and `npm run build`. Run `npm run preview` to rehearse from the built app. For an offline rehearsal, launch the local preview before presenting and use its simulation.

## Connect audience phones

1. In a Firebase project, register a Web app, enable Anonymous Authentication, and create a Realtime Database in locked mode.
2. Publish [database.rules.json](../database.rules.json) contents from the database's Rules tab or run `firebase deploy --only database --project YOUR_PROJECT_ID` using the Firebase CLI from this directory. GitHub Pages publishes the three web pages. The Firebase rules are deployed separately. Reload the presenter after publishing the rules.
3. Copy [.env.example](../.env.example) to `.env.local` and set `VITE_FIREBASE_CONFIG` to the Web app's JSON configuration, including `databaseURL`. Use another browser profile or phone for voting and verify its submission reaches the presenter. Copy the private clicker link from the presenter HUD to the Pixel and test both directions. Open a fresh link after reloading the presenter. The presenter's browser owns the generated room.
4. To use the Firebase project on GitHub Pages, set repository Actions variable `VITE_FIREBASE_CONFIG` to that same JSON and rerun the Pages workflow. Open the deployed presenter when projecting its QR, and keep the original presenter browser profile for the duration of the presentation.

## Test cross-browser voting and clicker commands locally

Run the Firebase emulators in one terminal and start Vite with the demo configuration in another. Open the paired clicker and voting links in a separate browser profile to exercise the database rules and live updates.

```sh
npm exec --package firebase-tools -- firebase emulators:start --only auth,database --project demo-comm1010
```

```sh
VITE_FIREBASE_EMULATORS=1 VITE_FIREBASE_CONFIG='{"apiKey":"demo-api-key","projectId":"demo-comm1010","databaseURL":"https://demo-comm1010-default-rtdb.firebaseio.com"}' npm run dev
```

## GitHub Pages

Pushes to `main` run the test and build jobs and deploy the Vite `dist/` artifact through GitHub Actions. The site source in **Settings → Pages** is **GitHub Actions**. The published entry point is [the COMM 1010 presenter](https://khakis23.github.io/comm1010-presentation/).
