#!/usr/bin/env python3
"""Add ten Career outfits to the current static Scholar build without touching progress."""
import json
from pathlib import Path

root = Path(__file__).resolve().parent.parent
bundle = root / "assets/index-Dmik1R0C.js"
html = root / "scholar/index.html"
catalog = json.loads((root / "art/doll/medical/manifest.json").read_text(encoding="utf8"))
items = catalog["items"]
assert len(items) == 10
assert [x["requiredMastery"] for x in items] == list(range(10, 101, 10))
for x in items:
    assert (root / x["image"].lstrip("/")).is_file(), x["image"]

src = bundle.read_text(encoding="utf8")
if "medical-01-forensic-pathologist" not in src:
    tick = chr(96)
    categories = "Pc=[" + ",".join(tick + x + tick for x in ["Uniform", "Latin", "French", "Youth"]) + "];function Fc"
    assert src.count(categories) == 1, "Cannot locate original Wardrobe categories"
    outfits = []
    for index, x in enumerate(items, 1):
        rid = f"medical-{index:02d}-{x['id']}"
        outfits.append({
            "id": rid, "name": x["name"],
            "blurb": f"Medical career collection · {x['nameZh']}",
            "art": x["image"], "closet": x["image"],
            "need": f"Reach {x['requiredMastery']} Masteries",
            "category": "Medical"
        })
    injection = "Pc=[" + ",".join(tick + x + tick for x in ["Uniform", "Latin", "French", "Youth"]) + "];Nc.push(..."+json.dumps(outfits, ensure_ascii=False, separators=(",", ":"))+");Pc.push('Medical');function Fc"
    src = src.replace(categories, injection, 1)

    unlock = "function Fc(e,t){let n=Oc(t.xp).level"
    assert src.count(unlock) == 1, "Cannot locate outfit unlocking rule"
    src = src.replace(unlock,
        "function Fc(e,t){let m=String(e).match(/^medical-(\\d\\d)-/);if(m)return(t.masteryCount??0)>=Number(m[1])*10;let n=Oc(t.xp).level",
        1)

    mastery = "latinTopics:Vu(e),latinXp:e.latinXp??0"
    assert src.count(mastery) == 1, "Cannot locate progress snapshot"
    src = src.replace(mastery,
        "latinTopics:Vu(e),masteryCount:Object.values(e.seenCorrect||{}).filter(v=>Number(v)>0).length,latinXp:e.latinXp??0",
        1)
    old = "Uniform, Latin, French, British youth — twenty complete looks."
    src = src.replace(old, "Uniform, Latin, French, Medical, British youth — thirty complete looks.")
    assert src.count("medical-01-forensic-pathologist") == 1
    bundle.write_text(src, encoding="utf8")

page = html.read_text(encoding="utf8")
if ">Medical</button>" not in page:
    loc = page.index(">Youth</button>")
    start = page.rfind("<button", 0, loc)
    assert start >= 0
    youth = page[start:loc + len(">Youth</button>")]
    assert youth.startswith("<button") and youth.endswith(">Youth</button>")
    page = page.replace(youth, youth + youth.replace(">Youth</button>", ">Medical</button>"), 1)
    page = page.replace("Uniform, Latin, French, British youth — twenty complete looks.",
        "Uniform, Latin, French, Medical, British youth — thirty complete looks.")
    html.write_text(page, encoding="utf8")

assert "medical-10-medical-student" in bundle.read_text(encoding="utf8")
assert "Medical</button>" in html.read_text(encoding="utf8")
print("Medical careers installed: 10 outfits, milestone thresholds 10..100, original progress preserved.")
