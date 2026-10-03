import * as THREE from 'three';
import { GLTFLoader } from './GLTFLoader.js';

const canvas = document.getElementById('ambient-volume');
const root = document.documentElement;
const preference = matchMedia('(prefers-reduced-motion: reduce)');
const mobile = matchMedia('(max-width: 700px)').matches;
let renderer;
try {
  renderer = new THREE.WebGLRenderer({canvas, alpha:true, antialias:!mobile, powerPreference:'low-power'});
} catch (_) {
  import('./volume.js?v=motion16-20261003').catch(()=>{});
}
if (renderer) start();

async function start(){
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,mobile?1.25:1.6));
  renderer.setClearColor(0x000000,0);
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.08;
  renderer.localClippingEnabled=true;
  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(34,1,.015,15);
  const anatomicalGroup=new THREE.Group();scene.add(anatomicalGroup);
  const hemisphere=new THREE.HemisphereLight(0xcbeaf5,0x253741,2.1);scene.add(hemisphere);
  const key=new THREE.DirectionalLight(0xffe4d8,3.2);key.position.set(-1.2,1.9,2);scene.add(key);
  const rim=new THREE.DirectionalLight(0x79d7e5,3);rim.position.set(1,.8,-1);scene.add(rim);
  const fill=new THREE.DirectionalLight(0xb5e7ff,.8);fill.position.set(1,-.2,1);scene.add(fill);
  const clip=new THREE.Plane(new THREE.Vector3(0,1,0),-.18);
  const loader=new GLTFLoader();
  let body,respiratory,bodyMaterials=[],lungMaterials=[],airwayMaterials=[],ready=false;
  let elapsed=0,last=0,visible=true,reduced=preference.matches;
  let dark=root.dataset.theme==='dark';
  const target=new THREE.Vector3();
  const lungCenter=new THREE.Vector3(0,.532,.014);
  function resize(){const box=canvas.parentElement.getBoundingClientRect();renderer.setSize(box.width,box.height,false);camera.aspect=box.width/box.height;camera.updateProjectionMatrix();render();}
  function applyTheme(){
    dark=root.dataset.theme==='dark';
    bodyMaterials.forEach(m=>m.color.set(dark?0x91cad2:0x4f8896));
    lungMaterials.forEach((m,i)=>{m.color.set(dark?(i%2?0xc78c87:0xd29b91):(i%2?0xb56c68:0xc48479));m.emissive.set(dark?0x261a19:0x000000)});
    airwayMaterials.forEach(m=>m.color.set(dark?0xe4d3ba:0xe8d7bd));
    hemisphere.intensity=dark?1.7:2.1;key.intensity=dark?2.6:2.1;rim.intensity=dark?2.7:1.5;
    render();
  }
  function smooth(t){t=Math.max(0,Math.min(1,t));return t*t*t*(t*(t*6-15)+10)}
  function render(){
    if(!renderer)return;
    const progress=reduced?1:smooth((elapsed-1.5)/8.5);
    const breathing=reduced?1:1+Math.sin(Math.max(0,elapsed-10)*1.28)*.010;
    if(ready){
      // Both meshes share the source atlas's coordinates. Keep that alignment intact.
      const fade=1-progress;
      bodyMaterials.forEach(m=>m.opacity=(dark?.24:.2)*fade);
      body.visible=progress<.99;
      respiratory.scale.set(1+(breathing-1)*.75,breathing,1+(breathing-1)*.75);
      respiratory.position.y=lungCenter.y*(1-breathing);
      const ambient=reduced?0:Math.sin(elapsed*1.92)*.024;
      anatomicalGroup.rotation.y=.10+ambient;
      const distance=THREE.MathUtils.lerp(mobile?2.30:1.78,mobile?.91:.78,progress);
      camera.position.set(THREE.MathUtils.lerp(.23,.095,progress),THREE.MathUtils.lerp(.56,.545,progress),distance);
      target.set(0,THREE.MathUtils.lerp(.565,.535,progress),.008);
      camera.lookAt(target);
    }else{camera.position.set(.1,.56,1.7);camera.lookAt(0,.56,0)}
    renderer.render(scene,camera);
  }
  function loop(now){requestAnimationFrame(loop);if(now-last<33)return;const dt=Math.min((now-last)/1000,.07);last=now;if(!visible||document.hidden)return;if(ready&&!reduced)elapsed+=dt;render()}
  window.addEventListener('resize',resize);
  new ResizeObserver(resize).observe(canvas.parentElement);
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting}).observe(canvas);
  new MutationObserver(applyTheme).observe(root,{attributes:true,attributeFilter:['data-theme']});
  preference.addEventListener('change',e=>{reduced=e.matches;if(reduced)elapsed=10;render()});
  canvas.addEventListener('webglcontextlost',()=>{canvas.style.opacity='0'},{once:true});
  resize();
  try{
    const models=await Promise.all([loader.loadAsync('./body-reference.glb'),loader.loadAsync('./lungs-reference.glb')]);
    body=models[0].scene;respiratory=models[1].scene;
    body.traverse(obj=>{if(!obj.isMesh)return;obj.material=new THREE.MeshPhongMaterial({color:0x91cad2,transparent:true,opacity:.24,shininess:65,side:THREE.FrontSide,depthWrite:false,clippingPlanes:[clip]});bodyMaterials.push(obj.material);obj.renderOrder=3;});
    respiratory.traverse(obj=>{
      if(!obj.isMesh)return;
      const original=(Array.isArray(obj.material)?obj.material[0]:obj.material).name||'';
      const isLung=original.toLowerCase().includes('lung');
      obj.material=new THREE.MeshStandardMaterial({color:isLung?0xc78c87:0xe4d3ba,roughness:isLung?.61:.42,metalness:0,transparent:isLung,opacity:isLung?.85:1,depthWrite:!isLung,side:THREE.FrontSide});
      obj.renderOrder=isLung?2:1;
      (isLung?lungMaterials:airwayMaterials).push(obj.material);
    });
    anatomicalGroup.add(body,respiratory);ready=true;elapsed=reduced?10:0;
    root.classList.add('anatomy-loaded');applyTheme();
  }catch(error){
    renderer.dispose();canvas.style.opacity='0';root.classList.add('anatomy-unavailable');
    console.warn('Anatomy illustration unavailable; portfolio content remains available.');
    return;
  }
  requestAnimationFrame(loop);
}
