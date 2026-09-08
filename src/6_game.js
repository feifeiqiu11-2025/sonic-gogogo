
/* =====================================================================
   INTERACTIVE OBJECTS — rings, springs, dash pads, enemies, birds, particles
   ===================================================================== */
const objs=new THREE.Group(); scene.add(objs);
// particles
const PART={ n:520, geo:new THREE.BoxGeometry(.14,.14,.14), pos:[],vel:[],life:[],max:[],g:[],size:[],col:[], head:0 };
PART.mesh=new THREE.InstancedMesh(PART.geo,new THREE.MeshStandardMaterial({color:0xffffff,emissive:0xffffff,emissiveIntensity:.35,roughness:.6}),PART.n); PART.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); PART.mesh.frustumCulled=false; scene.add(PART.mesh);
for(let i=0;i<PART.n;i++){ PART.pos.push(new THREE.Vector3(0,-999,0)); PART.vel.push(new THREE.Vector3()); PART.life.push(0); PART.max.push(1); PART.g.push(0); PART.size.push(1); PART.col.push(new THREE.Color()); PART.mesh.setColorAt(i,new THREE.Color(1,1,1)); }
function emit(p,v,life,color,size=1,g=-9){ const i=PART.head; PART.head=(PART.head+1)%PART.n; PART.pos[i].copy(p); PART.vel[i].copy(v); PART.life[i]=life; PART.max[i]=life; PART.col[i].set(color); PART.size[i]=size; PART.g[i]=g; PART.mesh.setColorAt(i,PART.col[i]); }
function burst(p,n,speed,color,life=.7,size=1,g=-9,dir=null){ for(let k=0;k<n;k++){ const v=new THREE.Vector3(rnd(2)-1,rnd(2)-1,rnd(2)-1).normalize().multiplyScalar(speed*(.4+rnd(.6))); if(dir) v.addScaledVector(dir,speed*.8); emit(p,v,life*(.6+rnd(.6)),color,size*(.6+rnd(.8)),g); } }
function updateParticles(dt){ const m=PART.mesh; for(let i=0;i<PART.n;i++){ if(PART.life[i]<=0){ if(PART.pos[i].y>-900){ PART.pos[i].y=-999; M4.makeTranslation(0,-999,0); m.setMatrixAt(i,M4);} continue; } PART.life[i]-=dt; PART.vel[i].y+=PART.g[i]*dt; PART.vel[i].multiplyScalar(1-1.5*dt); PART.pos[i].addScaledVector(PART.vel[i],dt); const s=PART.size[i]*clamp(PART.life[i]/PART.max[i],0,1); M4.compose(PART.pos[i],Q4.setFromEuler(E3.set(PART.life[i]*3,PART.life[i]*5,0)),V3.set(s,s,s)); m.setMatrixAt(i,M4); } m.instanceMatrix.needsUpdate=true; if(m.instanceColor) m.instanceColor.needsUpdate=true; }

// rings
const rings=[]; const ringGeo=new THREE.TorusGeometry(.6,.13,10,22);
function ringLine(t0,t1,spacing,laneFn,hFn=()=>0){ for(let t=t0;t<=t1;t+=spacing){ const u=(t-t0)/Math.max(1,(t1-t0)); rings.push({t,lane:typeof laneFn==='function'?laneFn(u,t):laneFn,h:hFn(u,t),got:false}); } }
function ringArc(t0,len,peak,lane,n=7){ for(let k=0;k<n;k++){ const u=k/(n-1); rings.push({t:t0+len*u,lane,h:peak*Math.sin(u*Math.PI),got:false}); } }
(()=>{ const sg=segByName;
  ringLine(sg('start').t0+18,sg('start').t1,5,0);
  ringLine(sg('downhill').t0+10,sg('downhill').t1,6,u=>Math.sin(u*9)*3);
  ringLine(sg('dash').t0+8,sg('dash').t1-4,5,-2.2);
  ringLine(sg('preloop').t0+2,sg('preloop').t1,4,0); { const lp=SEGS.find(s=>s.type==='loop'); ringLine(lp.t0+6,lp.t1-6,6,u=>Math.sin(u*6.3)*2.4); }
  const ck=SEGS.find(s=>s.type==='cork'); ringLine(ck.t0+8,ck.t1-6,6,0);
  ringLine(sg('rails').t0+6,sg('rails').t1-6,7,u=>(Math.floor(u*4)%2?RAIL_X:-RAIL_X),u=>.9);
  ringArc(sg('ramp1').t1-6,30,7,0,9); ringArc(sg('ramp1').t1+8,26,4,2.5,7);
  ringLine(sg('beach').t0+6,sg('beach2').t1,6,u=>Math.cos(u*7)*2.8);
  ringLine(sg('bridge').t0+4,sg('bridge').t1-2,5,0); ringLine(sg('ruins').t0+4,sg('ruins2').t1,6,u=>Math.sin(u*8)*3);
  ringLine(sg('cave').t0+10,sg('cave').t1-6,7,u=>Math.sin(u*10)*2.6,u=>.4+Math.abs(Math.sin(u*10))*1.4);
  const wl=SEGS.find(s=>s.type==='wall'); ringLine(wl.t0+10,wl.t1-10,6,0);
  ringArc(sg('ramp2').t1-6,44,10,0,12); ringArc(sg('ramp2').t1+6,36,6,-2.4,8);
  ringLine(sg('sprint').t0+6,sg('sprint2').t1,6,u=>Math.sin(u*14)*3.2); ringLine(sg('finish').t0+4,sg('finish').t1-4,5,0);
  // world-exclusive ring layouts (r.world tags them; they only appear and count in that destination)
  const n0=rings.length;
  ringLine(sg('dash').t0+12,sg('dash').t1-8,4,u=>Math.sin(u*14)*3);            // crystal slalom
  ringArc(sg('ruins').t0+22,16,5,-2,7); ringLine(sg('cave').t0+20,sg('cave').t1-10,5,u=>Math.cos(u*9)*2.4,u=>.3+Math.abs(Math.cos(u*9))*1.6);
  ringLine(sg('sprint2').t0+20,sg('sprint2').t0+90,4,u=>Math.cos(u*10)*3,()=>.4);
  rings.slice(n0).forEach(r=>r.world='aurora');
  const n1=rings.length;
  ringArc(sg('beach2').t0+30,24,6,0,9); ringArc(sg('bridge').t0+8,30,5,0,9);   // festival petal arcs
  ringArc(sg('sprint').t0+20,26,6,1.5,8); ringLine(sg('finish').t0-40,sg('finish').t1-6,4,u=>Math.sin(u*8)*2.6);
  rings.slice(n1).forEach(r=>r.world='blossom');
})();
const ringIM=new THREE.InstancedMesh(ringGeo,MAT.gold,rings.length); ringIM.castShadow=true; ringIM.instanceMatrix.setUsage(THREE.DynamicDrawUsage); ringIM.frustumCulled=false; objs.add(ringIM);
rings.forEach(r=>{ r.pos=worldAt(r.t,r.lane,r.h+1.1); const f=frameAt(r.t); r.up=f.N.clone(); r.fwd=f.T.clone(); });
function updateRings(time){ rings.forEach((r,k)=>{ if(r.got||(r.world&&r.world!==S.destination)){ M4.makeTranslation(0,-999,0); ringIM.setMatrixAt(k,M4); return; } const q=Q4.setFromRotationMatrix(M4.makeBasis(r.fwd.clone().cross(r.up),r.up,r.fwd)); const spin=new THREE.Quaternion().setFromAxisAngle(r.up,time*3+k*.4); q.premultiply(spin); M4.compose(r.pos,q,V3.set(1,1,1)); ringIM.setMatrixAt(k,M4); }); ringIM.instanceMatrix.needsUpdate=true; }

// springs & dash pads
const springs=[], dashPads=[];
function addSpring(t,lane,power=24,world=null){ const g=new THREE.Group(); const base=meshOf(new THREE.CylinderGeometry(1.1,1.2,.5,18),MAT.springRed,0,.25,0); const coil=new THREE.Mesh(new THREE.TorusGeometry(.75,.1,8,24),MAT.rail); coil.position.y=.55; coil.rotation.x=Math.PI/2; const top=meshOf(new THREE.CylinderGeometry(1.05,1.05,.22,18),MAT.spring,0,.75,0); g.add(base,coil,top); g.userData.top=top; g.userData.coil=coil;
  const f=frameAt(t); g.position.copy(worldAt(t,lane,0)); g.quaternion.setFromRotationMatrix(M4.makeBasis(f.B.clone().negate(),f.N,f.T)); objs.add(g); springs.push({t,lane,power,mesh:g,anim:0,world}); }
function addDash(t,lane,wide=false,world=null){ const w=wide?ROAD_W*2-.4:2.8; const g=new THREE.Group(); const pad=meshOf(new RoundedBoxGeometry(w,.16,3.2,2,.05),MAT.dash,0,.08,0); g.add(pad); for(let k=-1;k<=1;k++){ const arrow=meshOf(new THREE.ConeGeometry(.5,1,3),MAT.white,k*w/3.2,.2,0); arrow.rotation.x=Math.PI/2; g.add(arrow); }
  const f=frameAt(t); g.position.copy(worldAt(t,lane,0)); g.quaternion.setFromRotationMatrix(M4.makeBasis(f.B.clone().negate(),f.N,f.T)); objs.add(g); dashPads.push({t,lane,w,mesh:g,world}); }
