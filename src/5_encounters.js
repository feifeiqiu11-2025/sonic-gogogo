/* ADVENTURE ENCOUNTERS — per-racer state, fair seeded layouts, no shared combat locks. */
const encounterGroup=new THREE.Group();scene.add(encounterGroup);
const encounterGeo={ball:new THREE.SphereGeometry(1,14,10),box:new RoundedBoxGeometry(1,1,1,2,.12),ring:new THREE.TorusGeometry(1,.055,5,18)};
const encounterMat={wrap:std(0xe8d8b2,{roughness:.95}),seam:std(0xb6a58b,{roughness:1}),eye:std(0x77eecb,{emissive:0x36a989,emissiveIntensity:.4}),dark:std(0x252b30),fur:std(0xe5ae49,{roughness:.85}),cream:std(0xffe5b7),spots:std(0x684a32),warn:new THREE.MeshBasicMaterial({color:0xffd080,transparent:true,opacity:.6})};
function encounterPart(g,geo,mat,pos,scale){const m=new THREE.Mesh(encounterGeo[geo],encounterMat[mat]);m.position.set(...pos);m.scale.set(...scale);m.castShadow=true;g.add(m);return m;}
function buildMummy(){const g=new THREE.Group();encounterPart(g,'box','wrap',[0,.95,0],[.65,.9,.4]);encounterPart(g,'ball','wrap',[0,1.65,0],[.34,.36,.29]);
 for(let i=0;i<6;i++){const band=encounterPart(g,'ring','seam',[0,.58+i*.17,.012],[.34,.23,.35]);band.rotation.x=Math.PI/2;}
 for(let i=0;i<3;i++){const band=encounterPart(g,'ring','seam',[0,1.48+i*.13,0],[.32,.26,.35]);band.rotation.x=Math.PI/2;}
 for(const x of [-.13,.13])encounterPart(g,'ball','eye',[x,1.69,.277],[.065,.055,.028]);
 g.userData.arms=[];g.userData.legs=[];
 for(const side of [-1,1]){const arm=new THREE.Group();arm.position.set(side*.4,1.3,0);g.add(arm);encounterPart(arm,'box','wrap',[side*.12,-.13,.23],[.21,.25,.68]);g.userData.arms.push(arm);const leg=encounterPart(g,'box','wrap',[side*.18,.26,0],[.25,.55,.3]);g.userData.legs.push(leg);}
 return g;}
function buildCheetah(){const g=new THREE.Group(),body=new THREE.Group();g.add(body);g.userData.body=body;
 encounterPart(body,'ball','fur',[0,.9,0],[.36,.4,.8]);encounterPart(body,'ball','cream',[0,.68,.13],[.27,.21,.62]);
 const head=new THREE.Group();head.position.set(0,1.19,.75);body.add(head);g.userData.head=head;
 encounterPart(head,'ball','fur',[0,0,0],[.32,.29,.34]);encounterPart(head,'ball','cream',[0,-.12,.23],[.24,.14,.2]);encounterPart(head,'ball','dark',[0,-.065,.41],[.085,.05,.045]);
 for(const side of [-1,1]){encounterPart(head,'ball','fur',[side*.24,.24,-.04],[.115,.14,.08]);encounterPart(head,'ball','dark',[side*.24,.25,.025],[.068,.086,.025]);encounterPart(head,'ball','eye',[side*.15,.045,.285],[.06,.056,.035]);const tear=encounterPart(head,'box','dark',[side*.18,-.065,.29],[.035,.15,.025]);tear.rotation.z=side*.25;}
 g.userData.legs=[];for(const [x,z]of [[-.24,.45],[.24,.45],[-.25,-.48],[.25,-.48]]){const leg=new THREE.Group();leg.position.set(x,.85,z);body.add(leg);encounterPart(leg,'box','fur',[0,-.28,0],[.14,.53,.17]);encounterPart(leg,'ball','fur',[0,-.62,.09],[.15,.1,.22]);g.userData.legs.push(leg);}
 const spots=new THREE.InstancedMesh(encounterGeo.ball,encounterMat.spots,28);for(let i=0;i<28;i++){const a=i*2.399,y=.9+Math.sin(a)*.3,x=Math.cos(a)*.335,z=-.58+(i%7)*.18;M4.compose(new THREE.Vector3(x,y,z),Q4.identity(),V3.set(.06,.035,.075));spots.setMatrixAt(i,M4);}body.add(spots);
 const tail=new THREE.Group();tail.position.set(0,1,-.62);body.add(tail);tail.add(tapered([[0,0,0],[.15,.1,-.55],[.3,.36,-1.15],[.26,.5,-1.4]],.085,encounterMat.fur,encounterMat.dark));g.userData.tail=tail;
 return g;}
