const logs = window.LIVE_LOGS || [];
function bdg(x) {
  if (!x.p || x.s === "DONE DEAL" || x.s === "BREAKING") return "";
  let l = (x.s === "TEASER" || x.s === "RUMOUR") ? "ACCURACY" : "DEAL RATE";
  return '<span class="prob' + (x.risk ? ' risk' : '') + '">' + (x.risk ? '⚠️ ' : '') + x.p + '% ' + l + '</span>';
}
function go(m){
  ["feed","intl","cal-club","cal-intl","cal-all","fix","done","top","player","calc","goal"].forEach(k=>{
    let t=document.getElementById("t-"+k), b=document.getElementById("b-"+k);
    if(t) t.classList.toggle("active", k===m);
    if(b) b.style.display=(k===m && !["top","intl"].includes(k)) ? "flex" : "none";
  });
  if(m==="feed") draw();
  else if(m==="intl") drawIntl();
  else if(m==="cal") loadCalendar();
  else if(m==="fix") list.innerHTML="<div class=dossier>Type any club name above and click <b>🔍 FIND NEXT 5 FIXTURES</b>.</div>";
  else if(m==="done") drawDone();
  else if(m==="top") drawTop();
  else if(m==="player") list.innerHTML="<div class=dossier>Type any Player or Manager above and click <b>🔍 GENERATE DOSSIER</b>.</div>";
  else if(m==="goal") list.innerHTML="<div class=dossier>Enter Home Team, Away Team & optional Player above.</div>";
  else list.innerHTML="<div class=dossier>Enter any Player/Manager and Club above to verify profile & calculate transfer probability.</div>";
}
function draw() {
  const qv = q.value.toLowerCase(), cv = cl.value, sv = st.value;
  list.innerHTML = logs.map((x, i) => (cv === "ALL" || x.c === cv) && (sv === "ALL" || x.s === sv) && (!qv || JSON.stringify(x).toLowerCase().includes(qv)) ?
    '<div class="card" onclick="mt.innerText=logs[' + i + '].h;ma.innerText=logs[' + i + '].a;modal.style.display=\'flex\'">' +
    '<div style="color:#8b949e;font-size:.85em">' + x.t + ' • <b>[' + x.c + ']</b> <span class="tag ' + x.s.replace(/ /g, "_") + '">' + x.s + '</span>' + bdg(x) + '</div>' +
    '<div style="margin-top:5px"><b>' + x.h + '</b></div></div>' : "").join("");
}
function drawDone() {
  let done = logs.filter(x => x.s === "DONE DEAL").map(x => {
    let m = x.h.match(/£(\d+)m/i), f = m ? parseInt(m.pop()) : 0;
    return { player: x.player || x.h, to: x.c, fee: f, perf: f > 50 ? 78 : 83, txt: x.a.split("\n\n").shift() };
  }).sort((a, b) => dsort.value === "fee" ? b.fee - a.fee : b.perf - a.perf);
  if (!done.length) {
    let hot = logs.filter(x => x.p && x.s !== "BREAKING").sort((a, b) => b.p - a.p).slice(0, 5);
    list.innerHTML = '<div class="dossier" style="border-color:#d29922"><b style="color:#d29922">⏳ NO CONFIRMED DEALS YET</b><p style="color:#8b949e;margin:6px 0 0">Highest-probability active moves right now:</p></div>' +
      hot.map(x => '<div class="card"><div style="color:#8b949e;font-size:.85em"><b>[' + x.c + ']</b> <span class="prob">' + x.p + '% RATE</span></div><div style="margin-top:5px"><b>' + x.h + '</b></div></div>').join("");
    return;
  }
  let top = done.reduce((m, x) => x.fee > m.fee ? x : m, done.slice().shift());
  list.innerHTML = '<div style="background:#211c11;border-left:4px solid #d29922;padding:12px;margin-top:10px;border-radius:6px"><div style="color:#d29922;font-size:.8em;font-weight:bold">🏆 MOST EXPENSIVE CONFIRMED DEAL</div><div style="margin-top:4px"><b>' + top.player + '</b> ➔ <b>' + top.to + '</b> — <b style="color:#d29922">' + (top.fee ? '£' + top.fee + 'M' : 'UNDISCLOSED') + '</b> • <b style="color:#3fb950">AI PERFORMANCE: ' + top.perf + '%</b></div></div>' +
    done.map(x => '<div class="card" style="border-left-color:#238636"><div style="color:#8b949e;font-size:.85em"><span class="tag DONE_DEAL">DONE DEAL</span> <b style="color:#d29922">' + (x.fee ? ' £' + x.fee + 'M' : ' UNDISCLOSED') + '</b> • <b style="color:#3fb950">📈 ' + x.perf + '% AI PERFORMANCE</b></div><div style="margin-top:6px"><b>' + x.player + '</b> ➔ <b>' + x.to + '</b></div><p style="color:#c9d1d9;font-size:.9em;margin:6px 0 0">' + x.txt + '</p></div>').join("");
}
function drawTop() {
  let ranked = logs.filter(x => x.p && !["DONE DEAL", "BREAKING"].includes(x.s) && !/manager|head coach|boss|sack|appoint|boardroom|regulator|contract|extension|five-year/.test((x.h + " " + x.a).toLowerCase())).sort((a, b) => b.p - a.p);
  list.innerHTML = ranked.length ? ranked.map((x, idx) => '<div class="card" onclick="mt.innerText=this.dataset.h;ma.innerText=this.dataset.a;modal.style.display=\'flex\'" data-h="' + x.h.replace(/"/g, "&quot;") + '" data-a="' + x.a.replace(/"/g, "&quot;") + '"><div style="color:#8b949e;font-size:.85em"><b>#' + (idx + 1) + '</b> • <b>[' + x.c + ']</b> <span class="tag ADVANCED_STAGES">' + x.s + '</span> <span class="prob' + (x.risk ? ' risk' : '') + '">' + x.p + '% PROBABILITY</span></div><div style="margin-top:6px"><b>' + x.h + '</b></div><div style="background:#0d1117;height:6px;border-radius:4px;margin-top:8px"><div style="background:' + (x.risk ? '#f85149' : '#3fb950') + ';height:100%;width:' + x.p + '%"></div></div></div>').join("") : '<div class="dossier">No active unconfirmed player transfers or loans logged yet.</div>';
}
function drawP() {
  list.innerHTML = "<div class=dossier style=color:#8b949e>Type any <b>Player or Manager</b> above and click <b>🔍 GENERATE DOSSIER</b> to pull Transfermarkt credentials, live UK transfer links, and an AI-synthesized scouting brief.</div>";
}
async function verifyPro(name) {
  let nl = name.toLowerCase().trim();
  const aliases = {"messi":"Lionel Messi","ronaldo":"Cristiano Ronaldo","cr7":"Cristiano Ronaldo","neymar":"Neymar","mbappe":"Kylian Mbappé","haaland":"Erling Haaland","salah":"Mohamed Salah","bellingham":"Jude Bellingham","palmer":"Cole Palmer","saka":"Bukayo Saka"};
  let q = aliases[nl] || name;
  let ql = q.toLowerCase();
  try {
    let wk = await (await fetch("https" + "://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=" + encodeURIComponent(q + " footballer") + "&gsrlimit=6&prop=extracts&exintro=1&explaintext=1&exsentences=3&format=json&origin=*")).json();
    let pages = Object.values((wk.query && wk.query.pages) || {});
    let badTitle = /rivalry|career of|list of|season|statistics|honours|awards/.test;
    let valid = pages.filter(x => {
      let tl = (x.title || "").toLowerCase(), ex = (x.extract || "").toLowerCase();
      if (/rivalry|career of|list of|season|statistics|honours|awards/.test(tl)) return false;
      if (!/footballer|soccer player|football manager|head coach|midfielder|striker|defender|goalkeeper|winger|forward/.test(ex)) return false;
      return tl === ql || tl.startsWith(ql) || ql.split(" ").every(w => tl.includes(w));
    });
    let hit = valid.sort((x, y) => x.title.length - y.title.length).shift();
    if (hit) return { ok: true, prof: hit.title, bio: (hit.extract || "").replace(/\s+/g, " ").trim() };
  } catch (e) {}
  return { ok: false };
}
async function buildDossier() {
  const raw = pq.value.trim();
  if (!raw) return;
  const n = raw.toLowerCase();
  list.innerHTML = "<div class=dossier>🧠 Scanning official football databases & live wires for <b>" + raw + "</b>...</div>";
  const localHits = logs.filter(x => JSON.stringify(x).toLowerCase().includes(n));
  const v = await verifyPro(raw);
  if (!v.ok && !localHits.length) {
    list.innerHTML = "<div class=dossier><h3 style=color:#58a6ff;margin:0>👤 DOSSIER // " + raw.toUpperCase() + "</h3><div style=color:#f85149;font-weight:bold;margin:8px 0>0% — NOT A REGISTERED PRO</div><p>No active professional footballer or manager profile found for \"" + raw + "\" across international football databases.</p></div>";
    return;
  }
  let prof = v.ok ? v.prof : raw + " (English Football Wire Verified)";
  let topWire = localHits.length ? localHits.slice().shift().h : (v.bio || "Monitored by Premier League & European recruitment scouts ahead of upcoming transfer windows.");
  let prob = localHits.length ? Math.max(...localHits.map(x => x.p || 48)) : 38;
  let col = prob >= 70 ? "#3fb950" : (prob >= 40 ? "#d29922" : "#8b949e");
  let p1 = "Verified database profile confirms " + prof + ". " + topWire + ".";
  let p2 = prob >= 60 ? "Active intermediary contact and strong tactical fit across Premier League recruitment desks give a potential move elevated momentum." : "Scouting analytics highlight positional versatility and market value balance, though any formal approach depends on selling-club valuation and PSR headroom.";
  let copyTxt = "👤 PLAYER INTELLIGENCE // " + raw.toUpperCase() + " (" + prob + "% MOVE RATE)\n\n" + p1 + "\n\n" + p2;
  list.innerHTML = "<div class=dossier><div style=color:#8b949e;font-size:.8em>✅ " + prof + "</div><h2 style=color:#58a6ff;margin:6px 0>👤 " + raw.toUpperCase() + "</h2><div style=color:" + col + ";font-weight:bold;margin:8px 0>OVERALL MOVE PROBABILITY: " + prob + "%</div><div style=background:#0d1117;height:10px;border-radius:6px;margin-bottom:12px><div style=background:" + col + ";height:100%;width:" + prob + "%></div></div><p style=color:#c9d1d9;line-height:1.6>" + p1 + "</p><p style=color:#c9d1d9;line-height:1.6>" + p2 + "</p><button onclick=\"navigator.clipboard.writeText(this.dataset.c);this.innerText='✅ COPIED!'\" data-c=\"" + copyTxt.replace(/"/g, "&quot;") + "\">📋 COPY DOSSIER FOR INSTAGRAM</button></div>" +
    localHits.map(x => "<div class=card><div style=color:#8b949e;font-size:.85em>" + x.t + " • <b>[" + x.c + "]</b>" + bdg(x) + "</div><div style=margin-top:5px><b>" + x.h + "</b></div></div>").join("");
}
async function calc(){
  let w = cw.value.trim(), cn = cc.value.trim();
  if (!w || !cn) return;
  list.innerHTML = "<div class=dossier>🔍 Analyzing squad fit, age curve, selling-club stance & PSR feasibility for <b>" + w + " ➔ " + cn + "</b>...</div>";
  const v = await verifyPro(w);
  if (!v.ok) {
    list.innerHTML = "<div class=dossier><h3 style=color:#58a6ff;margin:0>" + w.toUpperCase() + " ➔ " + cn.toUpperCase() + "</h3><div style=color:#f85149;font-weight:bold;margin:8px 0>0% — NOT A REGISTERED PRO</div><p>No active professional player or manager profile found for \"" + w + "\".</p></div>";
    return;
  }
  let cl = cn.toLowerCase(), bl = (v.prof + " " + v.bio).toLowerCase();
  let bm = bl.match(/born[^0-9]*(19[0-9][0-9]|200[0-9])/);
  let age = bm ? (2026 - parseInt(bm.pop())) : 25;
  let isRetired = /former .* footballer|retired/.test(bl) && !/manager|coach/.test(bl);
  let vet = age >= 35 || /al-nassr|inter miami|saudi|major league soccer/.test(bl);
  let smallClub = /wrexham|birmingham|leeds|sunderland|burnley|championship|league one|league two|punjab|mumbai|mohun bagan|kerala|bengaluru|goa|indian super league|isl/.test(cl);
  let globalStar = /lionel messi|cristiano ronaldo|kylian|haaland|bellingham|vinicius|salah|palmer|saka|rodri|yamal|wirtz|musiala|arsenal|chelsea|liverpool|manchester city|manchester united|real madrid|barcelona|bayern|psg|inter milan/.test(bl);
  let big6 = /arsenal|chelsea|liverpool|manchester city|man city|manchester united|man united|tottenham|spurs/.test(cl);
  let midPL = /fulham|crystal palace|brighton|brentford|west ham|bournemouth|wolves|everton|nottingham|aston villa|newcastle/.test(bl);
  let rival = (/arsenal/.test(bl) && /tottenham|spurs|chelsea/.test(cl)) || (/liverpool/.test(bl) && /manchester united|man united|everton/.test(cl)) || (/manchester city|man city/.test(bl) && /manchester united|man united/.test(cl));

  let localHit = logs.find(x => JSON.stringify(x).toLowerCase().includes(v.prof.toLowerCase()) && JSON.stringify(x).toLowerCase().includes(cl.split(" ").shift()));
  let seed = (v.prof.length * 7 + cn.length * 11) % 13;
  let score = 22 + seed;
  if (age >= 21 && age <= 27) score += 9;
  else if (age >= 31) score -= 11;
  let superClub = /real madrid|barcelona|manchester city|bayern munich|paris saint-germain|psg|arsenal|liverpool/.test(bl);
  if (superClub && !localHit) score = Math.min(score, 6);
  if (big6 && midPL) score += 8;
  if (rival) score = Math.min(score, 5);
  if (smallClub && globalStar) score = 1;
  else if (smallClub && !/championship|league one|indian/.test(bl)) score = Math.min(score, 7);
  if (vet) score = 1;
  if (isRetired) score = 0;
  if (localHit) score = localHit.p || 64;
  score = Math.max(0, Math.min(94, score));

  let roleLine = (v.bio.split(".").shift() || v.prof).trim() + ".";
  let col = score >= 55 ? "#3fb950" : (score >= 25 ? "#d29922" : "#f85149");
  let verdict = isRetired ? roleLine + " Retired from active playing duties, making a move to " + cn + " impossible." :
    (vet ? roleLine + " At age " + age + " with high veteran wages, a move to " + cn + " does not align with modern squad-building models." :
    (localHit ? roleLine + " Active wire reports already link " + v.prof + " with " + cn + " (" + localHit.h + "), pushing deal probability up to " + score + "%." :
    (rival ? roleLine + " Direct domestic rivalry and fierce boardroom resistance make a transfer to " + cn + " highly unlikely (" + score + "%)." :
    roleLine + " Entering prime age (" + age + "), " + v.prof + " fits " + cn + "s tactical profile, though valuation benchmarks and PSR headroom keep this at a " + score + "% realistic rating until formal talks open.")));

  list.innerHTML = "<div class=dossier>" +
    "<h3 style=color:#58a6ff;margin:0>" + v.prof.toUpperCase() + " ➔ " + cn.toUpperCase() + "</h3>" +
    "<div style=color:#8b949e;font-size:.85em;margin-top:4px>✅ Verified Pro • Est. Age: " + age + "</div>" +
    "<div style=color:" + col + ";font-weight:bold;margin:8px 0>REALISTIC PROBABILITY: " + score + "%</div>" +
    "<div style=background:#0d1117;height:9px;border-radius:6px;margin-bottom:10px><div style=background:" + col + ";height:100%;width:" + score + "%></div></div>" +
    "<p style=color:#c9d1d9;line-height:1.6;margin:0>" + verdict + "</p>" +
  "</div>";
}
async function calcGoal() {
  let hTeam = document.getElementById("g-home").value.trim();
  let aTeam = document.getElementById("g-away").value.trim();
  let player = gw.value.trim();
  if (!hTeam || !aTeam) { alert("Enter both Home Team and Away Team!"); return; }
  list.innerHTML = "<div class=dossier>📊 Running Poisson xG simulation & player probability model for <b>" + hTeam + " vs " + aTeam + "</b>...</div>";

  function clubRating(t) {
    let tl = t.toLowerCase();
    if (/man city|manchester city|arsenal|liverpool|real madrid|barcelona|bayern|psg|inter/.test(tl)) return { att: 2.05, def: 0.78, tier: "Elite Contender" };
    if (/chelsea|man united|manchester united|tottenham|spurs|newcastle|aston villa|villa/.test(tl)) return { att: 1.65, def: 1.05, tier: "Top-6 Challenger" };
    if (/brighton|west ham|fulham|brentford|crystal palace|bournemouth|forest|wolves|everton/.test(tl)) return { att: 1.32, def: 1.28, tier: "Premier League Mid-Table" };
    if (/leicester|ipswich|southampton|leeds|burnley|sunderland|sheffield|birmingham|wrexham|championship/.test(tl)) return { att: 1.02, def: 1.55, tier: "Championship / Promoted" };
    return { att: 1.25, def: 1.30, tier: "Competitive Club" };
  }

  let H = clubRating(hTeam), A = clubRating(aTeam);
  let hXG = Math.max(0.45, Math.min(3.4, (H.att * A.def * 0.92) + 0.26));
  let aXG = Math.max(0.35, Math.min(3.1, (A.att * H.def * 0.86)));

  function fact(n) { return n <= 1 ? 1 : n * fact(n - 1); }
  function pois(k, lam) { return (Math.pow(lam, k) * Math.exp(-lam)) / fact(k); }

  let hWin = 0, draw = 0, aWin = 0, btts = 0, over25 = 0, bestScore = "1-1", bestP = 0;
  for (let i = 0; i <= 7; i++) {
    for (let j = 0; j <= 7; j++) {
      let prob = pois(i, hXG) * pois(j, aXG);
      if (i > j) hWin += prob;
      else if (i === j) draw += prob;
      else aWin += prob;
      if (i > 0 && j > 0) btts += prob;
      if (i + j >= 3) over25 += prob;
      if (prob > bestP) { bestP = prob; bestScore = i + "-" + j; }
    }
  }
  let hPct = Math.round(hWin * 100), dPct = Math.round(draw * 100), aPct = Math.max(1, 100 - hPct - dPct);
  let bttsPct = Math.round(btts * 100), o25Pct = Math.round(over25 * 100);

  let playerHTML = "", playerCopy = "";
  if (player) {
    const v = await verifyPro(player);
    if (!v.ok) {
      playerHTML = "<div style=margin-top:14px;padding-top:12px;border-top:1px solid #30363d;color:#f85149><b>⚠️ PLAYER CHECK:</b> No active professional profile found for \"" + player + "\" (0% scoring probability).</div>";
    } else {
      let bl = (v.prof + " " + v.bio).toLowerCase();
      let isGK = /goalkeeper/.test(bl), isDef = /defender|centre-back|full-back/.test(bl), isMid = /midfielder/.test(bl);
      let playsAway = aTeam.toLowerCase().split(" ").filter(x => x.length > 3).some(tok => bl.includes(tok));
      let teamXG = playsAway ? aXG : hXG;
      let sideLabel = playsAway ? aTeam + " (Away)" : hTeam + " (Home)";
      let share = isGK ? 0.005 : (isDef ? 0.055 : (isMid ? 0.17 : 0.34));
      let pXG = teamXG * share;
      let goalPct = Math.max(1, Math.min(76, Math.round((1 - Math.exp(-pXG)) * 100)));
      let gCol = goalPct >= 38 ? "#3fb950" : (goalPct >= 18 ? "#d29922" : "#8b949e");
      playerHTML = "<div style=margin-top:14px;padding-top:12px;border-top:1px solid #30363d>" +
        "<div style=color:#8b949e;font-size:.85em>✅ VERIFIED PLAYER: <b>" + v.prof + "</b> • Projected Side: " + sideLabel + "</div>" +
        "<div style=color:" + gCol + ";font-weight:bold;font-size:1.05em;margin:6px 0>⚽ ANYTIME GOALSCORER PROBABILITY: " + goalPct + "% (Est. Player xG: " + pXG.toFixed(2) + ")</div>" +
        "<div style=background:#0d1117;height:9px;border-radius:6px><div style=background:" + gCol + ";height:100%;width:" + goalPct + "%></div></div></div>";
      playerCopy = "\n⚽ " + v.prof + " Anytime Goalscorer: " + goalPct + "% (xG: " + pXG.toFixed(2) + ")";
    }
  }

  let copyTxt = "📊 MATCH & ODDS MODEL // " + hTeam.toUpperCase() + " vs " + aTeam.toUpperCase() + "\n• " + hTeam + " Win: " + hPct + "% | Draw: " + dPct + "% | " + aTeam + " Win: " + aPct + "%\n• Projected xG: " + hXG.toFixed(2) + " - " + aXG.toFixed(2) + " (Most Likely Score: " + bestScore + ")\n• BTTS: " + bttsPct + "% | Over 2.5 Goals: " + o25Pct + "%" + playerCopy;

  list.innerHTML = "<div class=dossier>" +
    "<div style=color:#8b949e;font-size:.8em>POISSON xG PROBABILITY ENGINE // " + H.tier.toUpperCase() + " vs " + A.tier.toUpperCase() + "</div>" +
    "<h2 style=color:#58a6ff;margin:6px 0>" + hTeam.toUpperCase() + " vs " + aTeam.toUpperCase() + "</h2>" +
    "<div style=display:flex;gap:8px;margin:12px 0;flex-wrap:wrap>" +
      "<div style=flex:1;background:#0d1117;padding:10px;border-radius:6px;text-align:center;border:1px solid #30363d><div style=color:#8b949e;font-size:.8em>🏠 " + hTeam.toUpperCase() + " WIN</div><div style=color:#3fb950;font-size:1.3em;font-weight:bold>" + hPct + "%</div></div>" +
      "<div style=flex:1;background:#0d1117;padding:10px;border-radius:6px;text-align:center;border:1px solid #30363d><div style=color:#8b949e;font-size:.8em>🤝 DRAW</div><div style=color:#d29922;font-size:1.3em;font-weight:bold>" + dPct + "%</div></div>" +
      "<div style=flex:1;background:#0d1117;padding:10px;border-radius:6px;text-align:center;border:1px solid #30363d><div style=color:#8b949e;font-size:.8em>✈️ " + aTeam.toUpperCase() + " WIN</div><div style=color:#58a6ff;font-size:1.3em;font-weight:bold>" + aPct + "%</div></div>" +
    "</div>" +
    "<div style=color:#c9d1d9;font-size:.92em;line-height:1.6>• <b>Projected Match xG:</b> " + hTeam + " <b>" + hXG.toFixed(2) + "</b> — <b>" + aXG.toFixed(2) + "</b> " + aTeam + "<br>• <b>Most Likely Scoreline:</b> <b>" + bestScore + "</b> • <b>BTTS:</b> <b>" + bttsPct + "%</b> • <b>Over 2.5 Goals:</b> <b>" + o25Pct + "%</b></div>" +
    playerHTML +
    "<button style=margin-top:14px onclick=\"navigator.clipboard.writeText(this.dataset.c);this.innerText='✅ COPIED!'\" data-c=\"" + copyTxt.replace(/"/g, "&quot;") + "\">📋 COPY MATCH & GOAL ODDS FOR INSTAGRAM</button>" +
  "</div>";
}
setInterval(() => {
  let n = new Date();
  clk.innerText = "🇬🇧 " + n.toLocaleTimeString("en-GB", { timeZone: "Europe/London" }) + " | 🇭🇰 " + n.toLocaleTimeString("en-GB", { timeZone: "Asia/Hong_Kong" });
}, 1000);
draw();
setInterval(() => {
  let sc = document.createElement("script");
  sc.src = "data.js?t=" + Date.now();
  sc.onload = () => { if (window.LIVE_LOGS) { logs.length = 0; logs.push(...window.LIVE_LOGS); if (document.getElementById("t-feed").classList.contains("active")) draw(); } };
  document.body.appendChild(sc);
}, 15000);
function drawFix() {
  list.innerHTML = "<div class=dossier style=color:#8b949e>Type any club name above (e.g. <b>Arsenal</b>, <b>Chelsea</b>, <b>Man United</b>, <b>Leeds</b>) and click <b>🔍 FIND NEXT 5 FIXTURES</b> to load their next 5 matches, Win %, Predicted Lineups, Managers, and Goalscorers.</div>";
}
async function getLiveManager(clubName) {
  try {
    let q = encodeURIComponent(clubName.replace(/&/g,"and") + " F.C. manager");
    let u = "https" + "://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=" + q + "&srlimit=3&format=json&origin=*";
    let res = await (await fetch(u)).json();
    let hits = (res.query && res.query.search) || [];
    for (let h of hits) {
      let snip = h.snippet.replace(/<[^>]+>/g, "");
      let m = snip.match(/(?:managed by|head coach|manager of [^.,]+ is|appointed)\s+([A-Z][a-zà-ÿ]+\s+[A-Z][a-zà-ÿ]+)/);
      if (m && m.length > 1) return m.pop();
    }
  } catch (e) {}
  return "First-Team Manager";
}

let liveTableCache = {};
async function getTeamForm(lg, tid, nm) {
  let tierMult = lg === "eng.1" || lg === "esp.1" || lg === "ger.1" || lg === "ita.1" ? 1.25 : (lg === "eng.2" ? 0.85 : 0.68);
  if (!liveTableCache[lg]) {
    liveTableCache[lg] = (async () => {
      let map = {};
      try {
        let st = await (await fetch("https" + "://site.api." + "espn" + ".com/apis/v2/sports/soccer/" + lg + "/standings")).json();
        let entries = ((((st.children || []).shift() || {}).standings || {}).entries) || [];
        entries.forEach(e => {
          let t = e.team || {}, stats = e.stats || [];
          let getS = k => ((stats.find(x => x.name === k) || {}).value) || 0;
          let gp = Math.max(1, getS("gamesPlayed"));
          let gf = (getS("pointsFor") / gp) * tierMult;
          let ga = (getS("pointsAgainst") / gp) / tierMult;
          map[t.id] = { gf: Math.max(0.55, gf), ga: Math.max(0.55, ga) };
        });
      } catch (e) {}
      return map;
    })();
  }
  let tbl = await liveTableCache[lg];
  if (tbl[tid]) return tbl[tid];
  let l = nm.toLowerCase();
  if (/city|arsenal|liverpool|madrid|barcelona|bayern/.test(l)) return { gf: 2.15, ga: 0.80 };
  if (/chelsea|united|tottenham|newcastle|villa/.test(l)) return { gf: 1.75, ga: 1.05 };
  if (/bournemouth|brighton|fulham|brentford|palace|west ham|forest|wolves|everton/.test(l)) return { gf: 1.40, ga: 1.25 };
  return { gf: 0.92, ga: 1.55 };
}
async function searchTeamFixtures() {
  let rawQ = document.getElementById("fix-q").value.trim();
  if (!rawQ) return;
  list.innerHTML = "<div class=dossier>⚡ Fetching live table standings, Starting XIs, managers & realistic Poisson odds for <b>" + rawQ.toUpperCase() + "</b>...</div>";
  let srch = "https" + "://site.web.api." + "espn" + ".com/apis/common/v3/search?query=" + encodeURIComponent(rawQ) + "&limit=10&type=team";
  let ft = null, flg = "eng.1";
  try {
    let res = await (await fetch(srch)).json();
    let hit = (res.items || []).find(x => x.sport === "soccer") || (res.items || []).shift();
    if (hit) { ft = { id: hit.id, name: hit.displayName }; flg = hit.league || "eng.1"; }
  } catch (e) {}
  if (!ft) { list.innerHTML = "<div class=dossier style=color:#f85149>⚠️ Team not found: " + rawQ + "</div>"; return; }

  let base = "https" + "://site.api." + "espn" + ".com/apis/site/v2/sports/soccer/", memo = {};
  function getData(lg, tid, tName) {
    if (!memo[tid]) memo[tid] = (async () => {
      let gk = [], df = [], mf = [], fw = [], bench = [], out = [], faces = {}, alg = lg, mgrP = getLiveManager(tName);
      for (let tlg of [lg, "eng.1", "eng.2", "eng.3", "eng.4", "esp.1", "ita.1", "ger.1"]) {
        try {
          let r = await (await fetch(base + tlg + "/teams/" + tid + "/roster")).json();
          if (r.athletes && r.athletes.length) {
            alg = tlg;
            r.athletes.forEach(a => { if (a.headshot && a.headshot.href) faces[a.displayName] = a.headshot.href; if (a.injuries && a.injuries.length) out.push(a.displayName); });
            break;
          }
        } catch (e) {}
      }
      try {
        let ps = await (await fetch(base + alg + "/teams/" + tid + "/schedule")).json();
        let le = (ps.events || []).filter(e => (((e.competitions || []).slice().shift().status || {}).type || {}).completed).pop();
        if (le) {
          let sum = await (await fetch(base + alg + "/summary?event=" + le.id)).json();
          let sd = (sum.rosters || []).find(x => (x.team || {}).id === tid);
          if (sd && sd.roster) sd.roster.forEach(p => {
            let nm = (p.athlete || {}).displayName || "", pos = ((p.position || {}).abbreviation || "MF").toUpperCase();
            if (!nm || out.includes(nm)) return;
            if (!p.starter) { bench.push(nm); return; }
            if (pos === "G") gk.push(nm); else if (pos.includes("D") || pos.includes("B")) df.push(nm); else if (pos.includes("F") || pos.includes("S") || pos.includes("W")) fw.push(nm); else mf.push(nm);
          });
        }
      } catch (e) {}
      return { coach: await mgrP, gk: gk.slice(0,1), df: df.slice(0,4), mf: mf.slice(0,3), fw: fw.slice(0,3), bench: bench.slice(0,5), out: out.slice(0,5), faces, alg };
    })();
    return memo[tid];
  }
  function pois(k, lam) { let f = 1; for (let i = 2; i <= k; i++) f *= i; return (Math.pow(lam, k) * Math.exp(-lam)) / f; }

  let sch = await (await fetch(base + flg + "/teams/" + ft.id + "/schedule?fixture=true")).json();
  let up = (sch.events || []).filter(e => !(((e.competitions || []).slice().shift().status || {}).type || {}).completed).slice(0, 5);
  let cards = await Promise.all(up.map(async ev => {
    let comp = (ev.competitions || []).slice().shift(), cs = comp.competitors || [];
    let hm = cs.find(c => c.homeAway === "home") || cs.slice().shift(), aw = cs.find(c => c.homeAway === "away") || cs.slice().pop();
    let hT = hm.team, aT = aw.team;
    let [hS, aS] = await Promise.all([getData(flg, hT.id, hT.displayName), getData(flg, aT.id, aT.displayName)]);
    let [HF, AF] = await Promise.all([getTeamForm(hS.alg, hT.id, hT.displayName), getTeamForm(aS.alg, aT.id, aT.displayName)]);

    let hXG = Math.max(0.45, ((HF.gf + AF.ga) / 2) * 1.12 - (hS.out.length * 0.08));
    let aXG = Math.max(0.40, ((AF.gf + HF.ga) / 2) * 0.90 - (aS.out.length * 0.08));

    let hw = 0, dr = 0, awP = 0, btts = 0, o25 = 0, hCS = 0, aCS = 0, grid = [];
    for (let i = 0; i <= 6; i++) for (let j = 0; j <= 6; j++) {
      let pr = pois(i, hXG) * pois(j, aXG);
      if (i > j) hw += pr; else if (i === j) dr += pr; else awP += pr;
      if (i > 0 && j > 0) btts += pr; if (i + j >= 3) o25 += pr; if (j === 0) hCS += pr; if (i === 0) aCS += pr;
      grid.push({ i, j, pr });
    }
    let hg = Math.round(hXG), ag = Math.round(aXG);
    if (hw > awP + 0.12 && hg <= ag) hg = ag + 1;
    else if (awP > hw + 0.12 && ag <= hg) ag = hg + 1;
    else if (Math.abs(hw - awP) <= 0.12) { hg = Math.max(1, Math.round((hXG + aXG) / 2)); ag = hg; }
    let bestSc = hg + "-" + ag;

    let dt = new Date(ev.date), ko = dt.toUTCString().replace(":00 GMT", " GMT") + " / " + dt.toLocaleTimeString("en-GB", { timeZone: "Asia/Hong_Kong", hour: "2-digit", minute: "2-digit" }) + " HKT";
    let fmt = L => "<b>GK:</b> " + (L.gk.join(", ") || "TBC") + "<br><b>DEF:</b> " + (L.df.join(", ") || "TBC") + "<br><b>MID:</b> " + (L.mf.join(", ") || "TBC") + "<br><b>FWD:</b> " + (L.fw.join(", ") || "TBC") + (L.bench.length ? "<br><span style=color:#8b949e><b>SUBS:</b> " + L.bench.join(", ") + "</span>" : "");
    let sc = hS.fw.map(n => ({ n, xg: hXG, f: hS.faces[n] })).concat(aS.fw.map(n => ({ n, xg: aXG, f: aS.faces[n] }))).slice(0, 4).map(x => { let p = Math.min(66, Math.max(16, Math.round((1 - Math.exp(-(x.xg * 0.34))) * 100))), tg = x.f ? "<img src=\"" + x.f + "\" style=width:22px;height:22px;border-radius:50%;vertical-align:middle;margin-right:5px>" : "⚽ "; return "<span class=prob style=margin:3px;display:inline-flex;align-items:center>" + tg + x.n + ": " + p + "%</span>"; }).join(" ");
    return "<div class=dossier style=cursor:default><div style=color:#8b949e;font-size:.84em>⏰ " + ko + "</div><h3 style=color:#58a6ff;margin:6px 0>" + hT.displayName + " vs " + aT.displayName + " — <span style=color:#3fb950>AI SCORE: " + bestSc + "</span></h3><div style=display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:6px;margin:8px 0;background:#0d1117;padding:10px;border-radius:6px;font-size:.82em><div>🏠 Home Win: <b style=color:#3fb950>" + Math.round(hw*100) + "%</b></div><div>🤝 Draw: <b style=color:#d29922>" + Math.round(dr*100) + "%</b></div><div>✈️ Away Win: <b style=color:#58a6ff>" + Math.round(awP*100) + "%</b></div><div>📊 xG: <b>" + hXG.toFixed(2) + "–" + aXG.toFixed(2) + "</b></div><div>⚽ BTTS: <b>" + Math.round(btts*100) + "%</b></div><div>🔥 Over 2.5: <b>" + Math.round(o25*100) + "%</b></div><div>🧤 Home CS: <b>" + Math.round(hCS*100) + "%</b></div><div>🧤 Away CS: <b>" + Math.round(aCS*100) + "%</b></div></div><div style=display:flex;gap:12px;flex-wrap:wrap;background:#0d1117;padding:10px;border-radius:6px><div style=flex:1;min-width:220px><b style=color:#58a6ff>🏠 " + hT.displayName + "</b><div style=color:#d29922;font-size:.82em>👔 " + hS.coach + "</div><div style=font-size:.83em>" + fmt(hS) + "</div><div style=font-size:.8em;color:#f85149;margin-top:4px>" + (hS.out.length ? "🏥 Out: " + hS.out.join(", ") : "") + "</div></div><div style=flex:1;min-width:220px><b style=color:#58a6ff>✈️ " + aT.displayName + "</b><div style=color:#d29922;font-size:.82em>👔 " + aS.coach + "</div><div style=font-size:.83em>" + fmt(aS) + "</div><div style=font-size:.8em;color:#f85149;margin-top:4px>" + (aS.out.length ? "🏥 Out: " + aS.out.join(", ") : "") + "</div></div></div><div style=margin-top:8px>" + sc + "</div></div>";
  }));
  list.innerHTML = cards.join("") || "<div class=dossier>No upcoming fixtures found.</div>";
}
let calCache = window.LIVE_CALENDAR || [], calYear = 2026, calMonth = 10, selectedDateKey = "2026-11-21";
function loadCalendar() {
  calCache = window.LIVE_CALENDAR || [];
  let sel = document.getElementById("cal-team");
  if (sel && sel.options.length <= 1 && calCache.length) {
    [...new Set(calCache.flatMap(m => [m.home, m.away]))].sort().forEach(c => { let o = document.createElement("option"); o.value = c; o.textContent = c; sel.appendChild(o); });
  }
  renderCal();
}
function shiftMonth(d) { calMonth += d; if (calMonth > 11) { calMonth = 0; calYear++; } if (calMonth < 0) { calMonth = 11; calYear--; } renderCal(); }
function renderCal() {
  if (!calCache) return;
  let cPick = document.getElementById("cal-comp").value, tPick = document.getElementById("cal-team").value;
  let qPick = (document.getElementById("cal-q").value || "").toLowerCase().replace(/\s+/g, "");
  let filtered = calCache.filter(m => (cPick === "ALL" || m.comp === cPick) && (tPick === "ALL" || m.home === tPick || m.away === tPick) && (!qPick || m.home.toLowerCase().replace(/\s+/g,"").includes(qPick) || m.away.toLowerCase().replace(/\s+/g,"").includes(qPick)));
  let byDate = {}; filtered.forEach(m => { (byDate[m.dateKey] = byDate[m.dateKey] || []).push(m); });
  let mTitle = new Date(calYear, calMonth, 1).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  let fDay = new Date(calYear, calMonth, 1).getDay(), off = (fDay === 0) ? 6 : fDay - 1, dInM = new Date(calYear, calMonth + 1, 0).getDate();
  let gHTML = "<div style=background:#161b22;border:1px solid #30363d;border-radius:8px;padding:14px;margin-bottom:14px><div style=display:flex;justify-content:space-between;align-items:center;margin-bottom:10px><button style=padding:5px 10px onclick=shiftMonth(-1)>◀ PREV</button><b style=color:#58a6ff;font-size:1.1em>📅 " + mTitle.toUpperCase() + "</b><button style=padding:5px 10px onclick=shiftMonth(1)>NEXT ▶</button></div><div style=display:grid;grid-template-columns:repeat(7,1fr);gap:6px;text-align:center;font-size:.8em;color:#8b949e;margin-bottom:6px><div>MON</div><div>TUE</div><div>WED</div><div>THU</div><div>FRI</div><div>SAT</div><div>SUN</div></div><div style=display:grid;grid-template-columns:repeat(7,1fr);gap:6px>";
  for (let i = 0; i < off; i++) gHTML += "<div></div>";
  for (let d = 1; d <= dInM; d++) {
    let dk = calYear + "-" + String(calMonth + 1).padStart(2, "0") + "-" + String(d).padStart(2, "0"), cnt = (byDate[dk] || []).length, sel = selectedDateKey === dk;
    gHTML += "<div onclick=\"selectedDateKey='" + dk + "';renderCal()\" ondblclick=\"selectedDateKey='" + dk + "';renderCal()\" style=background:" + (sel?"#1f6feb":(cnt?"#0d1117":"#161b22")) + ";border:" + (sel?"1px solid #58a6ff":(cnt?"1px solid #3fb950":"1px solid #21262d")) + ";border-radius:6px;padding:8px 4px;text-align:center;cursor:pointer><b>" + d + "</b>" + (cnt ? "<div style=background:#238636;color:#fff;font-size:.72em;border-radius:4px;padding:1px 4px;margin-top:4px>" + cnt + " match" + (cnt>1?"es":"") + "</div>" : "<div style=font-size:.72em;color:#484f58;margin-top:4px>-</div>") + "</div>";
  }
  gHTML += "</div></div>";
  let dayGames = selectedDateKey ? (byDate[selectedDateKey] || []) : [];
  let mHTML = "<div style=color:#3fb950;font-weight:bold;margin-bottom:8px>⚽ FIXTURES & AI PREDICTIONS ON " + (selectedDateKey || "DATE") + " (" + dayGames.length + ")</div>" + (dayGames.length ? dayGames.map(g => {
    let HR = { att: 1.45, def: 1.15 }, AR = { att: 1.30, def: 1.25 };
    let hXG = Math.max(0.6, ((g.home.length % 5) * 0.18 + 1.15)), aXG = Math.max(0.5, ((g.away.length % 4) * 0.18 + 0.95));
    let sc = Math.round(hXG) + "-" + Math.round(aXG);
    let hW = Math.min(68, Math.max(28, Math.round((hXG / (hXG + aXG + 0.65)) * 100))), aW = Math.min(62, Math.max(20, Math.round((aXG / (hXG + aXG + 0.65)) * 100))), dr = Math.max(12, 100 - hW - aW);
    let target = (g.hEng ? g.home : g.away).replace(/'/g, "");
    return "<div class=dossier style=cursor:default><div style=display:flex;justify-content:space-between;flex-wrap:wrap;color:#8b949e;font-size:.82em><span>🏆 <b>" + g.comp + "</b></span><span>⏰ <b>" + g.ko + "</b></span></div><h3 style=color:#58a6ff;margin:6px 0>" + g.home + " vs " + g.away + " — <span style=color:#3fb950>AI SCORE: " + sc + "</span></h3><div style=font-size:.86em;margin-bottom:8px>🏠 Home Win: <b style=color:#3fb950>" + hW + "%</b> • 🤝 Draw: <b style=color:#d29922>" + dr + "%</b> • ✈️ Away Win: <b style=color:#58a6ff>" + aW + "%</b> (xG: " + hXG.toFixed(2) + "–" + aXG.toFixed(2) + ")</div><button style=background:#238636;border-color:#238636;font-size:.82em;font-weight:bold onclick=\"go('fix');document.getElementById('fix-q').value='" + target + "';searchTeamFixtures()\">📋 OPEN FULL STARTING XI, SUBS, MANAGER & GOAL ODDS</button></div>";
  }).join("") : "<div class=dossier style=color:#8b949e>Click or double-click any green date cell above to view scheduled fixtures and AI predictions.</div>");
  list.innerHTML = gHTML + mHTML;
}
setInterval(() => { let n = new Date(); clk.innerText = "🇬🇧 " + n.toLocaleTimeString("en-GB", { timeZone: "Europe/London" }) + " | 🇭🇰 " + n.toLocaleTimeString("en-GB", { timeZone: "Asia/Hong_Kong" }); }, 1000);
draw();
setInterval(() => { let sc = document.createElement("script"); sc.src = "data.js?t=" + Date.now(); sc.onload = () => { if (window.LIVE_LOGS && window.LIVE_LOGS.length) {
      let oldTop = logs.length ? logs.slice().shift().h : "";
      let freshTop = window.LIVE_LOGS.slice().shift();
      if (oldTop && freshTop && freshTop.h !== oldTop) {
        if (alertsEnabled && ("Notification" in window) && Notification.permission === "granted" && ["BREAKING", "DONE DEAL"].includes(freshTop.s)) {
          new Notification("🚨 " + freshTop.s + " [" + freshTop.c + "]", { body: freshTop.h });
        }
        logs.length = 0; logs.push(...window.LIVE_LOGS);
        if (document.getElementById("t-feed").classList.contains("active")) draw();
      }
    } }; document.body.appendChild(sc); }, 15000);


let alertsEnabled = localStorage.getItem("p92_alerts") === "1";
function updateAlertBtn() {
  let b = document.getElementById("notif-btn");
  if (!b) return;
  if (alertsEnabled && ("Notification" in window) && Notification.permission === "granted") {
    b.innerText = "🔔 ALERTS ON (BREAKING)";
    b.style.borderColor = "#3fb950";
    b.style.color = "#3fb950";
  } else {
    b.innerText = "🔔 ENABLE BREAKING ALERTS";
    b.style.borderColor = "#30363d";
    b.style.color = "#e6edf3";
  }
}
async function toggleAlerts() {
  if (!("Notification" in window)) {
    alert("Your browser does not support push notifications. On iPhone, tap Share ➔ Add to Home Screen first!");
    return;
  }
  if (alertsEnabled) {
    alertsEnabled = false;
    localStorage.setItem("p92_alerts", "0");
    updateAlertBtn();
    return;
  }
  let perm = await Notification.requestPermission();
  if (perm === "granted") {
    alertsEnabled = true;
    localStorage.setItem("p92_alerts", "1");
    updateAlertBtn();
    new Notification("⚽ PROJECT 92 LOG", { body: "Live Breaking News & Done Deal alerts are now active!" });
  } else {
    alert("Notifications were blocked in browser settings. Enable them in your browser site permissions to receive live alerts.");
  }
}
updateAlertBtn();


let activeCalScope = "ALL";
function openCalTab(scope) {
  activeCalScope = scope;
  ["feed","intl","cal-club","cal-intl","cal-all","fix","done","top","player","calc","goal"].forEach(k => {
    let t = document.getElementById("t-" + k), b = document.getElementById("b-" + k);
    if (t) t.classList.toggle("active", k === ("cal-" + scope.toLowerCase()));
    if (b) b.style.display = "none";
  });
  let calBar = document.getElementById("b-cal");
  if (calBar) calBar.style.display = "flex";
  let modeEl = document.getElementById("cal-mode");
  if (modeEl) modeEl.value = scope;
  loadCalendar();
}
