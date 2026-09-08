<script type="importmap">
{ "imports": { "three": "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js",
               "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/" } }
</script>
<script type="module">
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { PoseLandmarker, FilesetResolver } from 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14';

const $ = id => document.getElementById(id);
const clamp = (v,a,b)=>Math.max(a,Math.min(b,v));
const lerp = (a,b,t)=>a+(b-a)*t;
const damp = (a,b,k,dt)=>lerp(a,b,1-Math.exp(-k*dt));
const now = ()=>performance.now()/1000;
const rnd = (a=1,b=0)=>b+Math.random()*(a-b);
const smoothstep=(a,b,x)=>{x=clamp((x-a)/(b-a),0,1);return x*x*(3-2*x)};
const TAU=Math.PI*2;

/* =====================================================================
   SETTINGS & STATE
   ===================================================================== */
const S = { players:1, hero:'sonic', pair:'heroes', input:'camera', phase:'start', destination:'tour', raceView:'split' };
const HERO = {
 sonic:{name:'Sonic',gi:0x1670e8,giDark:0x08459f,skin:0xf3c895,hair:0x1670e8,css:'#55aaff',buddy:null,buddyName:null},
 tails:{name:'Tails',gi:0xf8ad2e,giDark:0xc47b15,skin:0xffefce,hair:0xf8ad2e,css:'#ffd06d',buddy:null,buddyName:null},
 knuckles:{name:'Knuckles',gi:0xe53c42,giDark:0xa91f37,skin:0xeac292,hair:0xe53c42,css:'#ff7479',buddy:null,buddyName:null},
};
const raceKeys=()=>S.players===1?[S.hero]:S.players===2?['sonic','knuckles']:['sonic','tails','knuckles'];
const PAIRS={ heroes:['sonic','knuckles'] };

/* =====================================================================
   AUDIO — procedural tropical score + SFX
   ===================================================================== */
