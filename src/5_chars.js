
/* =====================================================================
   CHARACTERS — Sonic, Tails, and Knuckles with smooth procedural meshes,
   companions, werewolves. Toon shading + inverted-hull outlines.
   ===================================================================== */
// smooth, lit 'vinyl toy' shading: physically based with a soft clearcoat and studio reflections
const std=(color,extra={})=>new THREE.MeshPhysicalMaterial({color,roughness:.42,metalness:0,clearcoat:.55,clearcoatRoughness:.35,envMap:ENV,envMapIntensity:.55,...extra});
const cloth=(color)=>std(color,{roughness:.78,clearcoat:.08,sheen:.6,sheenColor:new THREE.Color(color).multiplyScalar(1.4),sheenRoughness:.7});
const skinM=(color)=>std(color,{roughness:.55,clearcoat:.2,sheen:.3,sheenColor:new THREE.Color(0xffc9b0)});
const CEL=false; const INK=new THREE.MeshBasicMaterial({color:0x2a2220,side:THREE.BackSide});
function meshOf(geo,mat,x=0,y=0,z=0,ol=0){ const m=new THREE.Mesh(geo,mat); m.position.set(x,y,z); m.castShadow=true; m.receiveShadow=false;
  if(ol>0 && CEL){ const h=new THREE.Mesh(geo,INK); const s=1+ol/Math.max(.08,geo.boundingSphere?geo.boundingSphere.radius:( geo.computeBoundingSphere(), geo.boundingSphere.radius)); h.scale.setScalar(s); h.castShadow=false; h.raycast=()=>{}; m.add(h); } return m; }
