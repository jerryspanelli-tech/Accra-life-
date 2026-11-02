/* Accra Life — first visible civilian pedestrian crowd.
 * This is an explicit spawn layer: model integration alone does not create NPCs.
 * Civilian actors use ACCRA_PEOPLE -> AccraAssets.createCharacter -> realistic GLB,
 * with the existing safe fallback retained if a model cannot load.
 */
(function(){
  "use strict";
  try {
    if (window.__accraCivilianCrowdSpawned) return;
    if (!window.ACCRA_PEOPLE || typeof window.ACCRA_PEOPLE.spawn !== "function") {
      console.error("[AccraCrowd] ACCRA_PEOPLE is not ready; civilian crowd was not spawned.");
      return;
    }
    const sceneRef = scene;
    const entries = [
      // First visible group around the player's starting neighbourhood.
      [ 5.2,  0,  13, "male",   "street"],
      [-5.2,  0,  18, "female", "street"],
      [ 5.2,  0,  29, "female", "ankara"],
      [-5.2,  0,  34, "male",   "kente"],
      [ 13,   0,  5.2,"male",   "street"],
      [-16,   0,  5.2,"female", "street"],
      [ 5.2,  0, -18, "male",   "suit"],
      [-5.2,  0, -25, "female", "suit"],
      // Osu / central streets.
      [-75.2, 0, -38, "female", "ankara"],
      [-64.8, 0, -44, "male",   "street"],
      [-75.2, 0,  22, "male",   "kente"],
      [-64.8, 0,  31, "female", "street"],
      // East Legon / estate streets.
      [ 75.2, 0, -42, "male",   "suit"],
      [ 64.8, 0, -34, "female", "suit"],
      [ 75.2, 0,  34, "female", "ankara"],
      [ 64.8, 0,  42, "male",   "street"],
      // Labadi / outer city streets.
      [-145, 0,  75.2,"female","street"],
      [-155, 0,  64.8,"male",  "kente"],
      [ 145, 0, -75.2,"male",  "street"],
      [ 155, 0, -64.8,"female","ankara"],
      // Additional everyday pedestrians.
      [-75.2, 0,  112, "male",   "street"],
      [-64.8, 0,  120, "female", "street"],
      [ 75.2, 0,  112, "female", "street"],
      [ 64.8, 0,  120, "male",   "suit"]
    ];
    const actors = [];
    entries.forEach((entry, index) => {
      const [x,y,z,gender,outfit] = entry;
      const options = {
        gender,
        outfit: outfit === "ankara" ? "ankara" : outfit === "suit" ? "suit" : "street",
        kente: outfit === "kente",
        scale: 1,
        hairStyle: index % 3 === 0 ? "afro" : index % 3 === 1 ? "braids" : "fade"
      };
      const actor = window.ACCRA_PEOPLE.spawn(null, options);
      if (!actor || !actor.root) return;
      actor.root.position.set(x,y,z);
      actor.root.rotation.y = ((index * 47) % 360) * Math.PI / 180;
      actor.root.getChildMeshes && actor.root.getChildMeshes().forEach(mesh => {
        mesh.checkCollisions = false;
        mesh.isPickable = false;
      });
      actors.push(actor);
    });
    window.__accraCivilianCrowdSpawned = true;
    window.ACCRA_CIVILIAN_CROWD = {
      count: () => actors.filter(actor => actor && actor.root && !actor.root.isDisposed()).length,
      models: () => actors.map(actor => actor._actor && actor._actor.model || "loading/fallback"),
      dispose: () => actors.forEach(actor => actor && actor.dispose && actor.dispose())
    };
    console.log("[AccraCrowd] Spawned civilian pedestrian actors:", actors.length);
  } catch (error) {
    console.error("[AccraCrowd] Civilian crowd spawn failed:", error);
  }
})();
