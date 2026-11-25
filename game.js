const $ = id => document.getElementById(id);
let K = 1;
const wrap = $("wrap");
const C = $("c"), X = C.getContext("2d");
const GY = 370, LW = 3300, EX = 620, SUP = ["", "", "²", "³", "⁴", "⁵"], FONT = "Trebuchet MS,sans-serif";
let S = "login", cam = 0, tt = 0, paused = false, idle = Date.now(), flash = 0, lastB = 100, WI = 0, sitT = 0, titleT = 0, introOn = false, sitB = null, shopFrom = "title", shopVis = false, invuln = 0, candE = null;

/* ---------- local profiles & save ---------- */
const DB_KEY = "monicaHop_profiles";
let db = {};
try { db = JSON.parse(localStorage.getItem(DB_KEY)) || {}; } catch (e) {}
let activeUser = "", pendingUser = "", save = {};

function saveDB() {
  try { localStorage.setItem(DB_KEY, JSON.stringify(db)); } catch (e) {}
}

function store() {
  if (!activeUser) return;
  db[activeUser.toLowerCase()] = save;
  saveDB();
  updateProfileUI();
}

function updateProfileUI() {
  if (!activeUser) { $("profBadge").hidden = true; return; }
  $("profBadge").hidden = false;
  $("profName").textContent = save.displayName || activeUser;
  $("profCoins").textContent = "● " + (save.coins || 0) + " coins";
}

function hasProgress() {
  return !!(save.started || save.bx != null || (save.w && save.w > 0) || (save.coins && save.coins > 0));
}

function updateTitleButtons() {
  const prog = hasProgress();
  $("new").hidden = prog;
  $("cont").hidden = !prog;
}

function loginSuccess(key, data) {
  activeUser = key;
  save = data;
  P.coins = save.coins || 0;
  store();
  applyDevice(false);
  $("loginBox").hidden = true;
  $("title").hidden = false;
  updateTitleButtons();
  S = "title";
  idle = Date.now();
}

function checkName() {
  const raw = $("nameIn").value.trim();
  if (!raw) { $("loginMsg").textContent = "Please type a name first."; return; }
  const key = raw.toLowerCase();
  if (db[key]) {
    SFX.heal();
    loginSuccess(key, db[key]);
  } else {
    pendingUser = raw;
    $("loginMsg").textContent = "Your name \"" + raw + "\" was not found on local save. Want to create or start with this account name?";
    $("loginStep1").hidden = true;
    $("loginStep2").hidden = false;
  }
}

$("loginGo").onclick = checkName;
$("nameIn").addEventListener("keydown", e => {
  if (e.key == "Enter") {
    e.preventDefault();
    if (!$("loginStep2").hidden) $("createAcc").click();
    else checkName();
  }
});
$("createAcc").onclick = () => {
  const raw = pendingUser || $("nameIn").value.trim();
  if (!raw) return;
  const key = raw.toLowerCase();
  SFX.coin();
  loginSuccess(key, { displayName: raw, coins: 0, own: ["c0", "b0"], cloak: "c0", skin: "b0" });
};
$("cancelAcc").onclick = () => {
  pendingUser = "";
  $("loginMsg").textContent = "";
  $("loginStep1").hidden = false;
  $("loginStep2").hidden = true;
  $("nameIn").focus();
};
$("exitAcc").onclick = () => {
  if (B && B.tm) clearTimeout(B.tm);
  B = null; Q = []; after = null; introOn = false; candE = null; setPause(false);
  $("dlg").hidden = true; $("battle").hidden = true; $("shop").hidden = true; $("end").hidden = true; $("shopS").hidden = true; $("askFight").hidden = true; $("title").hidden = true;
  activeUser = ""; pendingUser = ""; save = {};
  updateProfileUI();
  applyDevice(false);
  $("nameIn").value = "";
  $("loginMsg").textContent = "";
  $("loginStep1").hidden = false;
  $("loginStep2").hidden = true;
  $("loginBox").hidden = false;
  S = "login"; cam = 0;
  setTimeout(() => $("nameIn").focus(), 30);
};

const P = { max: 3, hp: 3, coins: 0, w: 28, h: 40, air: 0, jp: 0 }, keys = { left: 0, right: 0, jump: 0 };
let fx = [], ice = [], plats = [], coins = [], enemies = [], benches = [], trig = [], parts = [], B = null, Q = [], after = null, seen = new Set();
const pick = a => a[Math.floor(Math.random() * a.length)], rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const FF = Array.from({ length: 34 }, (_, i) => ({ x: (i * 97) % 800, y: 60 + (i * 53) % 300, p: i }));

const CK = {
  c0: { n: "Starlight Cloak", p: 0, c: "#5b3aa8", t: "#ffd27a", sc: "#c9a7ff", sp: "star", d: "Purple star bolts." },
  c1: { n: "Ember Cloak", p: 40, c: "#c4381f", t: "#ffb04d", sc: "#ff8a2a", sp: "fire", d: "Fire spells. Leaves glowing lava dust and embers when you walk, and fire bombs when you fly." },
  c2: { n: "Frost Cloak", p: 60, c: "#3d8fd6", t: "#e6f6ff", sc: "#9fe7ff", sp: "ice", d: "Ice spells. Freezes the ground you walk on and leaves glittering ice mist when you fly." },
  c3: { n: "Cloud Cloak", p: 90, c: "#e8f1ff", t: "#9fc4ff", sc: "#dff0ff", sp: "wind", ab: "float", d: "Hold Jump in the air to float. Wind spells." },
  c4: { n: "Wing Cloak", p: 140, c: "#ffe9a8", t: "#ffffff", sc: "#fff6b0", sp: "light", ab: "wings", d: "Grows wings: flap twice in the air. Light spells." }
};
const BK = {
  b0: { n: "Classic Spellbook", p: 0, c: "#e0577b" },
  b1: { n: "Golden Tome", p: 30, c: "#e8b923" },
  b2: { n: "Galaxy Tome", p: 50, c: "#4b2aa8" },
  b3: { n: "Rainbow Tome", p: 70, c: "rainbow" }
};
const cur = () => CK[save.cloak] || CK.c0;

const NM = { lady: "Grumpy Ladybug", rock: "Pebble Punk", mush: "Bouncy Mushroom", bee: "Buzzbee" };
const TA = {
  lady: "You shall not pass! Answer my question, bunny!",
  rock: "Rumble rumble! Solve it or get crushed!",
  mush: "Boing! Answer before I devour you!",
  bee: "Bzzzz! Too slow, bunny!"
};
const W = [
  {
    n: "Enchanted Forest", sky: ["#cdeedd", "#f6d9ee"], hill: ["#a9dcc0", "#8ccfae"], tr: "#6fb98f", gr: "#7ccf86", gd: "#5aa874", pb: "#8a5e3a", gl: "#ff9ad5", dark: 0, deco: "mush", top: "c", pool: ["lady", "rock"], mt: [0, 0],
    out: "The Beetle Guardian is calm again. A portal opens to the Sky Ruins.", in: [],
    boss: { n: "Forest Beetle Guardian", k: "beetle", t: 2, hp: 5, ey: -52, ec: "#fff27a", taunt: "Nobody crosses my forest alive!", win: [["Monica", "I beat a beetle with calculus. Add that to my résumé."]] }
  },
  {
    n: "Sky Ruins", sky: ["#7fb8ff", "#fbe3d0"], hill: ["#cfd9f2", "#b6c3e6"], tr: "#a9b5d6", gr: "#c6c2d9", gd: "#9a96b8", pb: "#8e89a8", gl: "#9fe7ff", dark: .12, deco: "crystal", top: "p", pool: ["rock", "bee"], mt: [0, 1],
    out: "The Golem crumbles into pebbles. The next portal hums.", in: [["Spellbook", "Sky Ruins. Mind the drop."], ["Monica", "Why does everything float here?"]],
    boss: { n: "Cloudstone Golem", k: "golem", t: 2, hp: 5, ey: -150, ec: "#ff3a3a", taunt: "Stone does not forget. Answer me!", win: [["Monica", "Rocks again. Why is it always rocks?"]] }
  },
  {
    n: "Dreamy Meadows", sky: ["#ffc9e6", "#cdb8ff"], hill: ["#f0b6e8", "#d6a3f0"], tr: "#e48fd0", gr: "#b7e27c", gd: "#8fc45a", pb: "#c9894f", gl: "#ffe27a", dark: .1, deco: "flower", top: "c", pool: ["bee", "mush"], mt: [1, 1],
    out: "The Bloom wilts into petals. Beyond it, the lake glows.", in: [["Spellbook", "Dreamy Meadows. Pretty flowers, ugly teeth."], ["Monica", "So pretty. So suspicious."]],
    boss: { n: "Grumpy Bloom", k: "bloom", t: 3, hp: 6, ey: -140, ec: "#fff", taunt: "I woke up hungry. Solve it or be lunch!", win: [["Monica", "We have a lot in common, flower. Rude."]] }
  },
  {
    n: "Moonlit Lake", sky: ["#0d1745", "#2a3d8f"], hill: ["#1d2f73", "#162456"], tr: "#10205a", gr: "#2a5fa0", gd: "#1a3a70", pb: "#32508f", gl: "#7de3ff", dark: .55, deco: "lily", top: "p", pool: ["mush", "rock"], mt: [1, 1],
    out: "The Spirit sinks into the water. One last portal remains.", in: [["Spellbook", "Moonlit Lake. Something old lives in the water."], ["Monica", "It’s dark. I don’t love dark."]],
    boss: { n: "Moonwater Spirit", k: "spirit", t: 4, hp: 7, ey: -95, ec: "#7de3ff", taunt: "The chain runs deep, little bunny.", win: [["Spellbook", "Chain rule mastered."], ["Monica", "I felt that one in my soul."]] }
  },
  {
    n: "Forgotten Library", sky: ["#170c2e", "#3b1f5e"], hill: ["#2a1748", "#1f1038"], tr: "#241243", gr: "#4b3566", gd: "#35244d", pb: "#5a3d78", gl: "#ffd27a", dark: .65, deco: "book", top: "p", pool: ["bee", "rock", "mush", "lady"], mt: [1, 1],
    out: "", in: [["Spellbook", "The Forgotten Library. The lost magic is here."], ["Monica", "Please don’t let there be a quiz."], ["Spellbook", "There is always a quiz."]],
    boss: { n: "Ancient Owl Scholar", k: "owl", t: 5, hp: 8, ey: -132, ec: "#ff9a1a", taunt: "Show me everything you have learned.", win: [] }
  }
];
const HINT = [
  "Bring the power down, then subtract one. Type powers like x^2.",
  "Bring the power down, then subtract one. Type powers like x^2.",
  "Differentiate each term. The derivative of a constant is 0.",
  "Chain rule: n(inner)^(n−1) times the derivative of the inner part.",
  "Mix it all: add up the derivative of each part.",
  "Product rule: first′ × second + first × second′. Or the chain rule with an x² inside."
];
const TRIG = [
  { x: 0, lines: [["Monica", "Ugh… where am I?"], ["Spellbook", "The Enchanted Forest. Move with A and D or the arrow keys. Jump with Space."], ["Monica", "Try moving! Unless you plan to stay here forever."]] },
  { x: 680, lines: [["Spellbook", "Your magic runs on derivatives. The derivative of a constant is zero."], ["Monica", "So y = 10000 gives y′ = 0? I could’ve done that in my sleep."], ["Spellbook", "Powers: y = x² gives y′ = 2x. Bring the power down, then subtract one."]] },
  { x: 2450, lines: [["Spellbook", "A bench lies ahead, the only one in this world. Press E to sit: it heals you, saves your progress and opens the shop."], ["Monica", "Finally. A chair. My kingdom needs more chairs."], ["Spellbook", "A guardian waits beyond it. Its questions are much harder than the little monsters’."]], last: 1 }
];

