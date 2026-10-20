/* accra-cloud.js
 * Loading screen + Supabase online connection
 * Shows a loading screen while connecting, then hides it automatically.
 */
(function () {
  try {
    // ========== LOADING SCREEN ==========
    const overlay = document.createElement("div");
    overlay.id = "accra-loading";
    overlay.style.cssText = `
      position: fixed;
      inset: 0;
      background: #0f1114;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      font-family: system-ui, -apple-system, sans-serif;
      color: #f0f0f0;
      transition: opacity 0.6s ease;
    `;

    const title = document.createElement("div");
    title.textContent = "ACCRA LIFE";
    title.style.cssText = `
      font-size: 32px;
      font-weight: 800;
      letter-spacing: 3px;
      color: #c9a54a;
      margin-bottom: 8px;
    `;

    const subtitle = document.createElement("div");
    subtitle.textContent = "Loading the city…";
    subtitle.style.cssText = `
      font-size: 15px;
      opacity: 0.7;
      margin-bottom: 40px;
    `;

    const spinner = document.createElement("div");
    spinner.style.cssText = `
      width: 42px;
      height: 42px;
      border: 4px solid rgba(201, 165, 74, 0.25);
      border-top-color: #c9a54a;
      border-radius: 50%;
      animation: accra-spin 0.9s linear infinite;
      margin-bottom: 28px;
    `;

    const status = document.createElement("div");
    status.id = "accra-load-status";
    status.textContent = "Starting…";
    status.style.cssText = `
      font-size: 13px;
      color: #c9a54a;
      opacity: 0.9;
    `;

    const style = document.createElement("style");
    style.textContent = `
      @keyframes accra-spin {
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);

    overlay.appendChild(title);
    overlay.appendChild(subtitle);
    overlay.appendChild(spinner);
    overlay.appendChild(status);
    document.body.appendChild(overlay);

    const setStatus = (text) => {
      const el = document.getElementById("accra-load-status");
      if (el) el.textContent = text;
    };

    const hideLoading = () => {
      overlay.style.opacity = "0";
      setTimeout(() => overlay.remove(), 650);
    };

    // ========== SUPABASE CLOUD ==========
    const SUPABASE_URL = "https://rojzwrewmwsnzbbfkdr.supabase.co";
    const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvanp3cmV3bXdzbnpiYmZma2RyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIzNDk2MDAsImV4cCI6MjEwNzkyNTYwMH0.UVBUp3HgstVyOcDD2P6qm4DJxr3C7woUjbtXWddS-LE";

    let sb = null;

    function loadLibrary() {
      return new Promise((resolve, reject) => {
        if (window.supabase && window.supabase.createClient) return resolve();
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js";
        script.onload = () => {
          if (window.supabase && window.supabase.createClient) resolve();
          else reject(new Error("Library loaded but empty"));
        };
        script.onerror = () => reject(new Error("Could not download Supabase library"));
        document.head.appendChild(script);
      });
    }

    const ready = (async () => {
      setStatus("Loading library…");
      await loadLibrary();

      setStatus("Connecting to server…");
      sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

      const { data: { session } } = await sb.auth.getSession();

      if (!session) {
        setStatus("Signing in…");
        const { error } = await sb.auth.signInAnonymously();
        if (error) throw new Error("Sign-in failed: " + error.message);
      }

      setStatus("Loading your player…");
      const playerName = localStorage.getItem("accra-name") || "Citizen";
      const { data, error } = await sb.rpc("create_player", { p_name: playerName });

      if (error) throw new Error("Player error: " + error.message);

      const name = data?.name || "player";
      const cash = data?.cash ?? "?";
      setStatus(`Connected • ${name} • GH₵ ${cash}`);

      // Hide loading screen after short delay
      setTimeout(hideLoading, 1200);

      return data;
    })();

    // Public API
    window.ACCRA_CLOUD = {
      ready,
      async pay(txId, amount, reason) {
        try {
          await ready;
          const { data, error } = await sb.rpc("apply_transaction", {
            p_tx: txId,
            p_amount: amount,
            p_reason: reason
          });
          if (error) return { ok: false, reason: error.message };
          return data;
        } catch (e) {
          return { ok: false, reason: e.message || String(e) };
        }
      }
    };

    // If connection fails, still hide the loading screen after a while
    ready.catch(err => {
      setStatus("Connection failed: " + (err.message || err));
      setTimeout(hideLoading, 3000);
    });

    // Safety: force hide after 10 seconds no matter what
    setTimeout(() => {
      if (document.getElementById("accra-loading")) {
        hideLoading();
      }
    }, 10000);

    (window.ACCRA_MODULES = window.ACCRA_MODULES || {}).cloud = 1;

  } catch (err) {
    console.error("accra-cloud failed:", err);
  }
})();
