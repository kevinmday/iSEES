import csv
from collections import defaultdict

LOG_PATH = r"C:\dev\IntentionalTradingSystem\logs\validation_log.csv"

signals = defaultdict(list)

# -------------------------
# LOAD DATA (POSITIONAL — NO HEADER)
# -------------------------
with open(LOG_PATH, newline="") as f:
    reader = csv.reader(f)

    for row in reader:
        # Expected format:
        # [0] timestamp
        # [1] symbol
        # [2] signal
        # [3] delta
        # [4] drift
        # [5] slope
        # [6] prop
        # [7] life
        # [8] price

        if len(row) < 9:
            continue

        symbol = row[1]
        signal = row[2]

        try:
            price = float(row[8])
        except:
            continue

        signals[symbol].append({
            "signal": signal,
            "price": price
        })

# -------------------------
# ANALYZE
# -------------------------
print("\n🔥 DAILY SIGNAL REVIEW\n")

for symbol, rows in signals.items():

    pmas_seen = False
    trend_seen = False
    max_move = 0.0
    start_price = None

    for r in rows:
        price = r["price"]
        signal = r["signal"]

        if start_price is None:
            start_price = price

        if start_price == 0:
            continue

        move = (price - start_price) / start_price

        if move > max_move:
            max_move = move

        if signal == "WATCH_PMAS":
            pmas_seen = True

        if signal == "ENTER_TREND":
            trend_seen = True

    # -------------------------
    # CLASSIFY OUTCOME (UPDATED)
    # -------------------------
    if not pmas_seen and not trend_seen:
        outcome = "NO_SIGNAL"
    elif max_move >= 0.01:
        outcome = "WIN"
    elif max_move > 0:
        outcome = "SMALL"
    else:
        outcome = "FAIL"

    # -------------------------
    # PRINT
    # -------------------------
    print(f"{symbol}")
    print(f"  PMAS: {pmas_seen} | TREND: {trend_seen}")
    print(f"  Max Move: {max_move*100:.2f}%")
    print(f"  Outcome: {outcome}")
    print("-" * 30)