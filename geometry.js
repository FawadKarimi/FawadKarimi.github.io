(function(){
'use strict';
var canvas=document.getElementById('ambient-geometry');if(!canvas)return;
var ctx;try{ctx=canvas.getContext('2d')}catch(e){}if(!ctx)return;
var root=document.documentElement,motion=window.matchMedia?window.matchMedia('(prefers-reduced-motion: reduce)'):null;
var state={width:1200,height:850,yaw:-.28,pitch:.06,mouseX:0,mouseY:0,targetX:0,targetY:0,reduced:!!(motion&&motion.matches),visible:true,dark:root.dataset.theme==='dark'};
var frame=0,last=0,time=0;
// Decorative depth planes and connected geometry restored alongside anatomical illustration.
function project(p){var yaw=state.yaw+state.mouseX*.055,pitch=state.pitch+state.mouseY*.025,cy=Math.cos(yaw),sy=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch);var x=p.x*cy+p.z*sy,z=-p.x*sy+p.z*cy,y=p.y*cp-z*sp;z=p.y*sp+z*cp;var f=800/(800+z),scale=Math.max(state.width/850,state.height/630);return{x:state.width/2+x*f*scale,y:state.height*.48+y*f*scale,z:z,f:f,s:scale}}
function line(points,color,width,close){ctx.beginPath();points.forEach(function(p,i){var q=project(p);if(i)ctx.lineTo(q.x,q.y);else ctx.moveTo(q.x,q.y)});if(close)ctx.closePath();ctx.strokeStyle=color;ctx.lineWidth=width||.8;ctx.stroke()}
function rgba(rgb,a){return'rgba('+rgb+','+a+')'}
function draw(){var W=state.width,H=state.height;ctx.clearRect(0,0,W,H);var rgb=state.dark?'85,204,220':'18,114,139',soft=state.dark?'110,161,206':'69,140,158';
// Conceptual imaging -> neural processing -> health support. No model predictions or patient data.
var z=95;
// Layered medical-image frames on the left.
for(var k=0;k<3;k++){var dx=k*13,dy=k*-10;line([{x:-375+dx,y:-150+dy,z:z},{x:-285+dx,y:-150+dy,z:z},{x:-285+dx,y:-65+dy,z:z},{x:-375+dx,y:-65+dy,z:z}],rgba(soft,.25),1,true)}
// A small multi-layer neural graph, with gently travelling signals.
var layers=[[-370,[-25,30,85]],[-315,[-50,5,60,115]],[-260,[-25,30,85]]];
for(var a=0;a<layers.length-1;a++){layers[a][1].forEach(function(y,i){layers[a+1][1].forEach(function(yy,j){var u={x:layers[a][0],y:y,z:z},v={x:layers[a+1][0],y:yy,z:z};line([u,v],rgba(rgb,.12),.7);if((i+j)%3===0){var t=(time*.035+(i+j)*.21)%1,q=project({x:u.x+(v.x-u.x)*t,y:y+(yy-y)*t,z:z});ctx.beginPath();ctx.arc(q.x,q.y,1.8,0,Math.PI*2);ctx.fillStyle=rgba(rgb,.50);ctx.fill()}})})}
layers.forEach(function(l){l[1].forEach(function(y){var q=project({x:l[0],y:y,z:z});ctx.beginPath();ctx.arc(q.x,q.y,3,0,Math.PI*2);ctx.strokeStyle=rgba(rgb,.45);ctx.lineWidth=1;ctx.stroke()})});
// Heart and medical cross, expressing the goal of health-supporting AI.
var heart=[];for(var a=0;a<=Math.PI*2+.05;a+=.08){heart.push({x:305+Math.pow(Math.sin(a),3)*4.1*16,y:-45-(13*Math.cos(a)-5*Math.cos(2*a)-2*Math.cos(3*a)-Math.cos(4*a))*4.1,z:z})}line(heart,rgba(rgb,.28),1.15,true);
var cx=305,cy=88,r=25,w=8;line([{x:cx-w,y:cy-r,z:z},{x:cx+w,y:cy-r,z:z},{x:cx+w,y:cy-w,z:z},{x:cx+r,y:cy-w,z:z},{x:cx+r,y:cy+w,z:z},{x:cx+w,y:cy+w,z:z},{x:cx+w,y:cy+r,z:z},{x:cx-w,y:cy+r,z:z},{x:cx-w,y:cy+w,z:z},{x:cx-r,y:cy+w,z:z},{x:cx-r,y:cy-w,z:z},{x:cx-w,y:cy-w,z:z}],rgba(rgb,.3),1.1,true);
// Curved lower connection stays outside the dominant lung silhouette.
var route=[{x:-260,y:130,z:z},{x:-195,y:205,z:z},{x:-60,y:244,z:z},{x:70,y:244,z:z},{x:205,y:205,z:z},{x:305,y:145,z:z}];line(route,rgba(rgb,.17),1);

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