const GEO={ eye:new THREE.SphereGeometry(.1,14,10), pupil:new THREE.SphereGeometry(.058,10,8), glint:new THREE.SphereGeometry(.022,6,6), cheek:new THREE.SphereGeometry(.06,8,6), hand:new THREE.SphereGeometry(.11,12,10), curl:new THREE.SphereGeometry(.14,10,8) };
// Curved, tapered silhouette pieces: quills, dreadlocks, and fox tails.
function tapered(points,radius,material,tipMaterial=null){
 const curve=new THREE.CatmullRomCurve3(points.map(v=>new THREE.Vector3(...v)));
 const segments=18,sides=12,frames=curve.computeFrenetFrames(segments,false),positions=[],indices=[];
 for(let i=0;i<=segments;i++){const t=i/segments,c=curve.getPointAt(t),r=radius*Math.pow(1-t,.62)+.003;
  for(let j=0;j<=sides;j++){const angle=j/sides*TAU,v=c.clone().addScaledVector(frames.normals[i],Math.cos(angle)*r).addScaledVector(frames.binormals[i],Math.sin(angle)*r);positions.push(v.x,v.y,v.z);}}
 const g=new THREE.BufferGeometry();for(let i=0;i<segments;i++){const start=indices.length;for(let j=0;j<sides;j++){const n=i*(sides+1)+j;indices.push(n,n+sides+1,n+1,n+1,n+sides+1,n+sides+2);}g.addGroup(start,indices.length-start,tipMaterial&&i>=11?1:0);}
 g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();return meshOf(g,tipMaterial?[material,tipMaterial]:material);
}
function buildSpeedster(key){
 const H=HERO[key],fox=key==='tails',echidna=key==='knuckles';
 const fur=std(H.gi,{roughness:.62,clearcoat:.16}),furDark=std(H.giDark,{roughness:.65}),muzzle=std(H.skin,{roughness:.75,clearcoat:.04});
 const white=std(0xfffdf5,{roughness:.65,clearcoat:.08}),black=std(0x141c2b,{roughness:.32}),red=std(0xe93342,{roughness:.46}),gold=std(0xffca45,{metalness:.4,roughness:.3});
 const iris=std(fox?0x419ece:echidna?0x8352b9:0x42a568),green=std(0x48aa69);
 const root=new THREE.Group(),body=new THREE.Group(),hips=new THREE.Group();root.add(body);body.add(hips);hips.position.y=.77;
 function oval(parent,mat,pos,scale){const m=meshOf(new THREE.SphereGeometry(1,24,18),mat,...pos);m.scale.set(...scale);parent.add(m);return m;}
 const legs={};for(const [nm,x] of [['L',-.17],['R',.17]]){const hip=new THREE.Group();hip.position.x=x;hips.add(hip);hip.add(meshOf(new THREE.CapsuleGeometry(.077,.24,5,12),fur,0,-.16,0));const knee=new THREE.Group();knee.position.y=-.32;hip.add(knee);knee.add(meshOf(new THREE.CapsuleGeometry(.073,.22,5,12),fur,0,-.12,0));
  knee.add(meshOf(new THREE.CylinderGeometry(.13,.12,.14,18),echidna?green:white,0,-.25,0));
  oval(knee,echidna?gold:red,[0,-.36,.12],[.18,.14,.33]);
  knee.add(meshOf(new RoundedBoxGeometry(.35,.065,.59,3,.035),white,0,-.46,.11));
  knee.add(meshOf(new RoundedBoxGeometry(.355,.07,.12,3,.025),echidna?green:white,0,-.27,.16));
  if(!fox&&!echidna)knee.add(meshOf(new RoundedBoxGeometry(.05,.11,.12,2,.015),gold,Math.sign(x)*.18,-.27,.16));
  if(echidna)knee.add(meshOf(new RoundedBoxGeometry(.29,.05,.18,2,.025),red,0,-.23,.29));
  legs[nm]={hip,knee};}
 const torso=new THREE.Group();hips.add(torso);oval(torso,fur,[0,.31,0],[echidna?.34:.28,.37,.24]);
 if(!echidna)oval(torso,fox?white:muzzle,[0,.32,.208],[fox?.22:.155,.265,.052]);
 else{const crescent=new THREE.Mesh(new THREE.TorusGeometry(.17,.033,8,28,Math.PI),white);crescent.rotation.z=Math.PI;crescent.position.set(0,.47,.226);torso.add(crescent);}
 const arms={};for(const [nm,x] of [['L',-.33],['R',.33]]){const sh=new THREE.Group();sh.position.set(x,.5,0);torso.add(sh);sh.add(meshOf(new THREE.CapsuleGeometry(.073,.22,5,12),fox||echidna?fur:muzzle,0,-.14,0));const elbow=new THREE.Group();elbow.position.y=-.29;sh.add(elbow);elbow.add(meshOf(new THREE.CapsuleGeometry(.065,.18,5,12),fox||echidna?fur:muzzle,0,-.11,0));elbow.add(meshOf(new THREE.CylinderGeometry(.125,.12,.12,16),white,0,-.24,0));oval(elbow,white,[0,-.37,.025],[echidna?.19:.145,.15,.14]);oval(elbow,white,[-Math.sign(x)*.11,-.34,.08],[.065,.085,.07]);
 if(echidna)for(const dx of [-.08,.08]){const spike=meshOf(new THREE.ConeGeometry(.065,.16,12),white,dx,-.35,.19);spike.rotation.x=Math.PI/2;elbow.add(spike);}arms[nm]={sh,elbow};}
 const neck=new THREE.Group();neck.position.y=.63;torso.add(neck);const head=new THREE.Group();head.position.y=.34;neck.add(head);
 oval(head,fur,[0,0,0],[.46,fox?.43:.46,.43]);
 // Joined eye mask with colored irises, a black nose, and sculpted muzzle.
 for(const x of [-.17,.17]){oval(head,white,[x,.06,.352],[.185,.25,.105]);oval(head,iris,[x*.85,.055,.454],[.051,.136,.026]);oval(head,black,[x*.85,.048,.475],[.023,.105,.018]);oval(head,white,[x*.85+.015,.112,.492],[.015,.03,.009]);}
 for(const x of [-.12,.12])oval(head,muzzle,[x,-.18,.355],[.21,.15,.14]);
 oval(head,black,[0,-.073,.514],[.066,.048,.057]);
 const smile=new THREE.Mesh(new THREE.TorusGeometry(.062,.009,8,16,Math.PI*.7),black);smile.position.set(.17,-.195,.478);smile.rotation.z=Math.PI*1.2;head.add(smile);
 if(!echidna){for(const x of [-.29,.29]){const ear=meshOf(new THREE.ConeGeometry(fox?.19:.13,fox?.42:.27,3,1),fur,x,.43,-.03);ear.rotation.y=Math.PI;ear.rotation.z=-Math.sign(x)*.24;head.add(ear);const inner=meshOf(new THREE.ConeGeometry(fox?.125:.077,fox?.28:.17,3,1),muzzle,x,.43,.049);inner.rotation.copy(ear.rotation);head.add(inner);}}
 if(key==='sonic'){
  const paths=[[[0,.30,-.13],[0,.25,-.57],[0,.12,-.96]],[[-.28,.2,-.16],[-.56,.05,-.5],[-.63,-.22,-.69]],[[.28,.2,-.16],[.56,.05,-.5],[.63,-.22,-.69]],[[-.22,-.08,-.22],[-.42,-.32,-.5],[-.38,-.60,-.68]],[[.22,-.08,-.22],[.42,-.32,-.5],[.38,-.60,-.68]],[[0,-.23,-.22],[0,-.47,-.47],[0,-.72,-.58]]];paths.forEach(points=>head.add(tapered(points,.25,fur)));
  head.add(tapered([[0,.25,.32],[0,.21,.41],[0,.105,.46]],.1,fur));
  torso.add(tapered([[0,.4,-.15],[0,.27,-.4],[0,.12,-.53]],.15,fur));hips.add(tapered([[0,.1,-.15],[0,.07,-.31],[0,.17,-.43]],.085,fur));
 }else if(fox){
  for(const side of [-1,1]){head.add(tapered([[side*.3,-.12,.15],[side*.49,-.14,.1],[side*.61,-.04,.01]],.17,white));head.add(tapered([[side*.30,-.22,.13],[side*.45,-.28,.08],[side*.54,-.22,0]],.13,white));}
  for(let j=0;j<3;j++)head.add(tapered([[(j-1)*.1,.27,.1],[(j-1)*.13,.46,.11],[(j-1)*.2,.56,-.05]],.09,fur));
  root.userData.foxTails=[];for(const side of [-1,1]){const tail=new THREE.Group();tail.position.set(side*.12,.13,-.17);hips.add(tail);tail.add(tapered([[0,0,0],[side*.28,.12,-.38],[side*.49,.52,-.79],[side*.45,.92,-.91]],.27,fur,white));root.userData.foxTails.push(tail);}
 }else{
  for(const side of [-1,1])for(let j=0;j<3;j++)head.add(tapered([[side*(.3-j*.05),.2,-.1-j*.12],[side*(.48-j*.035),-.14,-.15-j*.15],[side*(.48-j*.02),-.72,-.27-j*.16]],.16,fur));
  head.add(tapered([[-.3,.22,.29],[0,.20,.41],[.29,.15,.32]],.11,fur));hips.add(tapered([[0,.13,-.18],[0,-.05,-.4],[0,.03,-.55]],.11,fur));
 }
 attachBall(root,spinBall(fur,white,furDark));root.userData.rig={body,hips,torso,neck,head,legs,arms,ball:root.userData.ball,spinRing:root.userData.spinRing};root.userData.character=key;return root;
}
function spinBall(mat,stripeM,stripe2M){ const ball=new THREE.Group(); ball.add(meshOf(new THREE.SphereGeometry(.64,20,16),mat,0,.72,0)); const s1=new THREE.Mesh(new THREE.TorusGeometry(.64,.06,8,32),stripeM); s1.position.y=.72; s1.rotation.y=Math.PI/2; ball.add(s1); const s2=new THREE.Mesh(new THREE.TorusGeometry(.65,.05,8,32),stripe2M); s2.position.y=.72; ball.add(s2);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.88,.04,6,32,Math.PI*1.3),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.55})); ring.position.y=.72; ring.rotation.y=Math.PI/2; ball.add(ring); ball.visible=false; ball.userData.ring=ring; return ball; }
function attachBall(root,ball){ root.userData.ball=ball; root.userData.spinRing=ball.userData.ring; root.add(ball); }
function buildRunner(key){ return buildSpeedster(key); }