/* ---------- sound ---------- */
let AC = null, mg = null, mute = false, mi = 0;
function sfxInit() {
  if (!AC) {
    try {
      AC = new (window.AudioContext || window.webkitAudioContext)();
      mg = AC.createGain();
      mg.gain.value = .4;
      mg.connect(AC.destination);
      mstep();
    } catch (e) { AC = null; }
  }
  if (AC && AC.state == "suspended") AC.resume();
}
function tone(f, d, type, v, when, f2) {
  if (!AC || mute) return;
  const t = AC.currentTime + (when || 0), o = AC.createOscillator(), g = AC.createGain();
  o.type = type || "sine";
  o.frequency.setValueAtTime(f, t);
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
  g.gain.setValueAtTime(v || .2, t);
  g.gain.exponentialRampToValueAtTime(.001, t + d);
  o.connect(g); g.connect(mg); o.start(t); o.stop(t + d + .05);
}
function hiss(d, v) {
  if (!AC || mute) return;
  const n = Math.floor(AC.sampleRate * d), b = AC.createBuffer(1, n, AC.sampleRate), a = b.getChannelData(0);
  for (let i = 0; i < n; i++) a[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const s = AC.createBufferSource(), g = AC.createGain();
  g.gain.value = v; s.buffer = b; s.connect(g); g.connect(mg); s.start();
}
const SFX = {
  jump: () => tone(280, .16, "square", .1, 0, 720),
  coin: () => { tone(988, .07, "square", .1); tone(1319, .14, "square", .1, .07); },
  bad: () => { tone(160, .35, "sawtooth", .2, 0, 60); hiss(.15, .15); },
  cast: () => { tone(300, .4, "sawtooth", .1, 0, 1400); tone(600, .4, "triangle", .1, 0, 2000); },
  hit: () => { hiss(.2, .3); tone(120, .25, "sine", .3, 0, 40); },
  win: () => { hiss(.35, .3); tone(90, .5, "sine", .35, 0, 30); [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, .3, "triangle", .22, .2 + i * .1)); },
  heal: () => [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, .5, "sine", .2, i * .12)),
  die: () => [392, 330, 262, 196].forEach((f, i) => tone(f, .3, "triangle", .25, i * .18)),
  blip: () => tone(660 + Math.random() * 120, .05, "square", .06),
  alert: () => { tone(110, .3, "sawtooth", .2, 0, 70); tone(220, .18, "sawtooth", .15, .2); },
  portal: () => { hiss(.8, .12); tone(200, .9, "sine", .25, 0, 1200); },
  boom: () => { hiss(.12, .12); tone(90, .2, "sine", .18, 0, 40); }
};
const MU = [
  [60, [0, 2, 4, 7, 9], 330, "triangle"],
  [62, [0, 2, 4, 6, 7, 9], 300, "sine"],
  [65, [0, 2, 4, 7, 9], 280, "triangle"],
  [57, [0, 3, 5, 7, 10], 400, "sine"],
  [55, [0, 2, 3, 5, 7, 8, 11], 370, "sine"]
];
const mtof = m => 440 * 2 ** ((m - 69) / 12);
function mstep() {
  let m = MU[WI], boss = S == "battle" && B && B.e.boss;
  if (S == "title" || S == "login" || introOn || S == "shop") m = MU[3];
  let [r, sc, tm, ty] = m;
  if (boss) { r -= 12; sc = [0, 3, 5, 6, 7, 10]; tm = 210; ty = "sawtooth"; }
  if (!mute && AC && AC.state == "running") {
    const i = mi++;
    if (i % 4 == 0) tone(mtof(r - 12 + sc[(i >> 2) % sc.length]), tm / 250, boss ? "square" : "sine", boss ? .1 : .16);
    if (boss || Math.random() < .6) tone(mtof(r + sc[Math.floor(Math.random() * sc.length)] + (Math.random() < .3 ? 12 : 0)), boss ? .18 : .55, ty, boss ? .06 : .09);
    if (boss && i % 2 == 0) tone(60, .12, "sine", .2, 0, 35);
  }
  setTimeout(mstep, tm);
}

/* ---------- world ---------- */
function setPause(v) {
  paused = v;
  $("pauseOv").hidden = !paused;
  if (paused) keys.left = keys.right = keys.jump = 0;
}
function goMenu() {
  if (B && B.tm) clearTimeout(B.tm);
  B = null; Q = []; after = null; introOn = false; candE = null; setPause(false);
  save.coins = P.coins; store();
  $("dlg").hidden = true; $("battle").hidden = true; $("shop").hidden = true; $("end").hidden = true; $("shopS").hidden = true; $("askFight").hidden = true;
  $("title").hidden = false;
  updateTitleButtons();
  S = "title"; cam = 0; idle = Date.now();
}
function load(wi, fs) {
  WI = wi; const w = W[wi]; P.x = fs && save.bx != null ? save.bx : 280; P.y = GY - 40; P.vx = P.vy = 0; P.on = false; P.face = 1; lastB = P.x; invuln = 0; candE = null;
  plats = [600, 1100, 1600, 2050, 2420].map(x => ({ x: x + rnd(-60, 60), y: rnd(255, 300), w: rnd(115, 170) }));
  benches = [{ x: 2760 }];
  coins = []; for (let i = 0; i < 32; i++) if (Math.random() < .75) coins.push({ x: 250 + i * 92 + rnd(-10, 10), y: GY - 26 - (Math.random() < .25 ? 65 : 0) });
  plats.forEach(p => { for (let k = 0; k < 3; k++) coins.push({ x: p.x + 20 + k * 35, y: p.y - 24 }); });
  const n = rnd(2, 3), xs = [900, 1650, 2300].slice(0, n).map(x => x + rnd(-80, 120));
  enemies = xs.map(x => { const k = pick(w.pool); return { x, k, t: rnd(w.mt[0], w.mt[1]), q: 3, n: NM[k], taunt: TA[k], ph: Math.random() * 6, skip: false }; });
  enemies.push({ x: 3000, boss: 1, q: w.boss.hp, ph: 0, skip: false, ...w.boss });
  const cont = fs && save.bx != null;
  enemies.forEach(e => e.dead = e.boss ? !!(fs && save.bd) : !!cont);
  trig = (wi == 0 ? TRIG : [{ x: 0, lines: w.in }]).map(t => ({ ...t, done: (wi == 0 && !!save.tut) || (fs && t.x < P.x) }));
  cam = Math.max(0, Math.min(LW - 800, P.x - 300)); parts = []; fx = []; ice = []; titleT = fs ? 0 : 180;
}
function begin(fs) {
  P.hp = P.max = 3; P.coins = save.coins || 0; seen.clear(); $("title").hidden = true; S = "play"; setPause(false); keys.left = keys.right = keys.jump = 0;
  save.started = true;
  if (!fs) save.w = 0;
  store();
  load(fs ? save.w || 0 : 0, fs);
}
$("new").onclick = () => {
  save = { displayName: save.displayName, tut: save.tut, own: save.own, cloak: save.cloak, skin: save.skin, coins: save.coins, dev: save.dev, started: true, w: 0 };
  store(); $("title").hidden = true; introOn = true;
  say([
    ["Spellbook", "Long ago, one Heart Crystal kept the magic of every world alive."],
    ["Spellbook", "Now it is fading. Five guardians have awakened, and the lights are going out."],
    ["Monica", "Ugh. And I suppose that’s my problem?"],
    ["Spellbook", "Your magic runs on mathematics, Monica. You are the only one who can fix it."],
    ["Monica", "I hate that sentence."]
  ], () => { introOn = false; begin(false); });
};
$("cont").onclick = () => begin(true);
$("shopT").onclick = () => { P.coins = save.coins || 0; openShop("title"); };
$("shopS").onclick = () => openShop("sit");
$("again").onclick = () => { $("end").hidden = true; goMenu(); };
$("resumeBtn").onclick = () => setPause(false);
$("menuBtn").onclick = goMenu;

function promptFight(e) {
  candE = e;
  S = "ask";
  keys.left = keys.right = keys.jump = 0;
  $("askTitle").textContent = e.n;
  const msgEl = $("askFight").querySelector("p");
  if (e.boss) {
    msgEl.textContent = WI < 4
      ? "Fight Boss and Defeat to go to Chapter " + (WI + 2) + "?"
      : "Fight Final Boss and Defeat to restore the magic?";
    $("fightYes").textContent = "Yes, Fight Boss!";
    $("fightNo").textContent = "Not Yet";
  } else {
    msgEl.textContent = "Fight monster to earn knowledge and more coins at the same time?";
    $("fightYes").textContent = "Yes, Fight!";
    $("fightNo").textContent = "No, Keep Farming";
  }
  $("askFight").hidden = false;
  SFX.blip();
}
$("fightYes").onclick = () => {
  $("askFight").hidden = true;
  const e = candE; candE = null;
  if (e) startBattle(e); else S = "play";
};
$("fightNo").onclick = () => {
  $("askFight").hidden = true;
  if (candE) {
    candE.skip = true;
    if (candE.boss) P.x = Math.min(P.x, candE.x - 105);
  }
  candE = null;
  S = "play";
};

function say(lines, cb) { Q = lines.slice(); after = cb || null; S = "dlg"; keys.left = keys.right = keys.jump = 0; next(); }
function next() {
  if (!Q.length) { $("dlg").hidden = true; S = "play"; if (after) { const a = after; after = null; a(); } return; }
  const l = Q.shift(); SFX.blip(); $("dlg").hidden = false; $("who").textContent = l[0]; $("txt").textContent = l[1];
}
$("dlg").onclick = next;

/* ---------- shop ---------- */
function openShop(from) { shopFrom = from; S = "shop"; $("title").hidden = true; $("shop").hidden = false; renderShop(); }
function closeShop() { $("shop").hidden = true; if (shopFrom == "title") { S = "title"; $("title").hidden = false; updateTitleButtons(); } else S = "sit"; }
function renderShop(msg) {
  const own = save.own || ["c0", "b0"];
  let h = '<h3 style="margin:0 0 4px">Shop</h3><div>● ' + P.coins + ' coins</div>';
  const rows = (T, eq, lab) => {
    h += '<h4 style="margin:10px 0 4px">' + lab + '</h4>';
    for (const id in T) {
      const i = T[id], o = own.includes(id);
      h += '<div class="row"><span><b>' + i.n + '</b>' + (i.d ? '<br><small>' + i.d + '</small>' : '') + '</span><button data-id="' + id + '">' + (eq == id ? 'Equipped' : o ? 'Equip' : i.p + ' coins') + '</button></div>';
    }
  };
  rows(CK, save.cloak || "c0", "Cloaks");
  rows(BK, save.skin || "b0", "Spellbook skins");
  h += '<p>' + (msg || '') + '</p><button id="sclose">Close</button>';
  $("shop").innerHTML = h;
  $("shop").querySelectorAll("[data-id]").forEach(b => b.onclick = () => buy(b.dataset.id));
  $("sclose").onclick = closeShop;
}
function buy(id) {
  const T = id[0] == "c" ? CK : BK, i = T[id]; save.own = save.own || ["c0", "b0"];
  if (!save.own.includes(id)) {
    if (P.coins < i.p) { SFX.bad(); renderShop("Not enough coins."); return; }
    P.coins -= i.p; save.own.push(id); SFX.heal();
  }
  if (id[0] == "c") save.cloak = id; else save.skin = id;
  save.coins = P.coins; store(); renderShop();
}

/* ---------- math ---------- */
const term = (a, n) => (a == 1 ? "" : a) + "x" + SUP[n];
function gen0(t) {
  if (t == 0) {
    const r = Math.random();
    if (r < .4) { const c = rnd(2, 99999); return { d: "y = " + c, f: () => 0 }; }
    if (r < .7) { const a = rnd(2, 15); return { d: "y = " + a + "x", f: () => a }; }
    const a = rnd(1, 9); return { d: "y = " + term(a, 2), f: x => 2 * a * x };
  }
  if (t == 1) { const a = rnd(1, 9), n = rnd(2, 5); return { d: "y = " + term(a, n), f: x => a * n * x ** (n - 1) }; }
  if (t == 2) { const a = rnd(1, 6), n = rnd(2, 4), b = rnd(2, 9), c = rnd(2, 50), k = Math.random() < .5; return { d: "y = " + term(a, n) + " + " + b + "x" + (k ? " + " + c : ""), f: x => a * n * x ** (n - 1) + b }; }
  if (t == 3) { const m = rnd(2, 5), c = rnd(1, 9), k = rnd(2, 4), a = Math.random() < .5 ? rnd(2, 5) : 1; return { d: "y = " + (a > 1 ? a : "") + "(" + m + "x + " + c + ")" + SUP[k], f: x => a * k * m * (m * x + c) ** (k - 1) }; }
  if (t == 4) { const p = gen0(2), q = gen0(3); return { d: p.d + " + " + q.d.slice(4), f: x => p.f(x) + q.f(x) }; }
  const r = Math.random();
  if (r < .34) { const a = rnd(1, 5), b = rnd(1, 9), c = rnd(2, 6), d = rnd(1, 9); return { d: "y = (" + a + "x + " + b + ")(" + c + "x + " + d + ")", f: x => a * (c * x + d) + c * (a * x + b) }; }
  if (r < .68) { const m = rnd(1, 3), c = rnd(1, 9), k = rnd(2, 3); return { d: "y = (" + (m > 1 ? m : "") + "x² + " + c + ")" + SUP[k], f: x => k * 2 * m * x * (m * x * x + c) ** (k - 1) }; }
  const p = gen0(2), q = gen0(3); return { d: p.d + " + " + q.d.slice(4), f: x => p.f(x) + q.f(x) };
}
function gen(t) { let q; for (let i = 0; i < 30; i++) { q = gen0(t); if (!seen.has(q.d)) break; } seen.add(q.d); return q; }
function ok(s, f) {
  s = s.toLowerCase().replace(/\s+/g, "").replace(/^(y′|y'|dy\/dx|f′\(x\)|f'\(x\))=/, "").replace(/²/g, "^2").replace(/³/g, "^3").replace(/⁴/g, "^4").replace(/⁵/g, "^5");
  if (!s || !/^[0-9x+\-*\/^().]+$/.test(s)) return false;
  s = s.replace(/(\d|\))(x|\()/g, "$1*$2").replace(/\^/g, "**");
  try { const g = new Function("x", "return " + s); return [-2, .5, 1, 3].every(v => Math.abs(g(v) - f(v)) < 1e-6 * Math.max(1, Math.abs(f(v)))); } catch (e) { return false; }
}
function ask(keep) {
  B.q = gen(B.e.t); $("bq").textContent = B.q.d; $("ans").value = "";
  if (!keep) $("bmsg").textContent = "";
  clearTimeout(B.tm); B.tm = setTimeout(() => { $("bmsg").textContent = "Monica: “Are you solving it or writing a whole research paper?”"; }, 25000);
  setTimeout(() => $("ans").focus(), 30);
}
function startBattle(e) {
  S = "battle"; keys.left = keys.right = keys.jump = 0; B = { e, left: e.q, strikes: 3, age: 0, lunge: 0, cast: null }; parts = []; SFX.alert();
  $("battle").hidden = false; $("btaunt").textContent = e.n + ": “" + e.taunt + "”"; $("bhint").textContent = HINT[e.t]; ask();
}
function submit() {
  if (S != "battle" || B.cast) return;
  if (ok($("ans").value, B.q.f)) {
    clearTimeout(B.tm); B.cast = { t: 0, fin: B.left <= 1 }; SFX.cast();
    const m = pick(["HA! See? I knew you could do it!", "Easy. Take that!", "Magic never fails me!"]); $("bmsg").textContent = "Monica: “" + m + "”";
  } else {
    B.strikes--; flash = 14; B.lunge = 22; SFX.bad();
    if (B.strikes <= 0) { clearTimeout(B.tm); loseFight(); return; }
    const m = pick(["Oh. Well… that was embarrassing.", "Ouch! Try again!", "Hey! Focus!"]);
    $("bmsg").textContent = "Monica: “" + m + "” (" + B.strikes + " tries left)";
    $("ans").select();
  }
}
function loseFight() {
  $("battle").hidden = true;
  P.hp--;
  invuln = 120;
  if (P.hp <= 0) { die(); return; }
  SFX.bad();
  say([["Monica", "Ow! That hurt… I lost a heart, but I'm not giving up!"], ["Spellbook", "You have " + P.hp + " heart" + (P.hp == 1 ? "" : "s") + " left. Keep moving!"]]);
}
function winFight() {
  const e = B.e; e.dead = true; P.coins += e.boss ? 25 : 15; save.coins = P.coins; store(); $("battle").hidden = true;
  say(e.win && e.win.length ? e.win : [["Monica", e.k == "lady" ? "I just defeated a bug with a math problem. I need a vacation." : pick(["Easy.", "That’s one less monster.", "Next!"])]]);
}
function die() {
  SFX.die();
  say([["Monica", "I’m out of hearts… I need a break."], ["Spellbook", "Returning you to your last bench, or the start. Sit on a bench to heal."]], () => {
    P.x = lastB; P.y = GY - 40; P.vy = 0; P.hp = P.max; invuln = 0; cam = Math.max(0, Math.min(LW - 800, P.x - 300));
  });
}
$("go").onclick = submit;
$("ans").addEventListener("keydown", e => { if (e.key == "Enter") { e.preventDefault(); submit(); } });
["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "x", "^", "(", ")", "+", "-", "⌫"].forEach(t => {
  const b = document.createElement("button"); b.textContent = t; b.type = "button";
  b.onpointerdown = e => { e.preventDefault(); const a = $("ans"); a.value = t == "⌫" ? a.value.slice(0, -1) : a.value + t; };
  $("qk").appendChild(b);
});

