# Verification

## Automated

`npm test` includes:

1. Solo at sprint pace.
2. Two-player independent keyboard race.
3. Three-player independent keyboard race.
4. Solo at the original slower jogging input, including both big jumps.
5. Three different body pace inputs (0.15, 0.55, 1.0) through Aurora Dream.
6. The same independent body pace race through Blossom Festival.

Every run asserts completion, finite physics state, selected player count, all racers finishing, and unique finish places. Camera scenarios assert that the fastest body pace finishes before the medium and slowest pace. Additional assertions cover independent jump/boost/squat inputs, third-player keyboard input, reordered pose detections, a missing middle detection, and excluding pause time from the race timer.

The `Body` class keeps the original running-cadence algorithm, calibration logic, and gesture thresholds, with one owner-requested recalibration (Sep 2026): knee/ankle step-amplitude floors 0.10 -> 0.07 torso, wrist 0.12 -> 0.10, and full speed input at 2.4 steps/s instead of 3.0, so hard-but-shallow running registers. Speed authority in 6_game.js widened (speedIn x16 -> x18).

## Browser checks

Menu and live 3D character previews; all three solo character options; world selection; three-player countdown and split-screen rendering; Aurora gameplay; pause/resume; console checks. Mobile menu checked at 390 × 844 with no horizontal overflow.

## Remaining physical-device check

The camera tests inject independent body input values and synthetic pose identities. They do not replace a live session with three people. Three-person webcam recognition, lighting conditions, small-room visibility, and mobile GPU performance still need a physical playtest. Camera permission is never requested automatically before the user chooses camera mode.


## Adventure maps v0.4 (September 7, 2026)

- `npm test`: seven complete races (solo sprint/jog, duo/trio keyboard, three independent camera-input paces on each map).
- Separate encounter scenarios on all three maps assert deterministic seeds, replay variation, identical per-racer blueprints, distinct track geometry, road-only encounter starts across 100 seeds, mummy dodge/1.6-second contact penalty, isolated capture, missing-tracking behavior, exactly three punches plus three kicks, and escape by running faster.
- `test-gestures.mjs` compares Body and StepSignal source exactly with the v0.3 fixture, then checks the separate CombatSignal at 15/30/60 fps. Tests include retraction/rearming, held attacks, missing feet, ordinary running, and arms-up rejection.
- Browser: three-player combat with actual keyboard input; Sonic resumes while Tails and Knuckles remain caught; desert warning/hit feedback; switching maps; compact pause overlay; console checks. Illustrated map previews are checked at desktop and 390×844, with all assets loaded and no horizontal overflow.
- The temporary encounter QA page is not shipped. Preview artwork is explicitly labeled as concept art, not gameplay screenshots or exact geometry.

The original calibrated movement detectors remain byte-for-byte unchanged. New combat gestures are a separate detector used only while caught. These synthetic checks do **not** establish real-world punch/kick recognition accuracy for children; full-body webcam testing with people, varied lighting, and room sizes remains required.

## Cover-inspired playable scenery

Desert road sections now include terraced pyramids, temple entrances with turquoise carvings and torch flames, and sandy road surfacing. Space sections include rainbow-colored road ribbons following the existing transported frames, floating crystal platforms, cyan light rings, a nearby ringed planet, and violet banked walls. Sky rails have colored luminous surfaces. These additions do not create colliders or change track points, gesture thresholds, or movement physics. Reused landmark geometry is culled by racer distance.

Verified from the game camera in the browser with no warning/error logs; three-player independent camera-input full race and encounter regression passed; Body/StepSignal preservation and combat gesture tests passed.
