// landmarks.js - Accra Sports Stadium, Kotoka Airport and Labadi Beach for the Babylon.js game.
// Independence Square has been removed.
(function(){
 const E=window.ACCRA_LANDMARKS=[];
 const M=o=>Object.assign(new BABYLON.StandardMaterial('lm',scene),o);
 const lbl=(t,x,y,z,rot,w)=>{const dt=new BABYLON.DynamicTexture('lb',{width:512,height:128},scene,true),c=dt.getContext();c.fillStyle='#17191c';c.fillRect(0,0,512,128);c.fillStyle='#c9a54a';c.font='bold 44px Trebuchet MS';c.textAlign='center';c.textBaseline='middle';c.fillText(t,256,64);dt.update();
  const p=BABYLON.MeshBuilder.CreatePlane('lb',{width:w||16,height:4},scene);p.position.set(x,y,z);p.rotation.y=rot||0;p.material=M({diffuseTexture:dt,emissiveTexture:dt,disableLighting:true,backFaceCulling:false});p.isPickable=false;return p};
 const solidMesh=(m,col)=>{m.material=typeof col==='string'?mat(col):col;m.checkCollisions=true;m.receiveShadows=true;sg.addShadowCaster(m);return m};
 const glass=M({diffuseColor:C3('#2a4a6a'),specularColor:new BABYLON.Color3(.9,.9,.9),specularPower:100,emissiveColor:C3('#0c1822')});
 // ================= ACCRA SPORTS STADIUM (west) =================
 const SX=-235,SZ=0,RX=36,RZ=50,N=30;
 function ring(rx,rz,h,w,col){const ps=[];for(let k=0;k<N;k++){const a=k/N*2*Math.PI;if(Math.abs(a-Math.PI/2)<.24)continue;
   const len=Math.hypot(rx*Math.sin(a),rz*Math.cos(a))*2*Math.PI/N*1.5,b=BABYLON.MeshBuilder.CreateBox('sr',{width:w,height:h,depth:len},scene);
   b.position.set(SX+Math.cos(a)*rx,h/2,SZ+Math.sin(a)*rz);b.rotation.y=Math.atan2(rz*Math.cos(a),-rx*Math.sin(a))+Math.PI/2*0;ps.push(b)}
  const m=BABYLON.Mesh.MergeMeshes(ps,true,true);return solidMesh(m,col)}
 ring(RX+3,RZ+3,5,6,'#2f6fb0');ring(RX+9,RZ+9,10,6,'#e8e8e4');ring(RX+15,RZ+15,15,6,'#c0392b');ring(RX+21,RZ+21,19,5,'#f1c40f');
 box(RX*1.5,.06,RZ*1.5,SX,.06,SZ,'#3f8f3a',false);box(RX*1.5,.02,.5,SX,.1,SZ,'#f2f2f2',false);
 [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([a,b])=>{const x=SX+a*(RX+30),z=SZ+b*(RZ+30);solidMesh(BABYLON.MeshBuilder.CreateCylinder('ft',{diameter:2,height:34},scene),'#4a4f57').position.set(x,17,z);
  const h=box(6,1.4,1.4,x,35,z,'#fff6d6',false);h.material=M({emissiveColor:C3('#fff6d6'),disableLighting:true})});
 lbl('ACCRA SPORTS STADIUM',SX,24,SZ+RZ+26,Math.PI,22);
 E.push({n:'Accra Sports Stadium',x:SX,z:SZ});
 // ================= KOTOKA INTERNATIONAL AIRPORT (east) =================
 const RW=280;box(40,.1,420,RW,.06,0,'#2b2d31',false);for(let z=-190;z<=190;z+=20)box(1,.02,8,RW,.12,z,'#f2f2f2',false);
 box(24,.08,260,248,.05,0,'#4a4c52',false);
 box(42,16,90,215,8,60,'#cfd8dc');box(.8,12,82,236.4,7,60,glass,false);box(48,.8,96,215,16.4,60,'#9aa5ad',false);
 box(30,10,60,215,5,-60,'#e8eaed');
 solidMesh(BABYLON.MeshBuilder.CreateCylinder('ct',{diameter:6,height:30},scene),'#d9dde2').position.set(230,15,130);
 const pod=solidMesh(BABYLON.MeshBuilder.CreateCylinder('cp2',{diameter:12,height:6},scene),glass);pod.position.set(230,33,130);
 const plane=(x,z)=>{const f=solidMesh(BABYLON.MeshBuilder.CreateCylinder('pf',{height:22,diameter:3},scene),'#f7f7f4');f.rotation.x=Math.PI/2;f.position.set(x,2.4,z);
  box(26,.3,4,x,2,z+2,'#e6e9ec');box(.4,5,3,x,5,z-9,'#006b3f',false);box(9,.25,2.5,x,2.6,z-9,'#e6e9ec',false);box(.1,.5,14,x+1.52,2.6,z,'#fcd116',false)};
 plane(248,-35);plane(248,45);
 lbl('KOTOKA INTERNATIONAL AIRPORT',215,20,60+46,Math.PI,24);
 E.push({n:'Kotoka Airport',x:215,z:60});
 // ================= LABADI BEACH AND SEA (south) =================
 const sand=BABYLON.MeshBuilder.CreateGround('sand',{width:300,height:70},scene);sand.position.set(0,.04,222);sand.material=mat('#e3cf9b');sand.receiveShadows=true;
 const sea=BABYLON.MeshBuilder.CreateGround('sea',{width:700,height:300},scene);sea.position.set(0,.12,415);sea.material=M({diffuseColor:C3('#2f7f9f'),specularColor:new BABYLON.Color3(.9,.9,.9),specularPower:60});
 const wall=BABYLON.MeshBuilder.CreateBox('sw',{width:700,height:4,depth:1},scene);wall.position.set(0,2,268);wall.isVisible=false;wall.checkCollisions=true;
 if(typeof palm==='function')for(let x=-120;x<=120;x+=34)palm(x,208+(Math.abs(x)%3)*4);
 lbl('LABADI BEACH',0,6,200,Math.PI,14);
 E.push({n:'Labadi Beach',x:0,z:222});
})();
