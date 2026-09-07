// Headless run-through of the whole course with a keyboard "bot" (no browser/WebGL needed).
// Usage: node tools/simulate.mjs            (1 player, sprint)
//        MODE=2 node tools/simulate.mjs     (race)
//        FAST=0 SPEEDIN=0.4 node tools/simulate.mjs   (jogging pace — checks the big jumps are still clearable)
import { readFileSync, writeFileSync } from 'node:fs'; import { execSync } from 'node:child_process';
const html=readFileSync('public/index.html','utf8'); let js=html.match(/<script type="module">([\s\S]*?)<\/script>/)[1].replace(/^import .*$/gm,'');
js=js.replace("let runStart=0;","var runStart=0;").replace("p.speedIn=KEY.fast?1:.72;","p.speedIn=KEY.fast?1:(+process.env.SPEEDIN||.72);");
writeFileSync('tools/.harness.mjs',readFileSync('tools/harness_pre.mjs','utf8')+'\n// ==== GAME ====\n'+js+'\n// ==== TAIL ====\n'+readFileSync('tools/harness_tail.mjs','utf8'));
execSync('node tools/.harness.mjs',{stdio:'inherit',env:process.env});
