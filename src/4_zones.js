
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
function zoneAt(t){return BIOMES[segAt(t).meta.biome||'coast'];}
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
const asteroids=[]; (()=>{ const s0=segByName('cave').t0, s1=segByName('postwall').t1; const geo=new THREE.IcosahedronGeometry(1,1); const pa=geo.attributes.position; for(let i=0;i<pa.count;i++){ rnd(.5);const s=.88+.16*Math.sin(pa.getX(i)*4+pa.getY(i)*2+pa.getZ(i)*3);pa.setXYZ(i,pa.getX(i)*s,pa.getY(i)*s,pa.getZ(i)*s); } geo.computeVertexNormals();
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
function updateBiomes(t,time){
 biomeProps.aurora.children.forEach(m=>m.visible=segAt(m.userData.t).meta.biome==='aurora'&&Math.abs(m.userData.t-t)<280);
 biomeProps.blossom.children.forEach(m=>m.visible=segAt(m.userData.t).meta.biome==='blossom'&&Math.abs(m.userData.t-t)<280);
 auroraCurtain.visible=zoneAt(t)===BIOMES.aurora;auroraCurtain.rotation.y=Math.sin(time*.05)*.1;
 adventureScenery.children.forEach(g=>g.visible=playersInView(g.userData.t));
 fireflyMat.opacity=.45+Math.sin(time*2)*.18;
}
function playersInView(t){return typeof players!=='undefined'&&players.length?players.some(p=>Math.abs(p.t-t)<240):Math.abs((camera.userData.attractT||0)-t)<240;}
const BIOMES={coast:ZONES.find(z=>z.name==='Coral Coast'),sky:ZONES.find(z=>z.name==='Rainbow Sky'),space:ZONES.find(z=>z.name==='Space Run'),sunset:ZONES.find(z=>z.name==='Sunset Finish'),aurora:AURORA,blossom:BLOSSOM};
BIOMES.desert={...BIOMES.sunset,name:'Mummy Mirage',sky:[0x9b78b2,0xedbd87,0xffe6ac].map(c=>new THREE.Color(c)),fog:new THREE.Color(0xe1b782),fogD:.0024,sun:2.2,hemi:1.05,stars:0};
BIOMES.forest={...BIOMES.space,name:'Whispering Woods',sky:[0x131e36,0x36514f,0x779582].map(c=>new THREE.Color(c)),fog:new THREE.Color(0x354c47),fogD:.0045,sun:1.6,sunCol:new THREE.Color(0xdce9ae),hemi:1.15,ocean:.6,stars:.22};
const adventureScenery=new THREE.Group();world.add(adventureScenery);
const bark=new THREE.MeshStandardMaterial({color:0x544446,roughness:1}),leaves=new THREE.MeshStandardMaterial({color:0x234c46,roughness:1}),leaves2=new THREE.MeshStandardMaterial({color:0x456a54,roughness:1}),sandstone=new THREE.MeshStandardMaterial({color:0xd9ac75,roughness:.95}),sandLight=new THREE.MeshStandardMaterial({color:0xe8c38c,roughness:1});
const fireflyMat=new THREE.MeshBasicMaterial({color:0xb5ffc6,transparent:true,opacity:.6});
for(const seg of SEGS){if(!['forest','desert'].includes(seg.meta.biome)||seg.type==='gap')continue;
 for(let t=seg.t0+8;t<seg.t1;t+=20){const f=frameAt(t),g=new THREE.Group();g.userData.t=t;g.position.copy(f.p);g.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(f.B.clone().negate(),f.N,f.T));adventureScenery.add(g);
  for(const side of [-1,1]){const x=side*(ROAD_W+5+(Math.floor(t)%3));
   if(seg.meta.biome==='forest'){
    const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.5,.95,9,9),bark);trunk.position.set(x,4,0);trunk.rotation.z=-side*.12;trunk.castShadow=true;g.add(trunk);
    for(let j=0;j<3;j++){const canopy=new THREE.Mesh(new THREE.IcosahedronGeometry(1,1),j%2?leaves:leaves2);canopy.scale.set(4,2.8,4);canopy.position.set(x-side*j*1.3,8+j*1.6,j-1);g.add(canopy);}
    const branch=new THREE.Mesh(new THREE.CylinderGeometry(.13,.28,5,7),bark);branch.position.set(x-side*1.7,6.5,0);branch.rotation.z=side*1;g.add(branch);
    for(let j=0;j<4;j++){const fly=new THREE.Mesh(new THREE.SphereGeometry(.07,6,5),fireflyMat);fly.position.set(side*(3.5+j),1+(t*j%4),j*2);g.add(fly);}
   }else{
    const dune=new THREE.Mesh(new THREE.SphereGeometry(1,14,10),sandLight);dune.scale.set(13,3.6,15);dune.position.set(x+side*15,-2,-3);g.add(dune);
    const obelisk=new THREE.Mesh(new THREE.CylinderGeometry(.25,.7,6,4),sandstone);obelisk.position.set(x,2.8,0);g.add(obelisk);
    if(Math.floor(t/20)%3===0){const pyramid=new THREE.Mesh(new THREE.ConeGeometry(12,15,4),sandstone);pyramid.position.set(x+side*20,5,5);pyramid.rotation.y=Math.PI/4;g.add(pyramid);}
    const marker=new THREE.Mesh(new THREE.TorusGeometry(.48,.08,6,16),lanternMat);marker.position.set(x,3.4,.51);g.add(marker);
   }
  }
 }
}

