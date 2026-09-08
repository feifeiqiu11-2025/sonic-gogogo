// Exercise encounter transitions directly; rendering and physics use the real game code.
function assert(ok,message){if(!ok)throw new Error(message);}
S.players=3;S.input='keys';beginRun();S.phase='run';runStart=now();
resetEncounters(12345);
const plan=JSON.stringify(encounterPlan);
assert(plan===JSON.stringify(makeEncounterPlan(12345)),'Seeded layouts must be repeatable.');
assert(plan!==JSON.stringify(makeEncounterPlan(54321)),'Replay seeds must remix encounters.');
assert(players.every(p=>JSON.stringify(p.encounters.map(({mesh,handled,warned,...e})=>e))===plan),'All racers receive the same course blueprint.');
for(let seed=1;seed<=100;seed++)for(const e of makeEncounterPlan(seed))assert(segAt(e.t).type==='road','Encounters must start on ordinary road.');
const paths=Object.keys(MAPS).map(k=>JSON.stringify(buildTrack(k).pts.map(p=>p.toArray())));
assert(new Set(paths).size===3,'Maps must have distinct geometry.');
const p=players[0],other=players[1],m=p.encounters.find(e=>e.type==='mummy');
p.t=m.t;p.lane=racerBand(p).center+m.bias;p.h=0;p.speed=30;
updateEncounterAfter(p,m.t-3,1/60,0);
assert(p.slowT===1.6&&p.speed===8,'Mummy contact must cause exactly 1.6 seconds of slowdown.');
assert(other.slowT===0&&!other.encounters.find(e=>e.id===m.id).handled,'Mummy hits must stay local to one racer.');
for(let i=0;i<96;i++)updateEncounterBefore(p,1/60,0);
assert(p.slowT<1e-8,'Slowdown must expire.');
p.encounters=[{...m,handled:false}];p.lane=racerBand(p).min;updateEncounterAfter(p,m.t-3,1/60,0);
assert(p.mummiesDodged===1&&p.slowT<1e-8,'Leaning around a mummy must avoid slowdown.');
resetEncounters(12345);
const spec=p.encounters.find(e=>e.type==='cheetah');p.t=spec.t;p.air=false;p.h=0;
startChase(p,spec);p.encounter.age=3;p.encounter.gap=1.5;p.speed=0;
updateEncounterAfter(p,p.t,.1,0);
assert(p.encounter.type==='combat'&&p.speed===0,'A cheetah must catch a slower runner.');
const capturedAt=p.t;const otherAt=other.t;
for(let i=0;i<120;i++){updatePlayer(p,1/60,i/60);updatePlayer(other,1/60,i/60);}
assert(p.t===capturedAt&&other.t>otherAt,'Only the caught racer stops.');
for(let i=0;i<3;i++){KEYS[0].punchEdge=true;updateEncounterBefore(p,.4,0);}
assert(p.encounter.punches===3&&p.encounter.kicks===0&&p.encounter.type==='combat','Three punches alone cannot clear combat.');
for(let i=0;i<3;i++){KEYS[1].kickEdge=true;updateEncounterBefore(p,.4,0);}
assert(p.encounter.kicks===0,'Another racer cannot defeat your cheetah.');
S.input='camera';for(let i=0;i<60;i++){combatSignals[0].update(null,i/30,true);updateEncounterBefore(p,1/30,0);}
assert(p.encounter.type==='combat'&&p.t===capturedAt,'Missing camera detections cannot auto-win or move the racer.');
S.input='keys';for(let i=0;i<3;i++){KEYS[0].kickEdge=true;updateEncounterBefore(p,.4,0);}
assert(p.encounter.type==='retreat'&&p.catsDefeated===1,'Exactly three punches and three kicks clear combat.');
updatePlayer(p,1/60,0);assert(p.t>capturedAt,'Runner resumes after winning.');
resetEncounters(12345);p.t=spec.t;p.air=false;startChase(p,p.encounters.find(e=>e.type==='cheetah'));p.encounter.age=3;p.encounter.gap=15;p.speed=35;
updateEncounterAfter(p,p.t,.5,0);assert(p.encounter.gap>15,'Fast running must pull away from the cheetah.');
p.t=spec.t+spec.length+1;updateEncounterAfter(p,p.t-1,1/60,0);assert(p.encounter.type==='retreat'&&p.catsEscaped===1,'Outrunning the chase must avoid combat.');
S.phase='done';console.log('PASS '+mapKey+': seeded fairness, distinct maps, dodge, 1.6s penalty, independent chase/capture, 3+3 combat, missing tracking, escape.');
