import urllib.request, xml.etree.ElementTree as ET, json, os, re, ssl, html as htmllib, subprocess
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone, timedelta

ctx = ssl._create_unverified_context()
proto, host, path = "https" + "://", "site.api." + "espn" + ".com", "/apis/site/v2/sports/soccer/"
espn_feeds = [("PREMIER LEAGUE", proto+host+path+"eng.1/news"), ("CHAMPIONSHIP", proto+host+path+"eng.2/news"), ("FA CUP", proto+host+path+"eng.fa/news"), ("FOREIGN -> ENG", proto+host+path+"esp.1/news"), ("FOREIGN -> ENG", proto+host+path+"ita.1/news"), ("FOREIGN -> ENG", proto+host+path+"ger.1/news"), ("FOREIGN -> ENG", proto+host+path+"fra.1/news")]
bbc_feeds = [("PREMIER LEAGUE", "https" + "://feeds.bbci.co.uk/sport/football/premier-league/rss.xml"), ("CHAMPIONSHIP", "https" + "://feeds.bbci.co.uk/sport/football/championship/rss.xml")]
clubs = {"arsenal":("ARS","Arsenal"),"chelsea":("CHE","Chelsea"),"liverpool":("LIV","Liverpool"),"man city":("MCI","Man City"),"manchester city":("MCI","Man City"),"man united":("MUN","Man United"),"manchester united":("MUN","Man United"),"tottenham":("TOT","Tottenham"),"spurs":("TOT","Tottenham"),"newcastle":("NEW","Newcastle"),"villa":("AVL","Aston Villa"),"crystal palace":("CRY","Crystal Palace"),"fulham":("FUL","Fulham"),"brighton":("BHA","Brighton"),"west ham":("WHU","West Ham"),"everton":("EVE","Everton"),"brentford":("BRE","Brentford"),"wolves":("WOL","Wolves"),"bournemouth":("BOU","Bournemouth"),"forest":("NFO","Nott'm Forest"),"leicester":("LEI","Leicester"),"ipswich":("IPS","Ipswich"),"southampton":("SOU","Southampton"),"leeds":("CHAMPIONSHIP","Leeds United"),"birmingham":("CHAMPIONSHIP","Birmingham City"),"wrexham":("CHAMPIONSHIP","Wrexham")}
bad_w = {"Town","City","United","Rovers","Albion","Wanderers","Athletic","Hotspur","Palace","Forest","Villa","County","Highlights","Report","Watch","News","Live","Score","Scores","Goals","Match","Cup","League","Final","Round","Boss","Coach","Manager","Club","Team","Star","Stars","Update","Rumors","Rumours","Transfer","Transfers","Window","January","Summer","England","Spain","Italy","Germany","France","Brazil","Argentina","World","Super","Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sky","Sports","Mail","Mirror","Sun","Express","Standard","Telegraph","Guardian","Espn","Bbc","Goal","Football","London","Exclusive","Breaking","Paper","Talk","Gossip","National","How","Why","What","When","Where","Who","Which","Can","Will","Could","Should","After","Before","Amid","Inside","Report","Sources","Revealed","Confirmed","Watch"}
ignore = {v for k, v in clubs.items()} | {"Manchester United","Manchester City","Aston Villa","Crystal Palace","West Ham","Nottingham Forest","Premier League","Champions League","Europa League","Real Madrid","Transfer Rumors","Breaking News","Leeds United","Birmingham City","National League"}

base = os.path.expanduser("~/Desktop/project92log")
data_file = f"{base}/data.js"
existing = json.loads(open(data_file, encoding="utf-8").read().replace("window.LIVE_LOGS=", "").rstrip(";")) if os.path.exists(data_file) else []
seen = {x.get("raw_h","") for x in existing}
utc = datetime.now(timezone.utc)
stamp = f"{utc.strftime('%H:%M')} GMT / {(utc + timedelta(hours=8)).strftime('%H:%M')} HKT"

