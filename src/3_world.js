function createAdventure(mapKey){
let disposed=false;const adventureDisposers=[];

/* =====================================================================
   TRACK — turtle builder → dense polyline → parallel-transport frames
   ===================================================================== */
const ROAD_W=4.6, RAIL_X=2.4;
class Turtle {
  constructor(){ this.pts=[]; this.roll=[]; this.type=[]; this.pos=new THREE.Vector3(0,0,0); this.yaw=0; this.segs=[]; this.cur=null; this.stepLen=1.5; }
  fwdDir(){ return new THREE.Vector3(Math.sin(this.yaw),0,Math.cos(this.yaw)); }
  rightDir(){ return new THREE.Vector3(Math.cos(this.yaw),0,-Math.sin(this.yaw)).negate(); } // right of travel (T × up)
  begin(type,meta={}){ this.cur={type,start:this.pts.length,meta}; }
  end(){ this.cur.end=this.pts.length-1; this.segs.push(this.cur); this.cur=null; }
  push(roll=0){ this.pts.push(this.pos.clone()); this.roll.push(roll); this.type.push(this.cur?this.cur.type:'road'); }
  straight(len,dy=0,type='road',meta={},linear=false){ this.begin(type,meta); const n=Math.max(2,Math.round(len/this.stepLen)); const y0=this.pos.y; const f=this.fwdDir(); const x0=this.pos.x,z0=this.pos.z;
    for(let i=1;i<=n;i++){ const u=i/n; this.pos.set(x0+f.x*len*u, y0+dy*(linear?u:smoothstep(0,1,u)), z0+f.z*len*u); this.push(); } this.end(); }
  turn(deg,len,dy=0,type='road',meta={}){ this.begin(type,meta); const n=Math.max(4,Math.round(len/this.stepLen)); const total=deg*Math.PI/180; const y0=this.pos.y; let prev=0;
    for(let i=1;i<=n;i++){ const u=i/n; const ang=total*smoothstep(0,1,u); this.yaw+= (ang-prev); prev=ang; const f=this.fwdDir(); this.pos.x+=f.x*len/n; this.pos.z+=f.z*len/n; this.pos.y=y0+dy*smoothstep(0,1,u); this.push(); } this.end(); }
  loop(r){ this.begin('loop',{r}); const n=Math.round(TAU*r/this.stepLen); const f=this.fwdDir(), rt=this.rightDir(), c=this.pos.clone().add(new THREE.Vector3(0,r,0)); const shift=2.6*ROAD_W;
    for(let i=1;i<=n;i++){ const a=i/n*TAU; // angle from bottom, going forward & up
      this.pos.copy(c).addScaledVector(f,Math.sin(a)*r).addScaledVector(new THREE.Vector3(0,1,0),-Math.cos(a)*r).addScaledVector(rt,shift*(i/n)); this.push(); } this.end(); }
  corkscrew(len,r){ this.begin('cork',{}); const n=Math.round(len/this.stepLen); const f=this.fwdDir(), rt=this.rightDir(), base=this.pos.clone();
    for(let i=1;i<=n;i++){ const u=i/n, a=TAU*u; const ease=smoothstep(0,.12,u)*smoothstep(1,.88,u); const rr=r*ease; // helix around an axis r above the base line
      this.pos.copy(base).addScaledVector(f,len*u).addScaledVector(rt,-Math.sin(a)*rr).addScaledVector(new THREE.Vector3(0,1,0),(1-Math.cos(a))*rr); this.push(a); } this.end(); }
  wall(len,side=1,deg=0){ this.begin('wall',{side}); const n=Math.round(len/this.stepLen); const total=deg*Math.PI/180; let prev=0;
    for(let i=1;i<=n;i++){ const u=i/n; const ang=total*smoothstep(0,1,u); this.yaw+=ang-prev; prev=ang; const f=this.fwdDir(); this.pos.x+=f.x*len/n; this.pos.z+=f.z*len/n;
      const k=smoothstep(0,.26,u)*smoothstep(1,.74,u); this.pos.y+=0; this.push(side*k*Math.PI/2*.92); } this.end(); }
}
const MAPS={
 tour:{name:'Spooky Forest',tag:'The winding expedition',color:'#83d9ac',art:'maps/wildwood-rush.jpg',order:['forest','desert','sky','loop','space'],turn:1,forest:220,description:'Forest chase → buried temple → rainbow rails',challenge:'Balanced · 2 chases · mummy ambushes'},
 aurora:{name:'Mysterious Pyramid',tag:'The desert treasure trail',color:'#f3c47d',art:'maps/temple-twist.jpg',order:['desert','loop','forest','space','sky'],turn:-1,forest:250,description:'Desert switchbacks → corkscrew → haunted woods',challenge:'Dodge-heavy · more mummies · crystal detours'},
 blossom:{name:'Space Travel',tag:'The high-flying mystery',color:'#b9b0ff',art:'maps/starlight-safari.jpg',order:['space','sky','forest','desert','loop'],turn:1,forest:270,description:'Space run → sky bridge → cheetah territory',challenge:'Chase-heavy · longer forest · lantern rewards'},
};
function buildTrack(key=mapKey){
 const config=MAPS[key],T=new Turtle(),turn=config.turn;
 T.pos.set(0,118,0);T.yaw=0;T.push();
 function biome(name,fn){const from=T.segs.length;fn();for(let i=from;i<T.segs.length;i++)T.segs[i].meta.biome=name;}
 biome(key==='aurora'?'desert':'coast',()=>{
 T.straight(60,-2,'road',{name:'start'});T.turn(-30*turn,60,-16);
 T.straight(120,-52,'road',{name:'downhill'});T.turn((key==='blossom'?65:45)*turn,80,-18,'road',{name:'dash'});T.straight(50,-6);});
 const blocks={
 forest:()=>biome('forest',()=>{T.turn(35*turn,65,0,'road',{name:'forestGate'});T.turn(-55*turn,80,2,'road',{name:'forestBend'});T.straight(config.forest,-2,'road',{name:'forestChase'});T.turn(30*turn,60,0,'road',{name:'forestExit'});}),
 desert:()=>biome('desert',()=>{T.straight(30,9,'road',{name:'ramp1'},true);T.straight(42,-8,'gap',{name:'chain'});T.straight(60,-1,'road',{name:'beach'});T.turn((key==='aurora'?100:50)*turn,key==='aurora'?125:90,0,'road',{name:'beach2'});T.straight(46,0,'bridge',{name:'bridge'});T.straight(65,3,'road',{name:'ruins'});T.turn((key==='aurora'?-90:-35)*turn,95,8,'road',{name:'ruins2'});}),
 sky:()=>biome('sky',()=>{T.turn(-40*turn,70,22,'road',{name:'climb',float:true});T.straight(18,3,'road',{name:'railstart',float:true});T.straight(key==='blossom'?195:150,6,'rail',{name:'rails'});T.straight(40,-24,'road',{name:'raillanding',float:true});}),
 loop:()=>biome(key==='aurora'?'aurora':'blossom',()=>{T.straight(24,0,'road',{name:'preloop'});T.loop(key==='aurora'?20:17);T.straight(30,-2);T.corkscrew(key==='blossom'?145:110,7);T.straight(30,-3,'road',{name:'postcork'});}),
 space:()=>biome('space',()=>{T.straight(110,10,'cave',{name:'cave',float:true});T.straight(20,0,'road',{name:'caveexit',float:true});T.wall(90,1,40*turn);T.straight(30,-2,'road',{name:'postwall',float:true});})
 };
 config.order.forEach(name=>blocks[name]());
 biome('sunset',()=>{T.turn(30*turn,50,6,'road',{name:'sunsetturn'});T.straight(30,10,'road',{name:'ramp2'},true);T.straight(55,-14,'gap',{name:'waterfall'});T.straight(40,-6,'road',{name:'landing2'});T.turn(-25*turn,70,-3,'road',{name:'sprint'});T.straight(160,-2,'road',{name:'sprint2'});T.straight(60,0,'road',{name:'finish'});T.straight(40,0,'road',{name:'after'});});return T;
}
const TR = buildTrack();
// Frames by parallel transport, plus explicit roll around the tangent
const FR = (()=>{
  const P=TR.pts, n=P.length, T=[],N=new Array(n),B=[],cum=[0], up=new THREE.Vector3(0,1,0);
  for(let i=0;i<n;i++){ const a=P[Math.max(0,i-1)], b=P[Math.min(n-1,i+1)]; T.push(b.clone().sub(a).normalize()); if(i>0) cum.push(cum[i-1]+P[i].distanceTo(P[i-1])); }
  const upProj=i=>{ const v=up.clone().sub(T[i].clone().multiplyScalar(up.dot(T[i]))); return v.lengthSq()<1e-6?new THREE.Vector3(1,0,0):v.normalize(); };
  const special=new Set(['loop','cork','wall']);
  N[0]=upProj(0); const q=new THREE.Quaternion();
  for(const s of TR.segs){
    if(!special.has(s.type)){ for(let i=s.start;i<=s.end;i++) N[i]=upProj(i); continue; }
    // parallel transport through the segment from the previous normal
    let nrm=N[s.start-1].clone(); const pt=[];
    for(let i=s.start;i<=s.end;i++){ q.setFromUnitVectors(T[i-1],T[i]); nrm=nrm.clone().applyQuaternion(q); nrm.sub(T[i].clone().multiplyScalar(nrm.dot(T[i]))).normalize(); pt.push(nrm.clone()); }
    // exit error vs. world-up, spread as a corrective roll so the road leaves the section level
    const endN=pt[pt.length-1].clone().applyAxisAngle(T[s.end],TR.roll[s.end]); const want=upProj(s.end);
    const err=Math.atan2(endN.clone().cross(want).dot(T[s.end]), endN.dot(want));
    const len=s.end-s.start;
    for(let i=s.start;i<=s.end;i++){ const u=(i-s.start)/len; N[i]=pt[i-s.start].applyAxisAngle(T[i],TR.roll[i]+err*smoothstep(0,1,u)); }
  }
  for(let i=0;i<n;i++){ if(!N[i]) N[i]=upProj(i); B.push(T[i].clone().cross(N[i]).normalize()); }
  return {P,T,N,B,cum,len:cum[n-1]};
})();
const SEGS = TR.segs.map(s=>({...s, t0:FR.cum[s.start], t1:FR.cum[s.end]}));
const segByName = name=>SEGS.find(s=>s.meta.name===name);
function segAt(t){ for(const s of SEGS){ if(t<=s.t1) return s; } return SEGS[SEGS.length-1]; }
function frameAt(t, out){
  const c=FR.cum; t=clamp(t,0,FR.len-0.001); let lo=0,hi=c.length-1; while(hi-lo>1){ const m=(lo+hi)>>1; if(c[m]<=t) lo=m; else hi=m; }
  const u=(t-c[lo])/Math.max(1e-6,c[hi]-c[lo]);
  out=out||{p:new THREE.Vector3(),T:new THREE.Vector3(),N:new THREE.Vector3(),B:new THREE.Vector3()};
  out.p.lerpVectors(FR.P[lo],FR.P[hi],u); out.T.lerpVectors(FR.T[lo],FR.T[hi],u).normalize(); out.N.lerpVectors(FR.N[lo],FR.N[hi],u).normalize(); out.B.lerpVectors(FR.B[lo],FR.B[hi],u).normalize(); out.i=lo; return out;
}
const worldAt=(t,lane,h,out)=>{ const f=frameAt(t,_fa); return (out||new THREE.Vector3()).copy(f.p).addScaledVector(f.B,lane).addScaledVector(f.N,h); };
const _fa={p:new THREE.Vector3(),T:new THREE.Vector3(),N:new THREE.Vector3(),B:new THREE.Vector3()};

/* =====================================================================
   RENDERER, SCENE, LIGHTS
   ===================================================================== */
const canvas=$('gl');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
const DPR=Math.min(devicePixelRatio||1, 1.6); renderer.setPixelRatio(DPR);
renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1.05; renderer.outputColorSpace=THREE.SRGBColorSpace;
const scene=new THREE.Scene();
const FOG_COL=new THREE.Color(0xbfe3f2); scene.fog=new THREE.FogExp2(FOG_COL.getHex(),0.0016);
let camera=new THREE.PerspectiveCamera(62,innerWidth/innerHeight,.3,1800);
const sun=new THREE.DirectionalLight(0xfff0d6,3.1); sun.position.set(120,180,-90); sun.castShadow=true;
sun.shadow.mapSize.set(2048,2048); sun.shadow.camera.near=20; sun.shadow.camera.far=520; const SB=70; sun.shadow.camera.left=-SB; sun.shadow.camera.right=SB; sun.shadow.camera.top=SB; sun.shadow.camera.bottom=-SB; sun.shadow.bias=-0.0006; sun.shadow.normalBias=.03;
scene.add(sun); scene.add(sun.target);
const hemi=new THREE.HemisphereLight(0xcfe9ff,0x5a7a3a,.95); scene.add(hemi);
const amb=new THREE.AmbientLight(0xffffff,.18); scene.add(amb);
// post
const composer=new EffectComposer(renderer,new THREE.WebGLRenderTarget(innerWidth,innerHeight,{samples:4,type:THREE.HalfFloatType})); composer.addPass(new RenderPass(scene,camera));
const bloom=new UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight),.42,.55,.86); composer.addPass(bloom); composer.addPass(new OutputPass());
// soft studio reflections for the characters (a PMREM room environment)
const ENV=(()=>{ const pm=new THREE.PMREMGenerator(renderer); const t=pm.fromScene(new RoomEnvironment(renderer),.04).texture; pm.dispose(); return t; })();
function resize(){ renderer.setSize(innerWidth,innerHeight); composer.setSize(innerWidth,innerHeight); camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix(); }
addEventListener('resize',resize); resize();