/* ---------- input ---------- */
const KM = { ArrowLeft: "left", a: "left", A: "left", ArrowRight: "right", d: "right", D: "right", " ": "jump" };
addEventListener("keydown", e => {
  idle = Date.now(); sfxInit(); if (S == "battle" || S == "ask" || S == "login") return;
  if (S == "shop") { if (e.key == "Escape") closeShop(); return; }
  if (e.key == "Escape" && (S == "play" || S == "sit")) { setPause(!paused); return; }
  if (paused) return;
  if (S == "dlg") { if (["Enter", " ", "e", "E"].includes(e.key)) { e.preventDefault(); next(); } return; }
  if (S == "sit") { if ((e.key == "s" || e.key == "S") && sitT >= 50) { openShop("sit"); return; } if (e.key == "e" || e.key == "E" || KM[e.key]) { e.preventDefault(); stand(); } return; }
  if (e.key == "m" || e.key == "M") { mute = !mute; return; }
  if (KM[e.key]) { keys[KM[e.key]] = 1; e.preventDefault(); }
  if (e.key == "e" || e.key == "E") act();
});
addEventListener("keyup", e => { if (KM[e.key]) keys[KM[e.key]] = 0; });
addEventListener("pointerdown", () => { idle = Date.now(); sfxInit(); });
document.querySelectorAll("#touch [data-k]").forEach(b => {
  const k = b.dataset.k;
  b.addEventListener("pointerdown", e => {
    e.preventDefault();
    if (k == "mute") { mute = !mute; b.textContent = mute ? "🔇" : "🔊"; return; }
    if (k == "pause") { if (S == "play" || S == "sit") setPause(!paused); return; }
    if (paused || S == "shop" || S == "battle" || S == "ask" || S == "login") return;
    if (S == "dlg") { next(); return; }
    if (S == "sit") { stand(); return; }
    if (k == "act") act(); else keys[k] = 1;
  });
  ["pointerup", "pointerleave", "pointercancel"].forEach(ev => b.addEventListener(ev, () => { if (keys[k] !== undefined) keys[k] = 0; }));
});
function act() {
  if (S != "play" || paused) return;
  for (const b of benches) if (Math.abs(P.x + 14 - b.x - 26) < 60) {
    S = "sit"; sitB = b; P.x = b.x + 12; P.y = GY - 40; P.vx = 0; P.face = 1; sitT = 0; lastB = b.x; keys.left = keys.right = keys.jump = 0; return;
  }
}
function stand() { S = "play"; }

/* ---------- update ---------- */
function burst(x, y, c) { for (let i = 0; i < 18; i++) parts.push({ x, y, vx: (Math.random() - .5) * 7, vy: -Math.random() * 6, life: 45, c }); }
function finish() {
  delete save.bx; delete save.bd; delete save.w; delete save.started; save.tut = 1; save.coins = P.coins; store();
  say([
    ["Spellbook", "The Heart Crystal blazes with light. The magic is restored."],
    ["Monica", "So… am I officially a great wizard now?"],
    ["Spellbook", "You have demonstrated considerable mathematical skill."],
    ["Monica", "I’ll take that as a yes."],
    ["Monica", "Can we go home now? I’m hungry."]
  ], () => {
    S = "end";
    $("endtxt").textContent = "You defeated all five guardians and kept " + P.coins + " coins. Spend them in the shop and play again: every world is different each time.";
    $("end").hidden = false;
  });
}
function spellPos(t, ex) { const p = Math.max(0, Math.min(1, (t - 6) / 22)); return { x: 205 + (ex - 45 - 205) * p, y: GY - 100 - Math.sin(p * Math.PI) * 45 }; }
function bt() {
  B.age++; if (B.lunge > 0) B.lunge--;
  const c = B.cast; if (!c) return; c.t++;
  if (c.t >= 6 && c.t < 28) { const p = spellPos(c.t, EX); parts.push({ x: p.x, y: p.y, vx: -1 + Math.random() * 2, vy: Math.random() * 2 - 1, life: 22, c: cur().sc }); }
  if (c.t == 28) { B.left--; B.e.shake = 16; (c.fin ? SFX.win : SFX.hit)(); burst(EX - 40, GY - 95, cur().sc); burst(EX - 40, GY - 95, "#fff"); }
  if (c.t >= (c.fin ? 80 : 50)) { B.cast = null; if (c.fin) winFight(); else ask(1); }
}
function update() {
  if (paused) return;
  if (invuln > 0) invuln--;
  for (const p of parts) { p.x += p.vx; p.y += p.vy; p.vy += .25; p.life--; }
  parts = parts.filter(p => p.life > 0); if (flash > 0) flash--;
  for (const f of fx) { f.x += f.vx || 0; f.y += f.vy || 0; f.vy = (f.vy || 0) + (f.g || 0); f.r += f.gr || 0; f.life--; }
  fx = fx.filter(f => f.life > 0); for (const q of ice) q.life--; ice = ice.filter(q => q.life > 0);
  for (const e of enemies) if (e.shake > 0) e.shake--;
  if (S == "battle" && B) { bt(); return; }
  if (S == "sit") {
    sitT++;
    if (sitT == 50) {
      SFX.heal(); P.hp = P.max; save.w = WI; save.bx = lastB; save.coins = P.coins; save.bd = enemies[enemies.length - 1].dead; store();
      burst(P.x + 14, GY - 60, "#ff9ad5"); burst(P.x + 14, GY - 60, "#9ff0c0");
    }
    return;
  }
  if (S != "play") return;
  const dir = keys.right - keys.left, ab = cur().ab;
  P.vx = dir * 4.8; if (dir) P.face = dir;
  if (keys.jump && P.on) { P.vy = -12.5; P.on = false; SFX.jump(); }
  else if (keys.jump && !P.jp && !P.on && ab == "wings" && P.air > 0) { P.vy = -10.8; P.air--; SFX.jump(); burst(P.x + 14, P.y + 30, "#fff6b0"); }
  P.jp = keys.jump;
  if (ab == "float" && keys.jump && !P.on && P.vy > 1) P.vy = 1;
  P.vy += .65; P.x += P.vx; P.y += P.vy;
  P.x = Math.max(10, Math.min(LW - 40, P.x)); P.on = false;
  if (P.y + P.h >= GY) { P.y = GY - P.h; P.vy = 0; P.on = true; }
  for (const p of plats) if (P.vy >= 0 && P.x + P.w > p.x && P.x < p.x + p.w && P.y + P.h >= p.y && P.y + P.h - P.vy <= p.y + 4) { P.y = p.y - P.h; P.vy = 0; P.on = true; }
  if (P.on) P.air = 2;
  emitFx();
  for (const c of coins) if (!c.got && Math.abs(P.x + 14 - c.x) < 22 && Math.abs(P.y + 20 - c.y) < 30) { c.got = true; P.coins++; save.coins = P.coins; store(); SFX.coin(); }
  for (const t of trig) if (!t.done && P.x >= t.x) { t.done = true; if (!t.lines.length) continue; say(t.lines, () => { if (t.last) { save.tut = 1; store(); } }); return; }
  for (const e of enemies) {
    if (e.dead) continue;
    const dist = Math.abs(P.x - e.x);
    if (e.skip && dist > 120) e.skip = false;
    if (!e.skip && invuln <= 0 && dist < (e.boss ? 85 : 55) && (e.boss || P.y + P.h > GY - 70)) {
      promptFight(e);
      return;
    }
  }
  if (P.x > 3170) {
    if (enemies[enemies.length - 1].dead) {
      SFX.portal();
      if (WI < 4) say([["Spellbook", W[WI].out], ["Monica", "Another portal. I just wanted a nap."]], () => { save.w = WI + 1; delete save.bx; delete save.bd; save.coins = P.coins; store(); load(WI + 1, false); });
      else finish();
      return;
    }
    P.x = 3170;
  }
  cam += (Math.max(0, Math.min(LW - 800, P.x - 320)) - cam) * .16;
}

