
/* =====================================================================
   ZONES — coast → rainbow sky → jungle ruins → space → sunset finale
   ===================================================================== */
const ZONES=(()=>{ const sg=segByName; const C=h=>new THREE.Color(h); return [
  {name:'Coral Coast', t0:-1e9, t1:sg('climb').t0, sky:[C(0x2f7fd6),C(0x8ed3f5),C(0xfff0c9)], fog:C(0xbfe3f2), fogD:.0016, sun:3.1, sunCol:C(0xfff0d6), hemi:.95, ocean:.96, stars:0},
  {name:'Rainbow Sky', t0:sg('climb').t0, t1:sg('raillanding').t1, sky:[C(0x3a8ee8),C(0xa8dcff),C(0xffffff)], fog:C(0xdcefff), fogD:.0011, sun:3.3, sunCol:C(0xfff6e0), hemi:1.1, ocean:.96, stars:0},
  {name:'Jungle Ruins', t0:sg('raillanding').t1, t1:sg('ruins2').t1, sky:[C(0x2f9fd6),C(0x9fe0c8),C(0xf6f0c0)], fog:C(0xcfe9d5), fogD:.0022, sun:2.8, sunCol:C(0xfff2c8), hemi:1.0, ocean:.96, stars:0},
  {name:'Space Run', t0:sg('cave').t0, t1:sg('postwall').t1, sky:[C(0x05030f),C(0x0d0a2a),C(0x2a1450)], fog:C(0x0b0820), fogD:.0022, sun:.7, sunCol:C(0xc9d8ff), hemi:.35, ocean:.15, stars:1},
  {name:'Sunset Finish', t0:sg('sunsetturn').t0, t1:1e9, sky:[C(0x3a3f9e),C(0xff9a5c),C(0xffe2a0)], fog:C(0xffcfa8), fogD:.0015, sun:2.6, sunCol:C(0xffc27a), hemi:.85, ocean:.96, stars:.15},
]; })();
const zoneState={cur:null,mix:{}};
function zoneAt(t){ if(S.destination==='aurora')return AURORA;if(S.destination==='blossom')return BLOSSOM; for(let i=ZONES.length-1;i>=0;i--){ if(t>=ZONES[i].t0) return ZONES[i]; } return ZONES[0]; }
function applyZone(t,dt){ const z=zoneAt(t); const k=1-Math.exp(-1.6*dt); const m=zoneState.mix; if(!m.sky){ m.sky=z.sky.map(c=>c.clone()); m.fog=z.fog.clone(); m.fogD=z.fogD; m.sun=z.sun; m.sunCol=z.sunCol.clone(); m.hemi=z.hemi; m.ocean=z.ocean; m.stars=z.stars; }
  m.sky.forEach((c,i)=>c.lerp(z.sky[i],k)); m.fog.lerp(z.fog,k); m.fogD=lerp(m.fogD,z.fogD,k); m.sun=lerp(m.sun,z.sun,k); m.sunCol.lerp(z.sunCol,k); m.hemi=lerp(m.hemi,z.hemi,k); m.ocean=lerp(m.ocean,z.ocean,k); m.stars=lerp(m.stars,z.stars,k);
  const u=sky.material.uniforms; u.top.value.copy(m.sky[0]); u.mid.value.copy(m.sky[1]); u.bot.value.copy(m.sky[2]); scene.fog.color.copy(m.fog); scene.fog.density=m.fogD; oceanMat.uniforms.fogColor.value.copy(m.fog); oceanMat.uniforms.fogDensity.value=m.fogD; oceanMat.uniforms.skyC.value.copy(m.sky[1]);
  sun.intensity=m.sun; sun.color.copy(m.sunCol); hemi.intensity=m.hemi; oceanMat.uniforms.opacity.value=m.ocean; starsMat.opacity=m.stars; stars.visible=m.stars>.02; planets.visible=m.stars>.3; sunSprite.material.opacity=.9*(1-m.stars);
  if(zoneState.cur!==z){ if(zoneState.cur) toast(z.name+'!'); zoneState.cur=z; } }