const AU = { ctx:null, master:null, music:null, sfx:null, playing:false, step:0, timer:null, tempo:132 };
function audioInit(){
  if (AU.ctx) {AU.ctx.resume?.();return;}
  if(!(window.AudioContext||window.webkitAudioContext))return;
  const C = new (window.AudioContext||window.webkitAudioContext)();
  AU.ctx=C; AU.master=C.createGain(); AU.master.gain.value=.8; AU.master.connect(C.destination);
  AU.music=C.createGain(); AU.music.gain.value=.55; AU.music.connect(AU.master);
  AU.sfx=C.createGain(); AU.sfx.gain.value=.9; AU.sfx.connect(AU.master);
  const comp=C.createDynamicsCompressor(); comp.threshold.value=-14; comp.ratio.value=4; AU.master.disconnect(); AU.master.connect(comp); comp.connect(C.destination);
}
function tone({f=440,t=0,d=.2,type='sine',g=.3,dest=AU.sfx,slide=null,atk=.005}){
  const C=AU.ctx; if(!C) return; const o=C.createOscillator(), a=C.createGain(); o.type=type; o.frequency.setValueAtTime(f,C.currentTime+t);
  if(slide!=null) o.frequency.exponentialRampToValueAtTime(Math.max(20,slide),C.currentTime+t+d);
  a.gain.setValueAtTime(0,C.currentTime+t); a.gain.linearRampToValueAtTime(g,C.currentTime+t+atk); a.gain.exponentialRampToValueAtTime(.0001,C.currentTime+t+d);
  o.connect(a); a.connect(dest); o.start(C.currentTime+t); o.stop(C.currentTime+t+d+.05);
}
function noise({t=0,d=.2,g=.2,hp=800,lp=6000,dest=AU.sfx}){
  const C=AU.ctx; if(!C) return; const len=Math.floor(C.sampleRate*d), b=C.createBuffer(1,len,C.sampleRate), ch=b.getChannelData(0);
  for(let i=0;i<len;i++) ch[i]=(Math.random()*2-1)*(1-i/len);
  const s=C.createBufferSource(); s.buffer=b; const h=C.createBiquadFilter(); h.type='highpass'; h.frequency.value=hp; const l=C.createBiquadFilter(); l.type='lowpass'; l.frequency.value=lp;
  const a=C.createGain(); a.gain.value=g; s.connect(h); h.connect(l); l.connect(a); a.connect(dest); s.start(C.currentTime+t);
}
// steel-drum-ish pluck: two partials with fast decay
function steel(f,t,d=.35,g=.18,dest=AU.music){ tone({f,t,d,type:'sine',g,dest}); tone({f:f*2.76,t,d:d*.5,type:'sine',g:g*.35,dest}); tone({f:f*4.1,t,d:d*.25,type:'triangle',g:g*.15,dest}); }
const SFX = {
  ring(n){ const f=1046*Math.pow(1.0595, (n%6)*2); tone({f,d:.14,type:'sine',g:.22}); tone({f:f*1.5,d:.1,t:.03,type:'sine',g:.12}); },
  jump(){ tone({f:330,slide:660,d:.18,type:'triangle',g:.25}); noise({d:.12,g:.08,hp:2000}); },
  land(){ noise({d:.1,g:.15,hp:100,lp:900}); tone({f:120,slide:60,d:.12,type:'sine',g:.25}); },
  spring(){ tone({f:220,slide:1100,d:.35,type:'square',g:.16}); tone({f:440,slide:1760,d:.3,t:.02,type:'triangle',g:.16}); },
  dash(){ noise({d:.35,g:.25,hp:600,lp:5000}); tone({f:200,slide:900,d:.3,type:'sawtooth',g:.12}); },
  boost(){ noise({d:.7,g:.3,hp:300,lp:7000}); tone({f:150,slide:1200,d:.6,type:'sawtooth',g:.15}); },
  homing(){ tone({f:880,slide:1760,d:.12,type:'square',g:.16}); },
  hit(n){ noise({d:.2,g:.3,hp:200,lp:3000}); tone({f:520+n*90,slide:1040+n*120,d:.25,type:'triangle',g:.25}); },
  hurt(){ tone({f:300,slide:120,d:.35,type:'sawtooth',g:.22}); noise({d:.2,g:.2,hp:100,lp:1500}); },
  rail(){ noise({d:.25,g:.12,hp:3000,lp:9000}); },
  charge(t){ tone({f:120+t*400,d:.08,type:'sawtooth',g:.12}); },
  splash(){ noise({d:.6,g:.3,hp:400,lp:3000}); },
  goal(){ [0,.12,.24,.36,.6].forEach((t,i)=>steel([523,659,784,1046,1318][i],t,.6,.3,AU.sfx)); },
  birds(){ for(let i=0;i<5;i++) tone({f:1800+rnd(600),slide:2600,d:.08,t:i*.07,type:'sine',g:.06}); },
  countdown(last){ tone({f:last?1046:523,d:last?.6:.18,type:'triangle',g:.3}); }
};
// Music: D-major island groove. chords I V vi IV, steel-drum arpeggio + bass + hats
const NOTE = n=>440*Math.pow(2,(n-69)/12);
const PROG=[[62,66,69,74],[57,61,64,69],[59,62,66,71],[55,59,62,67]];
const MEL=[74,76,78,81,78,76,74,71, 69,71,74,76,74,71,69,66, 71,74,76,78,81,78,76,74, 79,78,76,74,71,69,66,62];
function musicStart(){ if(!AU.ctx||AU.playing) return; AU.playing=true; AU.step=0; AU.nextT=AU.ctx.currentTime+.05; musicTick(); }
function musicStop(){ AU.playing=false; clearTimeout(AU.timer); }
function musicTick(){
  if(!AU.playing) return; const C=AU.ctx; const beat=60/AU.tempo, s16=beat/4;
  while(AU.nextT<C.currentTime+.25){
    const st=AU.step, bar=Math.floor(st/16)%4, chord=PROG[bar], t=AU.nextT-C.currentTime;
    // kick + hats
    if(st%4===0) tone({f:110,slide:45,d:.18,type:'sine',g:.5,dest:AU.music});
    if(st%2===1) noise({t,d:.04,g:.08,hp:7000,lp:12000,dest:AU.music});
    if(st%8===4) noise({t,d:.12,g:.12,hp:1200,lp:4000,dest:AU.music});
    // bass
    if(st%4===0||st%8===6) tone({f:NOTE(chord[0]-12),t,d:.3,type:'triangle',g:.28,dest:AU.music});
    // arpeggio (steel)
    if(st%2===0){ const n=chord[(st/2)%4]; steel(NOTE(n),t,.3,.1); }
    // melody every other 16th, on phrase
    if(st%2===0){ const m=MEL[(st/2)%32]; if(m) steel(NOTE(m),t,.4,.16); }
    AU.nextT+=s16; AU.step++;
  }
  AU.timer=setTimeout(musicTick,60);
}
function speak(txt){ try{ if(!('speechSynthesis' in window)) return; const u=new SpeechSynthesisUtterance(txt); u.rate=1.05; u.pitch=1.15; u.lang='en-US'; speechSynthesis.cancel(); speechSynthesis.speak(u);}catch(e){} }

