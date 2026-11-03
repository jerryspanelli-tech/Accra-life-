/* Accra Life — lightweight first civilian crowd.
 * Spawn gradually to avoid a large first-load memory spike on phones.
 */
(function(){
  "use strict";
  if (window.__accraCivilianCrowdSpawned) return;
  if (!window.ACCRA_PEOPLE || typeof window.ACCRA_PEOPLE.spawn !== "function") {
    console.error("[AccraCrowd] ACCRA_PEOPLE is not ready; civilians were not spawned.");
    return;
  }
  const entries = [
    [ 5.2, 0,  13, "male",   "street"],
    [-5.2, 0,  18, "female", "street"],
    [ 5.2, 0,  29, "female", "ankara"],
    [-5.2, 0,  34, "male",   "kente"],
    [13,   0,   5.2,"male",  "street"],
    [-16,  0,   5.2,"female","street"],
    [ 5.2, 0, -18, "male",   "suit"],
    [-5.2, 0, -25, "female", "suit"]
  ];
  const actors = [];
  let next = 0;
  function spawnNext(){
    if (next >= entries.length) {
      window.__accraCivilianCrowdSpawned = true;
      window.ACCRA_CIVILIAN_CROWD = {
        count: () => actors.filter(a => a && a.root && !a.root.isDisposed()).length,
        dispose: () => actors.forEach(a => a && a.dispose && a.dispose())
      };
      console.log("[AccraCrowd] Spawned", actors.length, "civilian pedestrians gradually.");
      return;
    }
    const [x,y,z,gender,outfit] = entries[next];
    const index = next++;
    try {
      const actor = window.ACCRA_PEOPLE.spawn(null, {
        gender,
        outfit: outfit === "ankara" ? "ankara" : outfit === "suit" ? "suit" : "street",
        kente: outfit === "kente",
        scale: 1,
        hairStyle: index % 3 === 0 ? "afro" : index % 3 === 1 ? "braids" : "fade"
      });
      if (actor && actor.root) {
        actor.root.position.set(x,y,z);
        actor.root.rotation.y = ((index * 47) % 360) * Math.PI / 180;
        actors.push(actor);
      }
    } catch (error) {
      console.warn("[AccraCrowd] Could not spawn civilian", index, error);
    }
    // Spread GLB loading/instantiation across frames instead of doing it all at once.
    window.setTimeout(spawnNext, 900);
  }
  window.__accraCivilianCrowdStarted = true;
  spawnNext();
})();
