# ============================================================
# MarketMind — Field Log Crawler (FINAL PRODUCTION VERSION)
# ============================================================

import os
import time
from datetime import datetime


# --------------------------------------------------
# SELECT BEST LOG (RECENT + LARGE)
# --------------------------------------------------

def get_best_log():
    log_dir = "logs"
    now = time.time()

    candidates = []

    for f in os.listdir(log_dir):
        if not f.endswith(".log"):
            continue

        path = os.path.join(log_dir, f)
        size = os.path.getsize(path)
        mtime = os.path.getmtime(path)

        # Keep only logs from last 48 hours
        if now - mtime < 48 * 3600:
            candidates.append((path, size, mtime))

    if not candidates:
        raise ValueError("No recent log files found")

    # Sort by size first (largest), then newest
    candidates.sort(key=lambda x: (x[1], x[2]), reverse=True)

    best = candidates[0]

    print(
        f"[INFO] Using log file: {best[0]} "
        f"({best[1] / 1_000_000:.2f} MB)"
    )

    return best[0]


# --------------------------------------------------
# FIND TIMESTAMP (BACKTRACK SAFE)
# --------------------------------------------------

def find_timestamp(lines, index):
    for i in range(index, max(index - 20, 0), -1):
        line = lines[i].strip()

        if "|" in line:
            try:
                ts = line.split("|")[0].strip()
                return datetime.strptime(ts, "%H:%M:%S")
            except:
                continue

    return None


# --------------------------------------------------
# EXTRACT TOP CANDIDATES BLOCK
# --------------------------------------------------

def extract_top_candidates(lines, start_index):
    results = []
    i = start_index + 1

    while i < len(lines):
        line = lines[i].strip()

        # Stop when next block begins
        if not line or line.startswith("["):
            break

        parts = line.split()

        try:
            symbol = parts[0]
            prop = None
            drift = None

            for p in parts:
                if p.startswith("prop="):
                    prop = float(p.split("=")[1])
                elif p.startswith("drift="):
                    drift = float(p.split("=")[1])

            if symbol and prop is not None and drift is not None:
                results.append({
                    "symbol": symbol,
                    "prop": prop,
                    "drift": drift
                })

        except Exception:
            pass

        i += 1

    return results


# --------------------------------------------------
# MAIN CRAWLER
# --------------------------------------------------

def crawl_log(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        lines = f.readlines()

    timeline = []
    blocks_found = 0

    for i, line in enumerate(lines):
        if "[TOP CANDIDATES]" in line:
            blocks_found += 1

            timestamp = find_timestamp(lines, i)
            candidates = extract_top_candidates(lines, i)

            # Debug (first few only)
            if blocks_found <= 3:
                print(f"[DEBUG] Found block at line {i}, parsed {len(candidates)} symbols")

            for rank, c in enumerate(candidates, start=1):
                timeline.append({
                    "time": timestamp,
                    "symbol": c["symbol"],
                    "rank": rank,
                    "drift": c["drift"],
                    "prop": c["prop"]
                })

    print(f"\n[INFO] Found {blocks_found} TOP CANDIDATE blocks\n")
    return timeline


# --------------------------------------------------
# OUTPUT
# --------------------------------------------------

def print_summary(timeline):
    print("\n🔥 FIELD TIMELINE\n")

    if not timeline:
        print("⚠️ No candidate data parsed")
        return

    for entry in timeline[:40]:
        print(
            f"{entry['time']} | {entry['symbol']} | "
            f"rank={entry['rank']} | drift={entry['drift']:.4f} | prop={entry['prop']:.4f}"
        )


# --------------------------------------------------
# ENTRY POINT
# --------------------------------------------------

if __name__ == "__main__":
    log_file = get_best_log()
    data = crawl_log(log_file)
    print_summary(data)