/* ---------- drawing ---------- */
function glow(c, b) { X.shadowColor = c; X.shadowBlur = b * K; }
function monica(x, y, f, o) {
  o = o || {};
  const ck = cur(), ab = ck.ab, sit = o.sit;
  const mv = S == "play" && P.on && Math.abs(P.vx) > .1;
  const air = S == "play" && !P.on;
  const bob = mv ? Math.abs(Math.sin(tt / 4)) * 2.5 : Math.sin(tt / 22) * .8;
  const st = mv ? Math.sin(tt / 4) * 5 : 0;
  const earW = Math.sin(tt / 18) * .1 + (mv ? Math.sin(tt / 4) * .08 : 0);
  const s = o.s || 1, c = o.cast || 0;

  const fur = "#ffffff", furShade = "#efe9fa", out = "#3c2b5e", earIn = "#ffbedd";

  X.save();
  if (invuln > 0 && Math.floor(invuln / 6) % 2) X.globalAlpha = .45;
  X.translate(x + 14, y + 40);
  X.scale(f * s, s);
  X.lineJoin = "round";
  X.lineCap = "round";

  if (ab == "wings") {
    glow("#fff6b0", 14);
    X.fillStyle = "rgba(255,248,215,.95)";
    X.strokeStyle = "#e6c86e";
    X.lineWidth = 1.2;
    const fl = Math.sin(tt / (air ? 3 : 14)) * (air ? .55 : .14);
    for (const [r, len] of [[-.85, 22], [-.35, 16]]) {
      X.save();
      X.translate(-5, -22 - bob);
      X.rotate(r + fl);
      X.beginPath();
      X.ellipse(-len * .75, 0, len, 6.5, 0, 0, 7);
      X.fill();
      X.stroke();
      X.restore();
    }
    X.shadowBlur = 0;
  }

  if (ab == "float" && air && keys.jump) {
    glow("#fff", 12);
    X.fillStyle = "rgba(255,255,255,.9)";
    for (let i = 0; i < 3; i++) {
      X.beginPath();
      X.arc(-11 + i * 11, 6 + Math.sin(tt / 6 + i) * 2, 7.5, 0, 7);
      X.fill();
    }
    X.shadowBlur = 0;
  }

  const sway = sit ? 2 : (mv ? 9 + Math.sin(tt / 4) * 3 : 4) + (air ? (P.vy > 0 ? 12 : 6) : 0);
  const lift = air ? (P.vy > 0 ? -Math.min(12, P.vy * 1.8) : 3) : 0;
  glow(ck.c, 8);
  X.fillStyle = ck.c;
  X.strokeStyle = out;
  X.lineWidth = 1.5;
  X.beginPath();
  X.moveTo(-2, -23 - bob);
  X.quadraticCurveTo(-10 - sway * .5, -14 - bob, -13 - sway, -3 + lift);
  X.quadraticCurveTo(-7 - sway * .5, 1 + lift, -2, -4 - bob);
  X.closePath();
  X.fill();
  X.stroke();

  glow("#e6d8ff", 10);
  X.fillStyle = fur;
  X.strokeStyle = out;
  X.lineWidth = 1.5;
  X.beginPath();
  X.arc(-11, -9 - bob * .5, 4.8, 0, 7);
  X.fill();
  X.stroke();
  X.shadowBlur = 0;

  X.fillStyle = fur;
  X.strokeStyle = out;
  X.lineWidth = 1.5;
  X.beginPath();
  X.ellipse(-8, -14 - bob + (mv ? Math.sin(tt / 4) * 2 : 0), 3.6, 5.5, .35, 0, 7);
  X.fill();
  X.stroke();

  if (sit) {
    const sw = Math.sin(tt / 12) * 2.5;
    X.strokeStyle = out;
    X.lineWidth = 5.5;
    X.beginPath();
    X.moveTo(-4, -3); X.lineTo(-4 + sw, 9);
    X.moveTo(6, -3); X.lineTo(6 - sw, 9);
    X.stroke();
    X.strokeStyle = fur;
    X.lineWidth = 3;
    X.beginPath();
    X.moveTo(-4, -3); X.lineTo(-4 + sw, 9);
    X.moveTo(6, -3); X.lineTo(6 - sw, 9);
    X.stroke();
    for (const bx of [-3 + sw, 7 - sw]) {
      X.fillStyle = "#5c3b78";
      X.strokeStyle = out;
      X.lineWidth = 1.4;
      X.beginPath();
      X.ellipse(bx, 11.5, 5.2, 3.2, 0, 0, 7);
      X.fill();
      X.stroke();
    }
  } else {
    for (const [lx, off] of [[-4 + st, 0], [5 - st, 1]]) {
      const ly = air ? (off ? -3 : -1) : -1.5;
      X.fillStyle = "#5c3b78";
      X.strokeStyle = out;
      X.lineWidth = 1.5;
      X.beginPath();
      X.ellipse(lx, ly, 5.4, 3.4, 0, 0, 7);
      X.fill();
      X.stroke();
      X.fillStyle = ck.t;
      X.fillRect(lx - 3, ly - 2.6, 6, 1.4);
    }
  }

  const hemY = -3 - bob * .5 + (air ? -1.5 : 0);
  glow(ck.c, 6);
  X.fillStyle = ck.c;
  X.strokeStyle = out;
  X.lineWidth = 1.6;
  X.beginPath();
  X.moveTo(-7, -22 - bob);
  X.lineTo(8, -22 - bob);
  X.lineTo(11, hemY);
  X.quadraticCurveTo(5.5, hemY + 3, 0, hemY);
  X.quadraticCurveTo(-5.5, hemY + 3, -10, hemY);
  X.closePath();
  X.fill();
  X.stroke();

  X.strokeStyle = ck.t;
  X.lineWidth = 1.6;
  X.beginPath();
  X.moveTo(-9.5, hemY - 1.5);
  X.quadraticCurveTo(-5.5, hemY + 1.5, 0, hemY - 1.5);
  X.quadraticCurveTo(5.5, hemY + 1.5, 10.5, hemY - 1.5);
  X.stroke();

  X.fillStyle = ck.c;
  X.strokeStyle = out;
  X.lineWidth = 1.5;
  X.beginPath();
  X.moveTo(-9, -22 - bob);
  X.quadraticCurveTo(0, -16 - bob, 10, -21 - bob);
  X.lineTo(8, -24.5 - bob);
  X.lineTo(-7, -24.5 - bob);
  X.closePath();
  X.fill();
  X.stroke();

  glow("#ffd84d", 8);
  X.fillStyle = "#ffd84d";
  X.strokeStyle = out;
  X.lineWidth = 1.1;
  X.beginPath();
  X.arc(4, -21 - bob, 2.5, 0, 7);
  X.fill();
  X.stroke();
  X.shadowBlur = 0;

  const hx = 7 + c * 13 + (1 - c) * 2;
  const hyy = -15 - bob - c * 11 + (1 - c) * 3;
  X.fillStyle = fur;
  X.strokeStyle = out;
  X.lineWidth = 1.5;
  X.beginPath();
  X.ellipse(hx, hyy, 4.2, 3.4, c ? -.4 : .3, 0, 7);
  X.fill();
  X.stroke();

  if (c > 0) {
    glow(ck.sc, 22);
    X.fillStyle = ck.sc;
    X.beginPath();
    X.arc(hx + 5, hyy - 3, 3 + c * 5, 0, 7);
    X.fill();
    X.shadowBlur = 0;
  }

  [[-3.5, -.16, .92], [5.5, .14, 1]].forEach(([ex, r, sc]) => {
    X.save();
    X.translate(ex, -38 - bob);
    X.rotate(r + earW);
    X.scale(sc, sc);
    X.fillStyle = fur;
    X.strokeStyle = out;
    X.lineWidth = 1.6;
    X.beginPath();
    X.moveTo(-4.2, 1);
    X.bezierCurveTo(-5.5, -9, -4, -22, 0, -24);
    X.bezierCurveTo(4, -22, 5.5, -9, 4.2, 1);
    X.closePath();
    X.fill();
    X.stroke();
    X.fillStyle = earIn;
    X.beginPath();
    X.moveTo(-2, -1);
    X.bezierCurveTo(-2.6, -8, -1.8, -17, 0, -18.5);
    X.bezierCurveTo(1.8, -17, 2.6, -8, 2, -1);
    X.closePath();
    X.fill();
    X.restore();
  });

  glow("#e6d8ff", 12);
  X.fillStyle = fur;
  X.strokeStyle = out;
  X.lineWidth = 1.6;
  X.beginPath();
  X.ellipse(1.5, -32.5 - bob, 12.5, 10.5, 0, 0, 7);
  X.fill();
  X.stroke();
  X.shadowBlur = 0;

  X.fillStyle = furShade;
  X.beginPath();
  X.ellipse(1, -25.5 - bob, 9.5, 3.2, 0, 0, Math.PI);
  X.fill();

  X.fillStyle = "rgba(255, 130, 175, .55)";
  X.beginPath();
  X.ellipse(9.5, -29 - bob, 2.6, 1.5, 0, 0, 7);
  X.ellipse(-3.5, -29 - bob, 2.2, 1.3, 0, 0, 7);
  X.fill();

  for (const [ex, rx, ry] of [[7.5, 2.5, 3.3], [-1, 2.1, 3.1]]) {
    const ey = -32.5 - bob;
    X.fillStyle = "#2b4c9b";
    X.beginPath();
    X.ellipse(ex, ey, rx, ry, 0, 0, 7);
    X.fill();
    X.fillStyle = "#5aa9ff";
    X.beginPath();
    X.ellipse(ex, ey + 1.1, rx * .75, ry * .45, 0, 0, 7);
    X.fill();
    X.strokeStyle = out;
    X.lineWidth = 1.5;
    X.beginPath();
    X.arc(ex, ey, rx + .3, Math.PI * 1.1, Math.PI * 1.9);
    X.stroke();
    X.fillStyle = "#ffffff";
    X.beginPath();
    X.arc(ex + .8, ey - 1.2, 1.15, 0, 7);
    X.arc(ex - .6, ey + .9, .6, 0, 7);
    X.fill();
  }

  X.fillStyle = "#ff7eb6";
  X.beginPath();
  X.ellipse(4.2, -29.2 - bob, 1.5, 1, 0, 0, 7);
  X.fill();

  X.strokeStyle = out;
  X.lineWidth = 1.2;
  X.beginPath();
  X.moveTo(2.4, -27.4 - bob);
  X.quadraticCurveTo(3.3, -26.2 - bob, 4.2, -27.4 - bob);
  X.quadraticCurveTo(5.1, -26.2 - bob, 6, -27.4 - bob);
  X.stroke();

  X.restore();
  X.shadowBlur = 0;
}
function book(x, y) {
  const b = Math.sin(tt / 20) * 4, k = BK[save.skin] || BK.b0; glow("#ffd27a", 12);
  X.fillStyle = k.c == "rainbow" ? "hsl(" + (tt * 3 % 360) + ",85%,60%)" : k.c; X.fillRect(x, y + b, 18, 13);
  X.fillStyle = "#fff"; X.fillRect(x + 2, y + b + 2, 14, 2);
  if (k.c == "#4b2aa8") { X.fillStyle = "#fff"; X.fillRect(x + 12, y + b + 7, 2, 2); X.fillRect(x + 4, y + b + 9, 2, 2); }
  X.shadowBlur = 0;
}
function bench(x, front, s) {
  s = s == null ? WI : s;
  const c = [["#8a5a2b", "#4aa85a"], ["#b8b4cf", "#9fe7ff"], ["#fff0f5", "#ff9ad5"], ["#4a6a8f", "#7de3ff"], ["#6b2a8a", "#ffd27a"]][s];
  if (!front) {
    if (s == 0) {
      X.fillStyle = "#5c3b1a"; X.fillRect(x + 4, GY - 46, 44, 7); X.fillStyle = c[1];
      for (let i = 0; i < 5; i++) { X.beginPath(); X.arc(x + 8 + i * 9, GY - 47, 5, Math.PI, 0); X.fill(); }
      X.fillStyle = "#8a5a2b"; X.fillRect(x + 3, GY - 19, 6, 19); X.fillRect(x + 43, GY - 19, 6, 19);
    } else if (s == 1) {
      X.fillStyle = c[0]; X.fillRect(x - 2, GY - 18, 10, 18); X.fillRect(x + 44, GY - 18, 10, 18);
      glow(c[1], 18); X.fillStyle = c[1]; X.beginPath(); X.moveTo(x + 26, GY - 72 + Math.sin(tt / 20) * 4); X.lineTo(x + 34, GY - 56); X.lineTo(x + 26, GY - 40); X.lineTo(x + 18, GY - 56); X.fill(); X.shadowBlur = 0;
    } else if (s == 2) {
      X.strokeStyle = "#c98fa8"; X.lineWidth = 3; X.beginPath(); X.moveTo(x + 2, GY - 26); X.lineTo(x + 2, GY - 70); X.moveTo(x + 50, GY - 26); X.lineTo(x + 50, GY - 70); X.moveTo(x + 2, GY - 70); X.lineTo(x + 50, GY - 70); X.stroke();
      glow(c[1], 8); X.fillStyle = c[1]; for (let i = 0; i < 7; i++) { X.beginPath(); X.arc(x + 2 + i * 8, GY - 70 + Math.sin(i) * 4, 4, 0, 7); X.fill(); }
      X.shadowBlur = 0; X.fillStyle = c[0]; X.fillRect(x + 3, GY - 19, 5, 19); X.fillRect(x + 44, GY - 19, 5, 19);
    } else if (s == 3) {
      X.fillStyle = "#2a3d5f"; X.fillRect(x + 50, GY - 70, 3, 70); X.fillRect(x + 44, GY - 70, 10, 3);
      glow(c[1], 22); X.fillStyle = c[1]; X.beginPath(); X.ellipse(x + 49, GY - 60 + Math.sin(tt / 15) * 2, 5, 7, 0, 0, 7); X.fill();
      X.beginPath(); X.ellipse(x + 14, GY - 3, 16, 4, 0, 0, 7); X.fill(); X.shadowBlur = 0;
      X.fillStyle = c[0]; X.fillRect(x + 4, GY - 19, 6, 19); X.fillRect(x + 42, GY - 19, 6, 19);
    } else {
      X.fillStyle = c[0]; X.fillRect(x - 2, GY - 52, 56, 30); X.fillStyle = c[1]; X.fillRect(x - 2, GY - 52, 56, 3);
      X.fillStyle = "#3a1850"; X.fillRect(x - 4, GY - 30, 8, 30); X.fillRect(x + 48, GY - 30, 8, 30);
      glow("#ffb347", 16); X.fillStyle = "#ffd27a"; X.fillRect(x + 60, GY - 22, 6, 22);
      X.fillStyle = "#ff9a1a"; X.beginPath(); X.ellipse(x + 63, GY - 28 + Math.sin(tt / 5), 3, 6, 0, 0, 7); X.fill(); X.shadowBlur = 0;
    }
  }
  X.fillStyle = c[0]; X.fillRect(x, GY - 26, 52, 8); X.fillStyle = c[1]; X.fillRect(x, GY - 26, 52, 2);
}

/* ---------- monsters & bosses ---------- */
function eyes(x, y, c, r, sz) {
  sz = sz || 3.8;
  glow(c, 14);
  X.fillStyle = c;
  X.beginPath();
  X.arc(x - r, y, sz, 0, 7);
  X.arc(x + r, y, sz, 0, 7);
  X.fill();
  X.fillStyle = "#ffffff";
  X.beginPath();
  X.arc(x - r - sz * .28, y - sz * .28, sz * .32, 0, 7);
  X.arc(x + r - sz * .28, y - sz * .28, sz * .32, 0, 7);
  X.fill();
  X.shadowBlur = 0;
}

function teeth(x, y, w, n, h) {
  h = h || 8;
  X.fillStyle = "#fff";
  X.strokeStyle = "#2b1630";
  X.lineWidth = 1;
  for (let i = 0; i < n; i++) {
    const a = x - w / 2 + i * w / n;
    X.beginPath();
    X.moveTo(a, y);
    X.lineTo(a + w / n / 2, y + h);
    X.lineTo(a + w / n, y);
    X.closePath();
    X.fill();
    X.stroke();
  }
}

