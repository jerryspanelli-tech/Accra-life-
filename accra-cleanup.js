/* accra-cleanup.js - compatibility stub.
 * The old broad timed cleanup removed any mesh inside landmark rectangles, including the NEW hospital,
 * the rebuilt stadium and new Makola district buildings. Landmark-specific cleanup now runs in
 * accra-remove-old.js and the individual build modules. Do not run a broad delayed deletion pass here. */
(function () {
  window.ACCRA_CLEANUP = { run: () => 0, areas: [] };
  (window.ACCRA_MODULES = window.ACCRA_MODULES || {}).cleanup = 1;
  console.log("Accra broad cleanup disabled; landmark-specific cleanup is active");
})();