(()=>{ const sg=segByName;
  addDash(sg('downhill').t0+20,0,true); addDash(sg('dash').t0+30,0,true); addDash(sg('preloop').t0+6,0,true);
  addSpring(sg('postcork').t0+12,-2.6); addSpring(sg('postcork').t0+12,2.6,20);
  addDash(sg('ramp1').t0-6,0,true); addDash(sg('beach2').t0+20,2.5); addSpring(sg('beach2').t0+50,-2.8,22);
  addDash(sg('caveexit').t0+6,0,true); addDash(sg('ramp2').t0-8,0,true);
  addDash(sg('sprint').t0+20,0,true); addSpring(sg('sprint2').t0+30,-2.8,26); addSpring(sg('sprint2').t0+30,2.8,26); addDash(sg('sprint2').t0+80,0,true); addDash(sg('sprint2').t0+130,0,true);
  // world-exclusive layouts: Aurora favors springs to vault the crystals, Blossom keeps the festival pace high
  addSpring(sg('ruins').t0+26,-2,22,'aurora'); addSpring(sg('sprint2').t0+58,2,22,'aurora'); addDash(sg('raillanding').t0+12,0,true,'aurora');
  addDash(sg('beach').t0+34,0,true,'blossom'); addDash(sg('ruins2').t0+24,0,true,'blossom'); addSpring(sg('beach2').t0+72,0,24,'blossom');
})();

// world-specific challenges — Aurora: ice crystals to jump/roll through; Blossom: lantern gates that grant a glow boost
const iceHazards=[];
(()=>{ const sg=segByName; const spots=[[sg('downhill').t0+55,-1.8],[sg('dash').t0+18,1.6],[sg('postcork').t0+20,0],[sg('beach').t0+16,-2.2],[sg('beach2').t0+42,1.8],[sg('ruins').t0+30,0],[sg('sprint').t0+40,-1.6],[sg('sprint2').t0+64,2],[sg('sprint2').t0+116,-2]];
  for(const [t,lane] of spots){ const g=new THREE.Group(); for(let j=0;j<3;j++){ const h=1.1+(j%2)*.7; const m=new THREE.Mesh(new THREE.CylinderGeometry(0,.5,h,5),iceMat); m.position.set((j-1)*.6,h/2,(j-1)*.3); m.rotation.z=(j-1)*.22; m.castShadow=true; g.add(m); }
    const f=frameAt(t); g.position.copy(worldAt(t,lane,0)); g.quaternion.setFromRotationMatrix(M4.makeBasis(f.B.clone().negate(),f.N,f.T)); g.visible=false; objs.add(g); iceHazards.push({t,lane,mesh:g,fxT:0}); } })();
const lanternGates=[];
(()=>{ const sg=segByName; const spots=[sg('start').t0+30,sg('downhill').t0+70,sg('dash').t0+40,sg('beach').t0+26,sg('beach2').t0+60,sg('bridge').t0+20,sg('sprint').t0+30,sg('sprint2').t0+40,sg('sprint2').t0+100,sg('finish').t0+10];
  for(const t of spots){ const g=new THREE.Group(); for(let j=-2;j<=2;j++){ const l=new THREE.Mesh(new THREE.SphereGeometry(.42,10,8),lanternMat); l.scale.y=1.25; l.position.set(j*1.9,2.1+Math.abs(j)*.55,0); g.add(l); }
    const f=frameAt(t); g.position.copy(worldAt(t,0,0)); g.quaternion.setFromRotationMatrix(M4.makeBasis(f.B.clone().negate(),f.N,f.T)); g.visible=false; objs.add(g); lanternGates.push({t,mesh:g}); } })();

// enemies (werewolf hover-drones for homing chains, scouts on the ground)
const enemies=[];
function addEnemy(t,lane,h,hover=true,world=null){ const m=buildWerewolf(hover); const f=frameAt(t); m.position.copy(worldAt(t,lane,h)); m.quaternion.setFromRotationMatrix(M4.makeBasis(f.B.clone().negate(),f.N,f.T)); m.rotateY(Math.PI); objs.add(m); enemies.push({t,lane,h,hover,mesh:m,alive:true,ph:rnd(TAU),t0:t,world}); }
(()=>{ const sg=segByName; const c=sg('chain'); for(let k=0;k<5;k++) addEnemy(c.t0+4+k*8,(k%2?2.2:-2.2)*(k===4?0:1),3.5+Math.sin(k)*1.4);
  addEnemy(sg('rails').t0+60,0,3.6); addEnemy(sg('rails').t0+95,0,4.2);
  addEnemy(sg('ruins').t0+22,-1.5,0,false); addEnemy(sg('ruins2').t0+30,2,0,false); addEnemy(sg('cave').t0+55,0,0,false);
  const w=sg('waterfall'); addEnemy(w.t0+14,-1.5,6,true); addEnemy(w.t0+26,1.5,7.5,true); addEnemy(w.t0+38,0,6.5,true);
  addEnemy(sg('sprint2').t0+50,-2,0,false); addEnemy(sg('sprint2').t0+100,2.4,0,false); addEnemy(sg('sprint2').t0+104,-2.4,0,false);
  // world-exclusive patrols
  addEnemy(sg('cave').t0+80,0,4.2,true,'aurora'); addEnemy(sg('postwall').t0+12,-1.5,5,true,'aurora'); addEnemy(sg('sprint2').t0+80,1.5,3.8,true,'aurora');
  addEnemy(sg('beach2').t0+34,-1.5,3.6,true,'blossom'); addEnemy(sg('sprint').t0+46,1.5,0,false,'blossom'); })();
function updateEnemies(time,dt,players){ for(const e of enemies){ if(!e.alive||(e.world&&e.world!==S.destination)){ continue; } const f=frameAt(e.t); if(e.hover){ const bob=Math.sin(time*2+e.ph)*.5; e.mesh.position.copy(worldAt(e.t,e.lane,e.h+bob)); e.mesh.userData.body.rotation.z=Math.sin(time*3+e.ph)*.1; } else { // scouts prowl toward the nearest player
    const near=players.reduce((a,p)=>Math.abs(p.t-e.t)<Math.abs(a.t-e.t)?p:a,players[0]); if(near.t<e.t && e.t-near.t<60) e.t-=6*dt; else if(e.t<e.t0) e.t+=2*dt; e.mesh.position.copy(worldAt(e.t,e.lane,0)); const ph=time*9; if(e.mesh.userData.legs) e.mesh.userData.legs.forEach((l,i)=>l.rotation.x=Math.sin(ph+i*Math.PI)*.8); e.mesh.userData.body.position.y=Math.abs(Math.sin(ph))*.08; }
  e.mesh.quaternion.setFromRotationMatrix(M4.makeBasis(f.B.clone().negate(),f.N,f.T)); e.mesh.rotateY(Math.PI); } }
function killEnemy(e,p){ e.alive=false; e.mesh.visible=false; burst(e.mesh.position,26,9,0x9a8fb0,.8,1.3,-6); burst(e.mesh.position,10,7,0xff5a5a,.6,1,-4); if(e.hover) burst(e.mesh.position,12,6,0x5fe8ff,.5,.8,-2); }

// birds (three flocks that scatter)
const birdGeo=(()=>{ const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute([-.5,0,0, 0,0,.15, 0,0,-.15, 0,0,.15, .5,0,0, 0,0,-.15],3)); g.computeVertexNormals(); return g; })();
const flocks=[]; function addFlock(t,side,count=16){ const f=frameAt(t); const base=worldAt(t,side*(ROAD_W+6),1.5); const im=new THREE.InstancedMesh(birdGeo,MAT.bird,count); im.frustumCulled=false; objs.add(im); const birds=[]; for(let k=0;k<count;k++){ const b={p:base.clone().add(new THREE.Vector3(rnd(6)-3,rnd(1.5),rnd(6)-3)),v:new THREE.Vector3(),ph:rnd(TAU),fly:false}; birds.push(b); M4.compose(b.p,Q4.setFromEuler(E3.set(0,rnd(TAU),0)),V3.set(1,1,1)); im.setMatrixAt(k,M4); } flocks.push({t,im,birds,triggered:false,side}); }
(()=>{ const sg=segByName; addFlock(sg('start').t0+40,-1); addFlock(SEGS.find(s=>s.type==='wall').t0-8,-1,20); addFlock(sg('ramp2').t0,1,22); addFlock(sg('beach').t0+10,1,14); })();
function updateFlocks(time,dt,players){ for(const F of flocks){ if(!F.triggered && players.some(p=>Math.abs(p.t-F.t)<12)){ F.triggered=true; SFX.birds(); F.birds.forEach(b=>{ b.fly=true; b.v.set(rnd(6)-3,7+rnd(6),rnd(6)-3); b.v.addScaledVector(frameAt(F.t).B,F.side*3); }); }
  F.birds.forEach((b,k)=>{ if(b.fly){ b.v.y=damp(b.v.y,3,1,dt); b.v.x+=Math.sin(time*2+b.ph)*3*dt; b.p.addScaledVector(b.v,dt); } const flap=b.fly?Math.sin(time*18+b.ph):0; M4.compose(b.p,Q4.setFromEuler(E3.set(0,Math.atan2(b.v.x,b.v.z),0)),V3.set(1,1,1)); const m2=new THREE.Matrix4().makeRotationZ(flap*.9); M4.multiply(m2); F.im.setMatrixAt(k,M4); }); F.im.instanceMatrix.needsUpdate=true; } }

// speed streaks around the camera
const streaks=new THREE.Group(); camera.add(streaks); scene.add(camera);
const streakMat=new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0,depthWrite:false,fog:false});
const streakList=[]; for(let i=0;i<46;i++){ const m=new THREE.Mesh(new THREE.BoxGeometry(.03,.03,1),streakMat); const a=rnd(TAU), r=2.2+rnd(4); m.position.set(Math.cos(a)*r,Math.sin(a)*r*.7,-10-rnd(16)); streaks.add(m); streakList.push(m); }
function updateStreaks(speed,dt){ const k=smoothstep(20,38,speed); streakMat.opacity=k*.55; for(const m of streakList){ m.position.z+=speed*2.2*dt; m.scale.z=lerp(2,9,k); if(m.position.z>-3){ const a=rnd(TAU), r=2.2+rnd(4); m.position.set(Math.cos(a)*r,Math.sin(a)*r*.7,-24-rnd(6)); } } }

/* =====================================================================
   PLAYERS
   ===================================================================== */
