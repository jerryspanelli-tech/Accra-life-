/* Accra Life — GTA-inspired third-person follow rig.
 * Based on publicly documented GTA V follow-camera behaviour and a proven
 * root -> pitch pivot -> camera rig. Not Rockstar's proprietary source code.
 */
(function () {
  "use strict";
  try {
    const canvas=document.getElementById("c");
    const clamp=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));
    const wrap=a=>{while(a>Math.PI)a-=Math.PI*2;while(a< -Math.PI)a+=Math.PI*2;return a;};
    const DEFAULT_DISTANCE=8.5,DRIVE_MULTIPLIER=1.42,FOLLOW_SPEED=6.0;
    const RETURN_DELAY_MS=1750,BASE_PITCH=0.18,SHOULDER_OFFSET=0.42;

    // Critical: replace the active render camera, not just the global variable.
    const bootstrapCamera=cam;
    cam=new BABYLON.UniversalCamera("accra-gta-follow-camera",new BABYLON.Vector3(0,4,-8),scene);
    cam.minZ=0.15;cam.maxZ=60000;cam.speed=0;cam.angularSensibility=720;
    cam.checkCollisions=false;cam.inputs.clear();
    scene.activeCamera=cam;
    if(bootstrapCamera&&bootstrapCamera!==cam){try{bootstrapCamera.detachControl();bootstrapCamera.dispose();}catch(_){}}

    // Rockstar-like separation of follow translation, orbit yaw, and pitch.
    const followRoot=new BABYLON.TransformNode("accra-camera-follow-root",scene);
    const pitchPivot=new BABYLON.TransformNode("accra-camera-pitch-pivot",scene);
    pitchPivot.parent=followRoot;
    cam.parent=pitchPivot;
    // Compatibility: legacy game systems expect ArcRotateCamera's
    // getAbsolutePosition() method. Provide it for this UniversalCamera rig.
    if(typeof cam.getAbsolutePosition!=="function"){
      cam.getAbsolutePosition=function(){
        this.computeWorldMatrix(true);
        if(this.globalPosition)return this.globalPosition;
        return this.getWorldMatrix().getTranslation();
      };
    }
    cam.position.set(SHOULDER_OFFSET,0,-DEFAULT_DISTANCE);
    cam.rotation.set(0,-Math.atan2(SHOULDER_OFFSET,DEFAULT_DISTANCE),0);

    let distance=DEFAULT_DISTANCE,currentDistance=DEFAULT_DISTANCE;
    let cameraYaw=player.rotation.y||0,pitch=BASE_PITCH,dragging=false,pointerId=null,lastX=0,lastY=0,lastLookAt=-Infinity,initialized=false,collisionTimer=0,collisionDistance=DEFAULT_DISTANCE;
    const markLook=()=>{lastLookAt=performance.now();};
    canvas.addEventListener("pointerdown",e=>{
      if(e.pointerType==="mouse"&&e.button!==0)return;
      dragging=true;pointerId=e.pointerId;lastX=e.clientX;lastY=e.clientY;markLook();
      try{canvas.setPointerCapture(pointerId);}catch(_){}
    });
    canvas.addEventListener("pointermove",e=>{
      if(!dragging||e.pointerId!==pointerId)return;
      const dx=e.clientX-lastX,dy=e.clientY-lastY;lastX=e.clientX;lastY=e.clientY;
      cameraYaw=wrap(cameraYaw-dx/Math.max(320,cam.angularSensibility));
      pitch=clamp(pitch+dy*0.0028,0.06,0.52);markLook();
    });
    function endDrag(e){if(pointerId!==null&&e&&e.pointerId!==pointerId)return;dragging=false;pointerId=null;}
    canvas.addEventListener("pointerup",endDrag);
    canvas.addEventListener("pointercancel",endDrag);
    canvas.addEventListener("lostpointercapture",endDrag);
    canvas.addEventListener("wheel",e=>{distance=clamp(distance+Math.sign(e.deltaY)*0.65,4,16);markLook();},{passive:true});

    function setDistance(value){distance=clamp(Number(value)||DEFAULT_DISTANCE,4,16);}
    function canOcclude(mesh){
      return !!(mesh&&mesh!==cam&&mesh!==player&&mesh!==car&&mesh.isEnabled()&&mesh.isVisible&&mesh.isPickable&&mesh.name!=="ground"&&mesh.name!=="water");
    }
    function collisionAdjustedDistance(focus,desiredDistance){
      cam.position.z=-desiredDistance;
      cam.computeWorldMatrix(true);
      const end=cam.getAbsolutePosition().clone();
      const rayVector=end.subtract(focus);
      const rayLength=rayVector.length();
      if(rayLength<0.1)return desiredDistance;
      const ray=new BABYLON.Ray(focus,rayVector.scale(1/rayLength),rayLength);
      const hit=scene.pickWithRay(ray,canOcclude);
      return hit&&hit.hit?Math.max(2.25,Math.min(desiredDistance,hit.distance-0.4)):desiredDistance;
    }

    scene.onBeforeRenderObservable.add(()=>{
      const dt=Math.min(engine.getDeltaTime()/1000,0.05);
      const target=driving?car.position:player.position;
      const facingYaw=driving?heading:player.rotation.y;
      const direction=window.__accraMovementDirection;
      const moving=driving?Math.abs(spd)>0.12:!!(direction&&(Math.abs(direction.x)+Math.abs(direction.z)>0.08));
      const looking=dragging||performance.now()-lastLookAt<RETURN_DELAY_MS;
      if(!looking&&moving)cameraYaw+=wrap(facingYaw-cameraYaw)*(1-Math.exp(-FOLLOW_SPEED*dt));
      if(!looking)pitch+=(BASE_PITCH-pitch)*(1-Math.exp(-3.2*dt));

      const desiredYaw=facingYaw;
      const yawBlend=1-Math.exp(-(driving?7.5:FOLLOW_SPEED)*dt);
      const desiredRoot=new BABYLON.Vector3(target.x,target.y+(driving?1.2:1.12),target.z);
      if(!initialized){followRoot.position.copyFrom(desiredRoot);followRoot.rotation.y=cameraYaw;initialized=true;}
      else{
        followRoot.position=BABYLON.Vector3.Lerp(followRoot.position,desiredRoot,1-Math.exp(-9.0*dt));
        cameraYaw+=wrap(desiredYaw-cameraYaw)*yawBlend;followRoot.rotation.y=cameraYaw;
      }

      pitchPivot.rotation.x=pitch;
      const wanted=distance*(driving?DRIVE_MULTIPLIER:1);
      collisionTimer-=dt;if(collisionTimer<=0){collisionDistance=collisionAdjustedDistance(followRoot.position,wanted);collisionTimer=0.075;}const unobstructed=collisionDistance;
      const distanceBlend=1-Math.exp(-(unobstructed<currentDistance?14:4.5)*dt);
      currentDistance+= (unobstructed-currentDistance)*distanceBlend;
      cam.position.set(SHOULDER_OFFSET,0,-currentDistance);
      cam.rotation.set(0,-Math.atan2(SHOULDER_OFFSET,currentDistance),0);
      cam.computeWorldMatrix(true);
    });

    // Preserve the old movement/settings contract: alpha is the camera's world azimuth.
    Object.defineProperty(cam,"alpha",{configurable:true,get:()=>Math.atan2(-Math.cos(cameraYaw),-Math.sin(cameraYaw)),set:v=>{if(Number.isFinite(v)){cameraYaw=Math.atan2(-Math.cos(v),-Math.sin(v));followRoot.rotation.y=cameraYaw;}}});
    Object.defineProperty(cam,"radius",{configurable:true,get:()=>distance,set:v=>setDistance(v)});
    Object.defineProperty(cam,"beta",{configurable:true,get:()=>Math.PI/2-pitch,set:v=>{if(Number.isFinite(v))pitch=clamp(Math.PI/2-v,.06,.52);}});
    window.ACCRA_CAMERA={
      style:"gta-follow-rig",walkRadius:distance,driveRadius:distance*DRIVE_MULTIPLIER,
      setDistance(value){setDistance(value);this.walkRadius=distance;this.driveRadius=distance*DRIVE_MULTIPLIER;},
      getYaw:()=>cameraYaw,
      getActive:()=>scene.activeCamera===cam
    };
    window.ACCRA_MODULES=window.ACCRA_MODULES||{};
    window.ACCRA_MODULES.camera=4;
    if(window.ACCRA_SETTINGS_API)window.ACCRA_SETTINGS_API.cam=cam;
    console.log("[Accra Life] GTA follow rig active",scene.activeCamera===cam);
  }catch(err){console.error("[Accra Life] GTA follow camera failed:",err);}
})();
