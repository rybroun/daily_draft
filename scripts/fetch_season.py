#!/usr/bin/env python3
"""Pull one NFL season from nflverse into the shape `daily_draft` bundles.

    python3 scripts/fetch_season.py 2007

Writes data/nfl-<year>.json, and data/nfl-<year>-injuries.json when injury
reports exist for that year — nflverse publishes them from 2009 onward, so
earlier seasons simply have none and the file is skipped rather than faked.

Two things this corrects on the way through:

  * Team codes. nflverse normalises to the modern franchise (LA, LAC, LV), so a
    2007 pull claims Tomlinson played for the Chargers of Los Angeles. The
    era-correct codes survive inside game_id, and are recovered from there.
  * Nothing else. Missing weeks stay missing; no zero-filling, no interpolation.
"""
import csv, io, json, sys, urllib.request
from collections import Counter, defaultdict
from datetime import datetime, timezone

RELEASE = "https://github.com/nflverse/nflverse-data/releases/download"
KEEP = {"QB", "RB", "WR", "TE", "K", "FB"}

# nflverse column -> our key. Anything not listed is dropped.
STATS = {
    "receptions": "rec", "targets": "tgt", "receiving_yards": "recYds",
    "receiving_tds": "recTd", "carries": "rushAtt", "rushing_yards": "rushYds",
    "rushing_tds": "rushTd", "passing_yards": "passYds", "passing_tds": "passTd",
    "passing_interceptions": "int", "fumbles_lost_total": "fumLost",
    "special_teams_tds": "stTd", "passing_2pt_conversions": "passTwoPt",
    "fg_made": "fgMade", "fg_att": "fgAtt", "fg_made_40_49": "fgMade40_49",
    "pat_made": "patMade", "pat_att": "patAtt",
}
SUMMED = {
    "twoPt": ["rushing_2pt_conversions", "receiving_2pt_conversions"],
    "fgMade0_39": ["fg_made_0_19", "fg_made_20_29", "fg_made_30_39"],
    "fgMade50": ["fg_made_50_59", "fg_made_60_"],
}


def fetch(path):
    with urllib.request.urlopen(f"{RELEASE}/{path}") as r:
        return list(csv.DictReader(io.StringIO(r.read().decode("utf-8"))))


def number(row, column):
    raw = (row.get(column) or "").strip()
    if raw in ("", "NA"):
        return 0
    return round(float(raw), 3)


def era_codes(rows):
    """Recover the codes each franchise actually used that season."""
    votes = defaultdict(Counter)
    for row in rows:
        parts = (row.get("game_id") or "").split("_")
        if len(parts) < 4:
            continue
        era = {parts[2], parts[3]}
        modern = {row["team"], row["opponent_team"]}
        # Where one side already agrees, the other pair must map to each other.
        settled = era & modern
        for code in modern - settled:
            for candidate in era - settled:
                votes[code][candidate] += 1
    return {code: tally.most_common(1)[0][0] for code, tally in votes.items()}


def main(year):
    rows = [r for r in fetch(f"stats_player/stats_player_week_{year}.csv")
            if r.get("season_type") == "REG"]
    codes = era_codes(rows)

    players = {}
    for row in rows:
        if row.get("position") not in KEEP:
            continue
        pid = row["player_id"]
        p = players.setdefault(pid, {
            "id": pid, "name": row["player_display_name"],
            "team": codes.get(row["team"], row["team"]),
            "pos": row["position"], "weeks": {},
        })
        p["team"] = codes.get(row["team"], row["team"])

        line = {}
        for column, key in STATS.items():
            value = number(row, column)
            if value:
                line[key] = int(value) if float(value).is_integer() else value
        for key, columns in SUMMED.items():
            value = sum(number(row, c) for c in columns)
            if value:
                line[key] = int(value)
        p["weeks"][row["week"]] = line

    # The same involvement filter the 2015 pull used, so seasons are comparable.
    def involved(p):
        # Receptions, not targets. Target charting doesn't exist before roughly
        # 2010 — a 2007 pull has targets=0 for everyone, so filtering on them
        # silently drops every receiver in the league.
        total = sum(w.get("rushAtt", 0) + w.get("rec", 0) + w.get("fgAtt", 0)
                    + w.get("patAtt", 0) for w in p["weeks"].values())
        passes = sum(w.get("passYds", 0) for w in p["weeks"].values())
        return total >= 10 or passes >= 200

    kept = sorted((p for p in players.values() if involved(p)), key=lambda p: p["name"])

    weeks = sorted({int(r["week"]) for r in rows})
    out = {
        "season": int(year), "seasonType": "REG", "weeks": weeks,
        "source": f"nflverse-data release `stats_player`, asset stats_player_week_{year}.csv",
        "licence": "CC-BY-4.0 (nflverse-data). Attribution: nflverse.",
        "fetchedAt": datetime.now(timezone.utc).isoformat(),
        "players": kept,
    }
    with open(f"data/nfl-{year}.json", "w") as f:
        json.dump(out, f)
    print(f"{year}: {len(kept)} players, weeks {weeks[0]}-{weeks[-1]}, "
          f"{Counter(p['pos'] for p in kept)}")

    try:
        inj = [r for r in fetch(f"injuries/injuries_{year}.csv")
               if r.get("season_type") == "REG"]
    except urllib.error.HTTPError:
        print(f"{year}: no injury report published — skipping (nflverse starts at 2009)")
        return

    by_player = {}
    for row in inj:
        entry = by_player.setdefault(row["gsis_id"], {
            "id": row["gsis_id"], "name": row.get("full_name", ""),
            "team": row.get("team", ""), "pos": row.get("position", ""), "weeks": {},
        })
        entry["weeks"][row["week"]] = {
            "status": row.get("report_status") or None,
            "practice": row.get("practice_status") or None,
        }
    with open(f"data/nfl-{year}-injuries.json", "w") as f:
        json.dump({"season": int(year), "players": list(by_player.values())}, f)
    print(f"{year}: {sum(len(p['weeks']) for p in by_player.values())} injury rows")


if __name__ == "__main__":
    main(sys.argv[1])