const GRAV=22, GLIDE_G=9, JUMP_V=12.5, MAXSPD=40;
for(const s of SEGS){ if(s.type==='gap'){ const rampT=FR.P[s.start-1].clone().sub(FR.P[s.start-5]).normalize(); s.launch=Math.max(0,rampT.y-FR.T[Math.min(s.end,s.start+3)].y); } }
function makePlayer(key,idx){ const rig=buildRunner(key); scene.add(rig); const buddy=HERO[key].buddy==='wolfie'?buildWolfie():HERO[key].buddy==='bunny'?buildBunny():null; if(buddy) scene.add(buddy);
  const aura=new THREE.Mesh(new THREE.ConeGeometry(.9,3.4,14,1,true),new THREE.MeshBasicMaterial({color:0x8fefff,transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false,fog:false})); aura.rotation.x=-Math.PI/2; aura.position.set(0,.8,-1.4); rig.add(aura);
  const trail=new THREE.Mesh(new THREE.PlaneGeometry(.5,3),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false})); trail.position.set(0,.9,-1.8); rig.add(trail);
  if(S.players>1){ const c=document.createElement('canvas'); c.width=256; c.height=80; const g=c.getContext('2d'); g.fillStyle='rgba(20,30,40,.7)'; g.beginPath(); g.roundRect(8,8,240,64,32); g.fill(); g.fillStyle=HERO[key].css; g.beginPath(); g.arc(44,40,16,0,TAU); g.fill(); g.fillStyle='#fff'; g.font='bold 36px Nunito,sans-serif'; g.fillText(HERO[key].name,72,53); const tx=new THREE.CanvasTexture(c); tx.colorSpace=THREE.SRGBColorSpace; const tag=new THREE.Sprite(new THREE.SpriteMaterial({map:tx,transparent:true,depthTest:false})); tag.scale.set(2.6,.8,1); tag.position.y=2.75; rig.add(tag);rig.userData.nameTag=tag; }
  return { key,idx,hero:HERO[key],rig,buddy,aura,trail,t:6+idx*0,lane:S.players===3?(idx-1)*2.8:S.players===2?(idx?2.4:-2.4):0,h:0,vh:0,speed:0,speedFloor:0,floorT:0,state:'idle',air:false,boost:1,boosting:false,rings:0,chain:0,bestChain:0,chainT:0,top:0,stumbleT:0,chargeT:0,rollT:0,homing:null,homingU:0,driftDir:0,anim:{},phase:0,time:0,speedNorm:0,laneVel:0,landT:0,steer:0,armsUp:false,armsOut:false,squat:false,jumpEdge:false,speedIn:0,buddyT:0,buddyH:0,buddyLane:0,railSfxT:0,dashCd:0,finished:false,fellT:0,gapEntered:null,lastSeg:null,invT:0,prevTy:0 }; }
const players=[]; let camState={pos:new THREE.Vector3(0,130,-20),look:worldAt(55,0,0),up:new THREE.Vector3(0,1,0),fov:62,shake:0,mode:'attract',orbit:0};
camera.position.copy(worldAt(8,-18,15));
function readInput(p){ if(S.input==='keys'){ const KEY=KEYS[p.idx]; p.steer=(KEY.r?1:0)-(KEY.l?1:0); p.speedIn=KEY.fast?1:.72; p.jumpEdge=KEY.jumpEdge; KEY.jumpEdge=false; p.squat=KEY.squat; p.armsUp=KEY.up; p.armsOut=KEY.out; return; }
  const b=bodies[p.idx]; if(!b.seen){ p.steer=damp(p.steer,0,4,.033); p.speedIn=damp(p.speedIn,0,.8,.033); p.jumpEdge=false; p.squat=false; p.armsUp=false; p.armsOut=false; return; }
  p.steer=b.lean; p.speedIn=b.speedIn; p.jumpEdge=b.jumpEdge; b.jumpEdge=false; p.squat=b.squat; p.armsUp=b.armsUp; p.armsOut=b.armsOut; }
