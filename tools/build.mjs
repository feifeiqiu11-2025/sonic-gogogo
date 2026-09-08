// Concatenates src/*.html|js (in numeric order) into public/index.html and syntax-checks the module.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'; import { execSync } from 'node:child_process';
const parts=readdirSync('src').filter(f=>/^\d+_/.test(f)).sort((a,b)=>parseInt(a)-parseInt(b)||a.localeCompare(b));
const out=parts.map(f=>readFileSync('src/'+f,'utf8')).join('');
writeFileSync('public/index.html',out);
const js=out.match(/<script type="module">([\s\S]*?)<\/script>/)[1].replace(/^import .*$/gm,'');
writeFileSync('tools/.check.mjs',"const THREE={},PoseLandmarker={},FilesetResolver={},RoundedBoxGeometry={},EffectComposer={},RenderPass={},UnrealBloomPass={},OutputPass={},RoomEnvironment={};\n"+js);
execSync('node --check tools/.check.mjs',{stdio:'inherit'}); console.log('built public/index.html from', parts.join(', '));