function enemy(e) {
  const b = Math.sin(tt / 11 + e.ph) * 3, k = e.k;
  X.save();
  X.lineJoin = "round";
  X.lineCap = "round";

  if (k == "lady") {
    const walk = Math.sin(tt / 6 + e.ph) * 2.5;
    // Little scuttling legs
    X.strokeStyle = "#1c1024";
    X.lineWidth = 3;
    for (const [lx, off] of [[-16, walk], [-3, -walk], [10, walk]]) {
      X.beginPath();
      X.moveTo(lx, -10 + b);
      X.lineTo(lx - 3, -1 + off * .4);
      X.stroke();
    }
    // Shell
    glow("#ff3b5c", 14);
    X.fillStyle = "#c91834";
    X.strokeStyle = "#2a0a18";
    X.lineWidth = 2;
    X.beginPath();
    X.ellipse(-2, -16 + b, 25, 19, 0, Math.PI, 0);
    X.closePath();
    X.fill();
    X.stroke();
    X.shadowBlur = 0;

    // Glossy shell highlight
    X.fillStyle = "rgba(255, 180, 200, .32)";
    X.beginPath();
    X.ellipse(-7, -26 + b, 11, 4.5, -.25, 0, 7);
    X.fill();

    // Dark spots & dorsal spikes
    X.fillStyle = "#220c1a";
    for (const [sx, sy, sr] of [[-14, -21, 3.6], [-2, -26, 4.2], [9, -20, 3.4]]) {
      X.beginPath();
      X.arc(sx, sy + b, sr, 0, 7);
      X.fill();
    }
    for (let i = -1; i <= 1; i++) {
      X.beginPath();
      X.moveTo(i * 10 - 5, -33 + b);
      X.lineTo(i * 10, -43 + b);
      X.lineTo(i * 10 + 5, -33 + b);
      X.closePath();
      X.fill();
    }

    // Head & curled antennae
    X.fillStyle = "#24142e";
    X.strokeStyle = "#120818";
    X.lineWidth = 1.8;
    X.beginPath();
    X.arc(21, -12 + b, 10.5, 0, 7);
    X.fill();
    X.stroke();

    X.strokeStyle = "#24142e";
    X.lineWidth = 2;
    X.beginPath();
    X.moveTo(19, -22 + b);
    X.quadraticCurveTo(16, -32 + b, 22, -33 + b);
    X.moveTo(24, -21 + b);
    X.quadraticCurveTo(26, -31 + b, 31, -30 + b);
    X.stroke();
    X.fillStyle = "#ff4f79";
    X.beginPath();
    X.arc(22, -33 + b, 2.2, 0, 7);
    X.arc(31, -30 + b, 2.2, 0, 7);
    X.fill();

    // Eyes, grumpy brow & fangs
    eyes(22, -14 + b, "#ffe047", 3.6, 3.2);
    X.strokeStyle = "#ff4f79";
    X.lineWidth = 2;
    X.beginPath();
    X.moveTo(16, -18 + b); X.lineTo(22, -16 + b);
    X.moveTo(28, -18 + b); X.lineTo(22, -16 + b);
    X.stroke();
    teeth(22, -8 + b, 11, 3, 6);

  } else if (k == "rock") {
    const slam = Math.sin(tt / 10 + e.ph) * 2.5;
    // Heavy stone torso
    glow("#ff6a1a", 14);
    X.fillStyle = "#4b435c";
    X.strokeStyle = "#1e1929";
    X.lineWidth = 2.2;
    X.beginPath();
    X.moveTo(-24, 0);
    X.lineTo(-28, -24 + b * .4);
    X.lineTo(-14, -46 + b * .5);
    X.lineTo(4, -41 + b * .5);
    X.lineTo(22, -48 + b * .5);
    X.lineTo(29, -18 + b * .4);
    X.lineTo(22, 0);
    X.closePath();
    X.fill();
    X.stroke();
    X.shadowBlur = 0;

    // Highlight facet
    X.fillStyle = "#685e7d";
    X.beginPath();
    X.moveTo(-14, -44 + b * .5);
    X.lineTo(3, -39 + b * .5);
    X.lineTo(-4, -26 + b * .4);
    X.lineTo(-22, -24 + b * .4);
    X.closePath();
    X.fill();

    // Glowing lava cracks
    glow("#ff7b29", 10);
    X.strokeStyle = "#ff8c24";
    X.lineWidth = 2.2;
    X.beginPath();
    X.moveTo(-12, -5); X.lineTo(-4, -20 + b * .4); X.lineTo(7, -14 + b * .4); X.lineTo(14, -29 + b * .4);
    X.stroke();
    X.shadowBlur = 0;

    // Floating chunky fists
    for (const [fx, fy] of [[-31, -13 + slam], [32, -13 - slam]]) {
      X.fillStyle = "#3a3347";
      X.strokeStyle = "#1e1929";
      X.lineWidth = 1.8;
      X.beginPath();
      X.roundRect(fx - 7, fy - 7, 14, 14, 4);
      X.fill();
      X.stroke();
    }

    // Angry brow, eyes & jagged mouth
    eyes(1, -29 + b * .4, "#ff4a2a", 8.5, 3.8);
    X.fillStyle = "#2b2536";
    X.beginPath();
    X.moveTo(-13, -36 + b * .4); X.lineTo(1, -31 + b * .4); X.lineTo(15, -36 + b * .4); X.lineTo(14, -32 + b * .4); X.lineTo(1, -28 + b * .4); X.lineTo(-12, -32 + b * .4);
    X.closePath();
    X.fill();
    teeth(1, -18 + b * .4, 20, 4, 7);

  } else if (k == "bee") {
    const y = -50 + b * 2.2;
    const flap = Math.sin(tt * 1.1 + e.ph) * 4;
    // Fluttering wings
    X.fillStyle = "rgba(225, 242, 255, .75)";
    X.strokeStyle = "#8cb8de";
    X.lineWidth = 1.4;
    X.beginPath();
    X.ellipse(-7, y - 15, 13, 6 + Math.abs(flap) * .5, -.45, 0, 7);
    X.ellipse(7, y - 15, 13, 6 + Math.abs(flap) * .5, .45, 0, 7);
    X.fill();
    X.stroke();

    // Sharp stinger
    X.fillStyle = "#2b1d38";
    X.beginPath();
    X.moveTo(-18, y - 3);
    X.lineTo(-35, y + 2);
    X.lineTo(-18, y + 6);
    X.closePath();
    X.fill();

    // Plump striped body
    glow("#ffcf33", 12);
    X.fillStyle = "#ffd438";
    X.strokeStyle = "#2b1d38";
    X.lineWidth = 2;
    X.beginPath();
    X.ellipse(0, y, 20, 14, 0, 0, 7);
    X.fill();
    X.stroke();
    X.shadowBlur = 0;

    // Dark stripes (clipped inside body)
    X.save();
    X.beginPath();
    X.ellipse(0, y, 19, 13, 0, 0, 7);
    X.clip();
    X.fillStyle = "#261833";
    X.fillRect(-13, y - 15, 5.5, 30);
    X.fillRect(-2, y - 15, 5.5, 30);
    X.restore();

    // Dangling feet
    X.strokeStyle = "#261833";
    X.lineWidth = 2;
    X.beginPath();
    X.moveTo(-4, y + 13); X.lineTo(-6, y + 20 + b * .4);
    X.moveTo(4, y + 13); X.lineTo(2, y + 20 - b * .4);
    X.stroke();

    // Antennae, eyes & grin
    X.beginPath();
    X.moveTo(10, y - 12); X.quadraticCurveTo(14, y - 22, 19, y - 20);
    X.moveTo(14, y - 11); X.quadraticCurveTo(19, y - 20, 23, y - 17);
    X.stroke();

    eyes(12, y - 3, "#ff3b5c", 3.4, 3.2);
    X.strokeStyle = "#261833";
    X.lineWidth = 2;
    X.beginPath();
    X.moveTo(7, y - 8); X.lineTo(13, y - 5);
    X.moveTo(18, y - 7); X.lineTo(13, y - 5);
    X.stroke();
    teeth(12, y + 3, 10, 3, 5);

  } else {
    // Bouncy Mushroom with squash & stretch
    const hop = Math.max(0, Math.sin(tt / 9 + e.ph));
    const j = hop * 14;
    const sqX = hop > .1 ? .92 : 1.07;
    const sqY = hop > .1 ? 1.08 : .93;

    X.save();
    X.translate(0, -j);
    X.scale(sqX, sqY);

    // Chubby stem
    X.fillStyle = "#f2e6d8";
    X.strokeStyle = "#2d163b";
    X.lineWidth = 2;
    X.beginPath();
    X.roundRect(-12, -30, 24, 30, [4, 4, 8, 8]);
    X.fill();
    X.stroke();

    // Cute stubby arms
    X.beginPath();
    X.ellipse(-14, -14, 4, 3, -.4, 0, 7);
    X.ellipse(14, -14, 4, 3, .4, 0, 7);
    X.fill();
    X.stroke();

    // Spotted poison cap
    glow("#b84dff", 16);
    X.fillStyle = "#69229c";
    X.strokeStyle = "#2d163b";
    X.lineWidth = 2.2;
    X.beginPath();
    X.ellipse(0, -28, 29, 21, 0, Math.PI, 0);
    X.quadraticCurveTo(0, -22, -29, -28);
    X.closePath();
    X.fill();
    X.stroke();
    X.shadowBlur = 0;

    // Glowing neon spots
    glow("#7aff8a", 8);
    X.fillStyle = "#7aff8a";
    for (const [sx, sy, sr] of [[-14, -37, 4.5], [2, -42, 5.2], [16, -35, 4]]) {
      X.beginPath();
      X.arc(sx, sy, sr, 0, 7);
      X.fill();
    }
    X.shadowBlur = 0;

    // Goofy eyes & chomping mouth
    eyes(0, -19, "#6dff7a", 6.5, 3.6);
    X.fillStyle = "#220b30";
    X.beginPath();
    X.roundRect(-9, -12, 18, 7, 3);
    X.fill();
    teeth(0, -12, 16, 4, 5);
    X.restore();
  }
  X.restore();
  X.shadowBlur = 0;
}