const _f=frameAt(0), _w=new THREE.Vector3();
function updatePlayer(p,dt,time){
  p.time+=dt; if(p.finished){ updateCelebration(p,dt); placePlayer(p,time,dt); return; }
  readInput(p);
  if(updateEncounterBefore(p,dt,time)){placePlayer(p,time,dt);return;}
  const previousT=p.t;
  const seg=segAt(p.t); const f=frameAt(p.t,_f); const onRail=seg.type==='rail', onWall=seg.type==='wall', inGap=seg.type==='gap', inLoop=seg.type==='loop'||seg.type==='cork';
  // ---- speed
  const stumbling=p.stumbleT>0; if(stumbling) p.stumbleT-=dt; if(p.invT>0) p.invT-=dt;
  // cruise + pace: the hero always jogs at a base speed; the player's own pace adds or removes the rest
  const BASE=13; let target=BASE+p.speedIn*18; // wider gap between jogging and sprinting so effort reads on screen
  if(p.state==='charge'){ p.speed=damp(p.speed,0,6,dt); }
  else {
    const slope=-f.T.y; // + downhill
    let accel = target>p.speed ? 6 : 4;
    if(p.rollT>0) { target=Math.max(target,p.speed)+ (-f.T.y>0.05?4:0); accel=.6; }
    if(p.air) accel=.6; // no changing speed mid-air
    p.speed=damp(p.speed,target,accel,dt);
    if(!p.air) p.speed+=slope*GRAV*.12*dt*(p.rollT>0?2.5:1);
    if(p.floorT>0){ p.floorT-=dt; p.speed=Math.max(p.speed,p.speedFloor*Math.min(1,p.floorT/.8)); }
    if(onRail && p.armsOut){ p.speed+=4*dt; p.boost=Math.min(1,p.boost+.15*dt); }
    if(onWall && p.steer*seg.meta.side<-.3) p.speed+=3*dt;
    // boost (arms up with meter)
    p.boost=Math.min(1,p.boost+.2*dt); // recharges by itself (rings top it up faster)
    p.boosting = p.armsUp && p.boost>0.05 && !p.air && !stumbling;
    if(p.boosting){ p.boost=Math.max(0,p.boost-.35*dt); p.speed=Math.max(p.speed,damp(p.speed,MAXSPD,4,dt)); p.speed=Math.min(MAXSPD+2,p.speed+30*dt); if(!p.wasBoosting){ SFX.boost(); toast('BOOST!'); } }
    p.wasBoosting=p.boosting;
    if(stumbling) p.speed=Math.min(p.speed,8);
    p.speed=clamp(p.speed,0,MAXSPD+2);
  }
  // ---- rolling (squat while fast on the ground) & spin dash charge
  if(!p.air && !onRail && p.squat && p.speed>7 && p.state!=='charge'){ if(p.rollT<=0){ p.speed+=3; SFX.dash(); burst(worldAt(p.t,p.lane,.3),10,6,0xffd27a,.5,1,-6,f.T.clone().negate()); } p.rollT=Math.max(p.rollT,.45); }
  if(!p.air && p.squat && p.speed<=7 && p.state!=='charge' && p.rollT<=0){ p.state='charge'; p.chargeT=0; }
  if(p.state==='charge'){ p.chargeT+=dt; if(Math.floor(p.chargeT*8)!==Math.floor((p.chargeT-dt)*8)) { SFX.charge(Math.min(1,p.chargeT/1.4)); burst(worldAt(p.t,p.lane,.4),2,4,0xffe08a,.35,.7,-3); }
    if(!p.squat || p.chargeT>2.4){ const c=clamp(p.chargeT/1.4,.3,1); p.speed=Math.max(p.speed,16+c*16); p.rollT=1.1; p.state='roll'; SFX.dash(); burst(worldAt(p.t,p.lane,.3),22,9,0xffd27a,.6,1.2,-6,f.T.clone().negate()); camState.shake=.35; } }
  if(p.rollT>0){ p.rollT-=dt; }
  if(p.slowT>0){p.speed=Math.min(p.speed,8);p.boosting=false;p.floorT=0;}
  // ---- lateral steering
  if(onRail && S.players===3){p.lane=damp(p.lane,(p.idx-1)*RAIL_X,9,dt);p.laneVel=0;}
  else if(onRail){ const targetX=Math.sign(p.lane||1)*RAIL_X; if(Math.abs(p.steer)>.6 && Math.sign(p.steer)!==Math.sign(targetX) && p.h<.1 && !p.air){ p.lane=-targetX*.2; p.vh=6; p.air=true; SFX.jump(); }
    p.lane=damp(p.lane, Math.sign(p.lane||1)*RAIL_X, 9, dt); p.laneVel=0; }
  else { const width=2*ROAD_W/S.players; const bandL=-ROAD_W+p.idx*width+.25, bandR=-ROAD_W+(p.idx+1)*width-.25;
    const wantV=p.steer*lerp(5,8.5,p.speedNorm); const grip=seg.meta.biome==='aurora'?2.6:7; // Aurora's icy road answers the steering slowly
    p.laneVel=damp(p.laneVel,wantV,grip,dt); p.lane+=p.laneVel*dt;
    if(seg.meta.biome==='blossom' && !p.air) p.lane+=Math.sin(time*.55+p.idx*2.1)*.4*dt; // petal breeze drifts the racers
    if(p.lane<bandL){p.lane=bandL;p.laneVel*=-.2;} if(p.lane>bandR){p.lane=bandR;p.laneVel*=-.2;} }
  // drift: strong steering through a turn while fast
  const nextF=frameAt(p.t+6); const turn=f.T.clone().cross(nextF.T).y; // + = turning left
  const drifting = !p.air && !onRail && Math.abs(turn)>.045 && Math.abs(p.steer)>.5 && p.speed>18 && Math.sign(p.steer)===-Math.sign(turn);
  if(drifting){ p.driftDir=Math.sign(p.steer); p.speed+=1.5*dt; if(Math.random()<.6) emit(worldAt(p.t,p.lane+p.driftDir*.4,.1),new THREE.Vector3(rnd(2)-1,2+rnd(2),rnd(2)-1),.35,0xffe9a8,.7,-6); }
  // ---- vertical
  const wasAir=p.air;
  if(p.jumpEdge && !p.air && !stumbling && p.state!=='charge'){ p.vh=JUMP_V + Math.min(4,p.speed*.08); p.air=true; SFX.jump(); burst(worldAt(p.t,p.lane,.1),10,4,0xf1e2b8,.5,.8,-8); p.rollT=0; }
  else if(p.jumpEdge && p.air && !p.homing){ tryHoming(p,26); }
  if(p.air && !p.homing && p.h>.6){ const e=nearestEnemy(p,7); if(e) startHoming(p,e); }
  // entering a gap from a ramp: convert the slope into launch velocity
  if(inGap && p.lastSeg && p.lastSeg.type!=='gap'){ p.vh=Math.max(p.vh, p.speed*(seg.launch||0)*1.25); p.air=true; camState.shake=.15; }
  p.lastSeg=seg; p.prevTy=f.T.y;
  if(p.homing){ p.homingU+=dt/.24; const e=p.homing; const u=smoothstep(0,1,Math.min(1,p.homingU)); p.t=lerp(p.hs.t,e.t,u); p.lane=lerp(p.hs.lane,e.lane,u); p.h=lerp(p.hs.h,e.h+.6,u);
    if(p.homingU>=1){ killEnemy(e,p); p.homing=null; p.vh=11; p.air=true; p.chain++; p.chainT=2.2; p.bestChain=Math.max(p.bestChain,p.chain); SFX.hit(p.chain); camState.shake=.25; if(p.chain>=2) toast(`Combo ×${p.chain}!`); if(p.chain>=3) p.boost=Math.min(1,p.boost+.15); } }
  else {
    if(p.air){ const g=(p.armsUp && p.vh<2)?GLIDE_G:GRAV; p.vh-=g*dt; p.h+=p.vh*dt; if(p.h<=0 && !inGap){ p.h=0; p.air=false; p.vh=0; p.landT=.18; SFX.land(); burst(worldAt(p.t,p.lane,.05),12,5,0xf1e2b8,.5,.9,-8); camState.shake=Math.max(camState.shake,.1); } else if(inGap && p.h<-6){ fell(p,seg); } }
    else { p.h=0; p.vh=0; if(inGap){ p.air=true; } }
    p.t+=p.speed*dt;
  }
  if(p.chainT>0){ p.chainT-=dt; if(p.chainT<=0) p.chain=0; }
  if(p.landT>0) p.landT-=dt;
  // ---- collisions with objects
  for(const r of rings){ if(!r.got && (!r.world||r.world===S.destination) && Math.abs(r.t-p.t)<1.7 && Math.abs(r.lane-p.lane)<1.5 && Math.abs(r.h-p.h)<1.8){ r.got=true; p.rings++; p.boost=Math.min(1,p.boost+.06); SFX.ring(p.rings); burst(r.pos,8,4,0xffd54a,.5,.8,-2); } }
  if(!p.air) for(const s of springs){ if(s.world&&s.world!==S.destination) continue; if(Math.abs(s.t-p.t)<1.4 && Math.abs(s.lane-p.lane)<1.5){ p.vh=s.power; p.air=true; p.h=.2; p.speed=Math.max(p.speed,18); s.anim=1; SFX.spring(); p.state='spring'; p.springT=.5; burst(s.mesh.position,14,6,0xffd23a,.5,1,-6); } }
  if(!p.air) for(const d of dashPads){ if(d.world&&d.world!==S.destination) continue; if(Math.abs(d.t-p.t)<1.6 && Math.abs(d.lane-p.lane)<d.w/2+.6 && p.dashCd<=0){ p.speed=Math.max(p.speed,29); p.speedFloor=28; p.floorT=2.4; p.dashCd=1; SFX.dash(); burst(worldAt(p.t,p.lane,.4),16,8,0x7ff0ff,.5,1,-3,f.T.clone().negate()); camState.shake=.2; toast('DASH!'); } }
  p.dashCd=(p.dashCd??0)-dt;
  if(S.destination==='aurora' && !p.air) for(const hz of iceHazards){ if(Math.abs(hz.t-p.t)<1.5 && Math.abs(hz.lane-p.lane)<1.4){ const attacking=p.rollT>0||p.boosting||p.state==='roll'; if(attacking){ if(p.time>hz.fxT){ hz.fxT=p.time+.8; burst(hz.mesh.position,16,7,0x9ef5ee,.6,1,-6); SFX.hit(1); } } else if(p.invT<=0){ stumble(p); toast('Icy! Jump or roll through!'); } } }
  if(S.destination==='blossom'){ p.gateCd=(p.gateCd??0)-dt; for(const g of lanternGates){ if(p.gateCd<=0 && Math.abs(g.t-p.t)<1.6 && p.h<3.2){ p.gateCd=1; p.speed=Math.min(MAXSPD+2,p.speed+5); p.boost=Math.min(1,p.boost+.25); SFX.spring(); toast('Lantern glow!'); burst(worldAt(g.t,p.lane,2.2),14,6,0xffcc7a,.6,1,-3); } } }
  for(const e of enemies){ if(!e.alive||(e.world&&e.world!==S.destination)) continue; if(Math.abs(e.t-p.t)<1.6 && Math.abs(e.lane-p.lane)<1.6 && Math.abs(e.h-p.h)<1.8){ const attacking=p.rollT>0||p.boosting||p.homing||(p.air&&p.vh<0)||p.state==='roll'; if(attacking){ killEnemy(e,p); p.chain++; p.chainT=2.2; p.bestChain=Math.max(p.bestChain,p.chain); SFX.hit(p.chain); if(p.air){p.vh=10;} camState.shake=.2; } else if(p.invT<=0){ stumble(p); } } }
  // planks fall behind
  for(const pl of bridgePlanks){ if(!pl.userData.fallen && p.t-pl.userData.t>1.8){ pl.userData.fallen=true; pl.userData.vel=0; SFX.land(); } }
  updateEncounterAfter(p,previousT,dt,time);
  // ---- states
  if(p.state==='spring'){ p.springT-=dt; if(p.springT>0){} else p.state='jump'; }
  else if(p.state==='charge'){ }
  else if(stumbling) p.state='stumble';
  else if(p.homing) p.state='homing';
  else if(p.rollT>0) p.state='roll';
  else if(p.air) p.state=p.vh>1?'jump':'fall';
  else if(onRail) p.state='grind';
  else if(p.landT>0) p.state='land';
  else if(p.boosting) p.state='boost';
  else if(drifting) p.state='drift';
  else if(onWall) p.state='wall';
  else if(p.speed>.6) p.state='run';
  else p.state='idle';
  p.speedNorm=clamp(p.speed/30,0,1); p.top=Math.max(p.top,p.speed);
  // rail sparks & sfx
  if(onRail && !p.air){ if(Math.random()<.8) emit(worldAt(p.t,p.lane,.05),new THREE.Vector3(rnd(2)-1,1+rnd(3),rnd(2)-1).sub(f.T.clone().multiplyScalar(4)),.3,0xfff1b0,.5,-10); p.railSfxT-=dt; if(p.railSfxT<=0){ SFX.rail(); p.railSfxT=.28; } }
  if(p.state==='wall' && Math.random()<.5) emit(worldAt(p.t,p.lane,.05),new THREE.Vector3(rnd(1)-.5,rnd(1),rnd(1)-.5).add(f.N.clone().multiplyScalar(2)),.4,0xd9c9a8,.6,-4);
  // ground dust + boost debris
  if(!p.air && p.speed>10 && Math.random()<p.speedNorm*.9 && !onRail){ emit(worldAt(p.t,p.lane+rnd(.8)-.4,.05),f.N.clone().multiplyScalar(1+rnd(2)).sub(f.T.clone().multiplyScalar(2+rnd(3))),.45,0xe8d9b8,.8,-2); }
  if(p.boosting && Math.random()<.8){ emit(worldAt(p.t-1,p.lane+rnd(2)-1,rnd(1.2)),f.N.clone().multiplyScalar(2+rnd(4)).sub(f.T.clone().multiplyScalar(6+rnd(8))),.6,Math.random()<.5?0x7bd35a:0x9c6b3c,.9,-9); }
  if(p.t>finishT && !p.finished){ finishPlayer(p); }
  placePlayer(p,time,dt);
}
function nearestEnemy(p,range){ let best=null,bd=1e9; for(const e of enemies){ if(!e.alive||(e.world&&e.world!==S.destination)) continue; const d=e.t-p.t; if(d<-2||d>range) continue; if(Math.abs(e.h-p.h)>9) continue; const sc=d+Math.abs(e.lane-p.lane)*.5; if(sc<bd){bd=sc;best=e;} } return best; }
function tryHoming(p,range){ const e=nearestEnemy(p,range); if(e) startHoming(p,e); else { p.vh=Math.max(p.vh,3); } }
function startHoming(p,e){ p.homing=e; p.homingU=0; p.hs={t:p.t,lane:p.lane,h:p.h}; SFX.homing(); }
function stumble(p){ p.stumbleT=.9; p.invT=2; p.rollT=0; p.boosting=false; SFX.hurt(); camState.shake=.4; const lost=Math.min(p.rings,6); p.rings-=lost; for(let k=0;k<lost;k++) emit(worldAt(p.t,p.lane,1),new THREE.Vector3(rnd(8)-4,6+rnd(4),rnd(8)-4),1,0xffd54a,1.4,-12); toast('Oops!'); }
function fell(p,seg){ SFX.splash(); burst(worldAt(p.t,p.lane,p.h),30,8,0xbfefff,.9,1.4,-8); p.t=seg.t1+3; p.h=0; p.vh=0; p.air=false; p.speed=9; p.stumbleT=.7; p.invT=2; p.homing=null; toast('Almost! Jump on the ramp!'); camState.shake=.5; }
// After the line: run out past the flags, then bounce on the spot with confetti while the others come in.
function updateCelebration(p,dt){ p.celebT=(p.celebT??0)+dt; p.state='victory';
  p.speed=damp(p.speed,p.celebT<1.2?7:0,2.5,dt); p.t=Math.min(p.t+p.speed*dt,finishT+24+p.idx*2);
  if(p.speed<5){ const hop=Math.abs(Math.sin(p.celebT*4.4)); p.h=hop*1.2; p.vh=0;
    if(hop>.96 && p.celebT-(p.confT??0)>.5){ p.confT=p.celebT; burst(worldAt(p.t,p.lane,2.2),16,7,[0xffd54a,0x8fd3be,0xf2795b][p.idx]||0xffd54a,.9,1.2,-7); } } }
