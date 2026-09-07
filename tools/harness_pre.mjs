// Repeatable world and gameplay randomness for regression runs.
let seed=74321;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};

import * as THREE_ from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
class StubRenderer{ constructor(){ this.shadowMap={}; this.domElement={}; } setScissorTest(){} setScissor(){} setViewport(){} setPixelRatio(){} setSize(){} render(){} }
class StubPM{ constructor(){} fromScene(){ return {texture:{}}; } dispose(){} }
const THREE={...THREE_, WebGLRenderer:StubRenderer, PMREMGenerator:StubPM}; class RoomEnvironment{}
class EffectComposer{ constructor(){} addPass(){} setSize(){} render(){} } class RenderPass{} class UnrealBloomPass{} class OutputPass{}
const PoseLandmarker={}, FilesetResolver={};
// ---- DOM stubs
const handlers={}; const els={};
const ctx=new Proxy({},{get:(t,k)=>{ if(k==='createRadialGradient'||k==='createLinearGradient') return ()=>({addColorStop(){}}); if(k==='measureText') return ()=>({width:10}); return (typeof k==='string' && ['fillStyle','strokeStyle','lineWidth','lineCap','font','textAlign'].includes(k))?'':()=>{}; }, set:()=>true});
function el(id){ if(els[id]) return els[id]; const e={id,style:{setProperty(){}},classList:{add(){},remove(){}},setAttribute(){},getAttribute(){return null},addEventListener(){},dataset:{},width:320,height:240,hidden:false,textContent:'',innerHTML:'',disabled:false,getContext:()=>ctx,readyState:0,play:async()=>{},srcObject:null}; Object.defineProperty(e,'onclick',{set(f){handlers[id]=f;},get(){return handlers[id];}}); els[id]=e; return e; }
globalThis.document={getElementById:el,createElement:()=>({width:0,height:0,getContext:()=>ctx}),querySelectorAll:()=>[]};
globalThis.window=globalThis; globalThis.addEventListener=()=>{}; globalThis.innerWidth=1280; globalThis.innerHeight=720; globalThis.devicePixelRatio=1;
const rafQ=[]; globalThis.requestAnimationFrame=f=>{rafQ.push(f);return 1;};
let fakeNow=0; Object.defineProperty(globalThis,"performance",{value:{now:()=>fakeNow*1000},configurable:true});