function bossDraw(e) {
  const k = e.k, pulse = Math.sin(tt / 14);
  X.save();
  X.lineJoin = "round";
  X.lineCap = "round";

  if (k == "beetle") {
    // Segmented armored legs
    X.strokeStyle = "#112b1d";
    X.lineWidth = 6;
    for (const [lx, dx] of [[-52, -16], [-28, -10], [28, 10], [52, 16]]) {
      const step = Math.sin(tt / 10 + lx) * 4;
      X.beginPath();
      X.moveTo(lx, -38);
      X.lineTo(lx + dx, -18 + step);
      X.lineTo(lx + dx * .7, 0);
      X.stroke();
    }

    // Serrated dorsal horns
    X.fillStyle = "#0e291b";
    X.strokeStyle = "#07170e";
    X.lineWidth = 2;
    for (let i = -3; i <= 3; i++) {
      const h = 142 - Math.abs(i) * 11;
      X.beginPath();
      X.moveTo(i * 19 - 9, -96 + Math.abs(i) * 7);
      X.lineTo(i * 19, -h);
      X.lineTo(i * 19 + 9, -96 + Math.abs(i) * 7);
      X.closePath();
      X.fill();
      X.stroke();
    }

    // Giant emerald carapace
    glow("#45e685", 20);
    X.fillStyle = "#1b5436";
    X.strokeStyle = "#081c11";
    X.lineWidth = 3;
    X.beginPath();
    X.ellipse(0, -60, 80, 62, 0, Math.PI, 0);
    X.lineTo(80, -38);
    X.quadraticCurveTo(0, -28, -80, -38);
    X.closePath();
    X.fill();
    X.stroke();
    X.shadowBlur = 0;

    // Shell highlight & gold center seam
    X.fillStyle = "#28754c";
    X.beginPath();
    X.ellipse(-26, -84, 32, 14, -.35, 0, 7);
    X.fill();

    X.strokeStyle = "#ffd84d";
    X.lineWidth = 3;
    X.beginPath();
    X.moveTo(0, -122);
    X.lineTo(0, -34);
    X.stroke();

    // Giant ivory pincers
    const pinch = Math.sin(tt / 12) * 4;
    X.fillStyle = "#f5edd6";
    X.strokeStyle = "#2b2218";
    X.lineWidth = 2.4;
    X.beginPath();
    X.moveTo(-42, -40);
    X.quadraticCurveTo(-84, -30, -88, -8 + pinch);
    X.quadraticCurveTo(-64, -18, -44, -22);
    X.closePath();
    X.fill();
    X.stroke();

    X.beginPath();
    X.moveTo(42, -40);
    X.quadraticCurveTo(84, -30, 88, -8 + pinch);
    X.quadraticCurveTo(64, -18, 44, -22);
    X.closePath();
    X.fill();
    X.stroke();

    // Glowing eyes & fangs
    eyes(0, -54, "#fff27a", 22, 6);
    teeth(0, -36, 56, 7, 10);

  } else if (k == "golem") {
    const hover = Math.sin(tt / 15) * 4;
    // Pillar legs
    X.fillStyle = "#3f3b54";
    X.strokeStyle = "#191626";
    X.lineWidth = 3;
    for (const lx of [-42, 12]) {
      X.beginPath();
      X.roundRect(lx, -36, 30, 36, 6);
      X.fill();
      X.stroke();
    }

    // Floating heavy arms
    for (const [ax, dir] of [[-86, -1], [58, 1]]) {
      X.save();
      X.translate(ax + 14, -90 + hover);
      X.rotate(dir * .08 + Math.sin(tt / 18) * .06);
      X.fillStyle = "#524d6b";
      X.strokeStyle = "#191626";
      X.lineWidth = 3;
      X.beginPath();
      X.roundRect(-14, -35, 28, 76, 8);
      X.fill();
      X.stroke();
      X.restore();
    }

    // Massive chest block
    glow("#ff6a1a", 18);
    X.fillStyle = "#565170";
    X.strokeStyle = "#191626";
    X.lineWidth = 3;
    X.beginPath();
    X.roundRect(-56, -132 + hover * .6, 112, 98, 12);
    X.fill();
    X.stroke();
    X.shadowBlur = 0;

    // Glowing magma core in chest
    glow("#ff5e1a", 24);
    X.fillStyle = "#ff7b29";
    X.beginPath();
    X.moveTo(0, -104 + hover * .6);
    X.lineTo(22, -82 + hover * .6);
    X.lineTo(0, -60 + hover * .6);
    X.lineTo(-22, -82 + hover * .6);
    X.closePath();
    X.fill();
    X.fillStyle = "#fff2a6";
    X.beginPath();
    X.arc(0, -82 + hover * .6, 8 + pulse * 1.5, 0, 7);
    X.fill();
    X.shadowBlur = 0;

    // Stone head & crown horns
    X.fillStyle = "#625c7d";
    X.strokeStyle = "#191626";
    X.lineWidth = 3;
    X.beginPath();
    X.roundRect(-34, -186 + hover, 68, 52, 10);
    X.fill();
    X.stroke();

    X.fillStyle = "#3f3b54";
    X.beginPath();
    X.moveTo(-34, -172 + hover); X.lineTo(-48, -198 + hover); X.lineTo(-18, -186 + hover);
    X.moveTo(34, -172 + hover); X.lineTo(48, -198 + hover); X.lineTo(18, -186 + hover);
    X.fill();
    X.stroke();

    eyes(0, -158 + hover, "#ff3b2f", 16, 5.5);
    teeth(0, -145 + hover, 46, 6, 8);

  } else if (k == "bloom") {
    const sway = Math.sin(tt / 16) * 4;
    // Thorny stem & leaves
    X.fillStyle = "#237a42";
    X.strokeStyle = "#0e381d";
    X.lineWidth = 2.6;
    X.beginPath();
    X.roundRect(-8, -98, 16, 98, 6);
    X.fill();
    X.stroke();

    X.beginPath();
    X.moveTo(-8, -38); X.quadraticCurveTo(-36, -42, -32, -58); X.quadraticCurveTo(-16, -54, -8, -56);
    X.moveTo(8, -56); X.quadraticCurveTo(36, -60, 32, -76); X.quadraticCurveTo(16, -72, 8, -74);
    X.fill();
    X.stroke();

    // Outer petal ring
    glow("#d94bff", 24);
    for (let i = 0; i < 10; i++) {
      const a = i / 10 * Math.PI * 2 + tt / 90;
      X.save();
      X.translate(sway, -126);
      X.rotate(a);
      X.fillStyle = i % 2 ? "#a81c74" : "#cc298f";
      X.strokeStyle = "#380726";
      X.lineWidth = 2.2;
      X.beginPath();
      X.ellipse(0, -56, 18, 28, 0, 0, 7);
      X.fill();
      X.stroke();
      X.restore();
    }
    X.shadowBlur = 0;

    // Giant flytrap head & chomping jaws
    X.fillStyle = "#851259";
    X.strokeStyle = "#380726";
    X.lineWidth = 3;
    X.beginPath();
    X.arc(sway, -126, 54, 0, 7);
    X.fill();
    X.stroke();

    X.fillStyle = "#260619";
    X.beginPath();
    X.ellipse(sway, -122, 46, 20 + pulse * 3, 0, 0, 7);
    X.fill();

    // Upper & lower fangs
    teeth(sway, -138, 84, 8, 11);
    X.fillStyle = "#fff";
    X.strokeStyle = "#2b1630";
    X.lineWidth = 1;
    for (let i = 0; i < 7; i++) {
      const a = sway - 38 + i * 11;
      X.beginPath();
      X.moveTo(a, -106);
      X.lineTo(a + 5.5, -116);
      X.lineTo(a + 11, -106);
      X.closePath();
      X.fill();
      X.stroke();
    }
    eyes(sway, -150, "#fff27a", 18, 5.5);

  } else if (k == "spirit") {
    const floatY = Math.sin(tt / 14) * 6;
    // Swirling spectral cloak
    glow("#5ce1ff", 28);
    const g = X.createLinearGradient(0, -190, 0, 0);
    g.addColorStop(0, "rgba(18, 88, 138, .96)");
    g.addColorStop(.65, "rgba(28, 130, 184, .65)");
    g.addColorStop(1, "rgba(40, 170, 220, .08)");
    X.fillStyle = g;
    X.beginPath();
    X.moveTo(0, -188 + floatY);
    X.quadraticCurveTo(78, -115 + floatY, 58, -18);
    for (let i = 3; i >= -3; i--) {
      X.lineTo(i * 18, -4 + Math.sin(tt / 8 + i) * 12 + (i % 2 ? 12 : 0));
    }
    X.quadraticCurveTo(-78, -115 + floatY, 0, -188 + floatY);
    X.fill();

    // Floating moon halo behind head
    X.strokeStyle = "rgba(159, 231, 255, .65)";
    X.lineWidth = 3;
    X.beginPath();
    X.arc(0, -110 + floatY, 44, 0, 7);
    X.stroke();

    // Orbiting spirit wisps
    X.fillStyle = "#b8f2ff";
    for (let i = 0; i < 3; i++) {
      const a = tt / 22 + i * 2.09;
      X.beginPath();
      X.arc(Math.cos(a) * 66, -95 + floatY + Math.sin(a) * 20, 5.5, 0, 7);
      X.fill();
    }
    X.shadowBlur = 0;

    // Hollow face & glowing soul eyes
    X.fillStyle = "#041224";
    X.beginPath();
    X.ellipse(-18, -104 + floatY, 11, 15, -.1, 0, 7);
    X.ellipse(18, -104 + floatY, 11, 15, .1, 0, 7);
    X.fill();
    eyes(0, -104 + floatY, "#8cebff", 18, 5.5);

    X.fillStyle = "#041224";
    X.beginPath();
    X.roundRect(-20, -72 + floatY, 40, 16, 6);
    X.fill();
    teeth(0, -72 + floatY, 36, 5, 8);

  } else {
    // Ancient Owl Scholar
    const flap = Math.sin(tt / 14) * 10;
    // Layered wings
    glow("#ff9a1a", 22);
    X.fillStyle = "#36200d";
    X.strokeStyle = "#170c04";
    X.lineWidth = 3;
    X.beginPath();
    X.moveTo(-42, -105);
    X.quadraticCurveTo(-115, -75 - flap, -124, -30 + flap);
    X.quadraticCurveTo(-75, -36, -46, -54);
    X.closePath();
    X.fill();
    X.stroke();

    X.beginPath();
    X.moveTo(42, -105);
    X.quadraticCurveTo(115, -75 - flap, 124, -30 + flap);
    X.quadraticCurveTo(75, -36, 46, -54);
    X.closePath();
    X.fill();
    X.stroke();
    X.shadowBlur = 0;

    // Plump feathered body & belly crest
    X.fillStyle = "#4a2e14";
    X.strokeStyle = "#170c04";
    X.lineWidth = 3;
    X.beginPath();
    X.ellipse(0, -64, 58, 66, 0, 0, 7);
    X.fill();
    X.stroke();

    X.fillStyle = "#7a522b";
    X.beginPath();
    X.ellipse(0, -56, 36, 44, 0, 0, 7);
    X.fill();

    // Feather chevrons on belly
    X.strokeStyle = "#3b230e";
    X.lineWidth = 2.2;
    for (const [fx, fy] of [[-14, -70], [14, -70], [0, -54], [-14, -38], [14, -38]]) {
      X.beginPath();
      X.moveTo(fx - 7, fy);
      X.lineTo(fx, fy + 6);
      X.lineTo(fx + 7, fy);
      X.stroke();
    }

    // Owl head & ear tufts
    X.fillStyle = "#4a2e14";
    X.strokeStyle = "#170c04";
    X.lineWidth = 3;
    X.beginPath();
    X.arc(0, -132, 44, 0, 7);
    X.fill();
    X.stroke();

    X.beginPath();
    X.moveTo(-40, -158); X.lineTo(-42, -198); X.lineTo(-14, -172);
    X.moveTo(40, -158); X.lineTo(42, -198); X.lineTo(14, -172);
    X.fill();
    X.stroke();

    // Facial disc & scholar spectacles
    X.fillStyle = "#694321";
    X.beginPath();
    X.arc(-19, -132, 17, 0, 7);
    X.arc(19, -132, 17, 0, 7);
    X.fill();

    eyes(0, -132, "#ffb020", 19, 6.5);
    X.strokeStyle = "#ffd84d";
    X.lineWidth = 2.5;
    X.beginPath();
    X.arc(-19, -132, 14, 0, 7);
    X.moveTo(-5, -132);
    X.lineTo(5, -132);
    X.arc(19, -132, 14, 0, 7);
    X.stroke();

    // Hooked beak & sharp talons
    X.fillStyle = "#ff9a1a";
    X.strokeStyle = "#170c04";
    X.lineWidth = 2;
    X.beginPath();
    X.moveTo(-9, -120);
    X.lineTo(9, -120);
    X.lineTo(0, -98);
    X.closePath();
    X.fill();
    X.stroke();

    X.strokeStyle = "#ffb020";
    X.lineWidth = 5;
    X.beginPath();
    X.moveTo(-24, 0); X.lineTo(-24, -12); X.lineTo(-38, -4);
    X.moveTo(-24, -12); X.lineTo(-14, -3);
    X.moveTo(24, 0); X.lineTo(24, -12); X.lineTo(38, -4);
    X.moveTo(24, -12); X.lineTo(14, -3);
    X.stroke();
  }
  X.restore();
  X.shadowBlur = 0;
}

