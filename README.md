# Reclaiming Digital Agency

A six-slide deck and audience voting board for a 7–9 minute COMM 1010 call-to-action speech. The audience logs actions from the voting page, and the presenter tracks their progress toward a **20-point classroom goal**.

## Quick links

| Link | When to use it |
| --- | --- |
| [Live presenter deck](https://khakis23.github.io/comm1010-presentation/) | Open this on the computer connected to the projector. |
| [Live voter page](https://khakis23.github.io/comm1010-presentation/vote.html) | Preview the form. For a live room, use the QR code or voting link on slide 5. |
| [GitHub repository](https://github.com/khakis23/comm1010-presentation) · [Actions](https://github.com/khakis23/comm1010-presentation/actions/workflows/deploy.yml) | Browse the source and check the latest Pages deployment. |

## Run locally

Install **Node.js 22.12 or later** and run these commands from the repository root. CI uses Node 24.

```sh
npm ci
npm run dev
```

- **Presenter** · [http://localhost:5173/](http://localhost:5173/)
- **Voter** · [http://localhost:5173/vote.html](http://localhost:5173/vote.html)

Keep the terminal running while you use the site. If Vite prints a different port, use that port for both pages.

## Test voting in two windows

1. For a local-only test, leave `VITE_FIREBASE_CONFIG` blank or unset before starting Vite. Open the presenter in one window and the voter page in another. Tile them side by side in the **same browser profile**. Keep the protocol, hostname, and port identical in both windows.
2. In the presenter window, advance to slide 5, **Take action**, and check that the QR code and **Open the voting page** link appear. Advance to slide 6, **Classroom goal**, and press `R` to start with an empty board.
3. In the voter window, use the `+` buttons to log **3 locked apps, 1 app deleted for a 7-day fast, and 2 permanently deleted accounts**. Check that the form shows **20 points**, then select **Submit points to the board**.
4. Check for **Points submitted** in the voter window. The presenter should immediately show **20 points**, **1 voter**, and **Goal Achieved**. The action breakdown should show **3, 3, and 14 points** respectively. `BroadcastChannel` syncs the windows without a reload, with browser storage events as a fallback.
5. Reload the voter page to check that the confirmation persists. Each browser identity gets one ballot per round. Press `R` in the presenter again and check that the board returns to zero and the voter form reopens.

### Test with an audience phone

Same-browser voting shares the board within a single browser profile. For phones or separate browser profiles, configure Firebase Anonymous Authentication and Realtime Database, publish the database rules, and provide the public web configuration as `VITE_FIREBASE_CONFIG`. Put it in `.env.local` for Vite or in the repository’s Actions variables for GitHub Pages. The setup and optional local emulator commands are in the [project workflow guide](.agents/WORKFLOW.md#connect-audience-phones).

Once Firebase is configured on GitHub Pages, open the hosted deck and wait for **Live voting connected.** Scan the slide 5 QR code with a phone and submit a practice ballot. The QR includes the presenter’s room ID. Confirm the ballot arrives on slide 6, then reset the board before presenting. Keep the same presenter browser profile for the session so it retains ownership of the room.

## Presenter shortcuts

| Key | Action |
| --- | --- |
| `←` Left Arrow | Go to the previous slide. |
| `→` Right Arrow | Go to the next slide. |
| `Space` | Go to the next slide when focus is on the deck. On a focused button, Space activates that button. |
| `F` | Toggle fullscreen. |
| `S` | Simulate a series of audience votes if Wi-Fi drops or you need a practice tally. |
| `R` | Clear the board, stop any running simulation, and open a fresh voting round. |

The **Enable F, S and R shortcuts** checkbox is on by default. The footer also has **Previous**, **Next**, **Fullscreen**, **Simulate votes**, and **Reset votes** buttons. On a touchscreen, swipe left to advance or right to go back.

## How scoring works

| Audience action | Points per action |
| --- | ---: |
| Lock an app behind Face ID or Secure Folder | +1 |
| Delete an app for a 7-day fast | +3 |
| Permanently delete an account | +7 |

Each voter can log 0–10 of each action and must log at least one action to submit. The board adds up all ballots in the current round and shows **Goal Achieved** at **20 points or more**. The voter count includes one entry per ballot, including simulated ballots, and the action breakdown shows how those points were earned.

## Build and rehearse

Run these commands from the repository root after installing dependencies.

```sh
npm test
npm run build
npm run preview
```

The automated tests cover point weights, ballot validation, and simulation scoring. Preview serves the production build from `dist/` at [http://localhost:4173/](http://localhost:4173/) for the presenter and [http://localhost:4173/vote.html](http://localhost:4173/vote.html) for the voter. Use the port printed in the terminal if it differs.

- **Time a full run.** Start at slide 1, verify fullscreen, budget time for the QR vote on slide 5, and finish with the results on slide 6.
- **Practice the Wi-Fi fallback.** Open the local preview before disconnecting Wi-Fi and keep it running. On slide 6, press `R`, then `S`. Starting from zero, simulated ballots arrive over several seconds and reach **31 points**. The board labels how many votes are simulated, and those ballots stay in the presenter’s browser. Press `R` again to clear the practice results.

## How GitHub Pages deploys

1. A push to `main` triggers **Deploy GitHub Pages**. You can also start it manually from the workflow’s **Run workflow** button.
2. The build job uses Node 24, runs `npm ci` and `npm test`, then runs `npm run build` for both pages. It passes the optional repository Actions variable `VITE_FIREBASE_CONFIG` into the build. Without the variable, the hosted app uses same-browser voting.
3. After a successful build, GitHub Actions uploads `dist/` as the Pages artifact and deploys it to the `github-pages` environment. The repository’s **Settings → Pages → Build and deployment → Source** is set to **GitHub Actions**.
4. Open the run for your commit and confirm both **build** and **deploy** passed. Then open the live presenter and voter links above. See the [workflow file](.github/workflows/deploy.yml) and [deployment runs](https://github.com/khakis23/comm1010-presentation/actions/workflows/deploy.yml).