function buildWolfie(){ const g=new THREE.Group(); const grey=std(0x8a8f96), white=std(0xf5f5f5), dark=std(0x2a2422);
  const body=meshOf(new THREE.CapsuleGeometry(.24,.6,4,10),grey,0,.5,0); body.rotation.x=Math.PI/2; g.add(body); const belly=meshOf(new THREE.CapsuleGeometry(.2,.55,4,10),white,0,.4,0,0); belly.rotation.x=Math.PI/2; g.add(belly);
  const head=new THREE.Group(); head.position.set(0,.72,.42); g.add(head); head.add(meshOf(new THREE.SphereGeometry(.26,16,12),grey)); head.add(meshOf(new THREE.SphereGeometry(.2,14,10),white,0,-.06,.1,0));
  head.add(meshOf(new THREE.SphereGeometry(.08,10,8),dark,0,-.05,.3,0)); for(const sx of [-.11,.11]){ head.add(meshOf(new THREE.ConeGeometry(.08,.26,6),grey,sx,.28,-.02)); head.add(meshOf(new THREE.SphereGeometry(.055,10,8),sx<0?std(0x4aa6ff):std(0x6b3f1d),sx,.06,.23,0)); }
  const collar=new THREE.Mesh(new THREE.TorusGeometry(.2,.035,8,20),std(0xe6b54a)); collar.position.set(0,.6,.3); collar.rotation.x=Math.PI/2.4; g.add(collar);
  const tail=meshOf(new THREE.CapsuleGeometry(.09,.35,4,8),white,0,.7,-.45); tail.rotation.x=-.9; g.add(tail);
  const legs=[]; for(const [x,z] of [[-.16,.28],[.16,.28],[-.16,-.28],[.16,-.28]]){ const l=new THREE.Group(); l.position.set(x,.42,z); l.add(meshOf(new THREE.CapsuleGeometry(.07,.3,4,8),z>0?grey:white,0,-.2,0)); g.add(l); legs.push(l); }
  g.userData={legs,head,tail,type:'wolfie'}; return g; }
