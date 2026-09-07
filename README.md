# Sonic Gogogo — Sonic & Friends

A browser racing game for **one, two, or three people**, starring procedural 3D Sonic, Tails, and Knuckles.

## Play

```sh
npm install
npm run build
npm run serve
```

Open http://localhost:5173. Choose Solo, Duo, or Trio, select a world, then **Turn on camera**. Worlds differ in more than looks: Aurora Dream has an icy road with slippery steering and crystal hazards to jump or roll through; Blossom Festival adds lantern gates that grant a speed boost and a petal breeze that drifts the racers. Stand side by side with shoulders, hips, and preferably knees visible. Each player calibrates separately. Once everyone is spotted, the race starts by itself — no click needed (a "Start anyway" button appears only if calibration is struggling). During camera play, a preview sits at the bottom-right of the screen and turns red when a body is no longer detected. Raise both arms on the results screen to race again.

The body gesture detector keeps the original peak-counting algorithm, recalibrated for kids in Sep 2026 (step-amplitude floors lowered so fast shallow steps count; full speed at a sustained 2.4 steps/s instead of 3.0):

- Run in place to increase your own speed.
- Hop to jump; hop again in the air to attack.
- Squat to roll, lean to steer, hold arms out to balance, and raise both arms to boost.
- The original gentle automatic jog, jump physics, and boost behavior are preserved.

Three players have independent movement, boost, ring totals, and finish times. There is no catch-up speed adjustment. All racers get to finish. Separate camera views keep each racer visible even when they are far apart; Shared view is also available before starting.

The three-player lineup is P1 Sonic (left), P2 Tails (middle), and P3 Knuckles (right), as seen in the mirrored camera preview. Duo uses Sonic and Knuckles. Solo lets you choose any of the three.

## Worlds

Grand Adventure travels through Coral Coast, Aurora Valley, Rainbow Sky, Jungle Ruins, Space Run, Blossom Festival, and Sunset Finish. Aurora Dream and Blossom Festival apply their atmosphere and scenery along the whole existing course. These are environment variants, not different track layouts.

## Keyboard fallback

| Player | Steer | Jump | Roll | Boost | Balance | Sprint |
| --- | --- | --- | --- | --- | --- | --- |
| P1 | A / D | W or Space | S | Q | E | Shift |
| P2 | J / L | I | K | U | O | H |
| P3 | Left / Right | Up | Down | Enter | / | . |

In Solo, arrow keys also work. Escape pauses/resumes. Camera players can raise both arms to resume. Some keyboards limit simultaneous key presses; camera mode avoids that limitation.

## Build and verification

Edit the numbered files in `src/`, then `npm run build`. The playable build is `public/index.html`; it loads Three.js, MediaPipe, fonts, and the pose model online. Camera access requires localhost or HTTPS.

`npm test` runs six deterministic full-course simulations, including independent camera pace inputs, all three racers finishing, input isolation, dropped/reordered pose assignment, and pause timing. See `QA.md` for verification scope.
