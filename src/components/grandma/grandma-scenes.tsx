import React, {useEffect, useId, useRef, useState} from 'react';
import {AccessibilityInfo, AppState, Platform} from 'react-native';
import Svg, {Defs, Image as SvgImage, ClipPath, Path, Mask, Rect, G, Use} from 'react-native-svg';

export type GrandmaSceneProps = {
 width?: number;
 active?: boolean;
 /**
  * How far she moves. 1 = as painted. Reading: head turn and shift (try 0.5–2.5).
  * Tea: how high she lifts the cup (0–1; above 1 is treated as 1).
  */
 motion?: number;
 /** Playback speed. 1 = as painted (tea 8 s loop, reading 6.5 s loop); 2 = twice as fast. */
 speed?: number;
};
type Mode = 'tea' | 'reading';
const scenes = {"tea": {"w": 1312, "h": 1199, "label": "Tea break", "shape": "M300 314 C321 310 381 312 411 322 L411 347 Q407 376 390 395 L387 406 Q356 411 334 402 L311 386 Q286 408 265 431 L257 443 Q231 445 210 431 Q198 410 205 382 Q215 349 260 336 L298 334 Z", "cut": "M190 299 H424 V452 H190Z", "exclusion": ""}, "reading": {"w": 1254, "h": 1254, "label": "Reading her pattern", "shape": "M317 342 L320 164 L461 164 L461 30 L778 30 L777 259 C798 278 824 313 839 348 Q849 374 824 380 Q776 372 727 338 L677 351 C664 392 606 433 549 444 Q479 445 456 404 L445 351 L437 333Z", "cut": "M317 29 H853 V446 H317Z", "exclusion": "M767 285h3v1h-3z M767 286h12v1h-12z M767 287h24v1h-24z M794 287h6v1h-6z M767 288h40v1h-40z M768 289h47v1h-47z M769 290h55v1h-55z M771 291h63v1h-63z M773 292h70v1h-70z M775 293h74v1h-74z M776 294h78v1h-78z M777 295h83v1h-83z M778 296h82v1h-82z M780 297h80v1h-80z M782 298h78v1h-78z M783 299h77v1h-77z M785 300h75v1h-75z M786 301h74v1h-74z M788 302h72v1h-72z M789 303h71v1h-71z M790 304h70v1h-70z M792 305h68v1h-68z M793 306h67v1h-67z M795 307h65v1h-65z M796 308h64v1h-64z M797 309h63v1h-63z M799 310h61v1h-61z M800 311h60v1h-60z M801 312h59v1h-59z M802 313h58v1h-58z M804 314h56v1h-56z M805 315h55v1h-55z M806 316h54v1h-54z M807 317h53v1h-53z M809 318h51v1h-51z M810 319h50v1h-50z M811 320h49v1h-49z M812 321h48v1h-48z M813 322h47v1h-47z M814 323h46v1h-46z M815 324h45v1h-45z M816 325h44v1h-44z M817 326h43v1h-43z M817 327h43v1h-43z M818 328h42v1h-42z M819 329h41v1h-41z M820 330h40v1h-40z M820 331h40v1h-40z M821 332h39v1h-39z M822 333h38v1h-38z M823 334h37v1h-37z M824 335h36v1h-36z M825 336h35v1h-35z M825 337h35v1h-35z M826 338h34v1h-34z M826 339h34v1h-34z M827 340h33v1h-33z M827 341h33v1h-33z M828 342h32v1h-32z M828 343h32v1h-32z M829 344h31v1h-31z M829 345h31v1h-31z M830 346h30v1h-30z M830 347h30v1h-30z M831 348h29v1h-29z M831 349h29v1h-29z M831 350h29v1h-29z M831 351h29v1h-29z M831 352h29v1h-29z M831 353h29v1h-29z M831 354h29v1h-29z M831 355h29v1h-29z M831 356h29v1h-29z M831 357h29v1h-29z M830 358h30v1h-30z M830 359h30v1h-30z M829 360h31v1h-31z M829 361h31v1h-31z M828 362h32v1h-32z M827 363h33v1h-33z M826 364h34v1h-34z M825 365h35v1h-35z M824 366h36v1h-36z M823 367h37v1h-37z M773 368h8v1h-8z M821 368h39v1h-39z M773 369h13v1h-13z M819 369h41v1h-41z M773 370h24v1h-24z M816 370h8v1h-8z M827 370h33v1h-33z M773 371h32v1h-32z M816 371h6v1h-6z M827 371h33v1h-33z M774 372h32v1h-32z M816 372h3v1h-3z M827 372h33v1h-33z M779 373h27v1h-27z M827 373h33v1h-33z M781 374h25v1h-25z M827 374h33v1h-33z M784 375h22v1h-22z M827 375h33v1h-33z M785 376h21v1h-21z M827 376h33v1h-33z M786 377h19v1h-19z M827 377h33v1h-33z M787 378h18v1h-18z M826 378h34v1h-34z M790 379h15v1h-15z M826 379h34v1h-34z M790 380h15v1h-15z M826 380h34v1h-34z M792 381h13v1h-13z M826 381h34v1h-34z M794 382h11v1h-11z M826 382h34v1h-34z M795 383h10v1h-10z M826 383h34v1h-34z M796 384h9v1h-9z M825 384h35v1h-35z M798 385h6v1h-6z M825 385h35v1h-35z M825 386h35v1h-35z M825 387h35v1h-35z M825 388h35v1h-35z M825 389h35v1h-35z M825 390h35v1h-35z M825 391h35v1h-35z M825 392h35v1h-35z M824 393h36v1h-36z M824 394h36v1h-36z M824 395h36v1h-36z M822 396h38v1h-38z M822 397h38v1h-38z M470 398h15v1h-15z M703 398h157v1h-157z M470 399h15v1h-15z M702 399h158v1h-158z M464 400h22v1h-22z M700 400h160v1h-160z M461 401h25v1h-25z M699 401h161v1h-161z M460 402h26v1h-26z M698 402h162v1h-162z M459 403h28v1h-28z M698 403h162v1h-162z M458 404h30v1h-30z M697 404h163v1h-163z M456 405h32v1h-32z M697 405h163v1h-163z M455 406h34v1h-34z M695 406h165v1h-165z M454 407h36v1h-36z M694 407h166v1h-166z M453 408h37v1h-37z M693 408h167v1h-167z M453 409h38v1h-38z M692 409h168v1h-168z M452 410h40v1h-40z M692 410h168v1h-168z M452 411h41v1h-41z M692 411h168v1h-168z M451 412h43v1h-43z M689 412h171v1h-171z M451 413h44v1h-44z M564 413h4v1h-4z M688 413h172v1h-172z M451 414h45v1h-45z M562 414h6v1h-6z M687 414h173v1h-173z M450 415h47v1h-47z M560 415h9v1h-9z M685 415h175v1h-175z M450 416h48v1h-48z M559 416h10v1h-10z M684 416h176v1h-176z M442 417h57v1h-57z M556 417h14v1h-14z M684 417h176v1h-176z M440 418h60v1h-60z M553 418h17v1h-17z M680 418h180v1h-180z M438 419h64v1h-64z M552 419h19v1h-19z M679 419h181v1h-181z M438 420h65v1h-65z M550 420h21v1h-21z M678 420h182v1h-182z M438 421h67v1h-67z M548 421h24v1h-24z M677 421h183v1h-183z M438 422h69v1h-69z M545 422h28v1h-28z M677 422h183v1h-183z M438 423h71v1h-71z M542 423h32v1h-32z M673 423h187v1h-187z M438 424h75v1h-75z M539 424h35v1h-35z M672 424h188v1h-188z M438 425h77v1h-77z M535 425h41v1h-41z M671 425h189v1h-189z M438 426h83v1h-83z M529 426h47v1h-47z M670 426h190v1h-190z M438 427h18v1h-18z M457 427h120v1h-120z M668 427h192v1h-192z M438 428h18v1h-18z M458 428h120v1h-120z M667 428h193v1h-193z M438 429h18v1h-18z M459 429h119v1h-119z M665 429h195v1h-195z M438 430h18v1h-18z M459 430h120v1h-120z M664 430h196v1h-196z M438 431h18v1h-18z M460 431h119v1h-119z M663 431h197v1h-197z M438 432h17v1h-17z M463 432h117v1h-117z M663 432h197v1h-197z M438 433h16v1h-16z M463 433h118v1h-118z M661 433h199v1h-199z M438 434h15v1h-15z M462 434h119v1h-119z M657 434h203v1h-203z M438 435h15v1h-15z M460 435h122v1h-122z M655 435h205v1h-205z M438 436h14v1h-14z M458 436h124v1h-124z M653 436h207v1h-207z M438 437h12v1h-12z M457 437h126v1h-126z M652 437h208v1h-208z M438 438h9v1h-9z M455 438h130v1h-130z M651 438h209v1h-209z M441 439h5v1h-5z M454 439h132v1h-132z M650 439h210v1h-210z M454 440h133v1h-133z M649 440h211v1h-211z M453 441h134v1h-134z M648 441h212v1h-212z M453 442h136v1h-136z M644 442h216v1h-216z M453 443h23v1h-23z M478 443h112v1h-112z M643 443h217v1h-217z M452 444h24v1h-24z M479 444h124v1h-124z M642 444h218v1h-218z M451 445h25v1h-25z M482 445h124v1h-124z M640 445h220v1h-220z M451 446h25v1h-25z M483 446h125v1h-125z M637 446h223v1h-223z M451 447h24v1h-24z M484 447h124v1h-124z M637 447h223v1h-223z M451 448h24v1h-24z M487 448h121v1h-121z M637 448h223v1h-223z "}} as const;
const assets = {
 tea: {original: require('@/assets/images/grandma/tea-original.png'), backing: require('@/assets/images/grandma/tea-backing.png')},
 reading: {original: require('@/assets/images/grandma/reading-original.png'), backing: require('@/assets/images/grandma/reading-backing.png')},
};
// `accessible` groups the picture for screen readers on phones; the web doesn't understand it.
const a11yProps=Platform.OS==='web'?{role:'img' as const}:{accessible:true};
const smooth = (x: number) => {const t=Math.max(0,Math.min(1,x)); return t*t*(3-2*t);};
function transform(mode: Mode, time: number, motion: number) {
 if(mode==='tea') {
  const t=time%8;
  const lift=t<2?0:t<3.5?smooth((t-2)/1.5):t<4.6?1:t<6.2?1-smooth((t-4.6)/1.6):0;
  const l=lift*Math.min(1,Math.max(0,motion));
  return `rotate(${14*(1-l)-.8*l} 235 433)`;
 }
 const scan=Math.sin(time*2*Math.PI/6.5)*motion;
 return `translate(${scan*8} 0) rotate(${scan*2.3} 578 427)`;
}
function GrandmaScene({mode, width=320, active=true, motion=1, speed=1}: GrandmaSceneProps & {mode:Mode}) {
 const id='grandma'+useId().replace(/[^a-zA-Z0-9_-]/g,'');
 const scene=scenes[mode], source=assets[mode];
 const phase=useRef(0);
 const [time,setTime]=useState(0);
 const [reduced,setReduced]=useState(true);
 const [foreground,setForeground]=useState(AppState.currentState!=='background'&&AppState.currentState!=='inactive');
 useEffect(()=>{
  let alive=true;
  AccessibilityInfo.isReduceMotionEnabled().then(value=>{if(alive)setReduced(value);}).catch(()=>{});
  const a=AccessibilityInfo.addEventListener('reduceMotionChanged',setReduced);
  const b=AppState.addEventListener('change',state=>setForeground(state==='active'));
  return()=>{alive=false;a.remove();b.remove();};
 },[]);
 useEffect(()=>{
  if(!active||!foreground||reduced)return;
  let raf=0,last: number|undefined, cancelled=false;
  const tick=(now:number)=>{
   if(cancelled)return;
   const dt=last===undefined?0:Math.min(.05,(now-last)/1000);last=now;
   phase.current+=dt*speed;setTime(phase.current);raf=requestAnimationFrame(tick);
  };
  raf=requestAnimationFrame(tick);
  return()=>{cancelled=true;cancelAnimationFrame(raf);};
 },[active,foreground,reduced,speed]);
 return <Svg width={width} height={width*scene.h/scene.w} viewBox={`0 0 ${scene.w} ${scene.h}`} {...a11yProps} accessibilityLabel={scene.label}>
  <Defs>
   <SvgImage id={`${id}-original`} width={scene.w} height={scene.h} href={source.original}/>
   <SvgImage id={`${id}-backing`} width={scene.w} height={scene.h} href={source.backing}/>
   <ClipPath id={`${id}-clip`}><Path d={scene.shape}/></ClipPath>
   <Mask id={`${id}-still`} maskUnits="userSpaceOnUse" x={0} y={0} width={scene.w} height={scene.h}>
    <Rect width={scene.w} height={scene.h} fill="white"/><Path d={scene.cut} fill="black"/>
   </Mask>
   <Mask id={`${id}-colour`} maskUnits="userSpaceOnUse" x={0} y={0} width={scene.w} height={scene.h}>
    <Rect width={scene.w} height={scene.h} fill="white"/>{scene.exclusion ? <Path d={scene.exclusion} fill="black"/> : null}
   </Mask>
  </Defs>
  <Use href={`#${id}-backing`}/>
  <Use href={`#${id}-original`} mask={`url(#${id}-still)`}/>
  <G transform={transform(mode,time,motion)}>
   <Use href={`#${id}-original`} clipPath={`url(#${id}-clip)`} mask={`url(#${id}-colour)`}/>
  </G>
 </Svg>;
}
export function GrandmaTea(props: GrandmaSceneProps) {return <GrandmaScene {...props} mode="tea"/>;}
export function GrandmaReading(props: GrandmaSceneProps) {return <GrandmaScene {...props} mode="reading"/>;}