/* =====================================================================
   POSE TRACKING & GESTURES
   Landmarks: 0 nose, 11/12 shoulders, 13/14 elbows, 15/16 wrists, 23/24 hips, 25/26 knees, 27/28 ankles
   All signals normalized to torso units (shoulder-mid → hip-mid).
   ===================================================================== */
const video=$('video'); let landmarker=null, camOn=false, poseLoopId=0;
class Body {
  constructor(){ this.reset(); }
  reset(){ this.sig={knee:new StepSignal(),ankle:new StepSignal(),bounce:new StepSignal(),wrist:new StepSignal()}; this.debug={}; this.seen=false; this.lm=null; this.torso=.25; this.neutralHipY=null; this.calSamples=[]; this.hipY=0; this.hipVy=0; this.prevHipY=null;
    this.cadence=0; this.stepTimes=[]; this.kneeSign=0; this.lean=0; this.armsUp=false; this.armsOut=false; this.squat=false; this.jumpEdge=false; this.lastJump=-9; this.wasAir=false; this.speedIn=0; this.calibrated=false; this.lastSeen=0; this.centerX=.5; this.box={w:0,h:0}; this.vis=0; this.kneesVis=0; this.prevShY=null; this.shVy=0; this.bounceMax=0; this.bounceMin=0; }
  update(lm, t){
    if(!lm){ if(t-this.lastSeen>1.0){ this.seen=false; this.cadence=damp(this.cadence,0,1.5,.033); this.speedIn=clamp(this.cadence/2.4,0,1); } return; }
    this.seen=true; this.lastSeen=t; this.lm=lm;
    const P=i=>lm[i]; const mid=(a,b)=>({x:(P(a).x+P(b).x)/2,y:(P(a).y+P(b).y)/2});
    const sh=mid(11,12), hip=mid(23,24); const torso=Math.hypot(sh.x-hip.x,sh.y-hip.y)||.25; this.torso=damp(this.torso,torso,6,.033);
    const V=i=>(P(i).visibility??1); this.vis=Math.min(V(11),V(12),V(23),V(24)); this.kneesVis=Math.min(V(25),V(26));
    this.centerX=(hip.x+sh.x)/2; const xs=lm.map(p=>p.x), ys=lm.map(p=>p.y); this.box={w:Math.max(...xs)-Math.min(...xs),h:Math.max(...ys)-Math.min(...ys)};
    // calibration (neutral standing height)
    if(!this.calibrated){ this.calSamples.push(hip.y); if(this.calSamples.length>40){ const a=[...this.calSamples].sort((a,b)=>a-b); this.neutralHipY=a[Math.floor(a.length/2)]; this.calibrated=true; } }
    else { // drift baseline slowly toward hip when standing normally
      if(Math.abs(hip.y-this.neutralHipY)<.12*this.torso) this.neutralHipY=lerp(this.neutralHipY,hip.y,.01);
    }
    const nh=this.neutralHipY??hip.y;
    // vertical hip motion
    if(this.prevHipY!=null) this.hipVy=lerp(this.hipVy,(this.prevHipY-hip.y)/this.torso*30,.5); // + = rising, torso/s
    this.prevHipY=hip.y; this.hipY=(nh-hip.y)/this.torso;      // + = higher than neutral
    // jump: hips rise fast above neutral
    const airborne=this.hipY>.26 && this.hipVy>1.2;
    if(airborne && !this.wasAir && t-this.lastJump>.55){ this.jumpEdge=true; this.lastJump=t; }
    this.wasAir=this.hipY>.15;
    // squat: hips drop
    this.squat=this.hipY<-.18;
    // lean: shoulders offset from hips (positive = toward image right = person's left) & shoulder tilt
    const off=(sh.x-hip.x)/this.torso; const tilt=(P(11).y-P(12).y)/this.torso; // left shoulder lower => tilt>0 (leaning to their left)
    const leanRaw=clamp(-(off*1.6+tilt*1.2),-1,1); // negative => steer left (their left)
    this.lean=lerp(this.lean,Math.abs(leanRaw)<.12?0:leanRaw,.35);
    // arms
    const noseY=P(0).y; const wl=P(15), wr=P(16);
    this.armsUp = wl.y<sh.y-.55*this.torso && wr.y<sh.y-.55*this.torso;
    const outL=Math.abs(wl.y-P(11).y)<.45*this.torso && (wl.x-P(11).x)>.6*this.torso;
    const outR=Math.abs(wr.y-P(12).y)<.45*this.torso && (P(12).x-wr.x)>.6*this.torso;
    this.armsOut = outL && outR && !this.armsUp;
    // running cadence: several body signals, each run through an adaptive peak detector; the strongest wins
    // amplitude floors sized for kids: fast running in place shortens the stride, so shallow-but-quick steps must still count
    this.sig.knee.push(t,(P(25).y-P(26).y)/this.torso, .07);          // knee lift alternation
    this.sig.ankle.push(t,(P(27).y-P(28).y)/this.torso, .07);         // ankle alternation
    this.sig.bounce.push(t,-sh.y/this.torso, .035);                   // whole-body bounce (works when legs are out of frame)
    this.sig.wrist.push(t,(P(15).y-P(16).y)/this.torso, .10);         // arm pumping
    let cad=Math.max(this.sig.knee.rate(t), this.sig.ankle.rate(t), this.sig.bounce.rate(t)*.5, this.sig.wrist.rate(t)*.85);
    this.cadence=damp(this.cadence, cad, cad>this.cadence?8:3, .033);
    this.debug={knee:this.sig.knee.rate(t),bounce:this.sig.bounce.rate(t)*.5,wrist:this.sig.wrist.rate(t)};
    // speed input 0..1 — full speed at a sustained 2.4 steps/s (a hard but reachable kid sprint; 3.0 was out of reach)
    this.speedIn=clamp(this.cadence/2.4,0,1);
  }
}
// Adaptive step detector: counts peaks AND troughs of an oscillating signal whose swing exceeds a floor
// (and 35% of the recent range), then reports steps per second over the last ~1.4 s.
class StepSignal{ constructor(){ this.events=[]; this.ext=null; this.extT=0; this.search=1; this.hist=[]; }
  push(t,v,minAmp){ if(!isFinite(v)) return; this.hist.push([t,v]); while(this.hist.length&&t-this.hist[0][0]>1.5) this.hist.shift();
    let lo=Infinity,hi=-Infinity; for(const [,x] of this.hist){ if(x<lo)lo=x; if(x>hi)hi=x; } const need=Math.max(minAmp,(hi-lo)*.35);
    if(this.ext==null){ this.ext=v; this.extT=t; return; }
    if(this.search>0){ if(v>this.ext){ this.ext=v; this.extT=t; } else if(this.ext-v>need){ this.events.push(this.extT); this.search=-1; this.ext=v; this.extT=t; } }
    else { if(v<this.ext){ this.ext=v; this.extT=t; } else if(v-this.ext>need){ this.events.push(this.extT); this.search=1; this.ext=v; this.extT=t; } }
    this.events=this.events.filter(x=>t-x<1.4); }
  rate(t){ const n=this.events.filter(x=>t-x<1.4).length; return n>=2? n/1.4 : 0; } // extremes per second
}
const bodies=[new Body(),new Body(),new Body()];
const newKeys=()=>({l:false,r:false,jump:false,squat:false,up:false,out:false,fast:false,jumpEdge:false,punch:false,kick:false,punchEdge:false,kickEdge:false});
const KEY=newKeys(), KEYS=[KEY,newKeys(),newKeys()];
// Dedicated key clusters allow three people to play together on one keyboard.
const KEYMAP=[{a:'l',d:'r',w:'jump',s:'squat',q:'up',e:'out',Shift:'fast',' ':'jump',f:'punch',g:'kick'},
 {j:'l',l:'r',i:'jump',k:'squat',u:'up',o:'out',h:'fast',n:'punch',m:'kick'},
 {ArrowLeft:'l',ArrowRight:'r',ArrowUp:'jump',ArrowDown:'squat',Enter:'up','/':'out','.':'fast','[':'punch',']':'kick'}];
