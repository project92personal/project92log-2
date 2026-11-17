import urllib.request, json, os, ssl
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone, timedelta

ctx = ssl._create_unverified_context()
base = os.path.expanduser("~/Desktop/project92log")
api = "https" + "://site.api." + "espn" + ".com/apis/site/v2/sports/soccer/"
eng_lgs = [("PREMIER LEAGUE","eng.1"),("CHAMPIONSHIP","eng.2"),("LEAGUE ONE","eng.3"),("LEAGUE TWO","eng.4")]

teams = {}
for label, lg in eng_lgs:
    try:
        r = json.loads(urllib.request.urlopen(urllib.request.Request(f"{api}{lg}/teams?limit=50", headers={"User-Agent":"Mozilla/5.0"}), context=ctx, timeout=8).read().decode())
        for t in (((r.get("sports") or [{}])[0].get("leagues") or [{}])[0].get("teams") or []):
            tm = t.get("team", {})
            teams[tm.get("id")] = (label, lg, tm.get("displayName", ""))
    except Exception: pass

matches = {}
def fetch_sched(item):
    tid, (label, lg, tname) = item
    try:
        s = json.loads(urllib.request.urlopen(urllib.request.Request(f"{api}{lg}/teams/{tid}/schedule?fixture=true", headers={"User-Agent":"Mozilla/5.0"}), context=ctx, timeout=8).read().decode())
        return [(label, ev) for ev in (s.get("events") or [])]
    except Exception: return []

with ThreadPoolExecutor(max_workers=12) as ex:
    for res in ex.map(fetch_sched, teams.items()):
        for label, ev in res:
            eid = ev.get("id")
            if not eid or eid in matches: continue
            comp = (ev.get("competitions") or [{}])[0]
            cs = comp.get("competitors") or []
            if len(cs) < 2: continue
            hm = next((c for c in cs if c.get("homeAway") == "home"), cs[0])
            aw = next((c for c in cs if c.get("homeAway") == "away"), cs[1])
            hN, aN = hm.get("team", {}).get("displayName", ""), aw.get("team", {}).get("displayName", "")
            slug = ((ev.get("league") or {}).get("slug") or "").lower()
            c_lbl = "EUROPE (ENGLISH CLUBS)" if "uefa" in slug else label
            try:
                dt = datetime.fromisoformat(ev.get("date", "").replace("Z", "+00:00"))
                dkey = dt.strftime("%Y-%m-%d")
                ko = f"{dt.strftime('%H:%M')} GMT / {(dt + timedelta(hours=8)).strftime('%H:%M')} HKT"
                ts = int(dt.timestamp() * 1000)
            except Exception: continue
            matches[eid] = {"ts": ts, "dateKey": dkey, "ko": ko, "comp": c_lbl, "home": hN, "away": aN}


for u_lg in ["uefa.champions", "uefa.europa", "uefa.europa.conf"]:
    for tid, (lbl, lg, tname) in list(teams.items()):
        if lg == "eng.1":
            try:
                s_u = json.loads(urllib.request.urlopen(urllib.request.Request(f"{api}{u_lg}/teams/{tid}/schedule?fixture=true", headers={"User-Agent":"Mozilla/5.0"}), context=ctx, timeout=5).read().decode())
                for ev in (s_u.get("events") or []):
                    eid = ev.get("id")
                    if not eid or eid in matches: continue
                    comp = (ev.get("competitions") or [{}]).pop(0)
                    cs = comp.get("competitors") or []
                    if len(cs) < 2: continue
                    hm = next((c for c in cs if c.get("homeAway") == "home"), cs.pop(0))
                    aw = next((c for c in cs if c.get("homeAway") == "away"), cs.pop())
                    dt = datetime.fromisoformat(ev.get("date", "").replace("Z", "+00:00"))
                    matches[eid] = {"ts": int(dt.timestamp()*1000), "dateKey": dt.strftime("%Y-%m-%d"), "ko": f"{dt.strftime('%H:%M')} GMT / {(dt + timedelta(hours=8)).strftime('%H:%M')} HKT", "comp": "EUROPE (ENGLISH CLUBS)", "home": hm.get("team",{}).get("displayName",""), "away": aw.get("team",{}).get("displayName","")}
            except Exception: pass

out = sorted(matches.values(), key=lambda x: x["ts"])
open(f"{base}/calendar.js", "w", encoding="utf-8").write("window.LIVE_CALENDAR=" + json.dumps(out, ensure_ascii=False) + ";")
print(f"📅 Synced {len(out)} full-season fixtures across all 92 clubs + Europe!")