/* ---- rainbows: 7 translucent bands, no fog so they glow from far away */
const RB=[0xff3b3b,0xff9a2e,0xffe23a,0x4fe36b,0x3ac6ff,0x4a5cff,0xb64fff];
function rainbowArch(radius,tube=1.1){ const g=new THREE.Group(); RB.forEach((c,i)=>{ const r=radius-i*tube*1.05; const m=new THREE.Mesh(new THREE.TorusGeometry(r,tube*.55,6,64,Math.PI),new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:.62,fog:false,depthWrite:false})); g.add(m); }); return g; }
function placeArch(t,lane,radius,tube,yaw=0){ const f=frameAt(t); const a=rainbowArch(radius,tube); a.position.copy(f.p).addScaledVector(f.B,lane).addScaledVector(f.N,-radius*.05); a.quaternion.setFromRotationMatrix(M4.makeBasis(f.B,f.N,f.T.clone().negate())); a.rotateY(yaw); world.add(a); return a; }
(()=>{ const sg=segByName; const sk=sg('rails');
  for(let k=0;k<5;k++) placeArch(sk.t0+10+k*32,0,ROAD_W+6+k%2*2,.7);
  placeArch(sg('start').t0+42,0,ROAD_W+7,.8); placeArch(sg('finish').t1-2,0,ROAD_W+8,.9);
  // giant distant rainbows over the sea and over the jungle
  const big=rainbowArch(220,10); const f=frameAt(sg('downhill').t0+40); big.position.copy(f.p).addScaledVector(f.B,-260).add(new THREE.Vector3(0,-40,0)); big.quaternion.setFromRotationMatrix(M4.makeBasis(f.T,new THREE.Vector3(0,1,0),f.B)); world.add(big);
  const big2=rainbowArch(160,8); const f2=frameAt(sg('ruins').t0); big2.position.copy(f2.p).addScaledVector(f2.T,180).add(new THREE.Vector3(0,-20,0)); big2.quaternion.setFromRotationMatrix(M4.makeBasis(f2.B,new THREE.Vector3(0,1,0),f2.T.clone().negate())); world.add(big2); })();

/* ---- rainbow road under the rails (7 stripes across the width) */
(()=>{ const s=segByName('rails'); const i0=s.start,i1=s.end; const pos=[],col=[],idx=[]; const n=8; let k=0;
  for(let i=i0;i<=i1;i++){ for(let j=0;j<n;j++){ const x=(j/(n-1)-.5)*2*(ROAD_W+.6); const v=FR.P[i].clone().addScaledVector(FR.B[i],x).addScaledVector(FR.N[i],-.35); pos.push(v.x,v.y,v.z); const c=new THREE.Color(RB[Math.min(6,j)]); col.push(c.r,c.g,c.b); if(i>i0&&j>0){ idx.push(k-n-1,k-1,k-n, k-1,k,k-n); } k++; } }
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); g.setAttribute('color',new THREE.Float32BufferAttribute(col,3)); g.setIndex(idx); g.computeVertexNormals();
  const m=new THREE.Mesh(g,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.5,emissive:0xffffff,emissiveIntensity:.18,side:THREE.DoubleSide})); m.receiveShadow=true; world.add(m); })();

