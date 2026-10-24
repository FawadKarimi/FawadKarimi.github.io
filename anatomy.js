import * as THREE from 'three';


const canvas = document.getElementById('ambient-volume');
const root = document.documentElement;
const preference = matchMedia('(prefers-reduced-motion: reduce)');
const mobile = matchMedia('(max-width: 700px)').matches;
let renderer;
try {
  const context=canvas.getContext('webgl2',{alpha:true,antialias:!mobile,powerPreference:'low-power'});
  if(!context) throw new Error('WebGL unavailable');
  renderer = new THREE.WebGLRenderer({canvas, context, alpha:true, antialias:!mobile, powerPreference:'low-power'});
} catch (_) {
  import('./anatomy-software.js?v=nodule-focus1').catch(()=>{});
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
  // Synthetic illustrative targets; not detections or cancer diagnoses.
  const nodules=[[-.079,.575,.061],[.087,.451,.066]].map(position=>{
    const group=new THREE.Group();group.position.set(...position);
    const core=new THREE.Mesh(new THREE.SphereGeometry(.0055,12,8),new THREE.MeshBasicMaterial({color:0xffc16b,transparent:true,depthTest:false}));
    core.renderOrder=10;group.add(core);
    const halo=new THREE.Mesh(new THREE.RingGeometry(.010,.0115,40),new THREE.MeshBasicMaterial({color:0xffc16b,transparent:true,opacity:.7,side:THREE.DoubleSide,depthTest:false,depthWrite:false}));
    halo.renderOrder=11;group.add(halo);return {group,core,halo};
  });
  function smooth(t){t=Math.max(0,Math.min(1,t));return 1-(1-t)*(1-t)}
  function render(){
    if(!renderer)return;
    const progress=reduced?1:smooth(elapsed/8.5);
    const breathing=reduced?1:1+Math.sin(Math.max(0,elapsed-8.5)*1.28)*.010;
    if(ready){
      // Both meshes share the source atlas's coordinates. Keep that alignment intact.
      const fade=1-progress;
      bodyMaterials.forEach(m=>m.opacity=(dark?.24:.2)*fade);
      if(body)body.visible=progress<.99;
      respiratory.scale.set(1+(breathing-1)*.75,breathing,1+(breathing-1)*.75);
      respiratory.position.y=lungCenter.y*(1-breathing);
      const focusTime=Math.max(0,elapsed-10);
      const ambient=reduced?0:Math.sin(focusTime*.32)*.14;
      anatomicalGroup.rotation.y=.10+ambient;
      const approach=reduced?1:smooth(focusTime/2);
      const distance=THREE.MathUtils.lerp(mobile?.97:.84,mobile?.88:.72,approach);
      camera.position.set(THREE.MathUtils.lerp(.23,.095,progress),THREE.MathUtils.lerp(.56,.545,progress),distance);
      target.set(reduced?0:Math.sin(focusTime*.32)*.008,.525,.008);
      camera.lookAt(target);
      nodules.forEach(({core,halo},i)=>{
        const pulse=reduced?.65:(Math.sin(focusTime*.35+i*Math.PI)+1)/2;
        core.material.opacity=.65+.35*pulse;
        halo.scale.setScalar(1+.6*pulse);halo.material.opacity=.25+.55*(1-pulse);
        const parentQ=new THREE.Quaternion();respiratory.getWorldQuaternion(parentQ);
        halo.quaternion.copy(parentQ.invert().multiply(camera.quaternion));
      });
    }else{camera.position.set(.1,.56,1.7);camera.lookAt(0,.56,0)}
    renderer.render(scene,camera);
  }
  function loop(now){requestAnimationFrame(loop);if(now-last<33)return;const dt=Math.min((now-last)/1000,.07);last=now;if(!visible||document.hidden||reduced)return;if(ready)elapsed+=dt;render()}
  window.addEventListener('resize',resize);
  new ResizeObserver(resize).observe(canvas.parentElement);
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting}).observe(canvas);
  new MutationObserver(applyTheme).observe(root,{attributes:true,attributeFilter:['data-theme']});
  preference.addEventListener('change',e=>{reduced=e.matches;if(reduced)elapsed=10;render()});
  canvas.addEventListener('webglcontextlost',()=>{canvas.style.opacity='0';root.classList.remove('anatomy-loaded')},{once:true});
  resize();
  try{
    // Reuse the attributed, simplified reference geometry; skip the full-body download.
    const response=await fetch('./lungs-fast.json');
    if(!response.ok)throw new Error('Anatomy unavailable');
    const data=await response.json();
    respiratory=new THREE.Group();
    data.meshes.forEach(mesh=>{
      const geometry=new THREE.BufferGeometry();
      geometry.setAttribute('position',new THREE.Float32BufferAttribute(mesh.vertices,3));
      geometry.setIndex(mesh.indices);geometry.computeVertexNormals();
      const isLung=mesh.kind==='lung';
      const material=new THREE.MeshStandardMaterial({color:isLung?0xc78c87:0xe4d3ba,roughness:isLung?.61:.42,metalness:0,transparent:isLung,opacity:isLung?.85:1,depthWrite:!isLung,side:THREE.FrontSide});
      const obj=new THREE.Mesh(geometry,material);obj.renderOrder=isLung?2:1;
      (isLung?lungMaterials:airwayMaterials).push(material);respiratory.add(obj);
    });
    nodules.forEach(n=>respiratory.add(n.group));
    anatomicalGroup.add(respiratory);ready=true;elapsed=10;
    root.classList.add('anatomy-loaded');applyTheme();
  }catch(error){
    renderer.dispose();canvas.style.opacity='0';root.classList.add('anatomy-unavailable');
    import('./anatomy-software.js?v=nodule-focus1').catch(()=>{});
    return;
  }
  requestAnimationFrame(loop);
}
