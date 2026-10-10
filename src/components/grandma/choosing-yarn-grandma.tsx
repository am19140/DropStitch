import React, {useEffect, useId, useRef, useState} from 'react';
import {AccessibilityInfo, AppState, Platform} from 'react-native';
import Svg, {Defs, Image as SvgImage, ClipPath, Path, Mask, Rect, Use, G} from 'react-native-svg';

export type ChoosingYarnGrandmaProps = {width?:number; active?:boolean};
const ease=(x:number)=>x*x*(3-2*x);
// `accessible` groups the picture for screen readers on phones; the web doesn't understand it.
const a11yProps=Platform.OS==='web'?{role:'img' as const}:{accessible:true};
const HEAD='M260 284 L260 132 L475 128 L491 76 L575 40 L615 17 L799 16 L843 65 L845 275 L896 317 L941 369 L936 430 L855 433 Q750 416 673 340 C654 373 603 404 548 421 Q476 440 433 417 Q399 391 414 326 L414 284 Z';

/** Her head turns from the red yarn to the blue one and back, pausing at each: a nine-second loop. */
export function headTransform(time:number){
 const t=time%9;
 const q=t<1.7?0:t<4?ease((t-1.7)/2.3):t<5.7?1:t<8?1-ease((t-5.7)/2.3):0;
 return `translate(${q*90} ${q*2}) rotate(${2-46*q} 600 400)`;
}

/** Purl choosing between a red and a blue ball of yarn, for the yarn stash. Only her head moves. */
export default function ChoosingYarnGrandma({width=320,active=true}:ChoosingYarnGrandmaProps){
 const id='choose'+useId().replace(/[^a-zA-Z0-9_-]/g,'');
 const elapsed=useRef(0);
 const [time,setTime]=useState(0);
 const [reduced,setReduced]=useState(true);
 const [foreground,setForeground]=useState(AppState.currentState!=='background'&&AppState.currentState!=='inactive');
 useEffect(()=>{
  let alive=true;
  AccessibilityInfo.isReduceMotionEnabled().then(v=>{if(alive)setReduced(v);}).catch(()=>{});
  const a=AccessibilityInfo.addEventListener('reduceMotionChanged',setReduced);
  const b=AppState.addEventListener('change',s=>setForeground(s==='active'));
  return()=>{alive=false;a.remove();b.remove();};
 },[]);
 useEffect(()=>{
  if(!active||!foreground||reduced)return;
  let frame=0,last:number|undefined,cancelled=false;
  const tick=(now:number)=>{
   if(cancelled)return;
   const dt=last===undefined?0:Math.min(.05,(now-last)/1000);last=now;
   elapsed.current+=dt;setTime(elapsed.current);frame=requestAnimationFrame(tick);
  };
  frame=requestAnimationFrame(tick);
  return()=>{cancelled=true;cancelAnimationFrame(frame);};
 },[active,foreground,reduced]);
 return (
    <Svg width={width} height={width*1312/1199} viewBox="0 0 1199 1312" {...a11yProps} accessibilityLabel="Purl choosing between red and blue yarn">
      <Defs>
        <SvgImage id={`${id}-original`} width="1199" height="1312" href={require('@/assets/images/grandma/choosing-original.png')} />
        <SvgImage id={`${id}-backing`} width="1199" height="1312" href={require('@/assets/images/grandma/choosing-backing.png')} />
        <ClipPath id={`${id}-head-clip`}>
          <Path d={HEAD} />
        </ClipPath>
        <Mask id={`${id}-body-mask`} maskUnits="userSpaceOnUse" x="0" y="0" width="1199" height="1312">
          <Rect width="1199" height="1312" fill="white" />
          <Path d={HEAD} fill="black" />
        </Mask>
      </Defs>
      <Use href={`#${id}-backing`} clipPath={`url(#${id}-head-clip)`} />
      <Use href={`#${id}-original`} mask={`url(#${id}-body-mask)`} />
      <G transform={headTransform(time)}>
        <Use href={`#${id}-original`} clipPath={`url(#${id}-head-clip)`} />
      </G>
    </Svg>
 );
}
