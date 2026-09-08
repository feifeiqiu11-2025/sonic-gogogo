import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import assert from 'node:assert/strict';
const source=readFileSync('src/2_core.js','utf8');
assert.equal(source.slice(source.indexOf('class Body {'),source.indexOf('const bodies=')),readFileSync('tools/fixtures/body-v0.3.js','utf8'),'Kid-calibrated Body and StepSignal algorithms must remain unchanged.');
const utils='const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));const lerp=(a,b,t)=>a+(b-a)*t;const damp=(a,b,k,dt)=>lerp(a,b,1-Math.exp(-k*dt));';
const Combat=runInNewContext(utils+source.slice(source.indexOf('class CombatSignal {'),source.indexOf('const combatSignals='))+';CombatSignal');
function pose(){const a=Array.from({length:33},()=>({x:.5,y:.15,z:0,visibility:1}));const set=(i,x,y,z=0)=>a[i]={x,y,z,visibility:1};
 set(11,.6,.3);set(12,.4,.3);set(23,.58,.6);set(24,.42,.6);set(13,.64,.42);set(14,.36,.42);set(15,.57,.39,-.04);set(16,.43,.39,-.04);set(25,.58,.84);set(26,.42,.84);set(27,.58,1.04);set(28,.42,1.04);return a;}
const blend=(a,b,u)=>a.map((p,i)=>({...p,x:p.x+(b[i].x-p.x)*u,y:p.y+(b[i].y-p.y)*u,z:p.z+(b[i].z-p.z)*u}));
for(const fps of [15,30,60]){const detector=new Combat();let time=0,punches=0,kicks=0;
 const feed=(p,seconds,active=true)=>{for(let i=0;i<Math.ceil(seconds*fps);i++){time+=1/fps;detector.update(p,time,active);const e=detector.take();punches+=e.punch?1:0;kicks+=e.kick?1:0;}};
 const move=(a,b,seconds)=>{for(let i=1,n=Math.ceil(seconds*fps);i<=n;i++)feed(blend(a,b,i/n),1/fps);};
 const guard=pose(),jab=pose();jab[13]={x:.75,y:.33,z:-.08,visibility:1};jab[15]={x:.92,y:.35,z:-.17,visibility:1};
 feed(guard,.7);
 for(let i=0;i<3;i++){move(guard,jab,.2);feed(jab,.5);move(jab,guard,.2);feed(guard,.3);}
 assert.equal(punches,3,`${fps}fps: three complete punches should count once each`);assert.equal(kicks,0);
 const chamber=pose(),kick=pose();chamber[25]={x:.58,y:.55,z:-.03,visibility:1};chamber[27]={x:.58,y:.79,z:-.02,visibility:1};kick[25]={x:.58,y:.54,z:-.10,visibility:1};kick[27]={x:.58,y:.45,z:-.36,visibility:1};
 for(let i=0;i<3;i++){feed(guard,.4);move(guard,chamber,.2);feed(chamber,.12);move(chamber,kick,.2);feed(kick,.5);move(kick,guard,.25);}
 assert.equal(kicks,3,`${fps}fps: three chamber/extend/return kicks should count once each`);
 // Held limbs, low-confidence landmarks, jumps, and ordinary running cannot farm attacks.
 feed(kick,2);assert.equal(kicks,3);
 const missing=pose();missing[27].visibility=.1;feed(missing,.5);move(missing,kick,.2);assert.equal(kicks,3);
 detector.reset();punches=kicks=0;
 for(let i=0;i<fps*4;i++){const p=pose(),u=Math.sin(i/fps*12);p[25].y+=u*.04;p[26].y-=u*.04;p[27].y+=u*.025;p[28].y-=u*.025;p[15].y+=u*.08;p[16].y-=u*.08;feed(p,1/fps);}
 assert.equal(punches+kicks,0,`${fps}fps: ordinary running must not count as combat`);
 const up=pose();up[15].y=up[16].y=.05;feed(guard,.5);move(guard,up,.2);feed(up,1);assert.equal(punches+kicks,0,'Boost arms must not become punches');
 feed(guard,.5,false);move(guard,jab,.2); // No pre-armed punch should leak into a newly entered encounter.
 assert.equal(punches,0);
 console.log(`PASS ${fps}fps: punches, kicks, rearming, confidence, running and boost rejection`);
}
console.log('PASS: existing body control algorithms preserved exactly.');
