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

Two sources, in order. NFL.com first, which is current-heavy: it answers 200
with a generic helmet for anyone it has dropped, which this script recognises
by hash and discards. ESPN second, which keeps photographs of players NFL.com
gave up on years ago and covers most of a 2007 roster.

A player neither source has falls back to the anonymous head the game drew
before, so partial coverage is a normal state rather than a fault.
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

# ESPN keeps photographs of players NFL.com has long since dropped, which is
# most of a 2007 roster. Tried second, by ESPN id, for anyone the first source
# has no real picture of — it lifted coverage from 38% to about 90%.
ESPN = "https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/{id}.png&w=96&h=96"


def wanted() -> set[str]:
    """Every player id across every bundled season."""
    data = json.loads(SEASONS.read_text())
    return {p["id"] for season in data["seasons"].values() for p in season["players"]}


def urls(ids: set[str]) -> tuple[dict[str, str], dict[str, str]]:
    """Where to look for each player, first choice and second."""
    print(f"reading {PLAYERS}")
    with urllib.request.urlopen(PLAYERS) as response:
        rows = csv.DictReader(io.TextIOWrapper(response, encoding="utf-8"))
        nfl, espn = {}, {}
        for row in rows:
            if row["gsis_id"] not in ids:
                continue
            if row.get("headshot"):
                # ".../image/<upload|private>/f_auto,q_auto/league/<id>". Both
                # delivery types appear in the release and only the transform
                # between them changes — keep whichever one the row uses.
                nfl[row["gsis_id"]] = re.sub(
                    r"(/image/(?:upload|private)/)[^/]+/",
                    rf"\g<1>{TRANSFORM}/",
                    row["headshot"],
                )
            if row.get("espn_id"):
                espn[row["gsis_id"]] = ESPN.format(id=row["espn_id"])
    return nfl, espn


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


def sweep(source: str, targets: dict[str, str], refetch: bool) -> None:
    todo = [
        (pid, url)
        for pid, url in targets.items()
        if refetch or not (OUT / f"{pid}.png").exists()
    ]
    if not todo:
        print(f"{source}: nothing to fetch")
        return
    print(f"{source}: fetching {len(todo)}…")
    with ThreadPoolExecutor(max_workers=12) as pool:
        got = sum(pool.map(fetch, todo))
    print(f"{source}: got {got} of {len(todo)}")


def main() -> None:
    refetch = "--all" in sys.argv
    OUT.mkdir(parents=True, exist_ok=True)

    ids = wanted()
    print(f"{len(ids)} players across the bundled seasons")

    nfl, espn = urls(ids)
    sweep("nfl.com", nfl, refetch)
    # Second pass fills whatever the first couldn't, including everyone whose
    # NFL.com entry came back as the generic helmet.
    sweep("espn", {k: v for k, v in espn.items() if not (OUT / f"{k}.png").exists()}, False)

    on_disk = {f.stem for f in OUT.glob("*.png")}
    size = sum(f.stat().st_size for f in OUT.glob("*.png")) / 1_000_000
    print(f"\n{len(on_disk)}/{len(ids)} players have a portrait — {size:.1f} MB")

    # A source that starts serving one generic image would show up as many
    # players sharing a hash. Worth knowing before it reaches the field.
    seen: dict[str, int] = {}
    for f in OUT.glob("*.png"):
        digest = hashlib.sha256(f.read_bytes()).hexdigest()
        seen[digest] = seen.get(digest, 0) + 1
    repeated = sorted((n, h) for h, n in seen.items() if n > 1)
    if repeated:
        print("warning — identical images, likely placeholders:")
        for n, h in repeated:
            print(f"  {n} players share {h[:16]}")
    else:
        print("every portrait is distinct")


if __name__ == "__main__":
    main()
