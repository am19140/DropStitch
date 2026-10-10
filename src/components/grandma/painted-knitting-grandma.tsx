/**
 * Painted illustration animation prototype for React Native / Expo.
 * The actual artwork is embedded in an SVG rig; there is no vector redraw.
 * No button, app screen or automatic pause switching.
 * Usage: <PaintedKnittingGrandma paused={isPaused} width={320} active={isFocused} />
 * Install if needed: npx expo install react-native-svg
 * Keep the assets folder beside this file. Native device verification is required.
 * JS-thread prototype; transfer the same poses to Reanimated for demanding screens.
 */
import React, { useEffect, useId, useRef, useState } from 'react';
import { AccessibilityInfo, AppState } from 'react-native';
import Svg, { G, Defs, Image as SvgImage, Path, ClipPath, Use, Mask, Rect, Ellipse } from 'react-native-svg';
type Props={paused:boolean;width?:number;height?:number;active?:boolean};
type Motion={sleep:number;velocity:number;phase:number};
const smooth=(a:number,b:number,x:number)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
const f=(x:number)=>x.toFixed(3);
function advance(m:Motion,target:number,dt:number,reduced:boolean){
 const w=reduced?13:4.3,y=m.sleep-target,j=m.velocity+w*y,c=Math.exp(-w*dt);
 m.sleep=target+(y+j*dt)*c;m.velocity=(m.velocity-w*j*dt)*c;
 if(Math.abs(m.sleep-target)<.00001&&Math.abs(m.velocity)<.00005){m.sleep=target;m.velocity=0;}
 m.phase+=dt*4.1*Math.pow(Math.max(0,1-m.sleep),1.6);
}
function makePose(m:Motion,reduced:boolean){
 const {sleep,phase}=m,a=reduced?0:1-sleep,wave=Math.sin(phase),h=smooth(.14,.98,sleep);
 const wx=1.5*wave*a,wy=2.5*Math.cos(phase)*a+25*sleep,wr=1.15*wave*a-3*sleep;
 const rad=wr*Math.PI/180,px=535+75*Math.cos(rad)-37*Math.sin(rad)+wx,py=610+75*Math.sin(rad)+37*Math.cos(rad)+wy;
 return {
  head:`translate(${-4*h} ${7*h}) rotate(${-12*h+.3*wave*a} 608 441)`,
  work:`translate(${f(wx)} ${f(wy)}) rotate(${f(wr)} 535 610)`,
  closed:smooth(.38,.83,sleep),
  yarn:`M${f(px)} ${f(py)} C601 718 653 746 682 760 C727 779 756 849 809 869 C855 899 887 849 914 873`,
 };
}
export default function PaintedKnittingGrandma({paused,width=320,height,active=true}:Props){
 const id=useId().replace(/[^a-zA-Z0-9_-]/g,'');
 const target=useRef(paused?1:0);
 // Keep the animation loop's target in sync with the prop (set after render, not during it).
 useEffect(()=>{target.current=paused?1:0;},[paused]);
 const reduced=useRef(false);
 const motion=useRef<Motion>({sleep:paused?1:0,velocity:0,phase:0});
 const [pose,setPose]=useState(()=>makePose({sleep:paused?1:0,velocity:0,phase:0},false));
 const [foreground,setForeground]=useState(AppState.currentState!=='background'&&AppState.currentState!=='inactive');
 useEffect(()=>{
  let alive=true;
  AccessibilityInfo.isReduceMotionEnabled().then(value=>{if(alive)reduced.current=value;}).catch(()=>{});
  const a=AccessibilityInfo.addEventListener('reduceMotionChanged',value=>{reduced.current=value;});
  const b=AppState.addEventListener('change',state=>setForeground(state==='active'));
  return()=>{alive=false;a.remove();b.remove();};
 },[]);
 useEffect(()=>{
  if(!active||!foreground)return;
  let frame=0,last=0,cancelled=false;
  const tick=(now:number)=>{
   if(cancelled)return;
   const dt=last?Math.min(.05,(now-last)/1000):0;last=now;
   advance(motion.current,target.current,dt,reduced.current);
   setPose(makePose(motion.current,reduced.current));
   frame=requestAnimationFrame(tick);
  };
  frame=requestAnimationFrame(tick);
  return()=>{cancelled=true;cancelAnimationFrame(frame);};
 },[active,foreground]);
 return (
    <Svg width={width} height={height ?? width} viewBox="0 0 1254 1254" accessible={true} accessibilityLabel={paused ? "Grandma sheep resting" : "Grandma sheep knitting"}>
      <Defs >
        <SvgImage id={`${id}-pg-original`} width="1254" height="1254" href={require("@/assets/images/grandma/knitting-original.png")} />
        <SvgImage id={`${id}-pg-body`} width="1254" height="1254" href={require("@/assets/images/grandma/knitting-body.png")} />
        <SvgImage id={`${id}-pg-eyes`} width="1254" height="1254" href={require("@/assets/images/grandma/knitting-eyes.png")} />
        <Path id={`${id}-pg-head-shape`} d="M325 317 L324 177 L497 177 L497 60 L806 60 L788 262 L743 279 C762 307 810 350 837 368 Q852 390 817 398 Q778 398 742 366 L690 347 C679 390 621 419 560 433 Q486 450 454 407 L440 339 L437 312 Z" />
        <Path id={`${id}-pg-work-shape`} d="M343 478 L384 481 L414 503 L454 508 Q475 520 479 540 L565 563 Q621 546 665 577 L715 574 Q775 584 789 624 Q822 674 787 704 Q754 731 703 719 L681 722 L641 705 L613 681 L600 720 L592 783 L382 738 L392 690 L423 674 Q374 695 332 669 Q284 646 292 592 Q297 550 332 540 L358 522 Z" />
        <Mask id={`${id}-pg-head-color-mask`} maskUnits="userSpaceOnUse" x="0" y="0" width="1254" height="1254">
          <Rect width="1254" height="1254" fill="white" />
          <Path d="M772 302h27v1h-27z M772 303h38v1h-38z M772 304h51v1h-51z M772 305h60v1h-60z M774 306h66v1h-66z M776 307h72v1h-72z M778 308h78v1h-78z M780 309h81v1h-81z M782 310h79v1h-79z M783 311h78v1h-78z M785 312h76v1h-76z M787 313h74v1h-74z M789 314h72v1h-72z M791 315h70v1h-70z M793 316h68v1h-68z M794 317h67v1h-67z M796 318h65v1h-65z M798 319h63v1h-63z M800 320h61v1h-61z M801 321h60v1h-60z M803 322h58v1h-58z M804 323h57v1h-57z M806 324h55v1h-55z M807 325h54v1h-54z M809 326h52v1h-52z M810 327h51v1h-51z M811 328h50v1h-50z M812 329h49v1h-49z M814 330h47v1h-47z M815 331h46v1h-46z M816 332h45v1h-45z M817 333h44v1h-44z M818 334h43v1h-43z M819 335h42v1h-42z M821 336h40v1h-40z M822 337h39v1h-39z M823 338h38v1h-38z M824 339h37v1h-37z M825 340h36v1h-36z M825 341h36v1h-36z M826 342h35v1h-35z M827 343h34v1h-34z M828 344h33v1h-33z M828 345h33v1h-33z M829 346h32v1h-32z M830 347h31v1h-31z M831 348h30v1h-30z M832 349h29v1h-29z M832 350h29v1h-29z M833 351h28v1h-28z M833 352h28v1h-28z M834 353h27v1h-27z M834 354h27v1h-27z M835 355h26v1h-26z M835 356h26v1h-26z M836 357h25v1h-25z M836 358h25v1h-25z M837 359h24v1h-24z M837 360h24v1h-24z M838 361h23v1h-23z M838 362h23v1h-23z M839 363h22v1h-22z M839 364h22v1h-22z M839 365h22v1h-22z M839 366h22v1h-22z M737 367h5v1h-5z M839 367h22v1h-22z M737 368h7v1h-7z M839 368h22v1h-22z M736 369h9v1h-9z M839 369h22v1h-22z M736 370h11v1h-11z M839 370h22v1h-22z M735 371h13v1h-13z M839 371h22v1h-22z M734 372h16v1h-16z M839 372h22v1h-22z M734 373h18v1h-18z M839 373h22v1h-22z M734 374h20v1h-20z M838 374h23v1h-23z M734 375h22v1h-22z M838 375h23v1h-23z M734 376h24v1h-24z M838 376h23v1h-23z M733 377h27v1h-27z M837 377h24v1h-24z M733 378h29v1h-29z M837 378h24v1h-24z M733 379h32v1h-32z M836 379h25v1h-25z M733 380h34v1h-34z M835 380h26v1h-26z M734 381h35v1h-35z M835 381h26v1h-26z M735 382h37v1h-37z M833 382h28v1h-28z M751 383h24v1h-24z M832 383h29v1h-29z M751 384h27v1h-27z M830 384h31v1h-31z M751 385h30v1h-30z M828 385h33v1h-33z M751 386h33v1h-33z M826 386h35v1h-35z M750 387h41v1h-41z M823 387h38v1h-38z M750 388h45v1h-45z M817 388h44v1h-44z M750 389h45v1h-45z M802 389h59v1h-59z M751 390h44v1h-44z M802 390h53v1h-53z M753 391h41v1h-41z M802 391h53v1h-53z M754 392h39v1h-39z M809 392h46v1h-46z M756 393h37v1h-37z M809 393h46v1h-46z M757 394h36v1h-36z M809 394h45v1h-45z M757 395h36v1h-36z M809 395h45v1h-45z M758 396h34v1h-34z M808 396h46v1h-46z M763 397h29v1h-29z M808 397h46v1h-46z M767 398h25v1h-25z M808 398h46v1h-46z M769 399h23v1h-23z M808 399h46v1h-46z M771 400h21v1h-21z M808 400h46v1h-46z M772 401h19v1h-19z M807 401h46v1h-46z M773 402h18v1h-18z M807 402h46v1h-46z M774 403h17v1h-17z M807 403h46v1h-46z M778 404h13v1h-13z M807 404h46v1h-46z M779 405h12v1h-12z M807 405h45v1h-45z M781 406h10v1h-10z M806 406h46v1h-46z M783 407h7v1h-7z M806 407h46v1h-46z M784 408h6v1h-6z M806 408h46v1h-46z M785 409h5v1h-5z M806 409h45v1h-45z M785 410h5v1h-5z M806 410h45v1h-45z M786 411h3v1h-3z M806 411h45v1h-45z M806 412h45v1h-45z M806 413h45v1h-45z M806 414h44v1h-44z M805 415h45v1h-45z M805 416h45v1h-45z M805 417h45v1h-45z M805 418h45v1h-45z M805 419h44v1h-44z M805 420h44v1h-44z M805 421h44v1h-44z M806 422h43v1h-43z M807 423h41v1h-41z M809 424h39v1h-39z M810 425h38v1h-38z M811 426h37v1h-37z M812 427h36v1h-36z M813 428h34v1h-34z M814 429h33v1h-33z M814 430h33v1h-33z " fill="black" />
        </Mask>
        <ClipPath id={`${id}-pg-head-clip`}>
          <Use href={`#${id}-pg-head-shape`} />
        </ClipPath>
        <ClipPath id={`${id}-pg-work-clip`}>
          <Use href={`#${id}-pg-work-shape`} />
        </ClipPath>
        <ClipPath id={`${id}-pg-eye-clip`}>
          <Ellipse cx="500" cy="290" rx="28" ry="24" />
          <Ellipse cx="591" cy="305" rx="28" ry="23" />
        </ClipPath>
        <Mask id={`${id}-pg-static-mask`} maskUnits="userSpaceOnUse" x="0" y="0" width="1254" height="1254">
          <Rect width="1254" height="1254" fill="white" />
          <Rect x="324" y="58" width="540" height="427" fill="black" />
          <Use href={`#${id}-pg-work-shape`} fill="black" />
          <Path d="M606 638 C601 700 632 728 681 748 C725 758 751 844 805 867 C856 900 880 849 910 872" fill="none" stroke="black" strokeWidth="30" strokeLinecap="round" />
        </Mask>
      </Defs>
      <Use href={`#${id}-pg-body`} />
      <Use href={`#${id}-pg-original`} mask={`url(#${id}-pg-static-mask)`} />
      <Path id={`${id}-pg-thread`} stroke="#fff3d5" strokeWidth="7.5" fill="none" strokeLinecap="round" d={pose.yarn} />
      <G id={`${id}-pg-work-motion`} transform={pose.work}>
        <Use href={`#${id}-pg-original`} clipPath={`url(#${id}-pg-work-clip)`} />
      </G>
      <G id={`${id}-pg-head-motion`} transform={pose.head}>
        <Use href={`#${id}-pg-original`} clipPath={`url(#${id}-pg-head-clip)`} mask={`url(#${id}-pg-head-color-mask)`} />
        <Use id={`${id}-pg-lids`} href={`#${id}-pg-eyes`} clipPath={`url(#${id}-pg-eye-clip)`} opacity={pose.closed} />
      </G>
    </Svg>
 );
}
