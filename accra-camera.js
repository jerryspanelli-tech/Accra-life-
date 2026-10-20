/* accra-camera.js - a GTA-style chase camera.
 * The camera sits behind the player or the car, turns to follow the direction of travel, and pulls back a little
 * when driving. A finger drag on the screen takes control for a moment, then the camera returns behind you.
 * It uses the camera (cam), player, car, heading, spd and driving from babylon.html. */
(function () {
  try {
    const WALK_RADIUS = 7.5, DRIVE_RADIUS = 11, BETA = 1.15;
    const TURN = .07, PULL = .08;               // how quickly the camera turns and pulls back
    const DRAG_HOLD_MS = 1500;                  // after a drag, wait this long before the camera returns
    let lastTouch = 0, lastPos = null, speed = 0;

    const canvas = document.getElementById("c");
    const touched = () => { lastTouch = performance.now(); };
    canvas.addEventListener("pointerdown", touched);
    canvas.addEventListener("pointermove", e => { if (e.buttons) touched(); });

    const wrap = a => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };

    scene.onBeforeRenderObservable.add(() => {
      const dt = Math.min(engine.getDeltaTime() / 1000, .05);
      const now = performance.now();

      // how fast the player is moving (used to decide when to turn the camera)
      const pos = driving ? car.position : player.position;
      if (lastPos) speed = Math.hypot(pos.x - lastPos.x, pos.z - lastPos.z) / Math.max(dt, .001);
      lastPos = pos.clone();

      // the direction the character or car is facing
      const yaw = driving ? heading : player.rotation.y;
      const fx = Math.sin(yaw), fz = Math.cos(yaw);

      // the camera sits behind the direction of travel: its offset points back along the facing direction
      const wantAlpha = Math.atan2(-fz, -fx);
      const wantRadius = driving ? DRIVE_RADIUS : WALK_RADIUS;

      // give way to a finger drag for a moment, so the player can look around
      if (now - lastTouch < DRAG_HOLD_MS) { cam.radius += (wantRadius - cam.radius) * PULL * .3; return; }

      // only turn the camera to follow movement, so it does not spin while standing still
      if (speed > .5 || (driving && Math.abs(spd) > .5)) {
        cam.alpha += wrap(wantAlpha - cam.alpha) * TURN;
      }
      cam.beta += (BETA - cam.beta) * TURN;
      cam.radius += (wantRadius - cam.radius) * PULL;
    });

    window.ACCRA_CAMERA = { walkRadius: WALK_RADIUS, driveRadius: DRIVE_RADIUS };
    (window.ACCRA_MODULES = window.ACCRA_MODULES || {}).camera = 1;
    console.log("Chase camera ready");
  } catch (err) { console.error("accra-camera failed:", err); }
})();