/* =====================================================================
   TEXTURES (procedural canvases)
   ===================================================================== */
function canvasTex(w,h,fn,repeat=true){ const c=document.createElement('canvas'); c.width=w; c.height=h; fn(c.getContext('2d'),w,h); const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; if(repeat){t.wrapS=t.wrapT=THREE.RepeatWrapping;} t.anisotropy=8; return t; }
const TEX={
  checker: canvasTex(256,256,(g,w,h)=>{ for(let y=0;y<4;y++)for(let x=0;x<4;x++){ g.fillStyle=(x+y)%2?'#8a5a34':'#c48a52'; g.fillRect(x*64,y*64,64,64);} g.fillStyle='rgba(255,255,255,.08)'; for(let i=0;i<300;i++) g.fillRect(rnd(256),rnd(256),2,2); }),
  road: canvasTex(256,256,(g,w,h)=>{ g.fillStyle='#e9c98e'; g.fillRect(0,0,w,h); for(let i=0;i<900;i++){ g.fillStyle=`rgba(${120+rnd(60)|0},${80+rnd(50)|0},40,${rnd(.25)})`; g.fillRect(rnd(w),rnd(h),3,3);} g.fillStyle='#6fae3a'; g.fillRect(0,0,22,h); g.fillRect(w-22,0,22,h); g.fillStyle='#8fcf4a'; g.fillRect(22,0,6,h); g.fillRect(w-28,0,6,h); g.fillStyle='rgba(255,255,255,.55)'; for(let y=0;y<h;y+=48) g.fillRect(w/2-3,y,6,24); }),
  rock: canvasTex(256,256,(g,w,h)=>{g.fillStyle='#dfd4c4';g.fillRect(0,0,w,h);for(let y=0;y<h;y+=12){g.fillStyle=`rgba(110,89,73,${.03+rnd(.07)})`;g.fillRect(0,y,w,2+rnd(5));}for(let i=0;i<2200;i++){g.fillStyle=`rgba(100,87,72,${rnd(.12)})`;g.fillRect(rnd(w),rnd(h),1+rnd(3),1+rnd(2));}}),
  sand: canvasTex(256,256,(g,w,h)=>{ g.fillStyle='#f3dfae'; g.fillRect(0,0,w,h); for(let i=0;i<1500;i++){ g.fillStyle=`rgba(${160+rnd(60)|0},${130+rnd(40)|0},80,${rnd(.25)})`; g.fillRect(rnd(w),rnd(h),2,2);} }),
  wood: canvasTex(128,256,(g,w,h)=>{ g.fillStyle='#a9743f'; g.fillRect(0,0,w,h); for(let i=0;i<40;i++){ g.strokeStyle=`rgba(80,45,15,${rnd(.4)+.1})`; g.lineWidth=rnd(3)+1; g.beginPath(); g.moveTo(rnd(w),0); g.lineTo(rnd(w),h); g.stroke(); } }),
  cloud: canvasTex(256,128,(g,w,h)=>{ g.clearRect(0,0,w,h); for(let i=0;i<9;i++){ const x=30+rnd(w-60), y=50+rnd(40), r=22+rnd(30); const gr=g.createRadialGradient(x,y,0,x,y,r); gr.addColorStop(0,'rgba(255,255,255,.95)'); gr.addColorStop(1,'rgba(255,255,255,0)'); g.fillStyle=gr; g.fillRect(0,0,w,h);} },false),
  glow: canvasTex(64,64,(g,w,h)=>{ const gr=g.createRadialGradient(32,32,0,32,32,32); gr.addColorStop(0,'rgba(255,255,255,1)'); gr.addColorStop(.4,'rgba(255,255,255,.5)'); gr.addColorStop(1,'rgba(255,255,255,0)'); g.fillStyle=gr; g.fillRect(0,0,w,h); },false),
};
TEX.checker.repeat.set(1,1); TEX.rock.repeat.set(1,1);

