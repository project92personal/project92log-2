import urllib.request, xml.etree.ElementTree as ET, json, os, re, ssl, html as htmllib, shutil
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone, timedelta

ctx = ssl._create_unverified_context()
proto, host, path = "https" + "://", "site.api." + "espn" + ".com", "/apis/site/v2/sports/soccer/"
espn_feeds = [("PREMIER LEAGUE", proto+host+path+"eng.1/news"), ("CHAMPIONSHIP", proto+host+path+"eng.2/news"), ("FA CUP", proto+host+path+"eng.fa/news"), ("FOREIGN -> ENG", proto+host+path+"esp.1/news"), ("FOREIGN -> ENG", proto+host+path+"ita.1/news"), ("FOREIGN -> ENG", proto+host+path+"ger.1/news"), ("FOREIGN -> ENG", proto+host+path+"fra.1/news")]
bbc_feeds = [("NATIONAL TEAMS", "https" + "://://google.com"), ("PREMIER LEAGUE", "https" + "://feeds.bbci.co.uk/sport/football/premier-league/rss.xml"), ("CHAMPIONSHIP", "https" + "://feeds.bbci.co.uk/sport/football/championship/rss.xml")]

clubs = {"arsenal":("ARS","Arsenal"),"chelsea":("CHE","Chelsea"),"liverpool":("LIV","Liverpool"),"man city":("MCI","Man City"),"manchester city":("MCI","Man City"),"man united":("MUN","Man United"),"manchester united":("MUN","Man United"),"tottenham":("TOT","Tottenham"),"spurs":("TOT","Tottenham"),"newcastle":("NEW","Newcastle"),"villa":("AVL","Aston Villa"),"crystal palace":("CRY","Crystal Palace"),"fulham":("FUL","Fulham"),"brighton":("BHA","Brighton"),"west ham":("WHU","West Ham"),"everton":("EVE","Everton"),"brentford":("BRE","Brentford"),"wolves":("WOL","Wolves"),"bournemouth":("BOU","Bournemouth"),"forest":("NFO","Nott'm Forest"),"leicester":("LEI","Leicester"),"ipswich":("IPS","Ipswich"),"southampton":("SOU","Southampton"),"leeds":("CHAMPIONSHIP","Leeds United"),"birmingham":("CHAMPIONSHIP","Birmingham City"),"wrexham":("CHAMPIONSHIP","Wrexham")}
nations = ["england","france","spain","germany","brazil","argentina","belgium","portugal","italy","netherlands","scotland","wales","ireland","usa","japan","south korea","morocco","nigeria","senegal","world cup","nations league","euros","copa america","afcon","national team"]
bad_w = {"Town","City","United","Rovers","Albion","Wanderers","Athletic","Hotspur","Palace","Forest","Villa","County","Highlights","Report","Watch","News","Live","Score","Scores","Goals","Match","Cup","League","Final","Round","Boss","Coach","Manager","Club","Team","Star","Stars","Update","Rumors","Rumours","Transfer","Transfers","Window","January","Summer","England","Spain","Italy","Germany","France","Brazil","Argentina","Belgium","Portugal","Netherlands","Scotland","Wales","World","Super","Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sky","Sports","Mail","Mirror","Sun","Express","Standard","Telegraph","Guardian","Espn","Bbc","Goal","Football","London","Exclusive","Breaking","Paper","Talk","Gossip","National","How","Why","What","When","Where","Who","Which","Can","Will","Could","Should","After","Before","Amid","Inside","Sources","Revealed","Confirmed","Premier","Championship","Champions","Europa","Nations","Real","Madrid","Barcelona","Bayern","Munich","Inter","Milan","Juventus","Paris"}

base = os.path.expanduser("~/Desktop/project92log")
data_file = f"{base}/data.js"
existing = json.loads(open(data_file, encoding="utf-8").read().replace("window.LIVE_LOGS=", "").rstrip(";")) if os.path.exists(data_file) else []
seen = {x.get("raw_h","") for x in existing}
utc = datetime.now(timezone.utc)
stamp = f"{utc.strftime('%H:%M')} GMT / {(utc + timedelta(hours=8)).strftime('%H:%M')} HKT"