function keyEvent(e,down){const key=e.key.length===1?e.key.toLowerCase():e.key;
 if(key==='Escape'&&down&&!e.repeat){togglePause();return;}
 for(let i=0;i<3;i++){const action=KEYMAP[i][key];if(!action)continue; const target=S.players===1?KEY:KEYS[i];
 if(['jump','punch','kick'].includes(action)&&down&&!target[action])target[action+'Edge']=true;target[action]=down;e.preventDefault();}}
addEventListener('keydown',e=>keyEvent(e,true));addEventListener('keyup',e=>keyEvent(e,false));
function clearKeys(){KEYS.forEach(k=>Object.assign(k,newKeys()));}
addEventListener('blur',()=>{clearKeys();if(S.phase==='run')togglePause();});
let debugOn=false; function toggleDebug(){ debugOn=!debugOn; }

let cameraRequest=0;
async function startCamera(){
  const request=++cameraRequest; $('goBtn').disabled=true; $('goBtn').hidden=true; lastVideoTime=-1;
  $('status').textContent='Starting camera…'; $('status').className='status';
  try{
    const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user',width:{ideal:640},height:{ideal:480}},audio:false});
    if(request!==cameraRequest){stream.getTracks().forEach(t=>t.stop());return false;}
    video.srcObject=stream; await video.play();if(request!==cameraRequest)return false;camOn=true;
  }catch(e){ $('status').textContent='Camera not available. Allow camera access, or play with the keyboard.'; return false; }
  $('status').textContent='Loading body tracker…';
  try{
    const vision=await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm');
    const tracker=await PoseLandmarker.createFromOptions(vision,{ baseOptions:{ modelAssetPath:'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task', delegate:'GPU'}, runningMode:'VIDEO', numPoses:S.players, minPoseDetectionConfidence:S.players>1?.35:.5, minPosePresenceConfidence:S.players>1?.35:.5, minTrackingConfidence:S.players>1?.35:.5 });
    if(request!==cameraRequest){tracker.close();return false;}landmarker=tracker;
  }catch(e){if(request!==cameraRequest)return false;stopCamera();$('status').textContent='Tracker could not load. Check your connection or use the keyboard.';return false;}
  $('status').textContent='Tracking. Step back until you fit the outline.';
  poseLoop(); return true;
}
let lastVideoTime=-1, poseResult=null;
function poseLoop(){
  const id=++poseLoopId;
  const step=()=>{
    if(id!==poseLoopId) return;
    if(landmarker && camOn && video.readyState>=2 && video.currentTime!==lastVideoTime){
      lastVideoTime=video.currentTime;
      try{ poseResult=landmarker.detectForVideo(video,performance.now()); }catch(e){poseResult=null;}
      assignPoses(poseResult, now());
      updateCombatTracking(now());
    }
    requestAnimationFrame(step);
  };
  step();
}
function assignPoses(res,t){
  const lms=(res&&res.landmarks)||[];
  if(S.players===1){ bodies[0].update(lms[0]||null,t); return; }
  // Globally minimize assignment cost (at most 3! possibilities). Retain slots when a person drops out.
  const cands=lms.slice(0,S.players).map(l=>({l,x:(l[23].x+l[24].x+l[11].x+l[12].x)/4})).sort((a,b)=>b.x-a.x);
  let best=Infinity,chosen=[];
  function match(j,used,slots,cost){if(j===cands.length){if(cost<best){best=cost;chosen=slots.slice();}return;}
    for(let i=0;i<S.players;i++){if(used.includes(i))continue;const body=bodies[i];
      const anchor=body.calibrated&&t-body.lastSeen<2.5?body.centerX:1-(i+.5)/S.players;
      match(j+1,[...used,i],[...slots,i],cost+Math.abs(cands[j].x-anchor));}}
  match(0,[],[],0);const out=Array(S.players).fill(null);chosen.forEach((slot,j)=>out[slot]=cands[j].l);
  bodies.forEach((body,i)=>body.update(out[i]||null,t));
}
// draw skeleton (setup + PiP)
const BONES=[[11,12],[11,13],[13,15],[12,14],[14,16],[11,23],[12,24],[23,24],[23,25],[25,27],[24,26],[26,28]];
function drawSkeleton(ctx,W,H,withVideo){
  ctx.clearRect(0,0,W,H);
  if(withVideo && video.readyState>=2){ ctx.drawImage(video,0,0,W,H); }
  ctx.fillStyle='rgba(0,0,0,.18)'; if(withVideo) ctx.fillRect(0,0,W,H);
  bodies.slice(0,S.players).forEach((b,i)=>{ if(!b.seen||!b.lm) return; const col=HERO[raceKeys()[i]].css;
    ctx.lineWidth=6; ctx.lineCap='round'; ctx.strokeStyle=col; ctx.beginPath();
    for(const [a,c] of BONES){ const p=b.lm[a],q=b.lm[c]; ctx.moveTo(p.x*W,p.y*H); ctx.lineTo(q.x*W,q.y*H); } ctx.stroke();
    ctx.fillStyle='#fff'; for(const k of [0,15,16,25,26,27,28]){ const p=b.lm[k]; ctx.beginPath(); ctx.arc(p.x*W,p.y*H,7,0,TAU); ctx.fill(); }
    // head circle
    const n=b.lm[0]; ctx.strokeStyle=col; ctx.lineWidth=5; ctx.beginPath(); ctx.arc(n.x*W,n.y*H-4,b.torso*H*.28,0,TAU); ctx.stroke();
    // pace meter (mirrored canvas, so draw the text flipped back)
    ctx.save(); ctx.scale(-1,1); ctx.fillStyle='rgba(0,0,0,.5)'; ctx.fillRect(-W+8,H-34,110,26); ctx.fillStyle='#fff'; ctx.font='bold 15px Nunito,sans-serif'; ctx.fillText(`pace ${b.cadence.toFixed(1)}/s`,-W+14,H-15); ctx.restore();
  });
}


