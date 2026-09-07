// ---------------- TEST DRIVE ----------------
const MODE=process.env.MODE||'1'; const FAST=process.env.FAST!=='0';
S.players=+MODE; S.hero=process.env.HERO||'sonic'; S.pair=process.env.PAIR||'heroes';
handlers['keysBtn']();
S.phase='run'; runStart=now();if(process.env.INPUT==='camera')S.input='camera';S.destination=process.env.DESTINATION||'tour';
KEY.fast=FAST; const dt=1/60; let lastSeg=null; const log=[];
function step(){ fakeNow+=dt; const q=rafQ.splice(0); for(const f of q) f(); }
for(let i=0;i<60*200;i++){
  const p=players[0]; const seg=segAt(p.t);
  if(seg!==lastSeg){ log.push(`t=${fakeNow.toFixed(1)}s ${seg.type}/${seg.meta.name||''} at ${p.t.toFixed(0)} spd ${p.speed.toFixed(1)} h ${p.h.toFixed(1)} lane ${p.lane.toFixed(1)} rings ${p.rings} st ${p.state}`+(players[1]?` | P2 t ${players[1].t.toFixed(0)} lane ${players[1].lane.toFixed(1)}`:'')); lastSeg=seg; }
  if((seg.meta.name==='ramp1'||seg.meta.name==='ramp2') && seg.t1-p.t<2 && !p.air) KEY.jumpEdge=true;
  if(seg.type==='gap' && p.air && Math.random()<.05) KEY.jumpEdge=true;
  KEY.up = seg.type==='gap' || seg.meta.name==='sprint2'; KEY.out = seg.type==='rail'; KEY.squat = (seg.meta.name==='ruins' && p.speed>14) || (seg.meta.name==='start' && p.speed<9 && fakeNow>1);
  KEY.l = seg.type==='wall' || (seg.meta.name==='cave' && p.t%40<20); KEY.r = seg.meta.name==='cave' && p.t%40>=20;
  if(S.input==='camera')bodies.forEach((b,i)=>Object.assign(b,{seen:true,speedIn:[.15,.55,1][i],lean:0,jumpEdge:false,squat:false,armsUp:false,armsOut:segAt(players[i].t).type==='rail'}));
  step();
  if(S.phase==='done'){ log.push('DONE at '+fakeNow.toFixed(1)+'s'); break; }
}
console.log(log.join('\n'));
const p=players[0]; console.log('final',{t:p.t.toFixed(0),rings:p.rings,best:p.bestChain,top:p.top.toFixed(1),phase:S.phase,enemiesLeft:enemies.filter(e=>e.alive).length, camPos:camera.position.toArray().map(v=>v.toFixed(0)), fov:camera.fov.toFixed(0)});

// Fail the test if a run only logs an error or leaves a racer behind.
function assert(condition,message){if(!condition)throw new Error(message);}
if(process.env.INPUT==='camera')assert(players[2].finishTime<players[1].finishTime&&players[1].finishTime<players[0].finishTime,'Faster body pace must finish ahead of slower body pace.');
assert(S.phase==='done','The course must reach the result state.');
assert(players.length===Number(MODE),'Selected player count must be honored.');
assert(players.every(p=>p.finished),'Every racer must be allowed to finish.');
assert(new Set(players.map(p=>p.place)).size===players.length,'Finish places must be distinct.');
assert(players.every(p=>[p.t,p.lane,p.h,p.speed,p.finishTime].every(Number.isFinite)),'Race state must stay finite.');

// Every player's body signal must reach only their character, including jump edges.
S.players=3;S.input='camera';const probes=[0,1,2].map(idx=>({idx,steer:0,speedIn:0}));
const originalBodies=bodies.slice();
for(let i=0;i<3;i++)bodies[i]={seen:true,lean:[-.7,0,.8][i],speedIn:[.15,.55,1][i],jumpEdge:i===1,squat:i===0,armsUp:i===2,armsOut:i===1};
probes.forEach(readInput);
assert(probes.map(p=>p.speedIn).join(',')==='0.15,0.55,1','Body pace must stay independent.');
assert(!probes[0].jumpEdge&&probes[1].jumpEdge&&!probes[2].jumpEdge,'One body jump must not jump every racer.');
assert(probes[0].squat&&!probes[1].squat&&probes[2].armsUp,'Body gestures must remain isolated.');
S.input='keys';clearKeys();KEYS[2].jumpEdge=true;probes.forEach(readInput);
assert(!probes[0].jumpEdge&&!probes[1].jumpEdge&&probes[2].jumpEdge,'Third keyboard jump must not be consumed by player one.');

// Pose detections may reorder or disappear: identities must remain sticky.
const assignments=[];
for(let i=0;i<3;i++)bodies[i]={centerX:[.8,.5,.2][i],lastSeen:fakeNow,calibrated:true,update(lm){assignments[i]=lm?.[0].x??null;}};
const pose=x=>Array.from({length:33},()=>({x,y:.5,visibility:1}));
assignPoses({landmarks:[pose(.2),pose(.8),pose(.5)]},fakeNow);
assert(assignments.join(',')==='0.8,0.5,0.2','Reordered detections must keep racer identities.');
assignPoses({landmarks:[pose(.21),pose(.79)]},fakeNow+.1);
assert(assignments[0]===.79&&assignments[1]===null&&assignments[2]===.21,'A dropped middle player must leave the middle slot empty.');
originalBodies.forEach((b,i)=>bodies[i]=b);

// A pause freezes race progress and does not inflate elapsed race time.
S.phase='run';const beforePause=elapsed(),positions=players.map(p=>p.t);togglePause();fakeNow+=8;
assert(elapsed()===beforePause,'Pause must freeze the race timer.');
assert(players.every((p,i)=>p.t===positions[i]),'Pause must preserve progress.');togglePause();
assert(Math.abs(elapsed()-beforePause)<1e-6,'Resuming must exclude pause duration.');
S.phase='done';console.log('PASS: finish, independent body/keyboard controls, pose identity, pause.');