const balloons=[];
/* ---- fluffy clouds and hot-air balloons around the sky section */
(()=>{ const s0=segByName('climb').t0, s1=segByName('raillanding').t1; const cloudGeo=new THREE.SphereGeometry(1,10,8);
  for(let k=0;k<34;k++){ const t=s0+rnd(s1-s0); const f=frameAt(t); const side=Math.random()<.5?-1:1; const c=new THREE.Group(); c.position.copy(f.p).addScaledVector(f.B,side*(ROAD_W+8+rnd(40))).add(new THREE.Vector3(0,-14+rnd(20),0));
    const n=4+Math.floor(rnd(5)); for(let j=0;j<n;j++){ const m=new THREE.Mesh(cloudGeo,MAT.cloud); const r=3+rnd(4); m.scale.set(r*1.4,r*.8,r); m.position.set((j-n/2)*3.4+rnd(2),rnd(1.5),rnd(3)-1.5); m.castShadow=true; c.add(m); } world.add(c); }
  const cols=[0xff5a5a,0xffd23a,0x4fe36b,0x3ac6ff,0xb64fff,0xff8ad5];
  for(let k=0;k<6;k++){ const t=s0+20+k*(s1-s0-40)/5; const f=frameAt(t); const side=k%2?1:-1; const b=new THREE.Group(); b.position.copy(f.p).addScaledVector(f.B,side*(ROAD_W+16+rnd(14))).add(new THREE.Vector3(0,6+rnd(12),0));
    const env=new THREE.Mesh(new THREE.SphereGeometry(4.5,20,16),new THREE.MeshStandardMaterial({color:cols[k],roughness:.6})); env.scale.y=1.15; env.castShadow=true; b.add(env);
    const stripe=new THREE.Mesh(new THREE.TorusGeometry(4.5,.35,8,32),MAT.white); stripe.rotation.x=Math.PI/2; b.add(stripe);
    const basket=new THREE.Mesh(new THREE.BoxGeometry(1.6,1.2,1.6),MAT.wood); basket.position.y=-7.2; b.add(basket); for(const [x,z] of [[-.7,-.7],[.7,-.7],[-.7,.7],[.7,.7]]){ const rope=new THREE.Mesh(new THREE.CylinderGeometry(.04,.04,3,4),MAT.stoneDark); rope.position.set(x,-5.2,z); b.add(rope); }
    b.userData.ph=rnd(TAU); balloons.push(b); world.add(b); } })();

/* ---- jungle floor, giant flowers and mushrooms around the ruins */
(()=>{ const s0=segByName('ramp1').t1, s1=segByName('ruins2').t1; const mid=frameAt((s0+s1)/2); const floor=new THREE.Mesh(new THREE.CircleGeometry(170,40),MAT.grassDark); floor.rotation.x=-Math.PI/2; floor.position.copy(mid.p); floor.position.y=Math.min(mid.p.y-2,segByName('beach').t0?frameAt(segByName('beach').t0).p.y-1.5:mid.p.y-2); floor.receiveShadow=true; world.add(floor);
  const petalCols=[0xff5a8a,0xffd23a,0xff7a3a,0xb64fff,0x4fc3ff]; 
  for(let k=0;k<16;k++){ const t=s0+rnd(s1-s0); const f=frameAt(t); const side=Math.random()<.5?-1:1; const base=f.p.clone().addScaledVector(f.B,side*(ROAD_W+4+rnd(12))); base.y=floor.position.y; const h=5+rnd(6);
    const stem=new THREE.Mesh(new THREE.CylinderGeometry(.25,.4,h,8),MAT.leaf); stem.position.copy(base).add(new THREE.Vector3(0,h/2,0)); stem.castShadow=true; world.add(stem);
    const head=new THREE.Group(); head.position.copy(base).add(new THREE.Vector3(0,h,0)); const pc=petalCols[k%petalCols.length]; for(let j=0;j<6;j++){ const p=new THREE.Mesh(new THREE.SphereGeometry(1.1,10,8),new THREE.MeshStandardMaterial({color:pc,roughness:.7})); p.scale.set(1,.5,1.6); const a=j/6*TAU; p.position.set(Math.cos(a)*1.5,0,Math.sin(a)*1.5); p.rotation.y=-a+Math.PI/2; p.castShadow=true; head.add(p); } head.add(new THREE.Mesh(new THREE.SphereGeometry(.8,10,8),MAT.flowerY)); head.rotation.x=.4*side; world.add(head);
    if(k%2===0){ const mh=2+rnd(3); const mstem=new THREE.Mesh(new THREE.CylinderGeometry(.6,.8,mh,10),MAT.white); const mb=base.clone().addScaledVector(f.T,6); mstem.position.copy(mb).add(new THREE.Vector3(0,mh/2,0)); world.add(mstem); const cap=new THREE.Mesh(new THREE.SphereGeometry(2.2,14,10,0,TAU,0,Math.PI/2),new THREE.MeshStandardMaterial({color:0xe23b2e,roughness:.6})); cap.position.copy(mb).add(new THREE.Vector3(0,mh,0)); cap.castShadow=true; world.add(cap); for(let d=0;d<5;d++){ const dot=new THREE.Mesh(new THREE.SphereGeometry(.35,8,6),MAT.white); const a=rnd(TAU), r=rnd(1.6); dot.position.copy(cap.position).add(new THREE.Vector3(Math.cos(a)*r,Math.sqrt(Math.max(0,2.2*2.2-r*r))*.98,Math.sin(a)*r)); world.add(dot); } } } })();

