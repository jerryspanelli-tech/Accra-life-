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
 // Kotoka airport is built in accra-airport.js

 // ================= LABADI BEACH AND SEA (south) =================
 const sand=BABYLON.MeshBuilder.CreateGround('sand',{width:300,height:70},scene);sand.position.set(0,.04,222);sand.material=mat('#e3cf9b');sand.receiveShadows=true;
 const sea=BABYLON.MeshBuilder.CreateGround('sea',{width:700,height:300},scene);sea.position.set(0,.12,415);sea.material=M({diffuseColor:C3('#2f7f9f'),specularColor:new BABYLON.Color3(.9,.9,.9),specularPower:60});
 const wall=BABYLON.MeshBuilder.CreateBox('sw',{width:700,height:4,depth:1},scene);wall.position.set(0,2,268);wall.isVisible=false;wall.checkCollisions=true;
 if(typeof palm==='function')for(let x=-120;x<=120;x+=34)palm(x,208+(Math.abs(x)%3)*4);
 lbl('LABADI BEACH',0,6,200,Math.PI,14);
 E.push({n:'Labadi Beach',x:0,z:222});
})();
