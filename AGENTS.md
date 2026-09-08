# Sonic Gogogo (formerly Rainbow Coast Run)

Edit numbered `src/` files and rebuild with `npm run build`; do not hand-edit the generated `public/index.html`. Run `npm test` after gameplay changes.

The current user direction replaces the supplied ninja cast with Sonic, Tails, and Knuckles. Preserve the body-motion controls and gesture thresholds (original algorithm; step-amplitude floors and pace mapping recalibrated for kids Sep 2026 at the owner’s request — see QA.md). All three racers respond to their own tracked movement. Do not synchronize their speeds or positions, introduce hidden catch-up boosts, or cut off slower racers before they finish.

Architecture:
- `1_head.html`: menu, responsive UI, HUD, camera setup, and results.
- `2_core.js`: hero metadata, audio, Body detector (original algorithm, kid-recalibrated floors), three-pose assignment, keyboard fallback.
- `3_world.js`: track frames, geometry, materials, sky, ocean, renderer.
- `4_zones.js`: mixed biomes, forest/desert scenery, atmosphere variants.
- `5_chars.js`: procedural Sonic/Tails/Knuckles rigs, animation, actual-model menu portraits.
- `5_encounters.js`: independent mummy/chase/combat state and seeded layouts; punches and kicks use a separate CombatSignal in `2_core.js`.
- `6_game.js`: physics, collectibles, race state, shared/separate cameras, and game flow.

Menu choices happen before camera activation. Setup and replay support hands-free gestures. Keep scores and finish times per player. See README.md and QA.md for controls, verification, and physical-device test limitations.

The illustrated map names/assets under `public/previews/` are proposals requested for review before replacing the current menu. Preserve that separation until the owner selects a direction.