function buildBunny(){ const g=new THREE.Group(); const white=std(0xfafafa), pink=std(0xffa3c4);
  g.add(meshOf(new THREE.SphereGeometry(.28,16,12),white,0,.36,0)); const head=new THREE.Group(); head.position.set(0,.7,.14); g.add(head); head.add(meshOf(new THREE.SphereGeometry(.25,16,12),white));
  for(const sx of [-.1,.1]){ const ear=meshOf(new THREE.CapsuleGeometry(.07,.42,4,8),white,sx,.42,-.02); ear.rotation.z=sx*1.4; head.add(ear); const inner=meshOf(new THREE.CapsuleGeometry(.035,.32,4,8),pink,sx,.42,.03,0); inner.rotation.z=sx*1.4; head.add(inner); head.add(meshOf(new THREE.SphereGeometry(.045,10,8),std(0x2a2422),sx,.03,.22,0)); head.add(meshOf(new THREE.SphereGeometry(.05,8,6),pink,sx*1.6,-.05,.18,0)); }
  head.add(meshOf(new THREE.SphereGeometry(.04,8,6),pink,0,-.03,.25,0)); g.add(meshOf(new THREE.SphereGeometry(.1,10,8),white,0,.36,-.26));
  const legs=[]; for(const [x,z] of [[-.13,.12],[.13,.12],[-.14,-.14],[.14,-.14]]){ const l=new THREE.Group(); l.position.set(x,.2,z); l.add(meshOf(new THREE.CapsuleGeometry(.06,.14,4,8),white,0,-.1,0)); g.add(l); legs.push(l); }
  g.userData={legs,head,type:'bunny'}; return g; }