function tree(x, h, s, t) {
  X.fillStyle = t; X.beginPath(); X.moveTo(x - 4 * s, GY); X.lineTo(x - 2.5 * s, GY - h); X.lineTo(x + 2.5 * s, GY - h); X.lineTo(x + 4 * s, GY); X.fill();
  [[0, -10, 26, "#3f9a62"], [-16, 4, 20, "#3f9a62"], [16, 2, 21, "#3f9a62"], [-4, -18, 17, "#5fbf7f"], [10, -8, 14, "#5fbf7f"]].forEach(([dx, dy, r, c]) => {
    X.fillStyle = c; X.beginPath(); X.arc(x + dx * s, GY - h + dy * s, r * s, 0, 7); X.fill();
  });
}
function bg(w) {
  const night = w.dark > .3, g = X.createLinearGradient(0, 0, 0, GY); g.addColorStop(0, w.sky[0]); g.addColorStop(.65, w.sky[1]); g.addColorStop(1, w.sky[1]); X.fillStyle = g; X.fillRect(0, 0, 800, 450);
  if (night) {
    X.fillStyle = "#fff";
    for (let i = 0; i < 60; i++) { X.globalAlpha = .3 + .7 * Math.abs(Math.sin(tt / 30 + i)); X.fillRect((i * 137) % 800, (i * 59) % 250, i % 7 ? 2 : 3, i % 7 ? 2 : 3); }
    X.globalAlpha = 1;
  } else {
    X.fillStyle = "#fff"; X.globalAlpha = .07;
    for (let i = 0; i < 5; i++) { X.beginPath(); X.moveTo(650, 80); X.lineTo(60 + i * 150, GY); X.lineTo(120 + i * 150, GY); X.fill(); }
    X.globalAlpha = 1;
  }
  glow(w.gl, 60); X.fillStyle = night ? "#eef5ff" : "#fff7d0"; X.beginPath(); X.arc(650, 80, 34, 0, 7); X.fill(); X.shadowBlur = 0;
  if (night) { X.fillStyle = "rgba(180,200,240,.35)"; X.beginPath(); X.arc(640, 72, 6, 0, 7); X.arc(662, 90, 4, 0, 7); X.fill(); }
  X.fillStyle = night ? "rgba(120,140,220,.22)" : "rgba(255,255,255,.85)";
  for (let i = 0; i < 5; i++) {
    const x = ((i * 230 + tt * (.12 + i % 2 * .1) - cam * .1) % 1000 + 1000) % 1000 - 120, y = 50 + (i * 37) % 100;
    for (const [dx, dy, r] of [[0, 0, 22], [24, -8, 28], [52, 0, 22], [26, 6, 24]]) { X.beginPath(); X.ellipse(x + dx, y + dy, r * 1.4, r * .55, 0, 0, 7); X.fill(); }
  }
  X.globalAlpha = .55; X.fillStyle = w.hill[0]; X.beginPath(); X.moveTo(0, GY);
  for (let x = 0; x <= 820; x += 20) X.lineTo(x, GY - 150 - 70 * Math.abs(Math.sin((x + cam * .12) / 150)) - 18 * Math.sin((x + cam * .12) / 34));
  X.lineTo(800, GY); X.fill(); X.globalAlpha = 1;
  [[w.hill[0], .2, 45, 95, 110], [w.hill[1], .45, 28, 45, 70]].forEach(([c, k, a, h, s]) => {
    X.fillStyle = c; X.beginPath(); X.moveTo(0, GY);
    for (let x = 0; x <= 820; x += 20) X.lineTo(x, GY - h - a * Math.sin((x + cam * k) / s));
    X.lineTo(800, GY); X.fill();
  });
  const d = w.deco, px = cam * .6;
  if (d == "lily") {
    X.fillStyle = "rgba(60,110,200,.35)"; X.fillRect(0, GY - 48, 800, 48);
    for (let i = 0; i < 6; i++) { X.fillStyle = "rgba(230,245,255," + (.28 - i * .04) + ")"; X.fillRect(630 + Math.sin(tt / 20 + i) * 8, GY - 46 + i * 8, 40 - i * 5, 3); }
  }
  for (let i = 0; i < (d == "book" ? 5 : d == "lily" ? 16 : 7); i++) {
    if (d == "book") {
      const x = ((i * 220 - px) % 1100 + 1100) % 1100 - 120, h = 250; X.fillStyle = "#2a1748"; X.fillRect(x, GY - h, 100, h); X.fillStyle = "#150a28"; X.fillRect(x, GY - h, 100, 6);
      for (let r = 0; r < 5; r++) {
        const ry = GY - h + 14 + r * 47; X.fillStyle = "#150a28"; X.fillRect(x, ry + 34, 100, 4);
        for (let b = 0; b < 10; b++) { X.fillStyle = "hsl(" + ((i * 37 + r * 61 + b * 29) % 360) + ",45%," + (26 + b % 3 * 6) + "%)"; X.fillRect(x + 5 + b * 9, ry + (b % 4), 7, 34 - b % 4); }
      }
      if (i % 2) { glow(w.gl, 24); X.fillStyle = w.gl; X.globalAlpha = .5 + .2 * Math.sin(tt / 9 + i); X.beginPath(); X.arc(x + 50, GY - h - 12, 6, 0, 7); X.fill(); X.globalAlpha = 1; X.shadowBlur = 0; }
    } else if (d == "lily") {
      const x = ((i * 95 - px) % 1520 + 1520) % 1520 - 120, h = 40 + (i * 17) % 35; X.strokeStyle = "#0c1a45"; X.lineWidth = 2;
      X.beginPath(); X.moveTo(x, GY); X.quadraticCurveTo(x + Math.sin(tt / 40 + i) * 5, GY - h / 2, x + 4, GY - h); X.stroke(); X.fillStyle = "#2a1d12"; X.fillRect(x + 2, GY - h - 12, 5, 14);
    } else if (d == "crystal") {
      const x = ((i * 190 - px) % 1330 + 1330) % 1330 - 140, h = 90 + (i * 53) % 70; X.fillStyle = w.tr; X.fillRect(x - 12, GY - h, 24, h); X.fillRect(x - 18, GY - h - 8, 36, 8); X.fillRect(x - 18, GY - 6, 36, 6);
      if (i % 2) { X.beginPath(); X.moveTo(x - 12, GY - h - 8); X.lineTo(x, GY - h - 30); X.lineTo(x + 12, GY - h - 8); X.fill(); }
      X.strokeStyle = "rgba(255,255,255,.3)"; X.lineWidth = 1; X.beginPath(); X.moveTo(x - 4, GY - h); X.lineTo(x - 4, GY - 6); X.moveTo(x + 4, GY - h); X.lineTo(x + 4, GY - 6); X.stroke();
    } else if (d == "flower") {
      const x = ((i * 190 - px) % 1330 + 1330) % 1330 - 140, h = 80 + (i * 53) % 60; X.strokeStyle = "#4aa85a"; X.lineWidth = 4; X.beginPath(); X.moveTo(x, GY); X.lineTo(x + Math.sin(tt / 50 + i) * 4, GY - h); X.stroke();
      for (let k = 0; k < 8; k++) { const a = k / 8 * 6.283; X.fillStyle = k % 2 ? "#ff9ad5" : "#ffb8e2"; X.beginPath(); X.ellipse(x + Math.cos(a) * 16, GY - h + Math.sin(a) * 16, 12, 7, a, 0, 7); X.fill(); }
      X.fillStyle = "#ffd84d"; X.beginPath(); X.arc(x, GY - h, 9, 0, 7); X.fill();
    } else {
      const x = ((i * 190 - px) % 1330 + 1330) % 1330 - 140; tree(x, 70 + (i * 53) % 60, 1 + (i % 3) * .25, "#5a3a22");
    }
  }
}
function ground(w) {
  X.fillStyle = w.gr; X.fillRect(cam, GY, 800, 90); X.fillStyle = w.gd; X.fillRect(cam, GY + 30, 800, 60); X.fillStyle = w.gr;
  for (let x = Math.floor(cam / 7) * 7; x < cam + 810; x += 7) { const h = 5 + (x * 13 % 7); X.beginPath(); X.moveTo(x, GY + 1); X.lineTo(x + 2, GY - h - Math.sin(tt / 30 + x) * 1.5); X.lineTo(x + 4, GY + 1); X.fill(); }
  X.fillStyle = "rgba(0,0,0,.12)"; for (let x = Math.floor(cam / 31) * 31; x < cam + 810; x += 31) X.fillRect(x, GY + 14 + (x * 7 % 30), 6, 3);
  glow(w.gl, 14); X.fillStyle = w.gl; X.fillRect(cam, GY, 800, 3); X.shadowBlur = 0;
}
function deco(w, x, i) {
  glow(w.gl, 18); X.fillStyle = w.gl; X.globalAlpha = .9; const s = .8 + (i % 3) * .2, d = w.deco;
  if (d == "mush") { X.beginPath(); X.arc(x, GY - 14 * s, 14 * s, Math.PI, 0); X.fill(); X.fillRect(x - 3, GY - 14 * s, 6, 14 * s); }
  else if (d == "crystal") { X.beginPath(); X.moveTo(x, GY - 46 * s); X.lineTo(x + 10, GY - 16); X.lineTo(x, GY); X.lineTo(x - 10, GY - 16); X.fill(); }
  else if (d == "flower") { for (let k = 0; k < 6; k++) { X.beginPath(); X.arc(x + Math.cos(k) * 9 * s, GY - 30 * s + Math.sin(k) * 9 * s, 6 * s, 0, 7); X.fill(); } X.fillRect(x - 1.5, GY - 26 * s, 3, 26 * s); }
  else if (d == "lily") { X.beginPath(); X.ellipse(x, GY - 4, 22 * s, 5, 0, 0, 7); X.fill(); X.fillRect(x - 1.5, GY - 34 * s, 3, 30 * s); X.beginPath(); X.arc(x, GY - 36 * s, 5, 0, 7); X.fill(); }
  else { X.fillRect(x - 14, GY - 10, 28, 10); X.fillRect(x - 11, GY - 20, 22, 10); X.fillStyle = "#2a1748"; X.fillRect(x - 9, GY - 8, 18, 2); }
  X.globalAlpha = 1; X.shadowBlur = 0;
}
function bubble(x, y, t) {
  X.font = "bold 16px " + FONT; const w = X.measureText(t).width + 24; X.fillStyle = "#fffafd"; X.strokeStyle = "#9b5de5"; X.lineWidth = 2;
  X.beginPath(); X.roundRect(x - w / 2, y - 30, w, 34, 12); X.fill(); X.stroke();
  X.fillStyle = "#2c1f4a"; X.textAlign = "center"; X.fillText(t, x, y - 8); X.textAlign = "left";
}
function fireflies(c) {
  glow(c, 10); X.fillStyle = c;
  for (const f of FF) { f.x += Math.sin(tt / 60 + f.p) * .5; f.y += Math.cos(tt / 70 + f.p) * .35; X.globalAlpha = .4 + .5 * Math.abs(Math.sin(tt / 25 + f.p)); X.beginPath(); X.arc((f.x + 800) % 800, f.y, 2.2, 0, 7); X.fill(); }
  X.globalAlpha = 1; X.shadowBlur = 0;
}
function emitFx() {
  const id = save.cloak; if (id != "c1" && id != "c2") return;
  const x0 = P.x + 14, y0 = P.y + P.h, walk = P.on && Math.abs(P.vx) > .1, r = Math.random, d = P.face;
  if (id == "c1") {
    if (walk) {
      if (tt % 3 == 0) fx.push({ t: "smoke", x: x0 - d * 12, y: y0 - 5, vx: -d * (.6 + r() * .5), vy: -.4 - r() * .6, r: 7, gr: .4, life: 42, max: 42, c0: "rgba(255,130,30,", c1: "rgba(60,18,8," });
      if (tt % 5 == 0) fx.push({ t: "spark", x: x0 - d * 10, y: y0 - 3, vx: -d * r() * 2, vy: -1 - r() * 2, g: .12, life: 30, max: 30, c: "#ffb04d" });
      if (tt % 12 == 0) ice.push({ x: x0, y: y0, w: 14, life: 200, c: "#ff6a1a", fill: "rgba(255,110,20,.9)" });
    } else if (!P.on && tt % 9 == 0) {
      fx.push({ t: "boom", x: x0 + rnd(-6, 6), y: y0 + 8, r: 5, gr: 2.4, life: 18, max: 18 });
      fx.push({ t: "smoke", x: x0, y: y0 + 10, vx: (r() - .5) * 1.5, vy: .3, r: 10, gr: .8, life: 36, max: 36, c0: "rgba(255,90,20,", c1: "rgba(30,10,8," });
      for (let i = 0; i < 3; i++) fx.push({ t: "spark", x: x0, y: y0 + 8, vx: (r() - .5) * 5, vy: r() * 2, g: .15, life: 28, max: 28, c: "#ffd84d" });
      if (tt % 27 == 0) SFX.boom();
    }
  } else {
    if (walk) {
      if (tt % 3 == 0) fx.push({ t: "glit", x: x0 - d * 8 + rnd(-6, 6), y: y0 - rnd(2, 18), vx: -d * .4, vy: -.4, life: 36, max: 36, s: 5, p: r() * 6, c: "#fff" });
      if (tt % 6 == 0) ice.push({ x: x0, y: y0, w: 24, life: 300, c: "#9fe7ff", fill: "rgba(205,240,255,.9)" });
    } else if (!P.on) {
      if (tt % 2 == 0) fx.push({ t: "mist", x: x0 + rnd(-8, 8), y: y0 + 6, vx: (r() - .5) * .8, vy: .3, r: 8, gr: .7, life: 40, max: 40, c0: "rgba(240,252,255,", c1: "rgba(140,215,255," });
      fx.push({ t: "glit", x: x0 + rnd(-18, 18), y: y0 + rnd(-6, 16), vx: (r() - .5) * .6, vy: .3 + r() * .4, life: 40, max: 40, s: 6, p: r() * 6, c: "#d6f6ff" });
    }
  }
  if (fx.length > 220) fx.splice(0, 40); if (ice.length > 70) ice.splice(0, 10);
}
function drawFx() {
  for (const p of ice) { const a = Math.min(1, p.life / 50); glow(p.c, 12); X.globalAlpha = a * .9; X.fillStyle = p.fill; X.beginPath(); X.roundRect(p.x - p.w / 2, p.y - 3, p.w, 5, 3); X.fill(); }
  X.globalAlpha = 1; X.shadowBlur = 0;
  for (const f of fx) {
    const a = f.life / f.max;
    if (f.t == "smoke" || f.t == "mist") {
      const g = X.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r); g.addColorStop(0, f.c0 + (.75 * a) + ")"); g.addColorStop(.55, f.c1 + (.45 * a) + ")"); g.addColorStop(1, f.c1 + "0)");
      X.fillStyle = g; X.beginPath(); X.arc(f.x, f.y, f.r, 0, 7); X.fill();
    } else if (f.t == "boom") {
      const g = X.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r); g.addColorStop(0, "rgba(255,255,220," + a + ")"); g.addColorStop(.4, "rgba(255,170,40," + a * .9 + ")"); g.addColorStop(1, "rgba(255,60,0,0)");
      X.fillStyle = g; X.beginPath(); X.arc(f.x, f.y, f.r, 0, 7); X.fill();
      X.strokeStyle = "rgba(255,200,120," + a * .7 + ")"; X.lineWidth = 2; X.beginPath(); X.arc(f.x, f.y, f.r * 1.25, 0, 7); X.stroke();
    } else if (f.t == "spark") {
      glow(f.c, 8); X.globalAlpha = a; X.fillStyle = f.c; X.fillRect(f.x, f.y, 3, 3); X.globalAlpha = 1; X.shadowBlur = 0;
    } else {
      const z = f.s * (.5 + .5 * Math.abs(Math.sin(tt / 3 + f.p))); glow("#9fe7ff", 10); X.globalAlpha = a; X.strokeStyle = f.c; X.lineWidth = 1.6;
      X.beginPath(); X.moveTo(f.x - z, f.y); X.lineTo(f.x + z, f.y); X.moveTo(f.x, f.y - z); X.lineTo(f.x, f.y + z); X.stroke(); X.globalAlpha = 1; X.shadowBlur = 0;
    }
  }
}
function drawTitle() {
  const w = W[3]; bg(w); ground(w); bench(300, 0, 3); monica(312, GY - 60, 1, { sit: 1 }); bench(300, 1, 3); book(356, GY - 125); fireflies(w.gl);
  X.textAlign = "center"; glow("#ff7eb6", 30); X.fillStyle = "#fff"; X.font = "bold 76px Georgia,serif"; X.fillText("Monica Hop", 400, 110);
  glow("#7de3ff", 14); X.font = "20px " + FONT; X.fillText("A little bunny. A big adventure.", 400, 146); X.textAlign = "left"; X.shadowBlur = 0;
  if (S == "title") {
    const e = (Date.now() - idle) / 1000;
    if (e > 6) {
      const L = [["Monica", "Soooo… are we going or what?"], ["Monica", "Can we get moving? I’m bored!"], ["Spellbook", "Please be patient."], ["Monica", "YOU be patient!"], null];
      const l = L[Math.floor((e - 6) / 2.6) % L.length];
      if (l) bubble(l[0] == "Monica" ? 335 : 380, l[0] == "Monica" ? GY - 125 : GY - 140, l[1]);
    }
  }
}
function drawIntro() {
  const w = W[4]; cam = 0; bg(w); ground(w);
  const a = .55 + .45 * Math.abs(Math.sin(tt / 9 + Math.sin(tt / 3))), cx = 400, cy = 210;
  glow("#9fe7ff", 60 * a); X.fillStyle = "rgba(150,230,255," + (.35 + .55 * a) + ")"; X.beginPath(); X.moveTo(cx, cy - 70); X.lineTo(cx + 42, cy); X.lineTo(cx, cy + 70); X.lineTo(cx - 42, cy); X.fill(); X.shadowBlur = 0;
  monica(240, GY - 40, 1); fireflies("#9fe7ff");
}
function spellDraw(k, c, x, y, t, sz) {
  X.save(); X.translate(x, y); X.scale(sz, sz); glow(c, 26); X.fillStyle = c; X.strokeStyle = c;
  if (k == "star") { X.rotate(t / 4); X.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 7 : 17, a = i * Math.PI / 5; X.lineTo(Math.cos(a) * r, Math.sin(a) * r); } X.fill(); }
  else if (k == "fire") { const g = X.createRadialGradient(0, 0, 2, 0, 0, 20); g.addColorStop(0, "#fff6b0"); g.addColorStop(.5, "#ff8a2a"); g.addColorStop(1, "rgba(255,60,0,0)"); X.fillStyle = g; X.beginPath(); X.arc(0, 0, 20 + Math.sin(t) * 3, 0, 7); X.fill(); }
  else if (k == "ice") { X.rotate(t / 6); for (let i = 0; i < 3; i++) { X.rotate(2.09); X.beginPath(); X.moveTo(0, -5); X.lineTo(5, -20); X.lineTo(-5, -20); X.fill(); } }
  else if (k == "wind") { X.lineWidth = 3; for (let i = 1; i < 4; i++) { X.beginPath(); X.arc(0, 0, i * 6, t / 3 + i, t / 3 + i + 4); X.stroke(); } }
  else { X.beginPath(); X.arc(0, 0, 12, 0, 7); X.fill(); X.fillStyle = "rgba(255,255,255,.6)"; X.fillRect(-60, -3, 60, 6); }
  X.restore(); X.shadowBlur = 0;
}
function panel(x, y, name, fr, col) {
  X.fillStyle = "rgba(20,12,40,.78)"; X.strokeStyle = "#c98ae6"; X.lineWidth = 2; X.beginPath(); X.roundRect(x, y, 250, 56, 12); X.fill(); X.stroke();
  X.fillStyle = "#fff"; X.font = "bold 15px " + FONT; X.fillText(name, x + 12, y + 22); X.fillStyle = "#333"; X.fillRect(x + 12, y + 32, 226, 12);
  X.fillStyle = col; X.fillRect(x + 12, y + 32, 226 * Math.max(0, fr), 12);
}
function drawBattle() {
  const w = W[WI], e = B.e, c = B.cast, ck = cur();
  X.save(); X.translate(0, -140); bg(w); X.fillStyle = w.gr; X.fillRect(0, GY, 800, 400); X.fillStyle = w.gd; X.fillRect(0, GY + 40, 800, 400); glow(w.gl, 14); X.fillStyle = w.gl; X.fillRect(0, GY, 800, 3); X.shadowBlur = 0;
  X.fillStyle = "rgba(0,0,0,.3)"; X.beginPath(); X.ellipse(170, GY + 4, 85, 12, 0, 0, 7); X.ellipse(EX, GY + 4, e.boss ? 130 : 90, 15, 0, 0, 7); X.fill();
  const ap = Math.min(1, B.age / 30), dy = c && c.fin && c.t > 28 ? Math.max(0, 1 - (c.t - 28) / 50) : 1, lx = B.lunge > 0 ? -Math.sin(B.lunge / 22 * Math.PI) * 130 : 0, sc = (e.boss ? 1.3 : 1.7) * (.7 + .3 * ap);
  X.save(); X.translate(EX + lx + (e.shake ? (Math.random() - .5) * 12 : 0), GY); X.scale(sc, sc); X.globalAlpha = ap * dy;
  if (c && c.fin && c.t > 28) X.translate(0, (1 - dy) * 30);
  if (e.boss) bossDraw(e); else enemy(e);
  X.restore(); X.globalAlpha = 1;
  const hurt = B.lunge > 10 ? (Math.random() - .5) * 8 : 0;
  monica(120 + hurt, GY - 40 * 1.0 - 28, 1, { s: 1.7, cast: c ? (c.t < 34 ? Math.min(1, c.t / 6) : Math.max(0, 1 - (c.t - 34) / 10)) : 0 }); book(70, GY - 150);
  if (c && c.t < 30) { const p = spellPos(c.t, EX); if (c.t < 6) spellDraw(ck.sp, ck.sc, 205, GY - 100, tt, .4 + c.t / 10); else spellDraw(ck.sp, ck.sc, p.x, p.y, tt, 1.2); }
  for (const p of parts) { X.globalAlpha = Math.min(1, p.life / 30); X.fillStyle = p.c; X.fillRect(p.x, p.y, 5, 5); }
  X.globalAlpha = 1; X.restore();
  panel(20, 12, "Monica (" + "♥".repeat(P.hp) + "♡".repeat(P.max - P.hp) + ")", B.strikes / 3, "#ff4f86");
  panel(530, 12, e.n, B.left / e.q, B.left / e.q > .4 ? "#4adf6a" : "#ff4a4a");
  if (e.boss) {
    const g = X.createRadialGradient(400, 225, 180, 400, 225, 470); g.addColorStop(0, "rgba(120,0,20,0)"); g.addColorStop(1, "rgba(120,0,20," + (.28 + .1 * Math.sin(tt / 12)) + ")");
    X.fillStyle = g; X.fillRect(0, 0, 800, 450);
  }
  if (flash > 0) { X.fillStyle = "rgba(226,59,106," + flash / 40 + ")"; X.fillRect(0, 0, 800, 450); }
}
function drawWorld() {
  const w = W[WI], inSit = S == "sit" || (S == "shop" && shopFrom == "sit"); bg(w); X.save(); X.translate(-Math.round(cam), 0); ground(w);
  for (const p of plats) { X.fillStyle = w.pb; X.fillRect(p.x, p.y, p.w, 14); glow(w.gl, 10); X.fillStyle = w.gl; X.fillRect(p.x, p.y, p.w, 3); X.shadowBlur = 0; }
  benches.forEach(b => bench(b.x)); X.restore();
  if (w.dark) {
    const sx = P.x - cam + 14, sy = P.y + 20, g = X.createRadialGradient(sx, sy, 60, sx, sy, 370); g.addColorStop(0, "rgba(6,3,24,0)"); g.addColorStop(1, "rgba(6,3,24," + w.dark + ")");
    X.fillStyle = g; X.fillRect(0, 0, 800, 450);
  }
  X.save(); X.translate(-Math.round(cam), 0);
  for (let x = 150, i = 0; x < LW; x += 240, i++) deco(w, x, i);
  for (const c of coins) if (!c.got) { glow("#ffd84d", 12); X.fillStyle = "#ffd84d"; X.beginPath(); X.ellipse(c.x, c.y + Math.sin(tt / 15 + c.x) * 3, 7 * Math.abs(Math.cos(tt / 20 + c.x) * .6 + .4), 8, 0, 0, 7); X.fill(); X.shadowBlur = 0; }
  enemies.forEach(e => { if (!e.dead) { X.save(); X.translate(e.x, GY); if (e.boss) bossDraw(e); else enemy(e); X.restore(); } });
  const bd = enemies[enemies.length - 1].dead;
  glow(bd ? w.gl : "#555", bd ? 40 : 8); X.strokeStyle = bd ? w.gl : "#666"; X.lineWidth = 6; X.beginPath(); X.ellipse(3230, GY - 60, 30, 60, 0, 0, 7); X.stroke();
  if (bd) { X.fillStyle = w.gl; X.globalAlpha = .3 + .2 * Math.sin(tt / 10); X.fill(); X.globalAlpha = 1; }
  X.shadowBlur = 0;
  drawFx(); monica(P.x, inSit ? P.y - 20 : P.y, P.face, { sit: inSit }); book(P.x - P.face * 26, P.y - 8);
  if (inSit) bench(sitB.x, 1);
  if (S == "play") {
    for (const b of benches) if (Math.abs(P.x + 14 - b.x - 26) < 60) {
      X.fillStyle = "#fff"; glow("#000", 6); X.font = "bold 15px " + FONT; X.fillText("Press E to sit", b.x - 8, GY - 80); X.shadowBlur = 0;
    }
  }
  for (const p of parts) { X.globalAlpha = Math.min(1, p.life / 45); X.fillStyle = p.c; X.fillRect(p.x, p.y, 5, 5); }
  X.globalAlpha = 1; X.restore(); fireflies(w.gl);
  X.font = "bold 22px " + FONT; X.fillStyle = "#ff4f86"; glow("#000", 4); X.fillText("♥".repeat(P.hp) + "♡".repeat(P.max - P.hp), 14, 32);
  X.font = "bold 16px " + FONT; X.fillStyle = "#fff"; X.textAlign = "right"; X.fillText("Chapter " + (WI + 1) + " · " + w.n, 786, 28); X.textAlign = "left"; X.shadowBlur = 0;
  if (S == "sit" && !paused) bubble(P.x - cam + 14, P.y - 62, sitT < 50 ? "Resting…" : "Healed and saved. S: shop · E: stand");
  if (titleT > 0) {
    titleT--; X.globalAlpha = Math.min(1, titleT / 40); X.textAlign = "center"; glow(w.gl, 24); X.fillStyle = "#fff"; X.font = "bold 46px Georgia,serif"; X.fillText(w.n, 400, 170);
    X.font = "18px " + FONT; X.fillText("Chapter " + (WI + 1) + " of 5", 400, 200); X.textAlign = "left"; X.globalAlpha = 1; X.shadowBlur = 0;
  }
  if (flash > 0) { X.fillStyle = "rgba(226,59,106," + flash / 40 + ")"; X.fillRect(0, 0, 800, 450); }
  if (paused) {
    X.fillStyle = "rgba(20,10,40,.68)"; X.fillRect(0, 0, 800, 450); X.fillStyle = "#fff"; X.textAlign = "center"; X.font = "bold 34px " + FONT; X.fillText("Paused", 400, 175);
    X.font = "18px " + FONT; X.fillText("Monica: “Taking a break? We literally just started.”", 400, 210); X.textAlign = "left";
  }
}
let lastT = 0;
function loop(now) {
  requestAnimationFrame(loop);
  if (!lastT) lastT = now;
  if (now - lastT < 15.5) return;
  lastT = now - (now - lastT) % 16.666;
  X.setTransform(K, 0, 0, K, 0, 0); if (wrap.dataset.s != S) wrap.dataset.s = S; tt++; update();
  const sv = S == "sit" && sitT >= 50 && !paused; if (sv != shopVis) { shopVis = sv; $("shopS").hidden = !sv; }
  if (S == "title" || S == "login" || (S == "shop" && shopFrom == "title")) drawTitle();
  else if (introOn) drawIntro();
  else if (S == "battle" && B) drawBattle();
  else drawWorld();
}