/* =====================================================================
   SKY, OCEAN, SUN
   ===================================================================== */
const sky=new THREE.Mesh(new THREE.SphereGeometry(1500,32,16), new THREE.ShaderMaterial({ side:THREE.BackSide, depthWrite:false, fog:false,
  uniforms:{ top:{value:new THREE.Color(0x2f7fd6)}, mid:{value:new THREE.Color(0x8ed3f5)}, bot:{value:new THREE.Color(0xfff0c9)}, sunDir:{value:sun.position.clone().normalize()} },
  vertexShader:`varying vec3 vW; void main(){ vW=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader:`uniform vec3 top,mid,bot,sunDir; varying vec3 vW; void main(){ vec3 d=normalize(vW); float h=d.y; vec3 c=mix(bot,mid,smoothstep(-.02,.18,h)); c=mix(c,top,smoothstep(.15,.7,h)); float s=max(dot(d,sunDir),0.); c+=vec3(1.,.9,.7)*pow(s,120.)*1.6+vec3(1.,.8,.5)*pow(s,8.)*.25; gl_FragColor=vec4(c,1.); }` }));
scene.add(sky);
const sunSprite=new THREE.Sprite(new THREE.SpriteMaterial({map:TEX.glow,color:0xfff2c0,transparent:true,opacity:.9,depthWrite:false,fog:false})); sunSprite.scale.set(260,260,1); sunSprite.position.copy(sun.position).normalize().multiplyScalar(1400); sky.add(sunSprite);
// clouds
const cloudMat=new THREE.SpriteMaterial({map:TEX.cloud,transparent:true,opacity:.9,depthWrite:false,fog:false});
for(let i=0;i<26;i++){ const s=new THREE.Sprite(cloudMat); const a=rnd(TAU), r=900+rnd(400); s.position.set(Math.cos(a)*r,120+rnd(160),Math.sin(a)*r); const sc=180+rnd(220); s.scale.set(sc,sc*.45,1); scene.add(s); }

const oceanMat=new THREE.ShaderMaterial({ transparent:true, fog:true,
  uniforms:{ time:{value:0}, deep:{value:new THREE.Color(0x0e5e9a)}, shallow:{value:new THREE.Color(0x3fc4c9)}, foam:{value:new THREE.Color(0xf6ffff)}, sunDir:{value:sun.position.clone().normalize()}, skyC:{value:new THREE.Color(0x9fd8f4)}, camPos:{value:new THREE.Vector3()},
    fogColor:{value:FOG_COL}, fogDensity:{value:scene.fog.density}, opacity:{value:.96} },
  vertexShader:`uniform float time; varying vec3 vW; varying float vH;
    float w(vec2 p, vec2 d, float k, float sp){ return sin(dot(p,d)*k+time*sp); }
    void main(){ vec3 p=position; vec2 xz=(modelMatrix*vec4(p,1.)).xz; float h=w(xz,vec2(.7,.7),.08,1.2)*.5+w(xz,vec2(-.6,.8),.13,1.7)*.3+w(xz,vec2(.2,-1.),.21,2.3)*.2; p.y+=h*.9; vH=h; vW=(modelMatrix*vec4(p,1.)).xyz; gl_Position=projectionMatrix*viewMatrix*vec4(vW,1.); }`,
  fragmentShader:`uniform float time; uniform vec3 deep,shallow,foam,sunDir,skyC,camPos,fogColor; uniform float fogDensity,opacity; varying vec3 vW; varying float vH;
    float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
    float noise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y); }
    void main(){ vec3 V=normalize(camPos-vW); 
      float n1=noise(vW.xz*.06+time*.15), n2=noise(vW.xz*.15-time*.1);
      vec3 N=normalize(vec3((n1-.5)*.35,1.,(n2-.5)*.35));
      float fres=pow(1.-max(dot(N,V),0.),3.);
      float shore=smoothstep(60.,180.,length(vW.xz-vec2(60.,-160.)))*.5+.5;
      vec3 base=mix(shallow,deep,clamp(shore*noise(vW.xz*.01)*1.4,0.,1.));
      vec3 col=mix(base,skyC,fres*.75);
      vec3 H=normalize(V+sunDir); float spec=pow(max(dot(N,H),0.),260.)*2.2+pow(max(dot(N,H),0.),40.)*.15;
      col+=vec3(1.,.95,.85)*spec;
      float f=smoothstep(.55,.9,vH+noise(vW.xz*.4+time*.3)*.5); col=mix(col,foam,f*.35);
      float fogF=1.-exp(-fogDensity*fogDensity*pow(length(camPos-vW),2.)); col=mix(col,fogColor,clamp(fogF,0.,1.));
      gl_FragColor=vec4(col,opacity); }`
});
const ocean=new THREE.Mesh(new THREE.PlaneGeometry(3400,3400,140,140),oceanMat); ocean.rotation.x=-Math.PI/2; ocean.position.y=0; scene.add(ocean);

/* =====================================================================
   MATERIALS
   ===================================================================== */
const MAT={
  road:new THREE.MeshStandardMaterial({map:TEX.road,roughness:.9,metalness:0,side:THREE.DoubleSide}),
  slab:new THREE.MeshStandardMaterial({color:0x6b5a4a,roughness:.9,side:THREE.DoubleSide}),
  neonA:new THREE.MeshBasicMaterial({color:0x6ff6ff,fog:false}), neonB:new THREE.MeshBasicMaterial({color:0xff6ad5,fog:false}),
  cloud:new THREE.MeshLambertMaterial({color:0xffffff}),
  rock:new THREE.MeshStandardMaterial({map:TEX.rock,vertexColors:true,roughness:.95,side:THREE.DoubleSide}),
  rockPlain:new THREE.MeshStandardMaterial({map:TEX.rock,color:0xb8783f,roughness:.95,side:THREE.DoubleSide}),
  grass:new THREE.MeshStandardMaterial({color:0x62b342,roughness:1}),
  grassDark:new THREE.MeshStandardMaterial({color:0x3f8a34,roughness:1}),
  sand:new THREE.MeshStandardMaterial({map:TEX.sand,roughness:1}),
  trunk:new THREE.MeshStandardMaterial({color:0x9c6b3c,roughness:.9}),
  leaf:new THREE.MeshStandardMaterial({color:0x3ea94e,roughness:.8,side:THREE.DoubleSide}),
  leaf2:new THREE.MeshStandardMaterial({color:0x7bd35a,roughness:.8,side:THREE.DoubleSide}),
  stone:new THREE.MeshStandardMaterial({color:0xd9d2bd,roughness:.85}),
  stoneDark:new THREE.MeshStandardMaterial({color:0x9a917c,roughness:.9}),
  gold:new THREE.MeshStandardMaterial({color:0xffc63a,emissive:0xff9a00,emissiveIntensity:.55,roughness:.25,metalness:.8}),
  rail:new THREE.MeshStandardMaterial({color:0xe8eef5,roughness:.3,metalness:.9}),
  wood:new THREE.MeshStandardMaterial({map:TEX.wood,roughness:.9}),
  crystal:new THREE.MeshStandardMaterial({color:0x8ff7ff,emissive:0x35d6ff,emissiveIntensity:1.6,roughness:.2,transparent:true,opacity:.92}),
  spring:new THREE.MeshStandardMaterial({color:0xffd23a,roughness:.4,metalness:.3}),
  springRed:new THREE.MeshStandardMaterial({color:0xe23b2e,roughness:.5}),
  dash:new THREE.MeshStandardMaterial({color:0x2ad4ff,emissive:0x1ea8ff,emissiveIntensity:1.2,roughness:.3}),
  white:new THREE.MeshStandardMaterial({color:0xffffff,roughness:.6}),
  flowerP:new THREE.MeshStandardMaterial({color:0xff6fa3,roughness:.7}), flowerY:new THREE.MeshStandardMaterial({color:0xffd23a,roughness:.7}), flowerW:new THREE.MeshStandardMaterial({color:0xffffff,roughness:.7}),
  hibiscus:new THREE.MeshStandardMaterial({color:0xff4d5a,roughness:.7}),
  bird:new THREE.MeshStandardMaterial({color:0xffffff,roughness:.8,side:THREE.DoubleSide}),
  water2:new THREE.MeshStandardMaterial({color:0x5ad2e0,transparent:true,opacity:.6,roughness:.15}),
  lighthouse:new THREE.MeshStandardMaterial({color:0xffffff,roughness:.6}), lhRed:new THREE.MeshStandardMaterial({color:0xd9433a,roughness:.6}),
};

/* =====================================================================
   WORLD GEOMETRY
   ===================================================================== */
const world=new THREE.Group(); scene.add(world);
const uvScale=1/4;
function ribbon(i0,i1,widthFn,material,shadows=true,offsetN=0){
  const pos=[],uv=[],idx=[]; let k=0;
  for(let i=i0;i<=i1;i++){ const w=widthFn(i); const p=FR.P[i], B=FR.B[i], N=FR.N[i]; const l=p.clone().addScaledVector(B,-w).addScaledVector(N,offsetN), r=p.clone().addScaledVector(B,w).addScaledVector(N,offsetN); pos.push(l.x,l.y,l.z,r.x,r.y,r.z); uv.push(0,FR.cum[i]*uvScale,1,FR.cum[i]*uvScale);
    if(i>i0){ idx.push(k-2,k-1,k,k-1,k+1,k); } k+=2; }
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2)); g.setIndex(idx); g.computeVertexNormals();
  const m=new THREE.Mesh(g,material); m.receiveShadow=shadows; m.castShadow=shadows; return m;
}
function skirt(i0,i1,w,depthFn){ // rock wall hanging from road edges away from the surface normal, with grass gradient
  const pos=[],uv=[],col=[],idx=[]; let k=0; const grass=new THREE.Color(0x63b247), rock=new THREE.Color(0xd08a55), rockD=new THREE.Color(0x8e5a34);
  for(let i=i0;i<=i1;i++){ const p=FR.P[i],B=FR.B[i],N=FR.N[i]; const d=depthFn(i); const ww=w+1.2;
    const l=p.clone().addScaledVector(B,-ww), r=p.clone().addScaledVector(B,ww); const lb=l.clone().addScaledVector(N,-d), rb=r.clone().addScaledVector(N,-d);
    const l2=l.clone().addScaledVector(N,-2.2).addScaledVector(B,-1.5), r2=r.clone().addScaledVector(N,-2.2).addScaledVector(B,1.5);
    // left side: top, lip, bottom ; right side: top, lip, bottom
    for(const v of [l,l2,lb,r,r2,rb]) pos.push(v.x,v.y,v.z);
    const s=FR.cum[i]/8; uv.push(0,s,.3,s,d/8,s, 0,s,.3,s,d/8,s);
    for(const c of [grass,rock,rockD,grass,rock,rockD]) col.push(c.r,c.g,c.b);
    if(i>i0){ // left strip (two quads), right strip
      idx.push(k-6,k,k-5, k-5,k,k+1, k-5,k+1,k-4, k-4,k+1,k+2);
      idx.push(k-3,k-2,k+3, k+3,k-2,k+4, k-2,k-1,k+4, k+4,k-1,k+5); }
    k+=6; }
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2)); g.setAttribute('color',new THREE.Float32BufferAttribute(col,3)); g.setIndex(idx); g.computeVertexNormals();
  const m=new THREE.Mesh(g,MAT.rock); m.receiveShadow=true; m.castShadow=true; return m;
}
const depthDefault=i=>{ const N=FR.N[i], y=FR.P[i].y; return N.y>.35? clamp((y+14)/N.y,6,400) : 40; };
// Build per segment
const spaceWallMat=new THREE.MeshStandardMaterial({map:TEX.rock,color:0x443269,roughness:.6,metalness:.2});
const railGroup=new THREE.Group(), bridgePlanks=[], caveGroup=new THREE.Group(); world.add(railGroup,caveGroup);
for(const s of SEGS){
  const {start:i0,end:i1,type}=s;
  if(type==='road'||type==='loop'||type==='cork'||type==='wall'){
    world.add(ribbon(i0,i1,()=>ROAD_W,MAT.road));
    // curb rails on loops / corkscrew for readability
    if(type==='loop'||type==='cork'){ world.add(ribbon(i0,i1,()=>ROAD_W+.5,MAT.stoneDark,true,-.35)); world.add(sideRail(i0,i1,-ROAD_W-.2,.6)); world.add(sideRail(i0,i1,ROAD_W+.2,.6)); }
    if(type==='wall') world.add(skirt(i0,i1,ROAD_W,()=>30)); else if(type==='road'&&!s.meta.float) world.add(skirt(i0,i1,ROAD_W,depthDefault));
    if(s.meta.float && type==='road'){ world.add(ribbon(i0,i1,()=>ROAD_W+.6,MAT.slab,true,-.5)); }
    if(type==='wall') world.add(ribbon(i0,i1,()=>26,spaceWallMat,true,-.45));
    if(type==='loop'){ // decorative stone hoop behind the loop
      const c=FR.P[Math.floor((i0+i1)/2)]; const r=s.meta.r; const hoop=new THREE.Mesh(new THREE.TorusGeometry(r+1.2,1.4,10,48),MAT.stone); hoop.position.copy(FR.P[i0]).add(new THREE.Vector3(0,r,0)).addScaledVector(FR.B[i0],-ROAD_W-2.4).addScaledVector(FR.T[i0],0); hoop.lookAt(hoop.position.clone().add(FR.B[i0])); hoop.castShadow=true; world.add(hoop);
      const hoop2=hoop.clone(); hoop2.position.copy(FR.P[i1]).add(new THREE.Vector3(0,r,0)).addScaledVector(FR.B[i0],ROAD_W+2.4); world.add(hoop2);
      for(let k=0;k<7;k++){ const a=k/7*TAU; const post=new THREE.Mesh(new THREE.BoxGeometry(1.2,1.2,r+1),MAT.stoneDark); post.position.copy(hoop.position).addScaledVector(FR.T[i0],Math.sin(a)*(r+1)/2).addScaledVector(new THREE.Vector3(0,1,0),-Math.cos(a)*(r+1)/2); post.lookAt(hoop.position); post.castShadow=true; world.add(post); }
    }
  }
  if(type==='rail'){ for(const x of [-RAIL_X,0,RAIL_X]){ railGroup.add(sideRail(i0,i1,x,.16,true)); }
    for(let i=i0;i<=i1;i+=10){ const p=FR.P[i]; if(p.y<30){ const post=new THREE.Mesh(new THREE.CylinderGeometry(.35,.5,p.y+2,8),MAT.stoneDark); post.position.set(p.x,p.y/2-1,p.z); post.castShadow=true; world.add(post); } const bar=new THREE.Mesh(new THREE.BoxGeometry(RAIL_X*2+1,.3,.5),MAT.stoneDark); bar.position.copy(p).addScaledVector(FR.N[i],-.45); bar.lookAt(bar.position.clone().add(FR.T[i])); world.add(bar); } }
  if(type==='bridge'){ for(let i=i0;i<i1;i+=2){ const p=FR.P[i]; const plank=new THREE.Mesh(new THREE.BoxGeometry(ROAD_W*2+.6,.35,2.6),MAT.wood); plank.position.copy(p).addScaledVector(FR.N[i],-.18); plank.lookAt(plank.position.clone().add(FR.T[i])); plank.castShadow=plank.receiveShadow=true; plank.userData={t:FR.cum[i],fallen:false,vel:0,rot:0}; world.add(plank); bridgePlanks.push(plank); }
    for(const x of [-ROAD_W-.3,ROAD_W+.3]){ world.add(sideRail(i0,i1,x,.12,false,MAT.wood,1.1)); for(let i=i0;i<=i1;i+=6){ const post=new THREE.Mesh(new THREE.BoxGeometry(.3,1.4,.3),MAT.wood); post.position.copy(FR.P[i]).addScaledVector(FR.B[i],x).addScaledVector(FR.N[i],.5); world.add(post);} }
    // rope towers at both ends + water below
    const pool=new THREE.Mesh(new THREE.PlaneGeometry(60,40),MAT.water2); pool.rotation.x=-Math.PI/2; pool.position.copy(FR.P[Math.floor((i0+i1)/2)]); pool.position.y=1.2; world.add(pool);
  }
  if(type==='cave'){ world.add(ribbon(i0,i1,()=>ROAD_W,MAT.road)); world.add(ribbon(i0,i1,()=>ROAD_W+.6,MAT.slab,true,-.5)); }
  if(s.meta.float && (type==='cave'||type==='road') && s.meta.name!=='climb' && s.meta.name!=='railstart' && s.meta.name!=='raillanding'){ // neon edge lights for the space section
    for(const [x,m] of [[-ROAD_W-.1,MAT.neonA],[ROAD_W+.1,MAT.neonB]]) world.add(sideRail(i0,i1,x,.16,false,m,.1)); }
  if(type==='gap'){ /* nothing — open air */ }
}
function sideRail(i0,i1,x,r,metal=false,mat=null,h=0){ const pts=[]; for(let i=i0;i<=i1;i++) pts.push(FR.P[i].clone().addScaledVector(FR.B[i],x).addScaledVector(FR.N[i],r+h)); const curve=new THREE.CatmullRomCurve3(pts); const g=new THREE.TubeGeometry(curve,Math.max(8,(i1-i0)),r,metal?10:6,false); const m=new THREE.Mesh(g,mat||(metal?MAT.rail:MAT.stone)); m.castShadow=true; m.receiveShadow=true; return m; }

// ---- islands / hills (procedural low-poly mounds)
function mound(x,z,r,h,mat=MAT.grass,y=0){ const g=new THREE.ConeGeometry(r,h,14,4,true); const pa=g.attributes.position; for(let i=0;i<pa.count;i++){ const px=pa.getX(i), pz=pa.getZ(i), py=pa.getY(i); const n=1+0.22*Math.sin(px*.13+pz*.09)+0.12*Math.cos(pz*.21-px*.05); pa.setX(i,px*n); pa.setZ(i,pz*n); pa.setY(i,py*(1+.06*Math.sin(px*.3))); } g.computeVertexNormals(); const m=new THREE.Mesh(g,mat); m.position.set(x,y+h/2-1,z); m.castShadow=true; m.receiveShadow=true; world.add(m); return m; }
// Mounds near the track
const floatAt=i=>{ const s=SEGS.find(s=>i>=s.start&&i<=s.end); return s&&s.meta.float; };
for(let i=0;i<FR.P.length;i+=45){ const p=FR.P[i]; if(p.y<8||TR.type[i]!=='road'||floatAt(i)) continue; const side=Math.random()<.5?-1:1; const r=14+rnd(22); const off=ROAD_W+r+6+rnd(16); const c=p.clone().addScaledVector(FR.B[i],side*off); const h=Math.min(p.y+rnd(40)-10,90); if(h>6) mound(c.x,c.z,r,h); }
// distant islands
[[520,-900,110,70],[-700,-1200,160,120],[900,-500,90,55],[-450,-350,70,40],[300,-1500,220,140],[-1100,-700,120,60]].forEach(([x,z,r,h])=>{ mound(x,z,r,h,MAT.grassDark); mound(x+r*.4,z+r*.2,r*.5,h*.5,MAT.stone,-3); });

// ---- Palms (instanced trunks + leaves)
const palmTrunkGeo=new THREE.CylinderGeometry(.22,.42,9,7); palmTrunkGeo.translate(0,4.5,0); (()=>{ const pa=palmTrunkGeo.attributes.position; for(let i=0;i<pa.count;i++){ const y=pa.getY(i); pa.setX(i,pa.getX(i)+Math.pow(y/9,2)*1.6); } palmTrunkGeo.computeVertexNormals(); })();
const leafGeo=(()=>{ const s=new THREE.Shape(); s.moveTo(0,0); s.quadraticCurveTo(1.1,2.2,0,5.2); s.quadraticCurveTo(-1.1,2.2,0,0); const g=new THREE.ShapeGeometry(s,6); g.rotateX(-Math.PI/2); return g; })();
const palmSpots=[]; for(let i=0;i<FR.P.length;i+=7){ const p=FR.P[i], ty=TR.type[i]; if(ty!=='road'||FR.N[i].y<.8||floatAt(i)) continue; if(Math.random()<.45) continue; const side=Math.random()<.5?-1:1; const off=ROAD_W+2.5+rnd(3.5); palmSpots.push({pos:p.clone().addScaledVector(FR.B[i],side*off).addScaledVector(FR.N[i],-.6),rot:rnd(TAU),sc:.75+rnd(.55)}); }
const trunkIM=new THREE.InstancedMesh(palmTrunkGeo,MAT.trunk,palmSpots.length); trunkIM.castShadow=true; trunkIM.receiveShadow=true;
const leafIM=new THREE.InstancedMesh(leafGeo,MAT.leaf,palmSpots.length*7); leafIM.castShadow=true; const leafIM2=new THREE.InstancedMesh(leafGeo,MAT.leaf2,palmSpots.length*3); leafIM2.castShadow=true;
const M4=new THREE.Matrix4(), Q4=new THREE.Quaternion(), V3=new THREE.Vector3(), E3=new THREE.Euler();
palmSpots.forEach((s,k)=>{ M4.compose(s.pos,Q4.setFromEuler(E3.set(0,s.rot,0)),V3.set(s.sc,s.sc,s.sc)); trunkIM.setMatrixAt(k,M4); const top=s.pos.clone().add(new THREE.Vector3(Math.cos(s.rot)*1.6*s.sc,9*s.sc,-Math.sin(s.rot)*1.6*s.sc));
  for(let j=0;j<7;j++){ const a=j/7*TAU+s.rot; M4.compose(top,Q4.setFromEuler(E3.set(.45+rnd(.3),a,0,'YXZ')),V3.set(s.sc*1.1,s.sc,s.sc*1.15)); leafIM.setMatrixAt(k*7+j,M4); }
  for(let j=0;j<3;j++){ const a=j/3*TAU+s.rot+.5; M4.compose(top,Q4.setFromEuler(E3.set(.2+rnd(.2),a,0,'YXZ')),V3.set(s.sc*.9,s.sc,s.sc*.9)); leafIM2.setMatrixAt(k*3+j,M4); } });
world.add(trunkIM,leafIM,leafIM2);

// ---- Grass tufts & flowers (instanced, swaying shader)
const grassGeo=(()=>{ const g=new THREE.PlaneGeometry(.9,1.1,1,2); g.translate(0,.55,0); const pa=g.attributes.position; for(let i=0;i<pa.count;i++){ const y=pa.getY(i); pa.setX(i,pa.getX(i)*(1-y/1.3)); } return g; })();
const grassMat=new THREE.MeshStandardMaterial({color:0x7fd45a,roughness:1,side:THREE.DoubleSide});
grassMat.onBeforeCompile=sh=>{ sh.uniforms.time={value:0}; sh.uniforms.pushPos={value:new THREE.Vector3(0,-999,0)}; sh.uniforms.pushPos2={value:new THREE.Vector3(0,-999,0)}; grassMat.userData.sh=sh;
  sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nuniform float time; uniform vec3 pushPos, pushPos2;')
  .replace('#include <begin_vertex>','#include <begin_vertex>\n vec4 wp=instanceMatrix*vec4(position,1.); wp=modelMatrix*wp; float k=position.y; vec2 dp=wp.xz-pushPos.xz; float d=length(dp); vec2 dp2=wp.xz-pushPos2.xz; float d2=length(dp2); vec2 push=normalize(dp+.001)*smoothstep(3.5,0.,d)*1.2*k + normalize(dp2+.001)*smoothstep(3.5,0.,d2)*1.2*k; transformed.x+=sin(time*2.+wp.x*.7+wp.z*.5)*.18*k+push.x; transformed.z+=cos(time*1.7+wp.z*.6)*.12*k+push.y;'); };
const grassSpots=[]; for(let i=0;i<FR.P.length;i+=1){ const ty=TR.type[i]; if((ty!=='road')||FR.N[i].y<.85||floatAt(i)) continue; for(let j=0;j<3;j++){ const side=Math.random()<.5?-1:1; const off=ROAD_W-.3+rnd(1.6); grassSpots.push(FR.P[i].clone().addScaledVector(FR.B[i],side*off).addScaledVector(FR.T[i],rnd(1.5)-.75)); } }
const grassIM=new THREE.InstancedMesh(grassGeo,grassMat,grassSpots.length); grassSpots.forEach((p,k)=>{ M4.compose(p,Q4.setFromEuler(E3.set(0,rnd(TAU),0)),V3.set(1,.8+rnd(.6),1)); grassIM.setMatrixAt(k,M4); }); grassIM.receiveShadow=true; world.add(grassIM);
const flowerGeo=new THREE.SphereGeometry(.22,6,5); flowerGeo.scale(1,.6,1);
const flowerIMs=[MAT.flowerP,MAT.flowerY,MAT.flowerW,MAT.hibiscus].map(m=>{ const spots=grassSpots.filter(()=>Math.random()<.09); const im=new THREE.InstancedMesh(flowerGeo,m,Math.max(1,spots.length)); spots.forEach((p,k)=>{ M4.compose(p.clone().add(new THREE.Vector3(rnd(.6)-.3,.7,rnd(.6)-.3)),Q4.identity(),V3.set(1,1,1)); im.setMatrixAt(k,M4); }); world.add(im); return im; });

// ---- Ruins (columns, fallen blocks, arches)
(()=>{ for(const nm of ['ruins','ruins2','beach2']){ const s=segByName(nm); for(let i=s.start+3;i<s.end-2;i+=8){ for(const side of [-1,1]){ if(Math.random()<.35) continue; const p=FR.P[i].clone().addScaledVector(FR.B[i],side*(ROAD_W+2.2+rnd(1.5))); const h=3+rnd(5); const col=new THREE.Mesh(new THREE.CylinderGeometry(.55,.7,h,10),MAT.stone); col.position.copy(p).add(new THREE.Vector3(0,h/2-.4,0)); col.rotation.z=rnd(.12)-.06; col.castShadow=col.receiveShadow=true; world.add(col); const cap=new THREE.Mesh(new THREE.BoxGeometry(1.8,.5,1.8),MAT.stoneDark); cap.position.copy(col.position).add(new THREE.Vector3(0,h/2+.2,0)); cap.castShadow=true; world.add(cap); }
    if(i%16===3){ const p=FR.P[i]; const arch=new THREE.Mesh(new THREE.TorusGeometry(ROAD_W+1.8,.9,8,18,Math.PI),MAT.stone); arch.position.copy(p).addScaledVector(FR.N[i],.8); arch.lookAt(arch.position.clone().add(FR.T[i])); arch.castShadow=true; world.add(arch); const l=new THREE.Mesh(new THREE.BoxGeometry(1.6,ROAD_W*.9,1.6),MAT.stone); l.position.copy(p).addScaledVector(FR.B[i],-ROAD_W-1.8).addScaledVector(FR.N[i],ROAD_W*.45); world.add(l); const r=l.clone(); r.position.copy(p).addScaledVector(FR.B[i],ROAD_W+1.8).addScaledVector(FR.N[i],ROAD_W*.45); world.add(r); } } } })();

// ---- Beach sand aprons + water pools near beach
(()=>{ for(const nm of ['beach','beach2','landing2']){ const s=segByName(nm); world.add(ribbon(s.start,s.end,()=>ROAD_W+9,MAT.sand,true,-.35)); } })();

// ---- Waterfall (shader curtain + pool + mist) at the waterfall gap
const wfMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,uniforms:{time:{value:0}},
  vertexShader:`varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader:`uniform float time; varying vec2 vUv; float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);} float noise(vec2 p){vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f); return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
   void main(){ vec2 uv=vUv; float n=noise(vec2(uv.x*14.,uv.y*6.+time*2.6))*.6+noise(vec2(uv.x*40.,uv.y*18.+time*4.))*.4; float streak=smoothstep(.35,.85,n); vec3 col=mix(vec3(.55,.85,.95),vec3(1.),streak); float a=(.55+streak*.45)*smoothstep(0.,.08,uv.x)*smoothstep(1.,.92,uv.x)*(1.-smoothstep(.75,1.,uv.y)*.4); gl_FragColor=vec4(col,a); }`});