function finishPlayer(p){ p.finished=true; p.finishTime=now()-runStart; p.place=players.filter(q=>q.finished).length; if(S.players>1) toast(`${p.hero.name} finishes ${['1st!','2nd!','3rd!'][p.place-1]}`); SFX.goal(); burst(worldAt(p.t,p.lane,3),60,12,0xffd54a,1.6,1.6,-6); burst(worldAt(p.t,p.lane,3),40,10,0x8fd3be,1.6,1.4,-6); }
const _q=new THREE.Quaternion(), _m=new THREE.Matrix4(), _x=new THREE.Vector3();
function placePlayer(p,time,dt){
  const f=frameAt(p.t,_f); const pos=worldAt(p.t,p.lane,p.h,_w);
  p.rig.position.copy(pos); _x.copy(f.B).negate(); _m.makeBasis(_x,f.N,f.T); _q.setFromRotationMatrix(_m);
  // bank into lane changes and drift
  const bank=new THREE.Quaternion().setFromAxisAngle(f.T, p.laneVel*.045 + (p.state==='drift'?p.driftDir*.35:0));
  const pitch=new THREE.Quaternion().setFromAxisAngle(f.B, p.air?clamp(-p.vh*.02,-.35,.35):0);
  _q.premultiply(bank).premultiply(pitch);
  p.rig.quaternion.slerp(_q,1-Math.exp(-14*dt));
  animateNinja(p.rig,p,dt);poseCombatHero(p);
  p.aura.material.opacity=damp(p.aura.material.opacity,p.boosting?.45:0,8,dt); p.aura.scale.set(1,1,lerp(.6,1.6,p.speedNorm)); p.aura.rotation.z+=dt*6;
  p.trail.material.opacity=damp(p.trail.material.opacity,(p.speed>24&&!p.air)?.22:0,6,dt); p.trail.scale.y=lerp(.5,1.4,p.speedNorm);
  // buddy runs alongside
  if(!p.buddy) return;
  const seg=segAt(p.t); const onRail=seg.type==='rail'; const side=p.idx?1:-1;
  const wantLane=onRail? -Math.sign(p.lane||1)*RAIL_X : clamp(p.lane+side*1.9,-ROAD_W+.5,ROAD_W-.5);
  p.buddyLane=damp(p.buddyLane,wantLane,6,dt); p.buddyT=damp(p.buddyT,p.t-2.4,5,dt); if(p.t-p.buddyT>14) p.buddyT=p.t-6;
  const bh=Math.max(0,p.h*.7)+(p.buddy.userData.hop||0); p.buddyH=damp(p.buddyH,bh,10,dt);
  const bf=frameAt(p.buddyT); p.buddy.position.copy(worldAt(p.buddyT,p.buddyLane,p.buddyH)); _x.copy(bf.B).negate(); _m.makeBasis(_x,bf.N,bf.T); _q.setFromRotationMatrix(_m); p.buddy.quaternion.slerp(_q,1-Math.exp(-12*dt)); p.buddy.rotation.x+=0;
  animateBuddy(p.buddy,p,dt);
}

/* =====================================================================
   CAMERA
   ===================================================================== */
const _cf=frameAt(0), _cp=new THREE.Vector3(), _cl=new THREE.Vector3(), _cu=new THREE.Vector3(), WUP=new THREE.Vector3(0,1,0);
function updateCamera(dt,time,focusPlayer=null){
  if(camState.mode==='attract'){ const t=25+Math.sin(time*.08)*9; camera.userData.attractT=t; const f=frameAt(t,_cf); _cp.copy(f.p).addScaledVector(f.N,15).addScaledVector(f.B,-18+Math.sin(time*.1)*3).addScaledVector(f.T,-17); const l=frameAt(t+30,_cf); camera.position.lerp(_cp,1-Math.exp(-2*dt)); camState.look.lerp(l.p,1-Math.exp(-2*dt)); camera.up.lerp(WUP,.1).normalize(); camera.lookAt(camState.look); camera.fov=damp(camera.fov,66,2,dt); camera.updateProjectionMatrix(); return; }
  const lead=focusPlayer||players.reduce((a,p)=>p.t>a.t?p:a,players[0]); const trail=focusPlayer||players.reduce((a,p)=>p.t<a.t?p:a,players[0]); const raceWide=S.players>1&&!focusPlayer; const gap2=raceWide?Math.min(60,lead.t-trail.t):0;
  const focusT = raceWide ? trail.t : lead.t; const focusLane = raceWide ? 0 : lead.lane;
  const spd=lead.speed, sn=clamp(spd/30,0,1); const seg=segAt(focusT); const f=frameAt(focusT,_cf);
  if(camState.mode==='victory'){ camState.orbit+=dt*.7; const c=worldAt(lead.t,lead.lane,0); camera.position.lerp(c.clone().add(new THREE.Vector3(Math.sin(camState.orbit)*6.5,2.3,Math.cos(camState.orbit)*6.5)),1-Math.exp(-3*dt)); camState.look.lerp(c.clone().add(new THREE.Vector3(0,.15,0)),1-Math.exp(-4*dt)); camera.up.lerp(WUP,.1).normalize(); camera.lookAt(camState.look); camera.fov=damp(camera.fov,50,2,dt); camera.updateProjectionMatrix(); return; } // aim low so the hopping hero sits above the score card
  // over-the-shoulder chase: close, low, locked to the runner's lane, runner sits in the lower third of the frame
  let back=lerp(5.2,7.4,sn), up=lerp(2.3,2.7,sn), sideOff=focusLane, wantUp=_cu.copy(f.N).lerp(WUP,.3).normalize(), lookAhead=11+sn*7, lookUp=2.2;
  if(seg.type==='loop'||seg.type==='cork'){ const u=(focusT-seg.t0)/(seg.t1-seg.t0); const w=Math.sin(u*Math.PI); back=lerp(6,5,w); sideOff=focusLane+(seg.type==='loop'?-1:1)*3*w; up=2.6; wantUp.copy(f.N).lerp(WUP,.15).normalize(); lookAhead=lerp(11,6,w); }
  else if(seg.type==='rail'){ back=6.5; up=2.4; wantUp.copy(f.N).lerp(WUP,.4).normalize(); }
  else if(seg.type==='wall'){ back=7; up=4.5; sideOff=focusLane-1; wantUp.copy(f.N).lerp(WUP,.4).normalize(); }
  else if(seg.type==='gap'){ back=8.5; up=3.4; lookUp=lead.h*.5+1.2; wantUp.copy(WUP).lerp(f.N,.4).normalize(); }
  else if(seg.type==='cave'){ back=6; up=2.3; }
  if(raceWide){ back+=3+gap2*.12; up+=1.2+gap2*.07; lookAhead=8+gap2*.5; lookUp=2.2+gap2*.05; }
  if(lead.encounter?.type==='chase'){back=Math.min(24,lead.encounter.gap+5);up=5;lookAhead=7;lookUp=1.5;}
  if(lead.encounter?.type==='combat'){back=5.4;up=2.8;sideOff=focusLane+2;lookAhead=1.7;lookUp=1.2;}
  if(S.phase==='count'){ back=focusPlayer?7:18; up=focusPlayer?3:7; sideOff=focusPlayer?focusLane:10; lookAhead=focusPlayer?5:28; }
  _cp.copy(f.p).addScaledVector(f.T,-back).addScaledVector(f.N,up+lead.h*.35).addScaledVector(f.B,sideOff);
  const lf=frameAt(focusT+lookAhead); _cl.copy(lf.p).addScaledVector(lf.N,lookUp+lead.h*.4).addScaledVector(lf.B,focusLane*.9);
  const k=S.phase==='count'?1.5:(seg.type==='gap'?6:11);
  camera.position.lerp(_cp,1-Math.exp(-k*dt)); camState.look.lerp(_cl,1-Math.exp(-(k+2)*dt));
  camera.up.lerp(wantUp,1-Math.exp(-5*dt)).normalize();
  // banking with lateral velocity
  const bankQ=new THREE.Quaternion().setFromAxisAngle(f.T,-lead.laneVel*.012);
  camera.up.applyQuaternion(bankQ);
  if(camState.shake>0){ camState.shake=Math.max(0,camState.shake-dt*1.8); const s=camState.shake*.25; camera.position.add(new THREE.Vector3(rnd(s*2)-s,rnd(s*2)-s,rnd(s*2)-s)); }
  camera.lookAt(camState.look);
  const wantFov=58+16*smoothstep(14,34,spd)+(lead.boosting?5:0)+(seg.type==='gap'?3:0)+(S.players>1?4:0);
  camera.fov=damp(camera.fov,wantFov,6,dt); camera.updateProjectionMatrix();
  if(!focusPlayer)updateStreaks(spd,dt);
  $('speedlines').style.opacity=smoothstep(22,40,spd)*.9;
}

/* =====================================================================
   HUD, PROMPTS, COACH
   ===================================================================== */
