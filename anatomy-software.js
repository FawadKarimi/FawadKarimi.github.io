// Software-rendered anatomical fallback for browsers without WebGL.
// Uses simplified CC BY 4.0 HuBMAP reference meshes; see ANATOMY-ATTRIBUTION.txt.
const old=document.getElementById('ambient-volume');
const canvas=document.createElement('canvas');canvas.id='ambient-volume';old.replaceWith(canvas);
const ctx=canvas.getContext('2d');
const root=document.documentElement,media=matchMedia('(prefers-reduced-motion: reduce)');
let reduced=media.matches,dark=root.dataset.theme==='dark',meshes=[],ready=false,W=1000,H=850,elapsed=0,last=0,visible=true;
function norm(v){const n=Math.hypot(...v);return v.map(x=>x/n)}
function cross(a,b){return[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]}
function dot(a,b){return a[0]*b[0]+a[1]*b[1]+a[2]*b[2]}
function smooth(t){t=Math.max(0,Math.min(1,t));return 1-(1-t)*(1-t)}
function draw(){
 if(!ready||!ctx)return;ctx.clearRect(0,0,W,H);
 const p=reduced?1:smooth(elapsed/8.5),mobile=W<701;
 const eye=[.23+(.095-.23)*p,.56+(.545-.56)*p,(mobile?2.30:1.78)+((mobile?.91:.78)-(mobile?2.30:1.78))*p];
 const target=[0,.565+(.535-.565)*p,.008],fwd=norm(target.map((v,i)=>v-eye[i])),right=norm(cross(fwd,[0,1,0])),up=cross(right,fwd);
 const focal=H/(2*Math.tan(34*Math.PI/360));
 const yaw=.1+(reduced?0:Math.sin(elapsed*1.92)*.024),c=Math.cos(yaw),s=Math.sin(yaw);
 const breath=reduced?1:1+Math.sin(Math.max(0,elapsed-8.5)*1.28)*.01;
 const faces=[],light=norm([-.35,.55,1]);
 for(const m of meshes){
  if(m.kind==='body'&&p>.985)continue;
  const src=m.vertices,projected=[],world=[];
  for(let i=0;i<src.length;i+=3){let x=src[i],y=src[i+1],z=src[i+2];if(m.kind!=='body'){x*=1+(breath-1)*.75;y=.532+(y-.532)*breath;z*=1+(breath-1)*.75}const q=[x*c+z*s,y,-x*s+z*c],rel=q.map((v,j)=>v-eye[j]),d=dot(rel,fwd);world.push(q);projected.push([W/2+dot(rel,right)*focal/d,H/2-dot(rel,up)*focal/d,d]);}
  const ids=m.indices;
  for(let k=0;k<ids.length;k+=3){const ai=ids[k],bi=ids[k+1],ci=ids[k+2],a=projected[ai],b=projected[bi],cc=projected[ci];if(a[2]<.02||b[2]<.02||cc[2]<.02)continue;const nx=m.normals[k],ny=m.normals[k+1],nz=m.normals[k+2],n=[nx*c+nz*s,ny,-nx*s+nz*c];if(dot(n,eye.map((v,j)=>v-world[ai][j]))<=0)continue;let base,alpha;if(m.kind==='body'){base=dark?[113,185,194]:[78,134,150];alpha=(dark?.25:.20)*(1-p)}else if(m.kind==='airway'){base=dark?[229,214,191]:[218,202,177];alpha=.95}else{base=dark?[199,139,132]:[186,116,107];alpha=.91}const shade=.48+Math.max(0,dot(n,light))*.57;faces.push({a,b,c:cc,z:(a[2]+b[2]+cc[2])/3,color:`rgba(${base.map(v=>Math.min(255,Math.round(v*shade))).join(',')},${alpha})`});}
 }
 faces.sort((a,b)=>b.z-a.z);
 for(const f of faces){ctx.fillStyle=f.color;ctx.beginPath();ctx.moveTo(f.a[0],f.a[1]);ctx.lineTo(f.b[0],f.b[1]);ctx.lineTo(f.c[0],f.c[1]);ctx.closePath();ctx.fill();}
}
function resize(){const r=canvas.parentElement.getBoundingClientRect();W=r.width;H=r.height;const d=Math.min(devicePixelRatio||1,1.25);canvas.width=W*d;canvas.height=H*d;ctx.setTransform(d,0,0,d,0,0);draw()}
function loop(t){requestAnimationFrame(loop);if(t-last<80)return;let dt=Math.min((t-last)/1000,.12);last=t;if(!visible||document.hidden||reduced)return;elapsed+=dt;draw()}
new ResizeObserver(resize).observe(canvas.parentElement);new IntersectionObserver(es=>{visible=es[0].isIntersecting}).observe(canvas);new MutationObserver(()=>{dark=root.dataset.theme==='dark';draw()}).observe(root,{attributes:true,attributeFilter:['data-theme']});media.addEventListener('change',e=>{reduced=e.matches;if(reduced)elapsed=10;draw()});
try{const response=await fetch('./anatomy-lod.json');if(!response.ok)throw Error('Anatomy unavailable');const data=await response.json();meshes=data.meshes;ready=true;elapsed=reduced?10:0;root.classList.add('anatomy-loaded','anatomy-software');resize();requestAnimationFrame(loop)}catch(_){canvas.style.opacity='0'}
