/* Accra Life civic replacement models.
 * Custom multi-mesh Ghanaian civic architecture and dedicated emergency vehicles.
 * Keeps the existing world coordinates and interior entry points. */
(function (g) {
  "use strict";
  const B = g.BABYLON;
  if (!B || !g.scene || !g.mat) { console.error("Civic models: Babylon scene not ready"); return; }
  const scene = g.scene;
  const M = {};
  const material = (hex, emissive) => {
    const key = hex + (emissive ? "e" : "");
    if (M[key]) return M[key];
    const m = new B.StandardMaterial("civic_" + key, scene);
    m.diffuseColor = B.Color3.FromHexString(hex);
    m.specularColor = new B.Color3(.16,.16,.16);
    if (emissive) m.emissiveColor = B.Color3.FromHexString(hex);
    M[key] = m; return m;
  };
  const part = (name,w,h,d,x,y,z,color,collide) => {
    const m = B.MeshBuilder.CreateBox(name,{width:w,height:h,depth:d},scene);
    m.position.set(x,y,z); m.material = typeof color === "string" ? material(color) : color;
    m.checkCollisions = !!collide; m.isPickable = false; m.receiveShadows = true; return m;
  };
  const cyl = (name,diam,height,x,y,z,color,axis) => {
    const m = B.MeshBuilder.CreateCylinder(name,{diameter:diam,height,tessellation:20},scene);
    m.position.set(x,y,z); if(axis==="x") m.rotation.z=Math.PI/2;
    m.material=material(color); m.isPickable=false; return m;
  };
  const sign = (label,w,h,x,y,z,bg,fg) => {
    const tex=new B.DynamicTexture("civic_sign",{width:1024,height:256},scene,false);
    const c=tex.getContext(); c.fillStyle=bg; c.fillRect(0,0,1024,256);
    c.fillStyle=fg; c.font="bold 76px Arial"; c.textAlign="center"; c.textBaseline="middle";
    c.fillText(label,512,128,980); tex.update();
    const m=new B.StandardMaterial("civic_sign_mat",scene); m.diffuseTexture=tex;
    m.emissiveTexture=tex; m.disableLighting=true; m.backFaceCulling=false;
    const p=B.MeshBuilder.CreatePlane("civic_sign",{width:w,height:h},scene);
    p.position.set(x,y,z); p.material=m; p.isPickable=false; return p;
  };
  const windowPane=(x,y,z,w,h,frontColor="#18364b")=>{
    part("window_recess",w+.28,h+.28,.16,x,y,z-.04,"#c5cbd0",false);
    part("tinted_glass",w,h,.12,x,y,z+.05,frontColor,false);
    part("window_mullion",.07,h,.14,x,y,z+.12,"#dce3e8",false);
    part("window_sill",w+.16,.12,.2,x,y-h/2-.08,z+.08,"#d7dde1",false);
  };
  const tree = (x,z) => {
    cyl("civic_palm_trunk",.55,5,x,2.5,z,"#795538");
    for(let i=0;i<7;i++){
      const a=i*Math.PI*2/7;
      const leaf=B.MeshBuilder.CreateBox("palm_frond",{width:.45,height:.12,depth:3.3},scene);
      leaf.position.set(x+Math.sin(a)*1.15,5.1,z+Math.cos(a)*1.15);
      leaf.rotation.y=a; leaf.rotation.x=-.25; leaf.material=material("#28764a"); leaf.isPickable=false;
    }
  };
  function emergencyVehicle(type,x,z,rotY) {
    const root=new B.TransformNode(type+"_vehicle",scene); root.position.set(x,0,z); root.rotation.y=rotY||0;
    const van=type==="ambulance", body=van?"#f4f4f1":"#f5f5f2", trim=van?"#c7192d":"#173b68";
    const add=(w,h,d,px,py,pz,col)=>{const m=part(type+"_vehicle_part",w,h,d,px,py,pz,col,false);m.parent=root;return m;};
    // Sculpted lower chassis, cabin and bonnet are separate meshes rather than a placeholder block.
    add(van?2.35:2.15,.72,van?4.7:4.25,0,.83,0,body);
    add(van?2.15:1.95,1.22,van?2.55:2.15,0,1.72,van?-.25:-.05,body);
    add(van?2.1:.9,.52,van?1.7:1.2,0,1.38,van?1.55:1.45,body);
    add(1.88,.12,van?4.5:4.05,0,1.2,0,trim);
    // Dark glazing, divided windscreen and rear glass.
    add(van?1.88:1.72,.76,.09,0,1.82,van?1.04:.98,"#183344");
    add(van?1.88:1.72,.7,.09,0,1.82,van?-1.53:-1.08,"#183344");
    [-1,1].forEach(s=>{
      add(.08,.7,van?1.15:.95,s*(van?1.09:.99),1.82,van?-.15:-.1,"#183344");
      add(.09,.16,van?4.2:3.9,s*(van?1.19:1.1),1.24,0,trim);
      for(const wz of [-1.35,1.35]){
        const wheel=cyl("vehicle_wheel",.82,.32,s*(van?1.18:1.1),.52,wz,"#17191b","x"); wheel.parent=root;
        const hub=cyl("vehicle_hub",.36,.34,s*(van?1.18:1.1),.52,wz,"#aeb5bb","x"); hub.parent=root;
      }
    });
    // Front lamps, grille, bumpers, mirrors.
    add(1.5,.22,.12,0,.85,van?2.36:2.14,"#20272c");
    [-.72,.72].forEach(s=>{add(.34,.22,.08,s,1.02,van?2.39:2.18,"#fff1c7");add(.28,.14,.08,s,1.38,van?2.39:2.18,"#b51f2c");});
    add(2.25,.18,.18,0,.53,van?2.38:2.2,"#aeb4b8");
    if(van){
      add(.14,.82,.08,-.78,1.72,-.05,trim); add(.14,.82,.08,.78,1.72,-.05,trim);
      add(.22,.9,.08,0,1.72,-.05,trim);
      // Red medical stripe and large red-cross emblem on both flanks.
      [-1,1].forEach(s=>{
        add(.06,.28,3.65,s*1.19,1.42,-.05,"#c7192d");
        add(.07,.7,.7,s*1.2,1.78,.35,"#c7192d");
        add(.07,.18,.7,s*1.2,1.78,.35,"#ffffff");
      });
      add(1.25,.12,.38,0,2.39,0,"#c7192d");
      add(.5,.16,.5,0,2.48,0,"#ffffff");
      sign("AMBULANCE",1.8,.35,0,2.55,0,"#c7192d","#ffffff").parent=root;
    } else {
      add(2.0,.18,.12,0,1.43,0,"#173b68");
      add(1.4,.12,.3,0,2.38,0,"#c51f32");
      [-.65,.65].forEach(s=>add(.25,.18,.28,s,2.38,0,"#e7f4ff"));
      sign("POLICE",1.5,.3,0,2.48,0,"#173b68","#ffffff").parent=root;
      [-1,1].forEach(s=>add(.06,.16,1.4,s*1.12,1.42,0,"#c9a54a"));
    }
    return root;
  }
  function buildHQ(){
    const CX=-100,CZ=95,X0=-140,X1=-60,Z0=60,Z1=130;
    const navy="#172e55",white="#e7e9e7",glass="#24465d",concrete="#bfc4c5";
    // Compound apron, boundary wall and controlled front gate.
    part("HQ_forecourt",80,.18,70,CX,.02,CZ,"#9b9d9c",false);
    part("HQ_south_wall",80,2.8,.7,CX,1.4,Z1,navy,true);
    part("HQ_west_wall",.7,2.8,70,X0,1.4,CZ,navy,true);
    part("HQ_east_wall",.7,2.8,70,X1,1.4,CZ,navy,true);
    part("HQ_north_wall_left",31,2.8,.7,-124,1.4,Z0,navy,true);
    part("HQ_north_wall_right",31,2.8,.7,-76,1.4,Z0,navy,true);
    // New stepped civic headquarters: central glazed atrium, two side wings and upper setbacks.
    part("HQ_left_wing",13,9,18,-119,4.5,100,white,true);
    part("HQ_right_wing",13,9,18,-81,4.5,100,white,true);
    part("HQ_main_block",25,11,19,CX,5.5,101,white,true);
    part("HQ_upper_setback",19,3,15,CX,12.5,101,white,true);
    part("HQ_roof_cap",21,.45,17,CX,14.2,101,"#aeb7bc",false);
    // Glass curtain wall and vertical concrete fins.
    for(let floor=0;floor<3;floor++){
      const y=2.1+floor*3.15;
      for(let i=-3;i<=3;i++) windowPane(CX+i*3.05,y,110.62,1.95,2.05);
      for(const x of [-119,-81]) for(let i=-1;i<=1;i++) windowPane(x+i*3.7,y,109.25,2.3,2.05);
    }
    for(let i=-3;i<=3;i++) part("HQ_facade_fin",.22,10.1,.35,CX+i*3.55,5.1,110.9,"#d2d8da",false);
    // Prominent entrance atrium, glass doors, canopy, columns and accessible steps.
    part("HQ_entry_glass",9,3.2,.18,CX,1.9,110.9,glass,false);
    part("HQ_entry_door_l",1.8,2.6,.12,-101,1.35,111.05,"#172a38",false);
    part("HQ_entry_door_r",1.8,2.6,.12,-99,1.35,111.05,"#172a38",false);
    part("HQ_canopy",15,.42,5,CX,3.5,113.2,navy,false);
    [-6,6].forEach(dx=>cyl("HQ_canopy_column",.48,3.2,CX+dx,1.6,113.5,white));
    part("HQ_steps",12,.28,2,CX,.14,114.3,"#d5d7d6",false);
    sign("GHANA POLICE SERVICE",20,1.5,CX,9.8,110.95,navy,"#ffffff");
    sign("ACCRA CENTRAL POLICE HQ",18,1.05,CX,4.7,113.15,navy,"#ffffff");
    // Security gate and sentry booth.
    part("HQ_gate_pillar",1.5,5,1.5,-108,2.5,60,white,true);
    part("HQ_gate_pillar",1.5,5,1.5,-92,2.5,60,white,true);
    part("HQ_gate_beam",17,.8,1.5,CX,5.2,60,navy,false);
    sign("POLICE HEADQUARTERS",13,.7,CX,5.25,59.15,navy,"#ffffff");
    part("HQ_guard_post",3,2.5,3,-116,1.25,67,white,true);
    windowPane(-116,1.7,68.56,1.6,1.1);
    // roof solar array and compound landscaping.
    for(let i=0;i<3;i++){const p=part("HQ_solar_panel",5,.12,3,CX-6+i*6,14.55,98,"#183653",false);p.rotation.x=-.18;}
    for(const p of [[-135,125],[-65,125],[-135,68],[-65,68]]) tree(p[0],p[1]);
    // Dedicated police patrol fleet (not generic sedan/SUV placeholders).
    [[-120,116],[-114,116],[-108,116],[-102,116]].forEach((p,i)=>emergencyVehicle("police",p[0],p[1],Math.PI));
    [[-86,119],[-80,119]].forEach(p=>emergencyVehicle("police",p[0],p[1],Math.PI));
    g.ACCRA_HQ={x:CX,z:CZ,gate:{x:CX,z:Z0},bounds:{x0:X0,x1:X1,z0:Z0,z1:Z1}};
    g.ACCRA_MODULES=g.ACCRA_MODULES||{};g.ACCRA_MODULES.hq=1;
    console.log("Accra Central Police HQ civic replacement ready");
  }
  function buildHospital(){
    const CX=110,CZ=100,X0=80,X1=140,Z0=75,Z1=125;
    const cream="#e9e5dc",blue="#2e6686",glass="#21485e",red="#b91f32";
    part("Hospital_apron",68,.16,58,CX,.02,CZ,"#b7b9b7",false);
    part("Hospital_main_wing",42,10,17,CX,5,98,cream,true);
    part("Hospital_left_wing",13,7,13,91,3.5,99,whiteColor(),true);
    part("Hospital_right_wing",13,7,13,129,3.5,99,cream,true);
    part("Hospital_upper_block",29,4,14,CX,12,98,"#f5f2ec",true);
    part("Hospital_roof",31,.5,16,CX,14.25,98,"#b9c0c3",false);
    for(let floor=0;floor<3;floor++){
      const y=1.9+floor*3.3;
      for(let i=-3;i<=3;i++) windowPane(CX+i*5.4,y,106.65,3.2,2.1,"#24536a");
      for(const x of [91,129]) windowPane(x,y,105.65,2.8,2.0,"#24536a");
    }
    // Distinct emergency, outpatient and maternity entry doors, each with a canopy.
    const entry=(x,label,color,width)=>{
      part("Hospital_entry_glass",width,2.8,.16,x,1.4,106.9,glass,false);
      part("Hospital_entry_canopy",width+2,.38,3.4,x,3.15,108.3,color,false);
      part("Hospital_entry_step",width+1,.22,1.4,x,.11,109.9,"#d5d7d4",false);
      sign(label,width+1,1.0,x,4.2,108.3,color,"#ffffff");
    };
    entry(92,"EMERGENCY",red,10);
    entry(110,"OUTPATIENT",blue,9);
    entry(130,"MATERNITY","#9c3864",9);
    sign("ACCRA GENERAL HOSPITAL",24,1.55,CX,13.1,106.7,blue,"#ffffff");
    // Red cross on the roof tower.
    part("Hospital_cross_vertical",1.2,4,.3,CX,15.5,98,red,false);
    part("Hospital_cross_horizontal",4,1.2,.3,CX,15.5,98,red,false);
    // Emergency bay, canopy and dedicated ambulances.
    part("Hospital_ambulance_bay",17,4,12,133,2,91,cream,true);
    part("Hospital_ambulance_roof",18,.4,13,133,4.2,91,"#c6ccce",false);
    sign("AMBULANCE BAY",13,1.0,133,5.1,97.7,red,"#ffffff");
    emergencyVehicle("ambulance",129,88,Math.PI/2);
    emergencyVehicle("ambulance",135,88,Math.PI/2);
    // Helipad, parking markings and planted approach.
    const pad=B.MeshBuilder.CreateDisc("Hospital_helipad",{radius:5,tessellation:32},scene);
    pad.position.set(CX,14.55,98);pad.rotation.x=Math.PI/2;pad.material=material("#4e626b");pad.isPickable=false;
    sign("H",2,2,CX,14.7,98,"#4e626b","#ffffff");
    for(let i=0;i<6;i++) part("Hospital_parking_bay",2.8,.04,5,84+i*4.5,.09,132,"#f1f1ec",false);
    [[82,78],[138,78],[82,122],[138,122],[110,132]].forEach(p=>tree(p[0],p[1]));
    g.ACCRA_HOSPITAL={x:CX,z:CZ,entrance:{x:92,z:110.4},bounds:{x0:X0,x1:X1,z0:Z0,z1:Z1}};
    g.ACCRA_MODULES=g.ACCRA_MODULES||{};g.ACCRA_MODULES.hospital=1;
    console.log("Accra General Hospital civic replacement ready");
  }
  function whiteColor(){return "#e9e5dc";}
  g.ACCRA_CIVIC_MODELS={buildHQ,buildHospital};
})(window);