/* ---------- device & screen ---------- */
let mode = "pc", ignoreRot = false, rotPaused = false;

function enterMobileScreen() {
  try {
    const r = document.documentElement.requestFullscreen && document.documentElement.requestFullscreen();
    if (r && r.then) {
      r.then(() => {
        try { screen.orientation.lock("landscape").catch(() => {}); } catch (e) {}
      }).catch(() => {});
    }
  } catch (e) {}
}

function exitMobileScreen() {
  try {
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
  } catch (e) {}
}

function resize() {
  const b = document.body, cs = getComputedStyle(b), mob = mode == "mobile";
  const vw = b.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  let vh = b.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
  if (!mob) vh -= ($("hint").offsetHeight || 0) + 10;
  const w = Math.max(240, Math.min(vw - (mob ? 0 : 8), vh * 16 / 9, mob ? 1280 : 1800)), dpr = Math.min(window.devicePixelRatio || 1, 2), bw = Math.round(Math.min(w * dpr, mob ? 1280 : 1800));
  wrap.style.width = w + "px"; wrap.style.height = (w * 9 / 16) + "px"; wrap.style.fontSize = Math.max(11, Math.min(20, w / 52)) + "px";
  if (C.width != bw) { C.width = bw; C.height = Math.round(bw * 9 / 16); } K = bw / 800;
  const portrait = mob && b.clientHeight > b.clientWidth && !ignoreRot; $("rotate").hidden = !portrait;
  if (portrait && S == "play" && !paused) { setPause(true); rotPaused = true; } else if (!portrait && rotPaused) { setPause(false); rotPaused = false; }
}

function applyDevice(toggleScreen) {
  const sel = save.dev || "select";
  mode = sel == "mobile" ? "mobile" : "pc";
  document.body.classList.remove("pc", "mobile");
  document.body.classList.add(mode);
  $("qk").hidden = mode != "mobile";
  $("ans").setAttribute("inputmode", mode == "mobile" ? "none" : "text");
  (mode == "mobile" ? $("bl") : $("arow")).appendChild($("go"));

  $("devWrap").hidden = false;
  $("devMenu").hidden = true;
  if (sel == "select") {
    $("devT").textContent = "DEVICE : ( select )";
    $("devArrow").hidden = false;
  } else {
    $("devT").textContent = "DEVICE : " + (sel == "mobile" ? "Mobile" : "PC");
    $("devArrow").hidden = true;
    if (toggleScreen) {
      if (sel == "mobile") enterMobileScreen();
      else exitMobileScreen();
    }
  }
  resize();
}

$("devT").onclick = () => {
  $("devMenu").hidden = !$("devMenu").hidden;
  if ((save.dev || "select") == "select") {
    $("devArrow").hidden = !$("devMenu").hidden;
  }
};

$("pickPC").onclick = () => {
  save.dev = "pc";
  store();
  applyDevice(true);
};

$("pickMob").onclick = () => {
  save.dev = "mobile";
  store();
  applyDevice(true);
};

$("rotok").onclick = () => { ignoreRot = true; resize(); };
wrap.addEventListener("contextmenu", e => e.preventDefault());
addEventListener("resize", resize); addEventListener("orientationchange", () => setTimeout(resize, 250)); document.addEventListener("fullscreenchange", () => setTimeout(resize, 150));
if (window.visualViewport) visualViewport.addEventListener("resize", resize);
applyDevice(false);
setTimeout(() => $("nameIn").focus(), 50);
requestAnimationFrame(loop);