/* ---- space: starfield, planets, asteroids around the floating road */
const starsMat=new THREE.PointsMaterial({color:0xffffff,size:2.2,sizeAttenuation:true,transparent:true,opacity:0,fog:false,depthWrite:false});
const stars=(()=>{ const n=2600; const a=new Float32Array(n*3); for(let i=0;i<n;i++){ const v=new THREE.Vector3(rnd(2)-1,rnd(1.6)-.3,rnd(2)-1).normalize().multiplyScalar(1300+rnd(100)); a.set([v.x,v.y,v.z],i*3); } const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(a,3)); const p=new THREE.Points(g,starsMat); p.visible=false; sky.add(p); return p; })();
const planets=new THREE.Group(); sky.add(planets); planets.visible=false;
(()=>{ const mk=(r,c,e,pos,ring)=>{ const m=new THREE.Mesh(new THREE.SphereGeometry(r,24,18),new THREE.MeshStandardMaterial({color:c,emissive:e,emissiveIntensity:.35,roughness:.8,fog:false})); m.position.copy(pos); planets.add(m); if(ring){ const rg=new THREE.Mesh(new THREE.TorusGeometry(r*1.7,r*.16,6,40),new THREE.MeshStandardMaterial({color:0xf0d8a0,emissive:0x806030,emissiveIntensity:.3,fog:false})); rg.position.copy(pos); rg.rotation.x=1.2; rg.scale.z=.15; planets.add(rg); } };
  mk(120,0xff8a5a,0xff5a2a,new THREE.Vector3(-700,380,-900),true); mk(70,0x7fc9ff,0x2a6aff,new THREE.Vector3(800,260,-600),false); mk(45,0xd8b0ff,0x7a40ff,new THREE.Vector3(300,520,700),false);
  const moon=new THREE.Mesh(new THREE.SphereGeometry(90,24,18),new THREE.MeshBasicMaterial({color:0xfff7d6,fog:false})); moon.position.set(-300,600,400); planets.add(moon); })();
const asteroids=[]; (()=>{ const s0=segByName('cave').t0, s1=segByName('postwall').t1; const geo=new THREE.IcosahedronGeometry(1,1); const pa=geo.attributes.position; for(let i=0;i<pa.count;i++){ const s=.75+rnd(.5); pa.setXYZ(i,pa.getX(i)*s,pa.getY(i)*s,pa.getZ(i)*s); } geo.computeVertexNormals();
  for(let k=0;k<44;k++){ const t=s0+rnd(s1-s0); const f=frameAt(t); const side=Math.random()<.5?-1:1; const m=new THREE.Mesh(geo,MAT.stoneDark); m.position.copy(f.p).addScaledVector(f.B,side*(ROAD_W+6+rnd(40))).addScaledVector(f.N,-10+rnd(26)); const sc=1.5+rnd(5); m.scale.setScalar(sc); m.rotation.set(rnd(TAU),rnd(TAU),0); m.castShadow=true; m.userData.spin=new THREE.Vector3(rnd(.4)-.2,rnd(.4)-.2,rnd(.2)-.1); world.add(m); asteroids.push(m); } })();

