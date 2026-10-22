function aircraft(x, z, index = 0) {
  const group = new B.TransformNode("plane_" + index, scene);

  // Fuselage
  const fus = B.MeshBuilder.CreateCylinder("apt_fus", {
    diameter: 3.2, height: 28, tessellation: 12
  }, scene);
  fus.rotation.z = Math.PI / 2;
  fus.position.set(0, 2.5, 0);
  fus.material = makeMat("#f8f8f6");
  fus.parent = group;
  fus.checkCollisions = true;
  if (typeof sg !== "undefined" && sg) sg.addShadowCaster(fus);

  // Nose
  const nose = B.MeshBuilder.CreateCylinder("apt_nose", {
    diameterTop: 0.2, diameterBottom: 3.2, height: 4.5, tessellation: 12
  }, scene);
  nose.rotation.z = Math.PI / 2;
  nose.position.set(15.5, 2.5, 0);
  nose.material = makeMat("#f8f8f6");
  nose.parent = group;

  // Wings
  const wing = safeBox(18, 0.22, 4.8, 0, 2.1, 0, "#1a1a1a", true);
  wing.parent = group;
  const wingL = safeBox(6.5, 0.18, 2.2, -8, 2.3, -9, "#1a1a1a", true);
  wingL.parent = group;
  const wingR = safeBox(6.5, 0.18, 2.2, -8, 2.3, 9, "#1a1a1a", true);
  wingR.parent = group;

  // Engines (we will spin these)
  const engL = safeBox(1.3, 1.3, 4.2, -2, 1.4, -6.2, "#c8ccd0", false);
  engL.parent = group;
  const engR = safeBox(1.3, 1.3, 4.2, -2, 1.4, 6.2, "#c8ccd0", false);
  engR.parent = group;

  // Tail (Ghana red)
  const tail = safeBox(0.35, 5.8, 4.2, -13.5, 5.2, 0, "#CE1126", true);
  tail.parent = group;

  // Horizontal stabilizers (Ghana gold)
  const stab = safeBox(5.5, 0.18, 2.4, -13, 4.1, 0, "#FCD116", true);
  stab.parent = group;

  // Ghana stripes
  const stripe1 = safeBox(18, 0.35, 3.25, 0, 2.9, 0, "#006B3F", false);
  stripe1.parent = group;
  const stripe2 = safeBox(18, 0.18, 3.25, 0, 3.15, 0, "#FCD116", false);
  stripe2.parent = group;

  // Navigation lights
  const lightRed = B.MeshBuilder.CreateSphere("navRed", { diameter: 0.35 }, scene);
  lightRed.position.set(-8, 2.4, -11);
  lightRed.material = makeMat("#ff0000", "#ff0000");
  lightRed.parent = group;

  const lightGreen = B.MeshBuilder.CreateSphere("navGreen", { diameter: 0.35 }, scene);
  lightGreen.position.set(-8, 2.4, 11);
  lightGreen.material = makeMat("#00ff00", "#00ff00");
  lightGreen.parent = group;

  const lightWhite = B.MeshBuilder.CreateSphere("navWhite", { diameter: 0.3 }, scene);
  lightWhite.position.set(16, 2.7, 0);
  lightWhite.material = makeMat("#ffffff", "#ffffff");
  lightWhite.parent = group;

  // Position the whole plane
  group.position.set(X(x), 0, Z(z));

  // Animation data
  group.metadata = {
    engL, engR, lightRed, lightGreen, lightWhite,
    baseY: 0,
    phase: Math.random() * Math.PI * 2
  };

  return group;
}