// Context-only combat recognition. The established Body cadence/gesture detector stays untouched.
class CombatSignal {
 constructor(){this.reset();}
 reset(){this.active=false;this.started=0;this.lastT=0;this.punchEdge=false;this.kickEdge=false;this.lastPunch=-9;this.lastKick=-9;this.arms=[{},{}];this.legs=[{},{}];this.baseAnkles=[null,null];this.hips=null;this.hint='Hands at chest, then punch';}
 take(){const out={punch:this.punchEdge,kick:this.kickEdge,hint:this.hint};this.punchEdge=this.kickEdge=false;return out;}
 update(lm,t,active){
  if(!active){this.reset();return;}
  if(!this.active){this.reset();this.active=true;this.started=t;}
  const dt=this.lastT?clamp(t-this.lastT,.005,.1):1/30;this.lastT=t;
  const valid=ids=>lm&&ids.every(i=>lm[i]&&Number.isFinite(lm[i].x)&&Number.isFinite(lm[i].y)&&(lm[i].visibility??1)>.55);
  if(!valid([11,12,23,24])){this.punchEdge=this.kickEdge=false;this.arms=[{},{}];this.legs=[{},{}];this.hint='Step into view';return;}
  const hipY=(lm[23].y+lm[24].y)/2,shY=(lm[11].y+lm[12].y)/2;
  const torso=Math.max(.08,Math.hypot((lm[11].x+lm[12].x-lm[23].x-lm[24].x)/2,shY-hipY));
  const d=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,(a.z??0)-(b.z??0))/torso;
  const angle=(a,b,c)=>{const u=[a.x-b.x,a.y-b.y,(a.z??0)-(b.z??0)],v=[c.x-b.x,c.y-b.y,(c.z??0)-(b.z??0)];return Math.acos(clamp(u.reduce((s,x,i)=>s+x*v[i],0)/(Math.hypot(...u)*Math.hypot(...v)||1),-1,1))*180/Math.PI;};
  this.hips??=hipY;const settled=Math.abs(hipY-this.hips)/torso<.28;
  const legsVisible=valid([25,26,27,28]);this.hint=legsVisible?'Punch, return hands • knee up, kick, foot down':'Step back until both feet are visible';
  for(let i=0;i<2;i++){
   const sh=11+i,el=13+i,wr=15+i,a=this.arms[i];
   if(!valid([sh,el,wr])){this.arms[i]={};continue;}
   const reach=d(lm[sh],lm[wr]),bend=angle(lm[sh],lm[el],lm[wr]);
   const chest=(lm[wr].y-shY)/torso>-.22&&(lm[wr].y-shY)/torso<.8;
   const speed=a.reach===undefined?0:(reach-a.reach)/dt;a.reach=reach;
   if(chest&&bend<125&&reach<1.05){a.guard=(a.guard||0)+dt;if(a.guard>.08)a.armed=true;}else a.guard=0;
   if(a.armed&&chest&&settled&&bend>145&&reach>1.02&&speed>1.25&&t-this.started>.35&&t-this.lastPunch>.35){this.punchEdge=true;this.lastPunch=t;a.armed=false;}
  }
  if(!legsVisible){this.legs=[{},{}];return;}
  for(let i=0;i<2;i++){
   const hip=23+i,knee=25+i,ankle=27+i,other=28-i,l=this.legs[i],a=lm[ankle];
   const bend=angle(lm[hip],lm[knee],a),lift=(hipY-lm[knee].y)/torso;
   if(a.y>hipY+.85*torso&&lift<-.35){this.baseAnkles[i]=this.baseAnkles[i]===null?a.y:Math.max(this.baseAnkles[i]-.005*torso,a.y);l.down=(l.down||0)+dt;if(l.down>.1){l.ready=true;l.chamber=false;}}else l.down=0;
   const base=this.baseAnkles[i],support=this.baseAnkles[1-i];
   const planted=support!==null&&Math.abs(lm[other].y-support)/torso<.25;
   if(l.ready&&planted&&lift>-.2&&bend<135){l.chamber=true;l.chamberT=t;}
   if(l.chamber&&t-l.chamberT>1.8)l.chamber=false;
   if(l.chamber&&planted&&settled&&base!==null&&(base-a.y)/torso>.5&&bend>145&&lift>-.25&&t-this.lastKick>.5){this.kickEdge=true;this.lastKick=t;l.ready=false;l.chamber=false;}
  }
 }
}
const combatSignals=[new CombatSignal(),new CombatSignal(),new CombatSignal()];
function updateCombatTracking(t){combatSignals.forEach((signal,i)=>{const b=bodies[i];signal.update(b.seen&&t-b.lastSeen<.2?b.lm:null,t,!!activeAdventure?.needsCombat(i));});}

// Camera/input state outlives a map. Rebuild the scene only before camera activation.
let activeAdventure=null;
function togglePause(){activeAdventure?.pause();}
function stopCamera(){activeAdventure?.stopCamera();}
function mountAdventure(key){
 activeAdventure?.dispose();S.destination=key;S.phase='start';
 activeAdventure=createAdventure(key);return activeAdventure;
}
