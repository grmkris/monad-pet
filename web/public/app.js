// Monad Pet — client-side demo pet. No backend, no wallet: state lives in localStorage.
(() => {
  const KEY = "monad-pet:v1";
  const DRAIN_PER_SEC = 100 / 90; // a full belly empties in 90 s
  const BLOCK_MS = 400;           // demo block time for "blocks since breakfast" while the chain is unreachable
  const RPC = "https://testnet-rpc.monad.xyz"; // Monad testnet (chain id 10143), read-only: eth_blockNumber
  const HEAD_POLL_MS = 1000;      // how often to ask the chain for its latest block
  const SEGMENTS = 20;
  const INK = "#200052";
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------- The pet (placeholder mascot until the brand kit lands) ----------
  let uid = 0;
  function petSVG() {
    const p = `pet${++uid}`;
    return `
<svg class="pet mood-happy" viewBox="0 0 200 200" role="img" aria-label="Monad Pet">
  <defs>
    <clipPath id="${p}-el"><ellipse cx="74" cy="104" rx="17" ry="20"/></clipPath>
    <clipPath id="${p}-er"><ellipse cx="126" cy="104" rx="17" ry="20"/></clipPath>
  </defs>
  <ellipse cx="100" cy="186" rx="56" ry="8" fill="${INK}" opacity=".14"/>
  <g class="rig">
    <ellipse class="foot" cx="72" cy="174" rx="16" ry="10" stroke="${INK}" stroke-width="5"/>
    <ellipse class="foot" cx="128" cy="174" rx="16" ry="10" stroke="${INK}" stroke-width="5"/>
    <path d="M100 38C99 28 101 20 107 13" fill="none" stroke="${INK}" stroke-width="4.5" stroke-linecap="round"/>
    <path d="M106 14C112 2 128 2 133 8C126 18 112 20 106 14Z" fill="#bff3dc" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
    <path class="body" d="M100 36C152 36 178 80 178 122C178 160 146 178 100 178C54 178 22 160 22 122C22 80 48 36 100 36Z" stroke="${INK}" stroke-width="5"/>
    <ellipse cx="100" cy="148" rx="44" ry="22" fill="#fff" opacity=".2"/>
    <ellipse cx="58" cy="74" rx="13" ry="7" transform="rotate(-38 58 74)" fill="#fff" opacity=".55"/>
    <ellipse cx="48" cy="132" rx="11" ry="6.5" fill="#ff9ec7" opacity=".85"/>
    <ellipse cx="152" cy="132" rx="11" ry="6.5" fill="#ff9ec7" opacity=".85"/>
    <ellipse cx="74" cy="104" rx="17" ry="20" fill="#fff"/>
    <ellipse cx="126" cy="104" rx="17" ry="20" fill="#fff"/>
    <g class="pupils">
      <circle cx="77" cy="107" r="10" fill="${INK}"/><circle cx="129" cy="107" r="10" fill="${INK}"/>
      <circle cx="81" cy="101" r="3.6" fill="#fff"/><circle cx="133" cy="101" r="3.6" fill="#fff"/>
    </g>
    <g clip-path="url(#${p}-el)"><rect class="lid" x="55" y="83" width="38" height="44"/></g>
    <g clip-path="url(#${p}-er)"><rect class="lid" x="107" y="83" width="38" height="44"/></g>
    <ellipse cx="74" cy="104" rx="17" ry="20" fill="none" stroke="${INK}" stroke-width="4.5"/>
    <ellipse cx="126" cy="104" rx="17" ry="20" fill="none" stroke="${INK}" stroke-width="4.5"/>
    <g data-show="starving" fill="none" stroke="${INK}" stroke-width="4.5" stroke-linecap="round">
      <path d="M58 80L86 71"/><path d="M114 71L142 80"/>
    </g>
    <g data-show="happy">
      <path d="M84 130Q100 153 116 130Z" fill="${INK}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <ellipse cx="100" cy="139" rx="7" ry="3.5" fill="#ff8ab8"/>
    </g>
    <path data-show="peckish" d="M86 138Q93 131 100 138T114 138" fill="none" stroke="${INK}" stroke-width="4.5" stroke-linecap="round"/>
    <path data-show="starving" d="M85 147Q100 129 115 147" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>
    <ellipse class="mouth-eat" cx="100" cy="137" rx="11" ry="9" fill="${INK}"/>
    <path data-show="starving" class="sweat" d="M160 72C160 72 152 84 152 89A8 8 0 0 0 168 89C168 84 160 72 160 72Z" fill="#9fd4ff" stroke="${INK}" stroke-width="3"/>
  </g>
</svg>`;
  }

  for (const el of document.querySelectorAll("[data-pet]")) el.innerHTML = petSVG();
  // Every pet on the page is the same pet, except the one saying thanks: it is always happy.
  const pets = [...document.querySelectorAll('[data-pet]:not([data-pet="thanks"]) .pet')];

  // ---------- State ----------
  const now = () => Date.now();
  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(KEY));
      if (s && [s.full, s.at, s.fedAt, s.fed].every(Number.isFinite)) {
        // fedBlock: the Monad block of the last meal; null until the chain has been reached (older saves have none)
        s.fedBlock = Number.isFinite(s.fedBlock) ? s.fedBlock : null;
        return s;
      }
    } catch {}
    return null;
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {}
  }
  let state = load() || { full: 100, at: now(), fedAt: now(), fed: 0, fedBlock: null };
  save();

  const fullness = (t) => Math.max(0, Math.min(100, state.full - ((t - state.at) / 1000) * DRAIN_PER_SEC));
  const moodOf = (f) => (f > 60 ? "happy" : f > 25 ? "peckish" : "starving");

  // ---------- Monad blocks ----------
  // `head` is the latest block number seen on Monad testnet (null until the first answer). "Blocks since
  // breakfast" is head - fedBlock; while the chain is unreachable it falls back to counting BLOCK_MS blocks.
  let head = null;
  async function pollHead() {
    if (document.hidden) return;
    try {
      const res = await fetch(RPC, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_blockNumber", params: [] }),
      });
      const n = parseInt((await res.json()).result, 16);
      if (!Number.isFinite(n)) return;
      head = Math.max(head ?? 0, n); // never tick backwards if one RPC node lags another
      if (state.fedBlock === null) {
        // Fed before the chain answered (or an older save): place the meal at the block it most likely happened in.
        state.fedBlock = Math.max(0, head - Math.floor((now() - state.fedAt) / BLOCK_MS));
        save();
      }
      render();
    } catch {}
  }
  const blocksSince = (t) =>
    head !== null && state.fedBlock !== null
      ? Math.max(0, head - state.fedBlock)
      : Math.max(0, Math.floor((t - state.fedAt) / BLOCK_MS));

  function line(mood, blocks, f) {
    if (mood === "happy") return blocks < 12 ? "Nom. Full belly. Life is good." : `${blocks} blocks since breakfast. Still vibing.`;
    if (mood === "peckish") return `It has been ${blocks} blocks since breakfast…`;
    if (f <= 0) return `${blocks} blocks. No food. Tell my story.`;
    return `Starving. ${blocks} blocks since my last meal!`;
  }

  // ---------- DOM ----------
  const $ = (s) => document.querySelector(s);
  const device = $(".device");
  const meter = $("[data-meter]");
  const pctEl = $("[data-pct]");
  const moodEl = $("[data-mood-label]");
  const blocksEl = $("[data-blocks]");
  const sinceEl = $("[data-since]");
  const fedEl = $("[data-fed]");
  const speechEls = document.querySelectorAll("[data-speech]");
  const announce = $("[data-announce]");
  const screenPet = $(".screen-pet");
  const feedBtn = $("[data-feed]");

  const segs = Array.from({ length: SEGMENTS }, () => {
    const s = document.createElement("span");
    s.className = "seg";
    meter.append(s);
    return s;
  });

  let prev = { mood: null, lit: -1, pct: -1, blocks: -1, live: null, fed: -1, text: "" };
  let override = null; // a short line after feeding: { text, until }

  function render() {
    const t = now();
    const f = fullness(t);
    const mood = moodOf(f);
    const lit = Math.ceil(f / (100 / SEGMENTS));
    const pct = Math.round(f);
    const blocks = blocksSince(t);
    const live = head !== null && state.fedBlock !== null; // counted on Monad, not estimated

    if (mood !== prev.mood) {
      device.dataset.mood = mood;
      moodEl.textContent = mood.toUpperCase();
      for (const p of pets) p.classList.remove("mood-happy", "mood-peckish", "mood-starving"), p.classList.add(`mood-${mood}`);
      if (prev.mood) announce.textContent = `Your pet is ${mood}.`;
    }
    if (lit !== prev.lit) {
      const from = Math.max(prev.lit, 0);
      segs.forEach((s, i) => {
        const on = i < lit;
        if (on === s.classList.contains("on")) return;
        s.style.setProperty("--delay", on ? `${(i - from) * 22}ms` : "0ms");
        s.classList.toggle("on", on);
      });
    }
    if (pct !== prev.pct) {
      pctEl.textContent = `${pct}%`;
      meter.setAttribute("aria-valuenow", String(pct));
      meter.setAttribute("aria-valuetext", `${pct}% full, ${mood}`);
    }
    if (blocks !== prev.blocks || live !== prev.live) {
      blocksEl.textContent = blocks.toLocaleString();
      sinceEl.textContent = `${live ? "" : "~"}${blocks.toLocaleString()}`; // "~" while it is only an estimate
      sinceEl.title = live
        ? `Monad block ${head.toLocaleString()}, fed at block ${state.fedBlock.toLocaleString()}`
        : "Estimated (Monad not reachable yet)";
    }
    if (state.fed !== prev.fed) fedEl.textContent = state.fed.toLocaleString();

    const text = override && override.until > t ? override.text : line(mood, blocks, f);
    if (text !== prev.text) for (const el of speechEls) el.textContent = text;

    prev = { mood, lit, pct, blocks, live, fed: state.fed, text };
  }

  function floatText(text) {
    const el = document.createElement("span");
    el.className = "float-text";
    el.textContent = text;
    screenPet.append(el);
    el.addEventListener("animationend", () => el.remove());
  }

  function chomp() {
    for (const p of pets) {
      p.classList.remove("chomp");
      void p.getBoundingClientRect(); // restart the animation
      p.classList.add("chomp");
    }
    setTimeout(() => pets.forEach((p) => p.classList.remove("chomp")), 560);
  }

  feedBtn.addEventListener("click", () => {
    const t = now();
    const wasFull = fullness(t) >= 95;
    // The meal lands in the latest block we know of; null until the chain answers, then pollHead fills it in.
    state = { full: 100, at: t, fedAt: t, fed: state.fed + 1, fedBlock: head };
    save();

    const coin = document.createElement("span");
    coin.className = "drop-coin";
    coin.textContent = "$";
    screenPet.append(coin);
    coin.addEventListener("animationend", () => coin.remove());

    setTimeout(() => {
      chomp();
      floatText(wasFull ? "stuffed!" : "+1 meal");
    }, reduced ? 0 : 460);

    override = { text: wasFull ? "Stuffed! But thank you. Truly." : "NOM. Oh, that hit the spot.", until: t + 2600 };
    render();
  });

  render();
  setInterval(render, 250);
  pollHead();
  setInterval(pollHead, HEAD_POLL_MS);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) pollHead(); });

  // ---------- Waitlist (client-side only) ----------
  const form = $("[data-waitlist-form]");
  const input = form.elements.email;
  const err = $("[data-wl-error]");
  const formState = $(".wl-form-state");
  const thanks = $("[data-wl-thanks]");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const v = input.value.trim();
    if (!input.checkValidity() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
      input.setAttribute("aria-invalid", "true");
      err.hidden = false;
      input.focus();
      return;
    }
    $("[data-wl-email]").textContent = v;
    formState.hidden = true;
    thanks.hidden = false;
    thanks.classList.add("show");
    thanks.focus();
  });
  input.addEventListener("input", () => {
    if (!input.hasAttribute("aria-invalid")) return;
    input.removeAttribute("aria-invalid");
    err.hidden = true;
  });
})();