/* Two additional art-directed biomes, reused as full-course atmosphere variants. */
const AURORA={...ZONES[3],name:'Aurora Valley',sky:[0x101f54,0x386b88,0x9bdfd5].map(c=>new THREE.Color(c)),fog:new THREE.Color(0x81b7c9),fogD:.0017,sun:1.8,hemi:1.2,ocean:.8,stars:.5,t0:segByName('postcork').t0,t1:segByName('climb').t0};
const BLOSSOM={...ZONES[4],name:'Blossom Festival',sky:[0x7778bf,0xefb2c8,0xffecd3].map(c=>new THREE.Color(c)),fog:new THREE.Color(0xefcbd8),sun:2.2,hemi:1.15,stars:0,t0:segByName('sunsetturn').t0,t1:segByName('finish').t0};
ZONES.push(AURORA,BLOSSOM);ZONES.sort((a,b)=>a.t0-b.t0);
// Return to the golden coast for the lighthouse finale.
ZONES.push({...ZONES.find(z=>z.name==='Sunset Finish'),t0:segByName('finish').t0});
ZONES.sort((a,b)=>a.t0-b.t0);
const biomeProps={aurora:new THREE.Group(),blossom:new THREE.Group()};world.add(biomeProps.aurora,biomeProps.blossom);
const iceMat=new THREE.MeshStandardMaterial({color:0x9ef5ee,emissive:0x419ca7,emissiveIntensity:.28,metalness:.22,roughness:.2});
const blossomMat=new THREE.MeshStandardMaterial({color:0xf8b8cb,roughness:.85});
const blossomLightMat=new THREE.MeshStandardMaterial({color:0xffd6d7,roughness:.85});
const barkMat=new THREE.MeshStandardMaterial({color:0x755769,roughness:1});
const lanternMat=new THREE.MeshStandardMaterial({color:0xffcc7a,emissive:0xffac4d,emissiveIntensity:.6,roughness:.6});
for(let k=0;k<72;k++){
  const t=15+k*(FR.len-50)/72,f=frameAt(t),side=k%2?1:-1;
  const crystal=new THREE.Group();crystal.position.copy(f.p).addScaledVector(f.B,side*(ROAD_W+4+(k%5)*2));
  for(let j=0;j<3;j++){const h=3+(k+j)%6;const m=new THREE.Mesh(new THREE.CylinderGeometry(0,.8,h,5),iceMat);m.position.set((j-1)*1.1,h/2,-j*.5);m.rotation.z=(j-1)*.18;crystal.add(m);}biomeProps.aurora.add(crystal);crystal.userData.t=t;
  if(k%2===0){const tree=new THREE.Group();tree.position.copy(f.p).addScaledVector(f.B,side*(ROAD_W+7));
    const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.25,.48,5.2,7),barkMat);trunk.position.y=2.6;tree.add(trunk);
    for(let j=0;j<5;j++){const a=j/5*TAU;const crown=new THREE.Mesh(new THREE.SphereGeometry(1,12,9),j%2?blossomMat:blossomLightMat);crown.scale.set(2.5,1.5,2);crown.position.set(Math.cos(a)*1.8,5.4+(j%2)*1.2,Math.sin(a)*1.8);tree.add(crown);}
    const lantern=new THREE.Mesh(new THREE.SphereGeometry(.5,10,8),lanternMat);lantern.scale.y=1.3;lantern.position.set(-side*2,3.3,0);tree.add(lantern);biomeProps.blossom.add(tree);tree.userData.t=t;
  }
}
const auroraCurtain=new THREE.Group();sky.add(auroraCurtain);
for(let j=0;j<3;j++){const points=[],indices=[];for(let i=0;i<=48;i++){const a=i/48*Math.PI*1.4;const x=Math.cos(a)*700,z=Math.sin(a)*700;const y=250+Math.sin(a*5+j)*70;points.push(x,y,z,x,y+90+Math.sin(a*3)*40,z);if(i<48){const n=i*2;indices.push(n,n+1,n+2,n+1,n+3,n+2);}}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(points,3));g.setIndex(indices);const m=new THREE.Mesh(g,new THREE.MeshBasicMaterial({color:[0x75efd0,0x7e91ed,0xb2a1ef][j],transparent:true,opacity:.16,side:THREE.DoubleSide,depthWrite:false,fog:false}));m.position.y=j*45;auroraCurtain.add(m);}
function updateBiomes(t,time){const aurora=S.destination==='aurora',blossom=S.destination==='blossom';
  biomeProps.aurora.children.forEach(m=>m.visible=(aurora||m.userData.t>=AURORA.t0&&m.userData.t<AURORA.t1)&&Math.abs(m.userData.t-t)<280);
  biomeProps.blossom.children.forEach(m=>m.visible=(blossom||m.userData.t>=BLOSSOM.t0&&m.userData.t<BLOSSOM.t1)&&Math.abs(m.userData.t-t)<280);
  auroraCurtain.visible=aurora||zoneAt(t).name==='Aurora Valley';auroraCurtain.rotation.y=Math.sin(time*.05)*.1;
}