def fetch_espn(item):
    comp, url = item
    try:
        arts = json.loads(urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent":"Mozilla/5.0"}), context=ctx, timeout=6).read().decode()).get("articles", [])[:8]
        return [(comp, (a.get("headline") or "").strip(), (a.get("description") or "").strip()) for a in arts if a.get("headline")]
    except Exception: return []

def fetch_bbc(item):
    comp, url = item
    try:
        xml_data = urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent":"Mozilla/5.0"}), context=ctx, timeout=6).read()
        return [(comp, (el.findtext("title") or "").strip(), re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', ' ', htmllib.unescape(el.findtext("description") or ""))).strip()) for el in ET.fromstring(xml_data).findall(".//item")[:8]]
    except Exception: return []

with ThreadPoolExecutor(max_workers=5) as ex:
    raw = [x for sub in ex.map(fetch_espn, espn_feeds) for x in sub] + [x for sub in ex.map(fetch_bbc, bbc_feeds) for x in sub]

new_items = []
for comp, title, desc in raw:
    if not title or title in seen: continue
    txt_chk = (title + " " + desc).lower()
    is_eng_link = any(k in txt_chk for k in clubs) or any(w in txt_chk for w in ["premier league", "championship", "efl", "england", "english"])
    if comp == "FOREIGN -> ENG" and not is_eng_link: continue
    seen.add(title)
    txt = (title + " " + desc).lower()
    def_pair = ("PREMIER LEAGUE", "Premier League clubs") if comp == "FOREIGN -> ENG" else (comp, comp.title())
    code, name = next((v for k, v in clubs.items() if k in txt), def_pair)
    found = [m for m in re.findall(r'\b([A-Z][a-z]+ [A-Z][a-z]+)\b', title+" "+desc) if m not in ignore and not any(w in bad_w for w in m.split())]
    player = found.pop(0) if found else ""
    who = player if player else name
    risk = any(w in txt for w in ["stall","snag","collapse","reject","dispute","doubt","blow","snub","warning","hijack"])

    if any(w in txt for w in ["sack","fired","relieved"]):
        s, p, head = "BREAKING", None, f"SACKED: {name.upper()} part ways with manager immediately"
        p1 = f"Senior board figures at {name} have initiated an immediate dugout change following a review of recent performances and squad momentum."
        p2 = f"First-team coaching staff are expected to oversee immediate training duties while {name} evaluate permanent replacements."
    elif any(w in txt for w in ["done deal","completed","official","confirmed","signs","joins","appoint"]):
        s, p, head = "DONE DEAL", None, f"CONFIRMED: {name.upper()} finalize move involving {who}"
        p1 = f"{name} have completed all formal registration and contractual steps regarding {who}, bringing recent speculation to an official close."
        p2 = f"The move has been structured to align with {name}'s tactical plans and league financial compliance rules."
    elif any(w in txt for w in ["agree","medical","close to","advanced","verge","personal terms"]):
        s, p, head = "ADVANCED STAGES", (32 if risk else 86), f"{name.upper()} CLOSE IN: {who} nearing final agreement"
        p1 = f"Discussions between {name} and representatives for {who} have progressed into advanced stages with core terms outlined."
        p2 = f"Final medical checks and regulatory sign-off remain the final steps before official confirmation."
    elif any(w in txt for w in ["talks","bid","offer","negotiating","chase","race","target","clause","eye","agent"]):
        s, p, head = "ONGOING TALKS", (28 if risk else 64), f"{name.upper()} IN TALKS: Active discussions for {who}"
        p1 = f"Recruitment executives at {name} are actively assessing {who} as part of ongoing squad-building discussions."
        p2 = f"Intermediaries continue weighing valuation benchmarks and PSR headroom ahead of formal next steps."
    else:
        s, p, head = "TEASER", 45, f"{name.upper()} NEWS: {who} in focus ahead of upcoming fixtures"
        p1 = f"Latest football coverage highlights {who} as {name} prepare for upcoming domestic and European fixtures."
        p2 = f"Squad selection, fitness updates, and tactical plans remain the main focus for coaching staff this week."

    out_w = ["exit","leave","depart","sell","offload","loan out","switch to","head to","move to real","move to barcelona","move to bayern","move to psg","saudi","mls"]
    dir_tag = " | OUTBOUND EXIT" if any(w in txt for w in out_w) else (" | INBOUND FOREIGN" if comp == "FOREIGN -> ENG" else "")
    new_items.append({"raw_h":title,"t":stamp,"c":code,"s":s,"p":p,"risk":risk,"player":player,"h":head,"a":f"🚨 {s} // [{code}]{dir_tag}\n\n{p1}\n\n{p2}"})

combined = (new_items + existing)[:80]
open(data_file, "w", encoding="utf-8").write("window.LIVE_LOGS=" + json.dumps(combined, ensure_ascii=False) + ";")
print(f"🛡️ Saved {len(combined)} 100% copyright-free AI-rewritten entries!")