const ICON={
  jump:'<circle cx="50" cy="26" r="9" fill="#fff"/><path d="M50 36v22M50 40l-14 14M50 40l14 14M50 58l-10 20M50 58l10 20" stroke="#fff" stroke-width="7" stroke-linecap="round" fill="none"/><path d="M22 30l-10-14M78 30l10-14" stroke="#E6B54A" stroke-width="6" stroke-linecap="round"/>',
  squat:'<circle cx="50" cy="34" r="9" fill="#fff"/><path d="M50 44v14M50 48l-14 6M50 48l14 6M50 58l-14 8 8 14M50 58l14 8-8 14" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M22 74l-8 10M78 74l8 10" stroke="#E6B54A" stroke-width="6" stroke-linecap="round"/>',
  armsUp:'<circle cx="50" cy="30" r="9" fill="#fff"/><path d="M50 40v26M50 44L30 22M50 44l20-22M50 66l-10 20M50 66l10 20" stroke="#fff" stroke-width="7" stroke-linecap="round" fill="none"/>',
  armsOut:'<circle cx="50" cy="28" r="9" fill="#fff"/><path d="M50 38v26M50 44H18M50 44h32M50 64l-10 20M50 64l10 20" stroke="#fff" stroke-width="7" stroke-linecap="round" fill="none"/>',
  leanL:'<circle cx="38" cy="30" r="9" fill="#fff"/><path d="M40 40l10 24M42 46l-18 4M42 46l16 8M50 64l-6 20M50 64l12 18" stroke="#fff" stroke-width="7" stroke-linecap="round" fill="none"/><path d="M28 14l-14 8 14 8" stroke="#E6B54A" stroke-width="6" stroke-linecap="round" fill="none"/>',
  leanR:'<circle cx="62" cy="30" r="9" fill="#fff"/><path d="M60 40L50 64M58 46l18 4M58 46l-16 8M50 64l6 20M50 64l-12 18" stroke="#fff" stroke-width="7" stroke-linecap="round" fill="none"/><path d="M72 14l14 8-14 8" stroke="#E6B54A" stroke-width="6" stroke-linecap="round" fill="none"/>',
  run:'<circle cx="58" cy="24" r="9" fill="#fff"/><path d="M56 34L42 56M50 42l16 6M50 42l-16-2M42 56l-12 22M42 56l18 10 6 16" stroke="#fff" stroke-width="7" stroke-linecap="round" fill="none"/><path d="M14 40h-8M18 52h-10M14 64h-8" stroke="#E6B54A" stroke-width="5" stroke-linecap="round"/>',
};
// prompts keyed to the course
ICON.punch='<g fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round"><circle cx="38" cy="18" r="9"/><path d="M38 30v35m0-23 20 7 24-7M38 44 20 53m18 12-14 23m14-23 15 23"/></g>';
ICON.kick='<g fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round"><circle cx="35" cy="16" r="9"/><path d="M35 29v32l-10 27m10-27 25-13 24 7M35 39l-15 10m15-10 18-3"/></g>';
const PROMPTS=(()=>{ const sg=segByName; const wl=SEGS.find(s=>s.type==='wall'); return [
  {t:sg('start').t0+8,text:'RUN!',icon:'run',say:'Run, hero, run!'},
  {t:sg('downhill').t0+40,text:'SQUAT & ROLL!',icon:'squat',say:'Squat down to roll!'},
  {t:sg('dash').t1-30,text:'RUN FAST!',icon:'run',say:'Run fast for the loop!'},
  {t:sg('preloop').t0-4,text:'LOOP!',icon:'run',say:'Loop!'},
  {t:sg('railstart').t0-6,text:'ARMS OUT!',icon:'armsOut',say:'Arms out and balance!'},
  {t:sg('ramp1').t0-14,text:'JUMP!',icon:'jump',say:'Jump off the ramp, then jump again to attack!'},
  {t:sg('beach2').t0+8,text:'ARMS UP · BOOST!',icon:'armsUp',say:'Arms up to boost!'},
  {t:sg('bridge').t0-6,text:'RUN FAST!',icon:'run',say:'The bridge is falling. Run!'},
  {t:sg('ruins').t0+6,text:'SQUAT & ROLL!',icon:'squat',say:'Roll through the werewolves!'},
  {t:sg('cave').t0+30,text:'LEAN LEFT!',icon:'leanL',say:'Lean left!'},
  {t:sg('cave').t0+70,text:'LEAN RIGHT!',icon:'leanR',say:'Lean right!'},
  {t:wl.t0-10,text:'LEAN LEFT!',icon:'leanL',say:'Lean into the wall!'},
  {t:sg('ramp2').t0-16,text:'JUMP!',icon:'jump',say:'Big jump over the waterfall!'},
  {t:sg('ramp2').t1+4,text:'ARMS UP · GLIDE!',icon:'armsUp',say:'Arms up to glide!'},
  {t:sg('sprint').t0+6,text:'SPRINT!',icon:'run',say:'Final sprint! Run as fast as you can!'},
  {t:sg('sprint2').t0+60,text:'ARMS UP · BOOST!',icon:'armsUp',say:'Boost!'},
].map(p=>({...p,shown:false})); })();
let promptTimer=0, toastTimer=0;
function showPrompt(pr){ $('promptIcon').innerHTML=ICON[pr.icon]; $('promptText').textContent=pr.text; $('prompt').classList.add('on'); promptTimer=2.2; speak(pr.say); }
function toast(txt){ $('toast').textContent=txt; $('toast').classList.add('on'); toastTimer=1.1; }
function updateHUD(dt){ const lead=players.reduce((a,p)=>p.t>a.t?p:a,players[0]); const ringsTotal=players.reduce((a,p)=>a+p.rings,0);
  if(players.length>1){ $('ringsBox').className='rings two'; $('ringCount').innerHTML=players.map(p=>`<em class="${p.key}">${p.hero.name} ${p.rings}</em>`).join(''); } else { $('ringsBox').className='rings'; $('ringCount').textContent=ringsTotal; } $('zoneName').textContent=zoneAt(lead.t).name; $('progressFill').style.width=(clamp(lead.t/finishT,0,1)*100)+'%'; $('raceProgress').textContent=Math.min(100,Math.floor(lead.t/finishT*100))+'%'; const el=elapsed(); $('timer').textContent=fmtTime(el);
  const ranked=[...players].sort((a,b)=>a.finished&&b.finished?a.place-b.place:a.finished?-1:b.finished?1:b.t-a.t);
  players.forEach((p,i)=>{ $('place'+i).textContent=p.finished?String(p.place):String(ranked.indexOf(p)+1); $('gap'+i).textContent=p.finished?'FINISHED · '+fmtTime(p.finishTime):ranked[0]===p?'LEADING':Math.round(Math.max(0,ranked[0].t-p.t))+' m behind'; $('spdFill'+i).style.width=(clamp(p.speed/MAXSPD,0,1)*100)+'%'; $('spdNum'+i).textContent=Math.round(p.speed*3.6)+' km/h'; $('boostFill'+i).style.width=(p.boost*100)+'%'; if(players.length>1) $('spdName'+i).className=p===lead?'lead':''; });
  for(const pr of PROMPTS){ if(!pr.shown && lead.t>pr.t-6 && !players.some(p=>p.encounter?.type==='combat'||p.challengeTimer>0)){ pr.shown=true; showPrompt(pr); } }
  if(promptTimer>0){ promptTimer-=dt; if(promptTimer<=0) $('prompt').classList.remove('on'); }
  if(toastTimer>0){ toastTimer-=dt; if(toastTimer<=0) $('toast').classList.remove('on'); }
  updateChallengeHUD();
  // camera pip
  if(S.input==='camera'){ const c=$('pipCanvas'); drawSkeleton(c.getContext('2d'),c.width,c.height,true); const seen=bodies.slice(0,S.players).filter(b=>b.seen).length; $('pipTag').textContent=seen? (S.players>1?`${seen}/${S.players} heroes seen`:'Tracking'): 'Step into view'; if(seen>=S.players)$('pip').classList.remove('lost');else $('pip').classList.add('lost'); }
}
const fmtTime=s=>{ const m=Math.floor(s/60), r=s-m*60; return `${m}:${r<10?'0':''}${r.toFixed(1)}`; };
let runStart=0; const elapsed=()=>S.phase==='run'?now()-runStart:S.phase==='paused'?pausedAt-runStart:(S.phase==='done'?finalTime:0); let finalTime=0;

/* =====================================================================
   FLOW
   ===================================================================== */
const show=id=>{ $('challengePanels').hidden=!!id;if(id==='start'||id==='done')$('splitLabels').hidden=true; if(id==='start'||id==='done')$('raceControls').hidden=true; for(const s of ['start','setup','done']) $(s).hidden=(s!==id); };
function setPanel(n){if(disposed)return;if(n===3)renderMapCards(); $('start').dataset.step=n; $('viewOptions').hidden=S.players===1; $('keyboardGuide').innerHTML=['P1 · W A S D / Q boost / E balance / Shift sprint / F punch / G kick','P2 · I J K L / U boost / O balance / H sprint / N punch / M kick','P3 · Arrows / Enter boost / slash balance / period sprint / [ punch / ] kick'].slice(0,S.players).join('<br>'); for(let i=1;i<=3;i++) $('panel'+i).hidden=(i!==n); }
function renderMoves(){ const M=[['run','Run in place','Your hero jogs on its own · faster steps = faster'],['armsUp','Both arms up','BOOST! Recharges as you run'],['jump','Hop','Jump · hop again in the air to attack'],['squat','Squat','Roll, or charge a spin dash'],['leanL','Lean','Steer left and right'],['armsOut','Arms out','Balance on the rails'],['punch','Punch','Caught? Hands at chest, punch, return'],['kick','Kick','Lift knee, extend foot, put it down']];
  $('moves').innerHTML=M.map(([ic,b,s])=>`<div class="move"><svg viewBox="0 0 100 100" style="background:rgba(34,33,29,.9);border-radius:12px">${ICON[ic]}</svg><div><b>${b}</b><span>${s}</span></div></div>`).join(''); }