function buildWerewolf(hover=true){ const g=new THREE.Group(); const fur=std(0x5f5a6b), furD=std(0x3d3946), red=new THREE.MeshStandardMaterial({color:0xff3b3b,emissive:0xff1a1a,emissiveIntensity:1.2});
  const body=new THREE.Group(); g.add(body); body.add(meshOf(new RoundedBoxGeometry(.7,.7,.5,3,.18),fur,0,.9,0)); const head=new THREE.Group(); head.position.set(0,1.45,.1); body.add(head);
  head.add(meshOf(new THREE.SphereGeometry(.34,16,12),fur)); head.add(meshOf(new RoundedBoxGeometry(.28,.22,.36,2,.08),furD,0,-.08,.3)); head.add(meshOf(new THREE.SphereGeometry(.06,8,6),std(0x1a1616),0,-.04,.5,0));
  for(const sx of [-.16,.16]){ head.add(meshOf(new THREE.ConeGeometry(.1,.32,6),furD,sx,.36,0)); head.add(meshOf(new THREE.SphereGeometry(.06,10,8),red,sx,.08,.3,0)); const tooth=meshOf(new THREE.ConeGeometry(.03,.09,4),std(0xffffff),sx*.6,-.2,.44,0); tooth.rotation.x=Math.PI; head.add(tooth); }
  for(const sx of [-.42,.42]){ const arm=meshOf(new THREE.CapsuleGeometry(.1,.4,4,8),fur,sx,.85,.1); arm.rotation.x=-.9; body.add(arm); }
  if(hover){ const disc=meshOf(new THREE.CylinderGeometry(.75,.6,.22,18),std(0x2c2a33),0,.45,0); g.add(disc); const ring=new THREE.Mesh(new THREE.TorusGeometry(.78,.06,8,28),new THREE.MeshStandardMaterial({color:0x5fe8ff,emissive:0x2ad4ff,emissiveIntensity:1.6})); ring.position.y=.42; ring.rotation.x=Math.PI/2; g.add(ring); }
  else { for(const sx of [-.2,.2]){ const leg=new THREE.Group(); leg.position.set(sx,.55,0); leg.add(meshOf(new THREE.CapsuleGeometry(.11,.32,4,8),furD,0,-.25,0)); body.add(leg); g.userData.legs=(g.userData.legs||[]).concat(leg);} }
  g.userData.body=body; g.userData.head=head; g.scale.setScalar(1.15); return g; }

