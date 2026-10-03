(function(){
'use strict';
var canvas=document.getElementById('ambient-volume');if(!canvas)return;
var ctx;try{ctx=canvas.getContext('2d')}catch(e){}if(!ctx)return;
var root=document.documentElement,motion=window.matchMedia?window.matchMedia('(prefers-reduced-motion: reduce)'):null;
var state={width:1200,height:850,yaw:-.28,pitch:.06,mouseX:0,mouseY:0,targetX:0,targetY:0,reduced:!!(motion&&motion.matches),visible:true,dark:root.dataset.theme==='dark'};
var points=[],seed=2718,frame=0,last=0,time=0;
function random(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296}
// Deterministic synthetic geometry. These spatial fields contain no clinical data.
for(var side=-1;side<=1;side+=2){for(var i=0;i<1800;i++){var x=random()*2-1,y=random()*2-1,z=random()*2-1;if(x*x+y*y+z*z>1)continue;points.push({x:side*145+x*96,y:y*177,z:z*73,a:.2+random()*.55,r:.65+random()*.85})}}
function project(p){var yaw=state.yaw+state.mouseX*.055,pitch=state.pitch+state.mouseY*.025,cy=Math.cos(yaw),sy=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch);var x=p.x*cy+p.z*sy,z=-p.x*sy+p.z*cy,y=p.y*cp-z*sp;z=p.y*sp+z*cp;var f=800/(800+z),scale=Math.max(state.width/850,state.height/630);return{x:state.width/2+x*f*scale,y:state.height*.48+y*f*scale,z:z,f:f,s:scale}}
function line(points,color,width,close){ctx.beginPath();points.forEach(function(p,i){var q=project(p);if(i)ctx.lineTo(q.x,q.y);else ctx.moveTo(q.x,q.y)});if(close)ctx.closePath();ctx.strokeStyle=color;ctx.lineWidth=width||.8;ctx.stroke()}
function rgba(rgb,a){return'rgba('+rgb+','+a+')'}
function draw(){var W=state.width,H=state.height;ctx.clearRect(0,0,W,H);var rgb=state.dark?'85,204,220':'18,114,139',soft=state.dark?'110,161,206':'69,140,158';
// Broad CT-like planes span the full landing environment, surrounding the copy.
for(var z=-140;z<=140;z+=70){line([{x:-395,y:-228,z:z},{x:395,y:-228,z:z},{x:395,y:228,z:z},{x:-395,y:228,z:z}],rgba(soft,state.dark?.085:.095),.7,true)}
for(var x=-395;x<=395;x+=79){line([{x:x,y:228,z:-140},{x:x,y:228,z:140}],rgba(soft,.10),.6)}
for(var side=-1;side<=1;side+=2){for(var j=0;j<9;j++){var z=-60+j*15,f=Math.sqrt(Math.max(0,1-z*z/(80*80))),ring=[];for(var a=0;a<=Math.PI*2+.01;a+=.065){ring.push({x:side*145+Math.cos(a)*98*f,y:Math.sin(a)*178*f,z:z})}line(ring,rgba(rgb,state.dark?.09:.095),.75,true)}}
points.map(function(p){var q=project(p);q.p=p;return q}).sort(function(a,b){return b.z-a.z}).forEach(function(q){ctx.beginPath();ctx.arc(q.x,q.y,q.p.r*q.f*Math.min(q.s,2),0,Math.PI*2);ctx.fillStyle=rgba(rgb,q.p.a*(state.dark?.44:.34));ctx.fill()});
// A quiet path from representation to candidate, without implying model results.
var nodes=[{x:-335,y:125,z:95},{x:-255,y:184,z:75},{x:-128,y:216,z:40},{x:35,y:220,z:5},{x:220,y:181,z:25},{x:325,y:92,z:100}];line(nodes,rgba(rgb,.22),1);nodes.forEach(function(n){var q=project(n);ctx.beginPath();ctx.arc(q.x,q.y,3*q.f,0,Math.PI*2);ctx.fillStyle=rgba(rgb,.48);ctx.fill()});
var spot=project({x:193,y:-92,z:35}),accent=state.dark?'196,240,165':'29,134,132';ctx.beginPath();ctx.arc(spot.x,spot.y,4.4*spot.f,0,Math.PI*2);ctx.fillStyle=rgba(accent,.88);ctx.fill();ctx.beginPath();ctx.arc(spot.x,spot.y,14*spot.f,0,Math.PI*2);ctx.strokeStyle=rgba(accent,.35);ctx.lineWidth=1;ctx.stroke();
}
function resize(){var r=canvas.parentElement.getBoundingClientRect();state.width=r.width;state.height=r.height;var ratio=Math.min(window.devicePixelRatio||1,1.75);canvas.width=Math.round(r.width*ratio);canvas.height=Math.round(r.height*ratio);ctx.setTransform(ratio,0,0,ratio,0,0);draw()}
function animate(t){frame=requestAnimationFrame(animate);if(t-last<40)return;var dt=Math.min((t-last)/1000,.06);last=t;if(state.reduced||!state.visible||document.hidden)return;time+=dt*16;state.yaw=-.28+Math.sin(time*.12)*.13;state.pitch=.06+Math.sin(time*.10)*.035;state.mouseX+=(state.targetX-state.mouseX)*.045;state.mouseY+=(state.targetY-state.mouseY)*.045;draw()}
function onMotion(e){state.reduced=e.matches;if(state.reduced){state.mouseX=state.mouseY=0;state.yaw=-.28;state.pitch=.06;draw()}}
if(motion&&motion.addEventListener)motion.addEventListener('change',onMotion);
window.addEventListener('pointermove',function(e){if(state.reduced||e.pointerType==='touch')return;state.targetX=(e.clientX/window.innerWidth-.5)*2;state.targetY=(e.clientY/window.innerHeight-.5)*2},{passive:true});
window.addEventListener('resize',resize);
if(window.ResizeObserver)new ResizeObserver(resize).observe(canvas.parentElement);
if(window.IntersectionObserver)new IntersectionObserver(function(entries){state.visible=entries[0].isIntersecting}).observe(canvas);
if(window.MutationObserver)new MutationObserver(function(){state.dark=root.dataset.theme==='dark';draw()}).observe(root,{attributes:true,attributeFilter:['data-theme']});
window.addEventListener('pagehide',function(){cancelAnimationFrame(frame)});
resize();frame=requestAnimationFrame(animate);
}());