renderMoves();
document.querySelectorAll('.mode-card').forEach(b=>b.onclick=()=>{ audioInit(); musicStart(); S.players=+b.dataset.mode; document.querySelectorAll('.mode-card').forEach(x=>x.setAttribute('aria-pressed',x===b)); setTimeout(()=>setPanel(S.players>1?3:2),160); });
document.querySelectorAll('.ninja-card').forEach(b=>b.onclick=()=>{ S.hero=b.dataset.hero; document.querySelectorAll('.ninja-card').forEach(x=>x.setAttribute('aria-pressed',x===b)); setTimeout(()=>setPanel(3),160); });
document.querySelectorAll('.pair-card').forEach(b=>b.onclick=()=>{ S.pair=b.dataset.pair; document.querySelectorAll('.pair-card').forEach(x=>x.setAttribute('aria-pressed',x===b)); setTimeout(()=>setPanel(3),160); });
$('back2').onclick=()=>setPanel(1); $('back3').onclick=()=>setPanel(S.players>1?1:2); $('next2').onclick=()=>setPanel(3);
async function play(input){if(S.destination!==mapKey){mountAdventure(S.destination).play(input);return;}audioInit();S.input=input;if(input==='keys'){stopCamera();beginRun();return;}show('setup');drawGhost();const ok=await startCamera();if(!ok&&!disposed)$('goBtn').disabled=true;}
$('playBtn').onclick=()=>play('camera');
$('backSetup').onclick=()=>{ stopCamera(); show('start'); };
$('keysBtn').onclick=()=>play('keys');
$('goBtn').onclick=()=>{ autoStartAt=0; beginRun(); };
$('againBtn').onclick=()=>{ show(null); resetRun(); beginRun(); };
$('menuBtn').onclick=()=>{ stopCamera(); resetRun(); AU.tempo=132; camState.mode='attract'; $('hud').classList.remove('on'); $('pausePanel').hidden=true; show('start'); setPanel(1); S.phase='start'; };
function stopCamera(){ cameraRequest++; camOn=false; if(landmarker){landmarker.close?.();landmarker=null;} bodies.forEach(b=>Object.assign(b,new Body())); poseLoopId++; if(video.srcObject){ video.srcObject.getTracks().forEach(t=>t.stop()); video.srcObject=null; } }
function drawGhost(){ const g=$('ghost'); const one=(cx)=>`<g fill="none" stroke="rgba(230,181,74,.85)" stroke-width="5" stroke-dasharray="10 8" stroke-linecap="round"><circle cx="${cx}" cy="90" r="34"/><path d="M${cx} 124v150M${cx} 150l-70 70M${cx} 150l70 70M${cx} 274l-40 150M${cx} 274l40 150"/></g>`; g.innerHTML=Array.from({length:S.players},(_,i)=>one(640*(i+.5)/S.players)).join(''); }
// setup loop: skeleton on the preview + readiness
// hands-free buttons: hold both arms up to press Start / Run again from across the room
let holdT=0, lastHoldTick=0;
function gestureHold(btnId,fillId,secs,onDone){ const t=now(); const dt=lastHoldTick?Math.min(.1,t-lastHoldTick):0; lastHoldTick=t; const up=S.input==='camera' && bodies.slice(0,S.players).some(b=>b.seen&&b.armsUp); holdT=up?holdT+dt:Math.max(0,holdT-dt*2); const k=Math.min(1,holdT/secs); $(fillId).style.width=(k*100)+'%'; if(k>=1){ holdT=0; $(fillId).style.width='0%'; onDone(); } }
let autoStartAt=0;
function setupTick(){if(disposed)return; if(!$('setup').hidden){ const c=$('setupCanvas'); drawSkeleton(c.getContext('2d'),c.width,c.height,false); const need=S.players; const ok=bodies.slice(0,need).every(b=>b.seen&&b.calibrated&&b.vis>.4); const seen=bodies.slice(0,need).filter(b=>b.seen).length;
    if(landmarker&&camOn){
      // hands-free start: once every player is tracked, the countdown runs on its own — no button to press
      if(ok){ $('goBtn').hidden=true; if(!autoStartAt) autoStartAt=now()+3; const left=Math.ceil(autoStartAt-now()); $('status').textContent=left>0?`I can see you! Starting in ${left}…`:'Go!'; $('status').className='status ok'; if(now()>=autoStartAt){ autoStartAt=0; beginRun(); } }
      else { autoStartAt=0; $('goBtn').hidden=false; $('goBtn').disabled=false; $('status').textContent= seen<need ? (need>1?`${seen} of ${need} heroes in view — stand side by side`:'Step into view so the camera can see your shoulders and hips') : 'Hold still for a moment…'; $('status').className='status'; } } }
  else if(S.phase==='paused'&&S.input==='camera'){gestureHold('resumeBtn','goFill',1.2,togglePause);}
  else if(!$('done').hidden && S.input==='camera'){ $('againGesture').hidden=false; gestureHold('againBtn','againFill',1.6,()=>$('againBtn').onclick()); }
  else { autoStartAt=0; holdT=0; }
  requestAnimationFrame(setupTick); } setupTick();
$('againGestureIcon').innerHTML=ICON.armsUp;
let runSerial=0;
function disposeRunner(rig){const geometries=new Set(),materials=new Set();rig.traverse(m=>{if(m.geometry)geometries.add(m.geometry);if(m.material)(Array.isArray(m.material)?m.material:[m.material]).forEach(x=>materials.add(x));});geometries.forEach(g=>g.dispose());materials.forEach(m=>{m.map?.dispose();m.dispose();});}
function resetRun(){ runSerial++;for(const mesh of [...encounterGroup.children])releaseEncounter(mesh); $('prompt').classList.remove('on');$('toast').classList.remove('on');promptTimer=toastTimer=0;for(const p of players){ scene.remove(p.rig);disposeRunner(p.rig); if(p.buddy) scene.remove(p.buddy); } players.length=0; rings.forEach(r=>r.got=false); enemies.forEach(e=>{ e.alive=true; e.mesh.visible=true; e.t=e.t0; }); flocks.forEach(F=>{ F.triggered=false; F.birds.forEach(b=>{ b.fly=false; b.v.set(0,0,0); }); }); bridgePlanks.forEach(pl=>{ pl.userData.fallen=false; pl.userData.vel=0; pl.userData.rot=0; pl.position.copy(pl.userData.home||pl.position); if(pl.userData.q) pl.quaternion.copy(pl.userData.q); }); PROMPTS.forEach(p=>p.shown=false); }
bridgePlanks.forEach(pl=>{ pl.userData.home=pl.position.clone(); pl.userData.q=pl.quaternion.clone(); });
function beginRun(){ holdT=0;show(null); resetRun(); raceCameras.length=0; raceStates.length=0; raceKeys().forEach((key,i)=>players.push(makePlayer(key,i))); resetEncounters();musicStart(); $('pausePanel').hidden=true; $('raceControls').hidden=false; clearKeys();
  iceHazards.forEach(h=>h.mesh.visible=S.destination==='aurora'); lanternGates.forEach(g=>g.mesh.visible=S.destination==='blossom');
  const inWorld=o=>!o.world||o.world===S.destination;
  springs.forEach(s=>s.mesh.visible=inWorld(s)); dashPads.forEach(d=>d.mesh.visible=inWorld(d)); enemies.forEach(e=>e.mesh.visible=e.alive&&inWorld(e));
  AU.tempo=S.destination==='aurora'?116:S.destination==='blossom'?144:132; // dreamy / festival / classic groove
  $('challengePanels').hidden=false;$('challengePanels').dataset.split=String(S.players>1&&S.raceView==='split');$('challengePanels').innerHTML=players.map((p,i)=>`<div class="challenge-slot"><div id="challenge${i}" class="challenge-card" hidden></div></div>`).join('');
  $('splitLabels').innerHTML=players.map((p,i)=>`<div class="split-label" style="--racer:${p.hero.css}"><span><b id="place${i}">${i+1}</b> ${p.hero.name}</span><small id="gap${i}"></small></div>`).join('');
  $('speedo').innerHTML=players.map((p,i)=>`<div class="${i?'row2':''}"><label><span class="rowname" id="spdName${i}">${players.length>1?`<i class="dot" style="background:${p.hero.css}"></i>${p.hero.name}`:'Speed'}</span><span id="spdNum${i}">0</span></label><div class="bar"><div class="fill" id="spdFill${i}"></div></div><div class="boost"><i id="boostFill${i}"></i></div></div>`).join('');
  camState.mode='follow'; camState.look.copy(worldAt(40,0,0)); camera.position.copy(worldAt(-10,14,9)); camera.fov=70; S.phase='count'; $('hud').classList.add('on'); $('hud').dataset.input=S.input;$('pip').style.display=S.input==='camera'?'block':'none';
  const serial=runSerial; const c=$('count'); let n=3; const tick=()=>{ if(serial!==runSerial||S.phase!=='count')return; if(n>0){ c.textContent=n; c.style.opacity=1; c.style.transform='scale(1)'; SFX.countdown(false); speak(String(n)); n--; setTimeout(()=>{c.style.opacity=0;},700); setTimeout(tick,1000); } else { c.textContent='GO!'; c.style.opacity=1; SFX.countdown(true); speak('Go!'); S.phase='run'; runStart=now(); setTimeout(()=>{c.style.opacity=0;},700); } }; tick(); }
function endRun(){ const serial=runSerial; S.phase='done'; finalTime=now()-runStart; camState.mode='victory'; musicStop(); setTimeout(()=>{if(serial!==runSerial||S.phase!=='done')return; const rings=players.reduce((a,p)=>a+p.rings,0), chain=Math.max(...players.map(p=>p.bestChain)), top=Math.max(...players.map(p=>p.top));
  const col=p=>`<div class="col ${p.key}"><h3>${p.hero.name}${p.place===1&&players.length>1?'<span class="win">Winner</span>':''}</h3><div class="line"><span>Time</span><b>${p.finished?fmtTime(p.finishTime):'did not finish'}</b></div><div class="line"><span>Rings</span><b>${p.rings}</b></div><div class="line"><span>Best combo</span><b>×${p.bestChain}</b></div><div class="line"><span>Mummies dodged</span><b>${p.mummiesDodged}</b></div><div class="line"><span>Chases cleared</span><b>${p.catsEscaped+p.catsDefeated}</b></div><div class="line"><span>Top speed</span><b>${Math.round(p.top*3.6)} km/h</b></div></div>`;
  $('scoreboard').innerHTML=`<div class="board">${[...players].sort((a,b)=>a.place-b.place).map(col).join('')}</div>`;
  const stars=(finalTime<95?1:0)+(rings>=60?1:0)+(chain>=3||finalTime<75?1:0); $('stars').textContent='★★★'.slice(0,Math.max(1,stars))+'☆☆☆'.slice(0,3-Math.max(1,stars));
  const keys=raceKeys(); const nm=keys.map(k=>HERO[k].name).join(' and '); const buds=keys.map(k=>HERO[k].buddyName).filter(Boolean); const winner=players.find(p=>p.place===1);
  $('doneTitle').textContent=players.length>1&&winner?`${winner.hero.name} wins!`:(stars===3?'Adventure conquered!':MAPS[mapKey].name+' cleared!'); $('doneSub').textContent=buds.length?`${nm} and ${buds.join(' and ')} made it to the lighthouse.`:`${nm} made it to the lighthouse.`;
  $('hud').classList.remove('on'); show('done'); speak(stars===3?'Amazing! Three stars!':'Great run, heroes!'); },2600); } // score overlays the ongoing celebration

