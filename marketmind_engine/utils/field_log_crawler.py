# marketmind_engine/utils/field_log_crawler.py

import re
from datetime import datetime

LOG_FILE = "logs/engine_2026-03-29_05-14-05.log"


def parse_timestamp(line):
    try:
        return datetime.strptime(line[:8], "%H:%M:%S")
    except:
        return None


def extract_top_candidates(lines, i):
    results = []
    j = i + 1

    while j < len(lines) and lines[j].strip():
        line = lines[j].strip()

        match = re.match(r"(\w+)\s+score=([\d\.\-]+)\s+prop=([\d\.\-]+)\s+drift=([\d\.\-]+)", line)
        if match:
            symbol, score, prop, drift = match.groups()
            results.append({
                "symbol": symbol,
                "score": float(score),
                "prop": float(prop),
                "drift": float(drift)
            })
        else:
            break

        j += 1

    return results


def crawl_log(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        lines = f.readlines()

    timeline = []

    for i, line in enumerate(lines):
        if "[TOP CANDIDATES]" in line:
            timestamp = parse_timestamp(line)
            candidates = extract_top_candidates(lines, i)

            for rank, c in enumerate(candidates, start=1):
                timeline.append({
                    "time": timestamp,
                    "symbol": c["symbol"],
                    "rank": rank,
                    "drift": c["drift"],
                    "prop": c["prop"]
                })

    return timeline


def print_summary(timeline):
    print("\n🔥 FIELD TIMELINE\n")

    for entry in timeline[:20]:
        print(f"{entry['time']} | {entry['symbol']} | rank={entry['rank']} | drift={entry['drift']:.4f} | prop={entry['prop']:.4f}")


if __name__ == "__main__":
    data = crawl_log(LOG_FILE)
    print_summary(data)