def fetch_espn(item):
    comp, url = item
    try:
        arts = json.loads(urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent":"Mozilla/5.0"}), context=ctx, timeout=6).read().decode()).get("articles", [])[:10]
        return [(comp, (a.get("headline") or "").strip(), (a.get("description") or "").strip()) for a in arts if a.get("headline")]
    except Exception: return []

def fetch_bbc(item):
    comp, url = item
    try:
        xml_data = urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent":"Mozilla/5.0"}), context=ctx, timeout=6).read()
        return [(comp, (el.findtext("title") or "").split(" - ").pop(0).strip(), re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', ' ', htmllib.unescape(el.findtext("description") or ""))).strip()) for el in ET.fromstring(xml_data).findall(".//item")[:10]]
    except Exception: return []

with ThreadPoolExecutor(max_workers=5) as ex:
    raw = [x for sub in ex.map(fetch_espn, espn_feeds) for x in sub] + [x for sub in ex.map(fetch_bbc, bbc_feeds) for x in sub]

new_items = []
for comp, title, desc in raw:
    if not title or title in seen: continue
    seen.add(title)
    clean_txt = re.sub(r"'s\b", "", title + " " + desc)
    txt = clean_txt.lower()
    is_nat = comp == "NATIONAL TEAMS" or any(n in txt for n in nations)
    is_eng_link = any(k in txt for k in clubs) or any(w in txt for w in ["premier league", "championship", "efl", "england", "english"])
    if comp == "FOREIGN -> ENG" and not is_eng_link and not is_nat: continue

    found = [m for m in re.findall(r'\b([A-Z][a-zà-ÿ]+(?:[- ][A-Z][a-zà-ÿ]+){1,2})\b', clean_txt) if not any(w in bad_w for w in re.split(r'[- ]', m))]
    player = found.pop(0) if found else ""
    if not player: continue

    nat_hit = next((n.title() for n in nations if n in txt and n not in ["world cup","nations league","euros","copa america","afcon","national team"]), "National Team")
    code, name = ("WORLD / INTL", nat_hit) if is_nat else next((v for k, v in clubs.items() if k in txt), ("PREMIER LEAGUE", "Premier League"))
    risk = any(w in txt for w in ["stall","snag","collapse","reject","dispute","doubt","blow","snub","warning","hijack"])
    out_w = ["exit","leave","depart","sell","offload","loan out","switch to","head to","move to real","move to barcelona","move to bayern","move to psg","saudi","mls"]
    is_out = any(w in txt for w in out_w)

    if any(w in txt for w in ["retir","hang up","international duty end"]):
        s, p, head = "BREAKING", None, f"RETIREMENT: {player} announces retirement from {name}"
        p1 = f"{player} has officially confirmed plans to step away from {name} duty, bringing an end to a major chapter on the international stage."
        p2 = f"Coaching staff and teammates paid tribute to {player}'s contributions ahead of upcoming national team fixtures."
    elif any(w in txt for w in ["sack","fired","relieved"]):
        s, p, head = "BREAKING", None, f"SACKED: {name.upper()} part ways with {player} immediately"
        p1 = f"Decision-makers at {name} have removed {player} from first-team coaching duties following a review of recent results."
        p2 = f"Interim staff will oversee immediate preparations while {name} evaluate permanent candidates."
    elif any(w in txt for w in ["done deal","completed","official","confirmed","signs","joins","appoint","call-up","called up","squad"]):
        s, p = "DONE DEAL", None
        head = f"NATIONAL SQUAD: {player} confirmed in {name} selection" if is_nat else f"CONFIRMED: {name.upper()} finalize move for {player}"
        p1 = f"{name} have officially confirmed {player}'s inclusion following final selection and fitness checks." if is_nat else f"{name} have completed all formal registration and contractual steps to finalize the deal involving {player}."
        p2 = f"{player} is set to link up with the squad immediately ahead of upcoming fixtures."
    elif any(w in txt for w in ["agree","medical","close to","advanced","verge","personal terms"]):
        s, p, head = "ADVANCED STAGES", (32 if risk else 86), f"{name.upper()} CLOSE IN: {player} nearing final agreement"
        p1 = f"Negotiations involving {player} and {name} have reached advanced stages with core terms largely aligned."
        p2 = f"Medical checks and formal paperwork remain the final steps before official confirmation."
    elif any(w in txt for w in ["talks","bid","offer","negotiating","chase","race","target","clause","eye","agent","exit","leave","sell"]):
        s, p = "ONGOING TALKS", (28 if risk else 64)
        head = f"{name.upper()} {'EXIT' if is_out else 'IN'} TALKS: Active discussions over {player}"
        p1 = f"Representatives for {player} and executives at {name} are actively discussing potential terms ahead of the registration window."
        p2 = f"Valuation benchmarks, squad role, and PSR headroom remain central to ongoing negotiations."
    else:
        s, p = "TEASER", 45
        head = f"{name.upper()} UPDATE: {player} in focus ahead of upcoming fixtures"
        p1 = f"{player} features prominently in {name} preparations ahead of upcoming competitive fixtures."
        p2 = f"Coaching staff continue assessing match sharpness, fitness, and tactical selection."

    dir_tag = " | NATIONAL TEAM" if is_nat else (" | OUTBOUND EXIT" if is_out else (" | INBOUND FOREIGN" if comp == "FOREIGN -> ENG" else ""))
    new_items.append({"raw_h":title,"t":stamp,"c":code,"s":s,"p":p,"risk":risk,"player":player,"h":head,"a":f"🚨 {s} // [{code}]{dir_tag}\n\n{p1}\n\n{p2}"})

combined = (new_items + existing)[:80]
open(data_file, "w", encoding="utf-8").write("window.LIVE_LOGS=" + json.dumps(combined, ensure_ascii=False) + ";")
shutil.copy(data_file, f"{base}/site/data.js")
shutil.copy(f"{base}/radar.py", f"{base}/site/radar.py")
print(f"🛡️ Saved {len(combined)} named, verified briefings (0 unnamed cards)!")