function seededRandom(seed){return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
function shuffled(list,rng){const out=list.slice();for(let i=out.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;}
let encounterSeed=0,encounterPlan=[];
function makeEncounterPlan(seed){const rng=seededRandom(seed),plan=[];
 const names=mapKey==='aurora'?['beach','beach2','ruins','ruins2','downhill']:['beach','beach2','ruins','ruins2'];
 for(const name of shuffled(names,rng)){const seg=segByName(name),length=seg.t1-seg.t0;const n=length>90?2:1;for(let i=0;i<n;i++){const t=seg.t0+18+(length-35)*(i+.25+rng()*.35)/n;plan.push({type:'mummy',t,bias:(rng()-.5)*.7});}}
 const forest=segByName('forestGate'),chase=segByName('forestChase');
 plan.push({type:'cheetah',t:forest.t0+30+rng()*15,length:115});
 if(mapKey!=='aurora')plan.push({type:'cheetah',t:chase.t0+70+rng()*35,length:125});
 // An extra surprise mummy between chases, with a generous clear interval.
 if(mapKey==='aurora'||rng()>.45)plan.push({type:'mummy',t:chase.t1-35,bias:(rng()-.5)*.6});
 return plan.sort((a,b)=>a.t-b.t).map((e,i)=>({...e,id:i}));
}
function releaseEncounter(mesh){const shared=new Set(Object.values(encounterGeo));mesh.traverse(o=>{if(o.geometry&&!shared.has(o.geometry))o.geometry.dispose();if(o.isInstancedMesh)o.dispose();});mesh.removeFromParent();}
function resetEncounters(seed){for(const mesh of [...encounterGroup.children])releaseEncounter(mesh);encounterSeed=seed??Math.floor(Math.random()*0xffffffff);encounterPlan=makeEncounterPlan(encounterSeed);
 for(const p of players){p.encounters=encounterPlan.map(e=>({...e,handled:false,warned:false,mesh:e.type==='mummy'?buildMummy():null}));p.encounters.forEach(e=>{if(e.mesh)encounterGroup.add(e.mesh);});p.slowT=0;p.encounter=null;p.challengeText='';p.challengeTimer=0;p.mummiesDodged=0;p.catsEscaped=0;p.catsDefeated=0;p.combatAnim=0;combatSignals[p.idx].reset();}
}
function racerBand(p){const width=2*ROAD_W/S.players;return {center:-ROAD_W+(p.idx+.5)*width,min:-ROAD_W+p.idx*width+.25,max:-ROAD_W+(p.idx+1)*width-.25};}
function challengeMessage(p,text,seconds=2.5){p.challengeText=text;p.challengeTimer=seconds;}
function startChase(p,e){e.handled=true;const mesh=buildCheetah();encounterGroup.add(mesh);p.encounter={type:'chase',spec:e,mesh,age:0,gap:15,punches:0,kicks:0,recoil:0};challengeMessage(p,'CHEETAH! Run faster!',3);SFX.birds();}
function enterCombat(p){const e=p.encounter;e.type='combat';e.age=0;e.punches=e.kicks=0;p.speed=0;p.vh=0;p.h=0;p.air=false;p.homing=null;p.rollT=0;p.floorT=0;p.boosting=false;p.state='combat';combatSignals[p.idx].reset();KEYS[p.idx].punchEdge=KEYS[p.idx].kickEdge=false;challengeMessage(p,'Caught! 3 punches + 3 kicks',4);}
function readCombatInput(p){if(S.input==='keys'){const k=KEYS[p.idx],out={punch:k.punchEdge,kick:k.kickEdge,hint:['F punch · G kick','N punch · M kick','[ punch · ] kick'][p.idx]};k.punchEdge=k.kickEdge=false;return out;}return combatSignals[p.idx].take();}
function updateEncounterBefore(p,dt,time){
 p.slowT=Math.max(0,(p.slowT||0)-dt);p.challengeTimer=Math.max(0,(p.challengeTimer||0)-dt);p.combatAnim=Math.max(0,(p.combatAnim||0)-dt);
 const e=p.encounter;if(!e||e.type!=='combat')return false;
 e.age+=dt;e.recoil=Math.max(0,e.recoil-dt);p.speed=0;p.speedNorm=0;p.state='combat';p.boosting=false;p.jumpEdge=false;
 const action=readCombatInput(p);e.hint=action.hint;
 if(e.age>.35&&action.punch&&e.punches<3){e.punches++;e.recoil=.3;p.combatAnim=.28;p.combatMove='punch';SFX.hit(e.punches);burst(worldAt(p.t+2.5,p.lane,1.2),8,3,0xffd888,.3,.5,-2);}
 if(e.age>.35&&action.kick&&e.kicks<3){e.kicks++;e.recoil=.4;p.combatAnim=.4;p.combatMove='kick';SFX.hit(e.kicks+2);burst(worldAt(p.t+2.5,p.lane,.7),9,3,0x9fe8d0,.3,.6,-2);}
 if(e.punches>=3&&e.kicks>=3){e.type='retreat';e.age=0;p.catsDefeated++;p.invT=2.5;challengeMessage(p,'You did it! Keep running!',3);SFX.goal();combatSignals[p.idx].reset();}
 return true;
}
function updateEncounterAfter(p,previousT,dt,time){
 for(const e of p.encounters||[]){if(e.handled)continue;const distance=e.t-p.t;
  if(e.type==='cheetah'){if(distance<=0&&!p.encounter&&!p.air&&p.t<e.t+e.length)startChase(p,e);else if(p.t>e.t+e.length)e.handled=true;continue;}
  const band=racerBand(p),lane=band.center+e.bias;
  if(!e.warned&&distance<76&&distance>0){e.warned=true;challengeMessage(p,'MUMMY! Lean left or right',2.8);}
  if(previousT<=e.t+1&&p.t>=e.t-1){e.handled=true;if(Math.abs(p.lane-lane)<.82&&p.h<2.2){p.slowT=1.6;p.speed=Math.min(p.speed,8);p.boosting=false;p.floorT=0;challengeMessage(p,'Wrapped up! Slowed for a moment',1.6);SFX.hurt();burst(worldAt(e.t,lane,.5),12,4,0xe8d8b2,.5,.7,-3);}else{p.mummiesDodged++;challengeMessage(p,'Nice dodge!',1.4);}}
 }
 const e=p.encounter;if(!e)return;
 e.age+=dt;e.recoil=Math.max(0,e.recoil-dt);
 if(e.type==='chase'){
  if(e.age>2)e.gap+= (p.speed-26)*dt;
  if(e.gap<=1.4&&!p.air){enterCombat(p);return;}
  if(p.t>e.spec.t+e.spec.length||e.gap>43){p.catsEscaped++;e.type='retreat';e.age=0;challengeMessage(p,'Cheetah outrun!',2.5);}
 }else if(e.type==='retreat'&&e.age>1.3){releaseEncounter(e.mesh);p.encounter=null;}
}
function updateEncounterVisuals(time){for(const p of players){
 for(const e of p.encounters||[]){if(!e.mesh)continue;const dist=e.t-p.t;e.mesh.visible=dist<88&&dist>-12;
  if(!e.mesh.visible)continue;const lane=racerBand(p).center+e.bias,f=frameAt(e.t);e.mesh.position.copy(worldAt(e.t,lane,-2*(1-smoothstep(75,38,dist))));e.mesh.quaternion.setFromRotationMatrix(M4.makeBasis(f.B.clone().negate(),f.N,f.T));e.mesh.rotateY(Math.PI);e.mesh.userData.arms.forEach((a,i)=>a.rotation.x=Math.sin(time*3+i)*.13);}
 const e=p.encounter;if(!e)continue;const combat=e.type==='combat',retreat=e.type==='retreat',t=combat?p.t+2.7:p.t-(retreat?8+e.age*10:Math.max(1,e.gap));const f=frameAt(t);e.mesh.position.copy(worldAt(t,p.lane,combat?0:Math.abs(Math.sin(time*13))*.1));e.mesh.quaternion.setFromRotationMatrix(M4.makeBasis(f.B.clone().negate(),f.N,f.T));if(combat)e.mesh.rotateY(Math.PI);
 e.mesh.userData.legs.forEach((l,i)=>l.rotation.x=combat?Math.sin(time*4.5+i*1.7)*.22:Math.sin(time*15+i%2*Math.PI+(i>1?.8:0))*.8);e.mesh.userData.tail.rotation.y=Math.sin(time*(combat?9:7))*(combat?.5:.3);e.mesh.userData.head.rotation.z=Math.sin(time*3)*.06;e.mesh.scale.setScalar(retreat?Math.max(.05,1-e.age*.65):1);
 if(combat){e.mesh.position.addScaledVector(f.T,e.recoil*1.6);e.mesh.userData.body.rotation.x=-.08+Math.sin(time*3.3)*.06-e.recoil*.9;e.mesh.userData.head.rotation.x=Math.sin(time*2.7)*.1+e.recoil*.8;}else e.mesh.userData.body.rotation.x=0;
}}
// Fighting stance owns the whole pose (runs after animateNinja): a bouncy guard, then
// wind-up/strike/return arcs for punches and kicks driven by combatAnim.
function poseCombatHero(p,time){if(p.encounter?.type!=='combat')return;const R=p.rig.userData.rig;
 const w=Math.sin(time*6.5),bounce=Math.abs(w);
 const hipsY=R.hips.userData.y??(R.hips.userData.y=R.hips.position.y);
 R.hips.position.y=hipsY-.1+bounce*.07;
 R.torso.rotation.set(.14,.3+w*.06,0);R.head.rotation.set(-.1,-.22,0);
 R.legs.L.hip.rotation.x=-.28;R.legs.R.hip.rotation.x=.1;R.legs.L.knee.rotation.x=.5;R.legs.R.knee.rotation.x=.35;
 R.arms.L.sh.rotation.x=-.95+w*.08;R.arms.R.sh.rotation.x=-.85-w*.08;R.arms.L.sh.rotation.z=.3;R.arms.R.sh.rotation.z=-.3;
 R.arms.L.elbow.rotation.x=-1.5;R.arms.R.elbow.rotation.x=-1.5;
 if(p.combatAnim>0){const dur=p.combatMove==='punch'?.28:.4,s=Math.sin(Math.min(1,(1-p.combatAnim/dur)*1.15)*Math.PI);
  if(p.combatMove==='punch'){R.torso.rotation.y=.3-s*.75;R.arms.R.sh.rotation.x=-.85-s*.95;R.arms.R.sh.rotation.z=-.1;R.arms.R.elbow.rotation.x=-1.5+s*1.42;R.hips.position.y=hipsY-.1+s*.05;}
  else{R.torso.rotation.set(.14-s*.3,.3-s*.35,0);R.legs.R.hip.rotation.x=.1-s*1.5;R.legs.R.knee.rotation.x=.35+(1-s)*.9;R.legs.L.knee.rotation.x=.5+s*.25;R.hips.position.y=hipsY-.1+s*.1;R.arms.L.sh.rotation.z=.3+s*.5;R.arms.R.sh.rotation.z=-.3-s*.5;}}}

function updateChallengeHUD(){for(const p of players){const el=$('challenge'+p.idx),e=p.encounter;let html='';
 if(e?.type==='combat'){const dots=n=>Array.from({length:3},(_,i)=>`<i class="${i<n?'lit':''}"></i>`).join('');html=`<strong>${p.hero.name} · CHEETAH SHOWDOWN</strong><div class="combat-meter"><span>PUNCH ${dots(e.punches)}</span><span>KICK ${dots(e.kicks)}</span></div><p>${e.hint||'Hands at chest. Punch and return. Lift knee, kick, foot down.'}</p>`;el.className='challenge-card combat';}
 else if(e?.type==='chase'){html=`<strong>${p.hero.name} · RUN FASTER!</strong><p>Cheetah ${Math.max(1,Math.round(e.gap))} m behind you</p><div class="chase-meter"><i style="width:${clamp(e.gap/43,0,1)*100}%"></i></div>`;el.className='challenge-card';}
 else if(p.challengeTimer>0){html=`<strong>${p.hero.name}</strong><p>${p.challengeText}</p>`;el.className='challenge-card';}
 el.hidden=!html;if(el.innerHTML!==html)el.innerHTML=html;
 }
}
// Map cards show the illustrated adventure covers (public/maps/, sources in previews/).
function renderMapCards(){for(const key of Object.keys(MAPS)) $('mapArt-'+key).innerHTML=`<img src="${MAPS[key].art}" alt="${MAPS[key].name} adventure map" loading="lazy">`;}
