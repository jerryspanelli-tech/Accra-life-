/* accra-apartments.js - five apartment tiers from the Accra Life Apartment Agency (Makola).
 * 5 star GH₵25,000+, 4 star GH₵15,000-24,000, 3 star GH₵10,000-14,000, 2 star GH₵6,000-9,000, 1 star GH₵3,000-5,000 a month.
 * You move in by paying a deposit of two months' rent. Rent is taken every game month (10 minutes). If you cannot pay,
 * you get an alert. New players start with no apartment. Works alongside the existing home system. */
(function () {
  try {
    const K = window.ACCRA_KIT;
    if (!K) { console.log("accra-apartments: waiting for the game"); return; }
    const MONTH_MS = 10 * 60 * 1000;
    const TIERS = [
      { stars: 1, name: "1 Star Community Apartment", min: 3000, max: 5000, rent: 3000, beds: "1 bedroom", extras: "Living room, basic kitchen, shared balcony, security by day, parking" },
      { stars: 2, name: "2 Star Sunset Apartment", min: 6000, max: 9000, rent: 6000, beds: "1 bedroom", extras: "Living room, kitchen, balcony, security day and night, parking" },
      { stars: 3, name: "3 Star Riverside Apartment", min: 10000, max: 14000, rent: 10000, beds: "2 bedrooms (1 en suite)", extras: "Living room, kitchen, balcony, shared pool, 24/7 security, parking" },
      { stars: 4, name: "4 Star Ocean View Apartment", min: 15000, max: 24000, rent: 15000, beds: "2 bedrooms (1 en suite)", extras: "Living room, modern kitchen, balcony, shared pool and gym, 24/7 security, parking" },
      { stars: 5, name: "5 Star Accra Skyline Apartment", min: 25000, max: null, rent: 25000, beds: "3 bedrooms (all en suite)", extras: "Spacious living room, island kitchen, private balcony with city view, rooftop pool, gym, 24/7 concierge, private parking and lift" }
    ];
    const stars = n => "\u2605".repeat(n) + "\u2606".repeat(5 - n);
    const price = t => t.max ? "GH\u00A2" + t.min.toLocaleString() + " \u2013 " + t.max.toLocaleString() : "GH\u00A2" + t.min.toLocaleString() + "+";
    const load = () => { try { return JSON.parse(localStorage.getItem("accra-apt")) || null; } catch (e) { return null; } };
    const save = v => { try { localStorage.setItem("accra-apt", JSON.stringify(v)); } catch (e) {} };
    let home = load();                          // { stars, paidUntil } or null (no apartment)

    // ----- rent: taken every game month; an alert if there is not enough cash -----
    function rentCheck() {
      if (!home) return;
      const t = TIERS[home.stars - 1];
      while (Date.now() >= home.paidUntil) {
        if (K.cash() >= t.rent) {
          K.pay(t.rent, t.name + " rent");
          home.paidUntil += MONTH_MS;
        } else {
          if (!home.warned || Date.now() - home.warned > MONTH_MS) {
            home.warned = Date.now();
            if (window.ACCRA_NOTIFY) window.ACCRA_NOTIFY("Rent due for your " + t.name + ": GH\u00A2" + t.rent + ". Pay it soon.", "rent");
            K.note("Rent is due for your apartment: GH\u00A2" + t.rent);
          }
          break;
        }
      }
      save(home);
    }
    setInterval(rentCheck, 15000); rentCheck();

    // ----- the agency menu -----
    const CLOSE = '<button data-x="1" style="' + K.BS + ';text-align:center">Close</button>';
    function menu() {
      const cur = home ? TIERS[home.stars - 1] : null;
      const head = K.ttl("\uD83C\uDFE2 Apartment Agency") + "<small>Cash GH\u00A2" + K.cash().toLocaleString() + ". Deposit = two months' rent when you move in.</small>";
      const curLine = cur
        ? '<div style="margin:6px 0;padding:6px 8px;border-radius:10px;background:rgba(201,165,74,.18)"><b>You live at: ' + cur.name + "</b><br><small>Rent GH\u00A2" + cur.rent.toLocaleString() + " each game month. Next rent in " + Math.max(0, Math.ceil((home.paidUntil - Date.now()) / 60000)) + " min.</small></div>" +
          '<button data-leave="1" style="' + K.BS + '">Give up this apartment</button>'
        : "<small>You do not have an apartment yet.</small>";
      const rows = TIERS.map(t => '<button data-tier="' + t.stars + '" style="' + K.BS + '">' + stars(t.stars) + " " + t.name + "<br><small>" + price(t) + " a month \u00B7 " + t.beds + "</small></button>").join("");
      K.show(head + curLine + rows + CLOSE, d => {
        if (d.x) return K.hide();
        if (d.leave) { if (!home) return K.note("You have no apartment."); home = null; save(null); K.note("You gave up your apartment."); return menu(); }
        if (d.tier) return details(+d.tier);
      });
    }
    function details(n) {
      const t = TIERS[n - 1], deposit = t.rent * 2;
      const body = K.ttl(stars(t.stars) + " " + t.name) + "<small>" + price(t) + " a month</small>" +
        "<div style=\"margin:6px 0;font-size:12px;line-height:1.4\"><b>Bedrooms:</b> " + t.beds + "<br><b>Includes:</b> " + t.extras + "</div>" +
        "<small>Move-in deposit: GH\u00A2" + deposit.toLocaleString() + " (paid now) then GH\u00A2" + t.rent.toLocaleString() + " every game month.</small>";
      K.show(body + '<button data-move="' + n + '" style="' + K.GOLD + '">Move in for GH\u00A2' + deposit.toLocaleString() + "</button>" +
        '<button data-back="1" style="' + K.BS + ';text-align:center">Back</button>' + CLOSE, d => {
        if (d.x) return K.hide();
        if (d.back) return menu();
        if (d.move) {
          if (home) return K.note("You already have an apartment. Give it up first.");
          if (K.cash() < deposit) return K.note("Not enough cash. You need GH\u00A2" + deposit.toLocaleString());
          K.pay(deposit, "Deposit: " + t.name);
          home = { stars: n, paidUntil: Date.now() + MONTH_MS, warned: 0 };
          save(home);
          K.hide();
          K.note("Welcome home to your " + t.name + "!");
          if (window.ACCRA_NOTIFY) window.ACCRA_NOTIFY("You moved into the " + t.name + ". Rent is GH\u00A2" + t.rent + " a month.", "home");
        }
      });
    }

    // the agency sits on the Makola road, in front of the mall entrance
    K.points.push({ x: 35, z: -4, r: 5, t: "\uD83C\uDFE2 Apartment Agency", f: () => menu() });

    window.ACCRA_APARTMENTS = { tiers: TIERS, current: () => home ? home.stars : 0 };
    (window.ACCRA_MODULES = window.ACCRA_MODULES || {}).apartments = 1;
    console.log("Apartment agency ready: 5 tiers");
  } catch (err) { console.error("accra-apartments failed:", err); }
})();