const waterfalls=[]; (()=>{ const s=segByName('waterfall'); const i=Math.floor((s.start+s.end)/2); const p=FR.P[i], B=FR.B[i]; const base=p.clone().addScaledVector(B,-46); // gorge on the left
  mound(base.x,base.z,24,p.y+38,MAT.grass,-2);
  const H=p.y+40; const wf=new THREE.Mesh(new THREE.PlaneGeometry(14,H,1,1),wfMat); wf.position.copy(base).addScaledVector(B,30).add(new THREE.Vector3(0,H/2-4,0)); wf.lookAt(wf.position.clone().add(B)); world.add(wf); waterfalls.push(wf);
  const wf2=wf.clone(); wf2.scale.set(.6,1,1); wf2.position.addScaledVector(FR.T[i],9).addScaledVector(B,2); world.add(wf2);
  const pool=new THREE.Mesh(new THREE.CircleGeometry(30,24),MAT.water2); pool.rotation.x=-Math.PI/2; pool.position.copy(base).addScaledVector(B,30); pool.position.y=1.5; world.add(pool);
  waterfalls.mist=new THREE.Vector3().copy(base).addScaledVector(B,30).setY(2);
  // a second smaller waterfall visible from the opening
  const s2=segByName('downhill'); const j=s2.start+20; const q=FR.P[j], B2=FR.B[j]; const wf3=new THREE.Mesh(new THREE.PlaneGeometry(9,q.y-2),wfMat); wf3.position.copy(q).addScaledVector(B2,-60).add(new THREE.Vector3(0,(q.y-2)/2,0)); wf3.lookAt(wf3.position.clone().add(B2)); world.add(wf3); mound(wf3.position.x-8,wf3.position.z,26,q.y+6,MAT.grass,-2); })();

