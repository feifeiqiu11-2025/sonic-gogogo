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