/* =====================================================================
   MAIN LOOP
   ===================================================================== */

const raceCameras=[],raceStates=[];
function renderRaceViews(dt,time){
 const split=S.players>1&&S.raceView==='split'&&(S.phase==='run'||S.phase==='count'||S.phase==='paused');$('splitLabels').hidden=!split;$('speedo').className='speedo'+(split?' split':'');$('speedo').style.setProperty('--players',players.length);players.forEach(p=>{if(p.rig.userData.nameTag)p.rig.userData.nameTag.visible=!split;});
 if(!split){composer.render();return;}
 const mainCamera=camera,mainState=camState,stacked=innerWidth<innerHeight||innerWidth<=720;
 renderer.setScissorTest(true);
 for(let i=0;i<players.length;i++){
  const p=players[i],width=stacked?innerWidth:Math.floor(innerWidth/players.length),height=stacked?Math.floor(innerHeight/players.length):innerHeight;
  if(!raceCameras[i]){raceCameras[i]=new THREE.PerspectiveCamera(65,width/height,.3,1800);raceCameras[i].position.copy(worldAt(p.t-7,p.lane,3));raceStates[i]={...mainState,look:worldAt(p.t+8,p.lane,1),mode:'follow',shake:0};}
  camera=raceCameras[i];camState=raceStates[i];camera.aspect=width/height;if(S.phase==='paused')camera.updateProjectionMatrix();else updateCamera(dt,time,p);
  sky.position.copy(camera.position);ocean.position.x=camera.position.x;ocean.position.z=camera.position.z;oceanMat.uniforms.camPos.value.copy(camera.position);
  // All views use the same race atmosphere; each camera follows only its own runner.
  const x=stacked?0:i*width,y=stacked?innerHeight-(i+1)*height:0;renderer.setViewport(x,y,width,height);renderer.setScissor(x,y,width,height);renderer.render(scene,camera);
 }
 camera=mainCamera;camState=mainState;renderer.setScissorTest(false);renderer.setViewport(0,0,innerWidth,innerHeight);sky.position.copy(camera.position);
}
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{S.raceView=b.dataset.view;document.querySelectorAll('[data-view]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));});

let last=now(), timeAcc=0;
let pausedAt=0;
function togglePause(){if(S.phase==='run'){pausedAt=now();S.phase='paused';$('pausePanel').hidden=false;clearKeys();}else if(S.phase==='paused'){runStart+=now()-pausedAt;S.phase='run';$('pausePanel').hidden=true;last=now();}}
$('pauseBtn').onclick=togglePause;$('resumeBtn').onclick=togglePause;$('exitBtn').onclick=()=>$('menuBtn').onclick();
$('keyboardPlay').onclick=()=>$('keysBtn').onclick();
document.querySelectorAll('[data-destination]').forEach(b=>b.onclick=()=>{S.destination=b.dataset.destination;document.querySelectorAll('[data-destination]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));});
function frame(){if(disposed)return;
  requestAnimationFrame(frame); const t=now(); let dt=Math.min(.05,t-last); last=t; if(S.phase==='paused'){renderRaceViews(0,timeAcc);return;} timeAcc+=dt;
  oceanMat.uniforms.time.value=timeAcc; oceanMat.uniforms.camPos.value.copy(camera.position); wfMat.uniforms.time.value=timeAcc; if(grassMat.userData.sh){ grassMat.userData.sh.uniforms.time.value=timeAcc; }
  if(S.phase==='run'||S.phase==='count'||S.phase==='done'){
    if(S.phase==='run'){ for(const p of players) updatePlayer(p,dt,timeAcc); const firstDone=players.find(p=>p.finished); if(players.every(p=>p.finished)) endRun();
      // Each runner's pace is independent; no catch-up speed or position synchronization.
    }
    else for(const p of players){ p.time+=dt; if(S.phase==='count') p.state='idle'; else if(S.phase==='done'&&p.finished) updateCelebration(p,dt); placePlayer(p,timeAcc,dt); }
    updateEncounterVisuals(timeAcc);updateHUD(dt); updateEnemies(timeAcc,dt,players); updateFlocks(timeAcc,dt,players);
    if(grassMat.userData.sh){ grassMat.userData.sh.uniforms.pushPos.value.copy(players[0].rig.position); grassMat.userData.sh.uniforms.pushPos2.value.copy(players[1]?players[1].rig.position:(players[0].buddy?players[0].buddy.position:players[0].rig.position)); }
    // falling planks
    for(const pl of bridgePlanks){ if(pl.userData.fallen && pl.position.y>-12){ pl.userData.vel-=20*dt; pl.position.y+=pl.userData.vel*dt; pl.rotation.x+=dt*1.6; } }
    // zone look (sky, fog, light) follows the leader
    const lead=players.reduce((a,p)=>p.t>a.t?p:a,players[0]); applyZone(lead.t,dt);
    // world weather: drifting petals in Blossom, falling snow in Aurora
    if(S.phase!=='count'&&Math.random()<.45){ const f=frameAt(Math.min(FR.len-5,lead.t+14+rnd(30)));
      if(segAt(lead.t).meta.biome==='blossom') emit(f.p.clone().addScaledVector(f.B,rnd(18)-9).addScaledVector(f.N,5+rnd(4)),new THREE.Vector3(rnd(2)-1,-.8-rnd(.8),rnd(2)-1),2.4,Math.random()<.5?0xf8b8cb:0xffd6d7,.75,-.4);
      else if(segAt(lead.t).meta.biome==='aurora') emit(f.p.clone().addScaledVector(f.B,rnd(18)-9).addScaledVector(f.N,6+rnd(4)),new THREE.Vector3(rnd(1)-.5,-.5-rnd(.5),rnd(1)-.5),3,0xeaffff,.6,-.15); }
    // fireworks over the finish
    if(lead.t>finishT-90 && Math.random()<.06){ const f=frameAt(finishT+rnd(60)-10); const p=f.p.clone().addScaledVector(f.B,rnd(80)-40).add(new THREE.Vector3(0,18+rnd(22),0)); burst(p,26,9,RB[Math.floor(rnd(7))],1.4,1.4,-3); }
    // spring animation
    for(const s of springs){ if(s.anim>0){ s.anim-=dt*3; s.mesh.userData.top.position.y=.75+Math.sin(s.anim*Math.PI)*.8; s.mesh.userData.coil.scale.y=1+Math.sin(s.anim*Math.PI)*2; } }
    // waterfall mist
    if(waterfalls.mist && Math.random()<.5) emit(waterfalls.mist.clone().add(new THREE.Vector3(rnd(10)-5,rnd(2),rnd(10)-5)),new THREE.Vector3(rnd(2)-1,2+rnd(3),rnd(2)-1),1.2,0xeaffff,1.6,-1);
    // shadow camera follows the leader
    sun.position.copy(lead.rig.position).add(new THREE.Vector3(120,180,-90)); sun.target.position.copy(lead.rig.position); sun.target.updateMatrixWorld();
  } else { applyZone(camera.userData.attractT||0,dt); const c=camera.position; sun.position.set(c.x+120,180,c.z-90); sun.target.position.set(c.x,0,c.z); sun.target.updateMatrixWorld(); if(Math.random()<.3&&waterfalls.mist) emit(waterfalls.mist.clone().add(new THREE.Vector3(rnd(10)-5,rnd(2),rnd(10)-5)),new THREE.Vector3(rnd(2)-1,2+rnd(3),rnd(2)-1),1.2,0xeaffff,1.6,-1); }
  balloons.forEach(b=>{ b.position.y+=Math.sin(timeAcc*.7+b.userData.ph)*.004; }); asteroids.forEach(a=>{ a.rotation.x+=a.userData.spin.x*dt; a.rotation.y+=a.userData.spin.y*dt; });
  if(S.destination==='blossom') for(const g of lanternGates) g.mesh.children.forEach((l,c)=>{ l.position.y=2.1+Math.abs(c-2)*.55+Math.sin(timeAcc*2+c)*.08; });
  updateRings(timeAcc); updateParticles(dt); updateCamera(dt,timeAcc);
  sky.position.copy(camera.position); ocean.position.x=camera.position.x; ocean.position.z=camera.position.z;
  updateBiomes(players.length?players[0].t:(camera.userData.attractT||0),timeAcc);
  renderRaceViews(dt,timeAcc);
}
frame();
$('loading').hidden=true;
// TEST_HARNESS_INSERT
return {play,pause:togglePause,stopCamera,needsCombat:i=>players[i]?.encounter?.type==='combat',dispose(){disposed=true;runSerial++;adventureDisposers.forEach(f=>f());Object.values(encounterGeo).forEach(g=>g.dispose());Object.values(encounterMat).forEach(m=>m.dispose());stopCamera();removeEventListener('resize',resize);musicStop();
 const geometries=new Set(),materials=new Set(),textures=new Set();scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materials.add(m));});
 materials.forEach(m=>{for(const v of Object.values(m))if(v?.isTexture)textures.add(v);m.dispose();});geometries.forEach(g=>g.dispose());textures.forEach(t=>t.dispose());Object.values(TEX).forEach(t=>t.dispose());ENV.dispose?.();composer.dispose?.();renderer.dispose();}};
}
mountAdventure(S.destination);
</script>
</body>
</html>
