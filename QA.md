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
