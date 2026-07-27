#!/usr/bin/env python3
"""
Pull a headshot for every player the game can deal.

    python3 scripts/fetch_headshots.py          # only what's missing
    python3 scripts/fetch_headshots.py --all    # re-fetch everything

Sources the URLs from nflverse's `players` release, which carries an NFL.com
image id per player, and stores them under `public/headshots/<gsis_id>.png`.

Hosted rather than hot-linked, deliberately. The originals are ~4 MB apiece and
the game would be making eight hundred third-party requests to render a board;
at 96px, face-cropped, the whole set is a few megabytes and belongs to us.

Coverage is partial and uneven: 62% of the 2015 players have a real portrait
and only 13% of the 2007 ones, because NFL.com no longer keeps photographs of
most players from that era. It answers 200 with a generic helmet for the rest,
which this script recognises and discards. A player without one falls back to
the anonymous head the game drew before.
"""

import csv
import hashlib
import io
import re
import json
import sys
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "headshots"
SEASONS = ROOT / "src" / "sports" / "nfl" / "seasons.json"
PLAYERS = "https://github.com/nflverse/nflverse-data/releases/download/players/players.csv"

# Cloudinary takes its transforms in the path. 96px square, cropped to the face,
# which is the size the board actually draws.
TRANSFORM = "f_auto,q_auto,w_96,h_96,c_fill,g_face"

# NFL.com answers with a generic helmet silhouette for players it has no photo
# of, and it answers 200. It's the same bytes every time, so it's identifiable —
# 456 of the first 736 fetched were this. Saving them would put a placeholder on
# the field, which is worse than the anonymous head we already draw.
PLACEHOLDER = "4df596f72b0265f9c98d31976dc0f31389ed6e16cdba914b95e286d4ec0d21ff"


def wanted() -> set[str]:
    """Every player id across every bundled season."""
    data = json.loads(SEASONS.read_text())
    return {p["id"] for season in data["seasons"].values() for p in season["players"]}


def urls(ids: set[str]) -> dict[str, str]:
    print(f"reading {PLAYERS}")
    with urllib.request.urlopen(PLAYERS) as response:
        rows = csv.DictReader(io.TextIOWrapper(response, encoding="utf-8"))
        found = {}
        for row in rows:
            if row["gsis_id"] in ids and row.get("headshot"):
                # ".../image/<upload|private>/f_auto,q_auto/league/<id>". Both
                # delivery types appear in the release and only the transform
                # between them changes — keep whichever one the row uses.
                swapped = re.sub(
                    r"(/image/(?:upload|private)/)[^/]+/",
                    rf"\g<1>{TRANSFORM}/",
                    row["headshot"],
                )
                found[row["gsis_id"]] = swapped
    return found


def fetch(item: tuple[str, str]) -> bool:
    player_id, url = item
    target = OUT / f"{player_id}.png"
    try:
        with urllib.request.urlopen(url, timeout=30) as response:
            body = response.read()
        # A few bytes back is an error page, not a portrait.
        if len(body) < 512:
            return False
        if hashlib.sha256(body).hexdigest() == PLACEHOLDER:
            return False
        target.write_bytes(body)
        return True
    except Exception as error:  # noqa: BLE001 — one bad image must not stop the run
        print(f"  {player_id}: {error}")
        return False


def main() -> None:
    refetch = "--all" in sys.argv
    OUT.mkdir(parents=True, exist_ok=True)

    ids = wanted()
    print(f"{len(ids)} players across the bundled seasons")

    available = urls(ids)
    missing = sorted(ids - set(available))
    if missing:
        print(f"{len(missing)} have no image on file and will fall back to the glyph")

    todo = [
        (pid, url)
        for pid, url in available.items()
        if refetch or not (OUT / f"{pid}.png").exists()
    ]
    if not todo:
        print("nothing to fetch")
        return

    print(f"fetching {len(todo)}…")
    with ThreadPoolExecutor(max_workers=12) as pool:
        got = sum(pool.map(fetch, todo))

    total = len(list(OUT.glob("*.png")))
    size = sum(f.stat().st_size for f in OUT.glob("*.png")) / 1_000_000
    print(f"fetched {got}/{len(todo)} — {total} on disk, {size:.1f} MB")


if __name__ == "__main__":
    main()
