/* Accra Life — GTA-style third-person follow camera.
 * Smooth over-the-shoulder chase view, free player-controlled orbit, then a gentle return behind the player.
 * Uses cam, camT, player, car, heading, spd and driving from babylon.html.
 */
(function () {
  "use strict";
  try {
    const canvas = document.getElementById("c");
    const DEFAULT_WALK_DISTANCE = 8.5;
    const DRIVE_MULTIPLIER = 1.38;
    const FOLLOW_SPEED = 5.5;
    const RETURN_DELAY_MS = 2200;
    const LOOK_HEIGHT = 1.15;
    const DEFAULT_BETA = 1.12;
    let walkDistance = DEFAULT_WALK_DISTANCE;
    let lastPointerAt = -Infinity;
    let lastPos = null;
    let measuredSpeed = 0;
    let dragging = false;

    const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
    const wrap = a => {
      while (a > Math.PI) a -= Math.PI * 2;
      while (a < -Math.PI) a += Math.PI * 2;
      return a;
    };
    const markLook = () => { lastPointerAt = performance.now(); };
    canvas.addEventListener("pointerdown", e => {
      dragging = true;
      markLook();
    });
    window.addEventListener("pointerup", () => { dragging = false; });
    window.addEventListener("pointercancel", () => { dragging = false; });
    canvas.addEventListener("pointermove", e => {
      if (dragging || e.buttons) markLook();
    });
    canvas.addEventListener("wheel", markLook, { passive: true });

    // Start behind the player's forward direction, rather than at a side-on simulator angle.
    const initialYaw = player.rotation.y || 0;
    cam.alpha = Math.atan2(-Math.cos(initialYaw), -Math.sin(initialYaw));
    cam.beta = DEFAULT_BETA;
    cam.radius = walkDistance;
    cam.lowerRadiusLimit = 4;
    cam.upperRadiusLimit = 22;
    cam.lowerBetaLimit = 0.55;
    cam.upperBetaLimit = 1.42;
    cam.panningSensibility = 0;
    cam.inertia = 0.82;
    cam.angularSensibility = 850;
    cam.wheelPrecision = 45;
    camT.position.copyFrom(player.position);
    camT.position.y += LOOK_HEIGHT;

    function setDistance(value) {
      walkDistance = clamp(Number(value) || DEFAULT_WALK_DISTANCE, 5, 14);
      cam.upperRadiusLimit = 22;
    }

    scene.onBeforeRenderObservable.add(() => {
      const dt = Math.min(engine.getDeltaTime() / 1000, 0.05);
      const now = performance.now();
      const focus = driving ? car.position : player.position;
      const yaw = driving ? heading : player.rotation.y;
      const targetAlpha = Math.atan2(-Math.cos(yaw), -Math.sin(yaw));
      const targetRadius = driving ? walkDistance * DRIVE_MULTIPLIER : walkDistance;

      if (lastPos) {
        measuredSpeed = Math.hypot(focus.x - lastPos.x, focus.z - lastPos.z) / Math.max(dt, 0.001);
      }
      lastPos = focus.clone();

      // Keep the GTA chase camera orbitable. After the player stops looking, ease behind the character.
      const playerIsLooking = dragging || now - lastPointerAt < RETURN_DELAY_MS;
      const blend = 1 - Math.exp(-FOLLOW_SPEED * dt);
      if (!playerIsLooking && (measuredSpeed > 0.12 || (driving && Math.abs(spd) > 0.12))) {
        cam.alpha += wrap(targetAlpha - cam.alpha) * blend;
      }
      if (!playerIsLooking) {
        cam.beta += (DEFAULT_BETA - cam.beta) * blend;
      }
      cam.radius += (targetRadius - cam.radius) * (1 - Math.exp(-3.2 * dt));
      camT.position.set(focus.x, focus.y + (driving ? 1.15 : LOOK_HEIGHT), focus.z);
    });

    window.ACCRA_CAMERA = {
      style: "gta-third-person",
      walkRadius: walkDistance,
      driveRadius: walkDistance * DRIVE_MULTIPLIER,
      setDistance(value) {
        setDistance(value);
        this.walkRadius = walkDistance;
        this.driveRadius = walkDistance * DRIVE_MULTIPLIER;
      }
    };
    window.ACCRA_MODULES = window.ACCRA_MODULES || {};
    window.ACCRA_MODULES.camera = 2;
    console.log("[Accra Life] GTA third-person camera ready");
  } catch (err) {
    console.error("[Accra Life] GTA camera failed:", err);
  }
})();
