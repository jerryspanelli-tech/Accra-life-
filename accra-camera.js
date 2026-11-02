/* Accra Life — manual third-person chase camera (not an orbit camera). */
(function () {
  "use strict";
  try {
    const canvas=document.getElementById("c");
    const DEFAULT_DISTANCE=8.5,DRIVE_MULTIPLIER=1.42,BASE_ELEVATION=.36,LOOK_HEIGHT=1.18,FOLLOW_SPEED=5.2;
    const clamp=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));
    const wrap=a=>{while(a>Math.PI)a-=Math.PI*2;while(a< -Math.PI)a+=Math.PI*2;return a;};
    let distance=DEFAULT_DISTANCE,yaw=Math.atan2(-Math.cos(player.rotation.y||0),-Math.sin(player.rotation.y||0));
    let elevation=BASE_ELEVATION,dragging=false,pointerId=null,lastX=0,lastY=0,lastLookAt=-Infinity,smoothedPosition=null;
    cam=new BABYLON.UniversalCamera("cam",new BABYLON.Vector3(0,5,-9),scene);
    cam.minZ=.2;cam.maxZ=60000;cam.speed=0;cam.angularSensibility=800;cam.checkCollisions=false;cam.inputs.clear();
    Object.defineProperty(cam,"alpha",{configurable:true,get:()=>yaw,set:v=>{if(Number.isFinite(v))yaw=v;}});
    Object.defineProperty(cam,"radius",{configurable:true,get:()=>distance,set:v=>{if(Number.isFinite(Number(v)))distance=clamp(Number(v),4,16);}});
    Object.defineProperty(cam,"beta",{configurable:true,get:()=>Math.PI/2-elevation,set:v=>{if(Number.isFinite(v))elevation=clamp(Math.PI/2-v,.16,.68);}});
    const markLook=()=>{lastLookAt=performance.now();};
    canvas.addEventListener("pointerdown",e=>{if(e.pointerType==="mouse"&&e.button!==0)return;dragging=true;pointerId=e.pointerId;lastX=e.clientX;lastY=e.clientY;markLook();try{canvas.setPointerCapture(pointerId);}catch(_){}});
    canvas.addEventListener("pointermove",e=>{if(!dragging||e.pointerId!==pointerId)return;const dx=e.clientX-lastX,dy=e.clientY-lastY;lastX=e.clientX;lastY=e.clientY;yaw-=dx/Math.max(350,cam.angularSensibility);elevation=clamp(elevation+dy*.0032,.16,.68);markLook();});
    function endDrag(e){if(pointerId!==null&&e&&e.pointerId!==pointerId)return;dragging=false;pointerId=null;}
    canvas.addEventListener("pointerup",endDrag);canvas.addEventListener("pointercancel",endDrag);canvas.addEventListener("lostpointercapture",endDrag);
    canvas.addEventListener("wheel",e=>{distance=clamp(distance+Math.sign(e.deltaY)*.65,4,16);markLook();},{passive:true});
    function setDistance(value){distance=clamp(Number(value)||DEFAULT_DISTANCE,4,16);}
    scene.onBeforeRenderObservable.add(()=>{
      const dt=Math.min(engine.getDeltaTime()/1000,.05),focus=driving?car.position:player.position;
      const facingYaw=driving?heading:player.rotation.y,targetYaw=Math.atan2(-Math.cos(facingYaw),-Math.sin(facingYaw));
      const direction=window.__accraMovementDirection;
      const moving=driving?Math.abs(spd)>.12:!!window.__accraRunning||!!(direction&&(Math.abs(direction.x)+Math.abs(direction.z)>.08));
      const looking=dragging||performance.now()-lastLookAt<1900;
      if(!looking&&moving)yaw+=wrap(targetYaw-yaw)*(1-Math.exp(-FOLLOW_SPEED*dt));
      if(!looking)elevation+=(BASE_ELEVATION-elevation)*(1-Math.exp(-3.4*dt));
      const radius=distance*(driving?DRIVE_MULTIPLIER:1),horizontal=radius*Math.cos(elevation);
      const rightX=-Math.sin(yaw),rightZ=Math.cos(yaw);
      const desired=new BABYLON.Vector3(focus.x+Math.cos(yaw)*horizontal+rightX*.38,focus.y+(driving?1.3:LOOK_HEIGHT)+radius*Math.sin(elevation),focus.z+Math.sin(yaw)*horizontal+rightZ*.38);
      if(!smoothedPosition)smoothedPosition=desired.clone();
      else smoothedPosition=BABYLON.Vector3.Lerp(smoothedPosition,desired,1-Math.exp(-(driving?7.2:8.5)*dt));
      cam.position.copyFrom(smoothedPosition);
      cam.setTarget(new BABYLON.Vector3(focus.x+rightX*.12,focus.y+(driving?1.05:LOOK_HEIGHT),focus.z+rightZ*.12));
    });
    window.ACCRA_CAMERA={style:"manual-gta-chase",walkRadius:distance,driveRadius:distance*DRIVE_MULTIPLIER,setDistance(value){setDistance(value);this.walkRadius=distance;this.driveRadius=distance*DRIVE_MULTIPLIER;},getYaw:()=>yaw};
    window.ACCRA_MODULES=window.ACCRA_MODULES||{};window.ACCRA_MODULES.camera=3;
    if(window.ACCRA_SETTINGS_API)window.ACCRA_SETTINGS_API.cam=cam;
    console.log("[Accra Life] Manual GTA chase camera ready");
  }catch(err){console.error("[Accra Life] GTA chase camera failed:",err);}
})();