// ---- Lighthouse at the finish
(()=>{ const s=segByName('after'); const i=s.end-3; const p=FR.P[i].clone().addScaledVector(FR.T[i],28); const base=new THREE.Mesh(new THREE.CylinderGeometry(4,5,4,16),MAT.stone); base.position.copy(p).add(new THREE.Vector3(0,1.5,0)); world.add(base); const tower=new THREE.Mesh(new THREE.CylinderGeometry(2.4,3.2,22,16),MAT.lighthouse); tower.position.copy(p).add(new THREE.Vector3(0,14,0)); tower.castShadow=true; world.add(tower);
  for(let k=0;k<3;k++){ const band=new THREE.Mesh(new THREE.CylinderGeometry(2.55-k*.12,2.75-k*.12,3,16),MAT.lhRed); band.position.copy(p).add(new THREE.Vector3(0,6+k*6,0)); world.add(band); }
  const lamp=new THREE.Mesh(new THREE.CylinderGeometry(2,2,3,12),MAT.crystal); lamp.position.copy(p).add(new THREE.Vector3(0,26.5,0)); world.add(lamp); const cap=new THREE.Mesh(new THREE.ConeGeometry(2.8,2.5,12),MAT.lhRed); cap.position.copy(p).add(new THREE.Vector3(0,29.2,0)); world.add(cap);
  mound(p.x,p.z,26,6,MAT.sand,-2); })();
// ---- finish gate
const finishT=segByName('finish').t1; (()=>{ const f=frameAt(finishT); const gate=new THREE.Mesh(new THREE.TorusGeometry(ROAD_W+1.5,.6,10,32),MAT.gold); gate.position.copy(f.p).addScaledVector(f.N,ROAD_W+1); gate.lookAt(gate.position.clone().add(f.T)); world.add(gate); for(const x of [-1,1]){ const post=new THREE.Mesh(new THREE.BoxGeometry(1,ROAD_W+1.5,1),MAT.stone); post.position.copy(f.p).addScaledVector(f.B,x*(ROAD_W+1.5)).addScaledVector(f.N,(ROAD_W+1.5)/2); world.add(post);} })();