/* ---- Rig animation. `a` holds smoothed animation params; state decides targets. ---- */
function animateNinja(root,st,dt){
  const R=root.userData.rig, a=st.anim; const t=st.time;
  let lean=0, bob=0, legAmp=0, armAmp=0, kneeBend=0, armDown=1, squashY=1, squashXZ=1, headTilt=0, torsoTwist=0, armsUp=0, armsOut=0, crouch=0, spread=0, ball=0, hipsY=R.hips.userData.y??(R.hips.userData.y=R.hips.position.y), elbowBend=.3;
  const sp=st.speedNorm; const cycleRate = sp<.02 ? 0 : lerp(6,17,sp);
  switch(st.state){
    case 'idle': bob=Math.sin(t*2.4)*.015; armDown=1; elbowBend=.25; kneeBend=.02; break;
    case 'run': lean=lerp(.06,.62,Math.pow(sp,1.3)); legAmp=lerp(.5,1.1,sp); armAmp=lerp(.5,1.15,sp); kneeBend=.6; bob=Math.abs(Math.sin(st.phase*2))*lerp(.03,.09,sp); elbowBend=lerp(.9,1.5,sp); headTilt=-lean*.4; break;
    case 'boost': lean=.9; legAmp=1.2; armAmp=.3; kneeBend=.8; armDown=.2; elbowBend=1.8; spread=-.2; headTilt=-.2; squashXZ=.95; break;
    case 'jump': lean=.25; kneeBend=1.3; legAmp=0; crouch=.2; armsUp=.7; spread=.35; elbowBend=.4; squashY=1.08; squashXZ=.95; break;
    case 'fall': lean=.1; kneeBend=.7; armsUp=.35; spread=.6; elbowBend=.5; break;
    case 'land': squashY=.78; squashXZ=1.14; crouch=.5; kneeBend=1.4; lean=.35; spread=.4; elbowBend=.6; break;
    case 'spin': case 'roll': case 'homing': ball=1; break;
    case 'charge': crouch=.55; kneeBend=1.6; lean=.5; squashY=.85; squashXZ=1.08; armDown=.9; elbowBend=1.4; break;
    case 'grind': crouch=.3; kneeBend=1.1; lean=.2; armsOut=1; spread=.1; torsoTwist=.3; squashY=.96; break;
    case 'drift': lean=.35; kneeBend=1; torsoTwist=st.driftDir*.6; armsOut=.5; legAmp=.6; armAmp=.4; break;
    case 'spring': squashY=1.18; squashXZ=.9; armsUp=1; lean=-.15; kneeBend=.2; spread=.15; break;
    case 'wall': lean=.5; legAmp=1; armAmp=.9; kneeBend=.7; torsoTwist=-.35; break;
    case 'stumble': lean=-.3+Math.sin(t*20)*.1; armsUp=.6; spread=.8; kneeBend=.9; headTilt=.3; break;
    case 'victory': bob=Math.abs(Math.sin(t*6))*.12; armsUp=Math.sin(t*6)>0?1:.3; spread=.4; kneeBend=Math.abs(Math.sin(t*6))*.6; squashY=1+Math.sin(t*6)*.05; break;
  }
  const k=st.state==='land'?18:10;
  for(const [key,v] of Object.entries({lean,bob,legAmp,armAmp,kneeBend,armDown,squashY,squashXZ,headTilt,torsoTwist,armsUp,armsOut,crouch,spread,ball,elbowBend})) a[key]=damp(a[key]??v,v,k,dt);
  st.phase+=cycleRate*dt; const ph=st.phase;
  R.ball.visible=a.ball>.5; R.hips.visible=a.ball<=.5;
  if(R.ball.visible){ R.ball.rotation.x-=dt*(st.state==='homing'?40:22); R.spinRing.rotation.x+=dt*30; R.spinRing.material.opacity=.35+Math.random()*.3; }
  R.body.scale.set(a.squashXZ,a.squashY,a.squashXZ);
  R.hips.position.y=hipsY-a.crouch*.28+a.bob;
  R.torso.rotation.set(a.lean, a.torsoTwist, 0);
  R.head.rotation.set(-a.lean*.55+a.headTilt, 0, -a.torsoTwist*.3);
  const L=R.legs.L, Rg=R.legs.R; const s1=Math.sin(ph), s2=Math.sin(ph+Math.PI);
  L.hip.rotation.x=-a.lean*.3+s1*a.legAmp*.9 - a.kneeBend*.25 - a.crouch*.9; Rg.hip.rotation.x=-a.lean*.3+s2*a.legAmp*.9 - a.kneeBend*.25 - a.crouch*.9;
  L.knee.rotation.x=Math.max(0,-s1)*a.legAmp*1.3+a.kneeBend*.5+a.crouch*1.5; Rg.knee.rotation.x=Math.max(0,-s2)*a.legAmp*1.3+a.kneeBend*.5+a.crouch*1.5;
  L.hip.rotation.z=a.spread*.35; Rg.hip.rotation.z=-a.spread*.35;
  if(st.state==='jump'||st.state==='fall'){ L.hip.rotation.x=-.9; Rg.hip.rotation.x=.4; L.knee.rotation.x=1.6; Rg.knee.rotation.x=.9; }
  if(st.state==='grind'){ L.hip.rotation.x=-.5; Rg.hip.rotation.x=.3; L.knee.rotation.x=1.2; Rg.knee.rotation.x=.9; }
  const AL=R.arms.L, AR=R.arms.R; const swingL=s2*a.armAmp*.9, swingR=s1*a.armAmp*.9;
  AL.sh.rotation.x=-a.lean*.2+swingL*(1-a.armsUp)*(1-a.armsOut) - a.armsUp*2.9; AR.sh.rotation.x=-a.lean*.2+swingR*(1-a.armsUp)*(1-a.armsOut) - a.armsUp*2.9;
  AL.sh.rotation.z= .18*a.armDown + a.armsOut*1.35 + a.armsUp*.35; AR.sh.rotation.z=-.18*a.armDown - a.armsOut*1.35 - a.armsUp*.35;
  AL.elbow.rotation.x=-a.elbowBend*(1-a.armsUp)*(1-a.armsOut)+ -.2*a.armsOut; AR.elbow.rotation.x=-a.elbowBend*(1-a.armsUp)*(1-a.armsOut) -.2*a.armsOut;
  if(st.state==='boost'){ AL.sh.rotation.x=1.4; AR.sh.rotation.x=1.4; AL.sh.rotation.z=.6; AR.sh.rotation.z=-.6; AL.elbow.rotation.x=-.4; AR.elbow.rotation.x=-.4; }
  const flut=Math.sin(t*14)*.15*(.3+sp); if(root.userData.scarf){ root.userData.scarf.rotation.x=.4+sp*1.0+flut; root.userData.scarf2.rotation.x=.55+sp*1.05-flut*.8; root.userData.scarf.rotation.z=flut*.6; }
  if(root.userData.foxTails)root.userData.foxTails.forEach((tail,i)=>{tail.rotation.z=Math.sin(t*8+i*Math.PI)*.16;tail.rotation.x=-sp*.45+Math.sin(t*6+i)*.12;});
  if(root.userData.tailSegs){ root.userData.tailSegs.forEach((s,i)=>{ s.rotation.y=Math.sin(t*9-i*.9)*.35*(.4+sp); s.rotation.x=-.15+sp*.25+Math.sin(t*6-i)*.08; }); }
}
function animateBuddy(b,st,dt){ const u=b.userData; const sp=st.speedNorm; const ph=st.phase*1.2;
  if(u.type==='wolfie'){ u.legs.forEach((l,i)=>{ l.rotation.x=Math.sin(ph+(i%2?Math.PI:0)+(i>1?.6:0))*lerp(.3,1.1,sp); }); u.head.rotation.x=Math.sin(ph*2)*.08-sp*.3; u.tail.rotation.z=Math.sin(st.time*9)*.35; }
  else { const hop=Math.abs(Math.sin(ph)); u.legs.forEach((l,i)=>{ l.rotation.x=(i<2?1:-1)*hop*.9; }); u.head.rotation.x=-hop*.25-sp*.2; b.userData.hop=hop*lerp(.15,.5,sp); }
}
// Render the actual game rigs into menu portraits, so selection matches gameplay.
// The portraits jog in place while the menu is open (paused when the menu is hidden).
const portraitCanvases=[...document.querySelectorAll('canvas[data-fig]')];
if(portraitCanvases.length){
  const pr=new THREE.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true});pr.setSize(256,320);pr.setPixelRatio(1);pr.toneMapping=THREE.ACESFilmicToneMapping;pr.toneMappingExposure=1.25;pr.outputColorSpace=THREE.SRGBColorSpace;
  const ps=new THREE.Scene();ps.add(new THREE.HemisphereLight(0xeaf7ff,0x8b7763,2));const keyLight=new THREE.DirectionalLight(0xffecd0,3);keyLight.position.set(-3,5,4);ps.add(keyLight);const rim=new THREE.DirectionalLight(0x8cdce8,2);rim.position.set(3,3,-2);ps.add(rim);
  const pc=new THREE.PerspectiveCamera(31,.8,.1,30);pc.position.set(0,1.25,4.4);pc.lookAt(0,1.08,0);
  const portraitRigs={},portraitsByKey={};
  for(const key of ['sonic','tails','knuckles']){portraitRigs[key]=buildRunner(key);portraitsByKey[key]=portraitCanvases.filter(c=>c.dataset.fig===key);}
  function posePortrait(key,t){ const rig=portraitRigs[key],R=rig.userData.rig; const ph=t*6.5+({sonic:0,tails:2.1,knuckles:4.2})[key]; const s1=Math.sin(ph),s2=Math.sin(ph+Math.PI);
    rig.rotation.y=-.38+Math.sin(t*.8+ph*.01)*.09;
    const hipsY=R.hips.userData.y??(R.hips.userData.y=R.hips.position.y); R.hips.position.y=hipsY+Math.abs(Math.sin(ph))*.05;
    R.legs.L.hip.rotation.x=s1*.5; R.legs.R.hip.rotation.x=s2*.5; R.legs.L.knee.rotation.x=Math.max(0,-s1)*.85; R.legs.R.knee.rotation.x=Math.max(0,-s2)*.85;
    R.arms.L.sh.rotation.x=s2*.45; R.arms.R.sh.rotation.x=s1*.45; R.arms.L.sh.rotation.z=.22; R.arms.R.sh.rotation.z=-.28; R.arms.L.elbow.rotation.x=-.55; R.arms.R.elbow.rotation.x=-.55;
    R.torso.rotation.y=Math.sin(ph)*.05; R.head.rotation.z=.06+Math.sin(t*1.2)*.03; }
  let portraitLast=0;
  (function portraitLoop(ms){ requestAnimationFrame(portraitLoop);
    if(document.getElementById('start').hidden||document.hidden||ms-portraitLast<40) return; portraitLast=ms; const t=ms/1000;
    for(const key of ['sonic','tails','knuckles']){ const targets=portraitsByKey[key]; if(!targets.length) continue; const rig=portraitRigs[key]; posePortrait(key,t);
      ps.add(rig); pr.render(ps,pc); ps.remove(rig);
      targets.forEach(c=>{const g=c.getContext('2d');g.clearRect(0,0,c.width,c.height);g.drawImage(pr.domElement,0,0,c.width,c.height);}); } })(0);
}