/* Cover-inspired landmarks: visual dressing only; track frames and colliders stay unchanged. */
const detailGeo={box:new THREE.BoxGeometry(1,1,1),pillar:new THREE.CylinderGeometry(1,1,1,10),cone:new THREE.ConeGeometry(1,1,5),orb:new THREE.SphereGeometry(1,16,12),ring:new THREE.TorusGeometry(1,.055,6,48)};
const detailMat={stone:new THREE.MeshStandardMaterial({color:0xb97936,roughness:.88}),gold:new THREE.MeshStandardMaterial({color:0xe6b969,roughness:.7}),dark:new THREE.MeshStandardMaterial({color:0x533629,roughness:1}),glyph:new THREE.MeshStandardMaterial({color:0x7ffff0,emissive:0x30dacb,emissiveIntensity:1.35,roughness:.4}),flame:new THREE.MeshBasicMaterial({color:0xffbf55}),violet:new THREE.MeshStandardMaterial({color:0x49347d,metalness:.3,roughness:.5}),crystal:new THREE.MeshStandardMaterial({color:0x9d74ed,emissive:0x6734bf,emissiveIntensity:.5,metalness:.3,roughness:.3}),cyan:new THREE.MeshBasicMaterial({color:0x6edfff}),planet:new THREE.MeshStandardMaterial({color:0x9167c8,emissive:0x483269,emissiveIntensity:.4,roughness:.8})};
function detailMesh(parent,shape,material,x,y,z,sx,sy,sz){const m=new THREE.Mesh(detailGeo[shape],detailMat[material]);m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.receiveShadow=true;parent.add(m);return m;}
function landmarkAt(t){const g=new THREE.Group(),f=frameAt(t);g.userData.t=t;g.position.copy(f.p);g.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(f.B.clone().negate(),f.N,f.T));adventureScenery.add(g);return g;}
// Reusable turquoise carved-symbol atlas, kept on the pillar faces.
const glyphTexture=canvasTex(128,512,g=>{g.clearRect(0,0,128,512);g.strokeStyle='#91ffdc';g.lineWidth=7;g.lineCap='round';for(let j=0;j<4;j++){const y=48+j*120;g.beginPath();g.moveTo(64,y-24);g.lineTo(40,y);g.lineTo(64,y+24);g.lineTo(88,y);g.closePath();g.stroke();g.beginPath();g.moveTo(64,y+24);g.lineTo(64,y+60);g.moveTo(44,y+42);g.lineTo(84,y+42);g.stroke();}},false);
const glyphFaceMat=new THREE.MeshBasicMaterial({map:glyphTexture,transparent:true,depthWrite:false,side:THREE.DoubleSide});
const glyphFaceGeo=new THREE.PlaneGeometry(1,4);
function temple(g,x){
 detailMesh(g,'box','stone',x,3.8,0,10,8,4);detailMesh(g,'box','dark',x,3,.0,3.4,5.6,4.08);
 for(const side of [-1,1]){detailMesh(g,'box','gold',x+side*3.7,4.2,.4,1.6,8.4,4.5);const glyph=new THREE.Mesh(glyphFaceGeo,glyphFaceMat);glyph.position.set(x+side*3.7,4.1,2.67);g.add(glyph);
  detailMesh(g,'pillar','dark',x+side*4,1.3,4.3,.55,2.6,.55);detailMesh(g,'cone','flame',x+side*4,3,4.3,.38,1.1,.38);}
 for(let i=0;i<4;i++)detailMesh(g,'box',i%2?'stone':'gold',x,8.2+i*.65,-.2,11-i*2,.7,5-i*.5);
 for(let i=0;i<4;i++)detailMesh(g,'box','gold',x,.15+i*.26,5-i*.7,4.4,.3+i*.52,1.3);
 const medallion=detailMesh(g,'ring','glyph',x,8.4,2.65,.7,.7,.7);medallion.rotation.z=Math.PI/4;
}
for(const seg of SEGS){
 if(seg.meta.biome==='desert'&&seg.type==='road'&&seg.t1-seg.t0>45){
  const t=seg.t0+30,g=landmarkAt(t),side=Math.floor(t/30)%2?1:-1;const shrine=new THREE.Group();shrine.position.x=side*16;shrine.rotation.y=Math.PI;g.add(shrine);temple(shrine,0);
  // Broad terraced pyramid beyond the road shoulder, with visible masonry courses.
  for(let j=0;j<9;j++)detailMesh(g,'box',j%2?'stone':'gold',-side*29,j*1.6-1,17,23-j*2.4,1.6,23-j*2.4);
  for(let j=0;j<3;j++)detailMesh(g,'box','stone',side*(28+j*4),j*2-3,-12,9,8+j*3,10);
 }
 if(seg.meta.biome==='space'&&['cave','road'].includes(seg.type)){
  for(let t=seg.t0+15;t<seg.t1;t+=52){const g=landmarkAt(t);
   for(const side of [-1,1]){const x=side*(18+Math.floor(t)%9),y=side===1?1:-4;
    detailMesh(g,'pillar','violet',x,y-2,0,7,2.5,7);const ring=detailMesh(g,'ring','cyan',x,y-.7,0,6.4,6.4,6.4);ring.rotation.x=Math.PI/2;
    const base=detailMesh(g,'cone','crystal',x,y-7,0,6.5,9,6.5);base.rotation.x=Math.PI;
    detailMesh(g,'pillar','violet',x,y+1,0,2,3.5,2);detailMesh(g,'orb','crystal',x,y+3,0,2.5,1.4,2.5);detailMesh(g,'orb','cyan',x,y+4.8,0,.45,.45,.45);
    for(let j=0;j<3;j++){const crystal=detailMesh(g,'cone','crystal',x+side*(5+j*2),y-3-j*2,4+j*3,1,4+j,1);crystal.rotation.z=side*.2;}
   }
  }
 }
}
// A ringed planet composed beside the space route, visible from the racing camera.
{const s=segByName('cave'),g=landmarkAt((s.t0+s.t1)/2);detailMesh(g,'orb','planet',-95,62,125,35,35,35);const ring=new THREE.Mesh(new THREE.RingGeometry(43,57,64),new THREE.MeshBasicMaterial({color:0xe8c7ff,side:THREE.DoubleSide,transparent:true,opacity:.65}));ring.position.set(-95,62,125);ring.rotation.set(.55,.1,.15);g.add(ring);}
// Color follows transported road normals, including banked turns; no new walkable surfaces.
const skywayColors=[0xf46b8b,0xf7a35b,0xf4d66e,0x75d99c,0x60cce6,0x718ded,0xac7bdc];
const skywayMat=new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.DoubleSide,toneMapped:false});
const desertRoadMat=new THREE.MeshStandardMaterial({map:TEX.sand,color:0xe7bc7b,roughness:.92,side:THREE.DoubleSide});
for(const seg of SEGS){
 if(seg.meta.biome==='desert'&&seg.type==='road')world.add(ribbon(seg.start,seg.end,()=>ROAD_W,desertRoadMat,true,.018));
 if(seg.meta.biome==='space'&&['road','cave','wall'].includes(seg.type)){
  const pos=[],colors=[],indices=[];let n=0;
  for(let band=0;band<7;band++){const c=new THREE.Color(skywayColors[band]);for(let i=seg.start;i<=seg.end;i++){for(let edge=0;edge<2;edge++){const v=FR.P[i].clone().addScaledVector(FR.B[i],-ROAD_W+(band+edge)*2*ROAD_W/7).addScaledVector(FR.N[i],.025);pos.push(v.x,v.y,v.z);colors.push(c.r,c.g,c.b);}if(i>seg.start)indices.push(n-2,n-1,n,n-1,n+1,n);n+=2;}}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geo.setIndex(indices);geo.computeVertexNormals();world.add(new THREE.Mesh(geo,skywayMat));
 }
 if(seg.type==='rail')for(const [idx,x]of [-RAIL_X,0,RAIL_X].entries()){const mat=new THREE.MeshStandardMaterial({color:skywayColors[idx*3],emissive:skywayColors[idx*3],emissiveIntensity:.65,metalness:.5,roughness:.3});world.add(sideRail(seg.start,seg.end,x,.19,true,mat));}
}
