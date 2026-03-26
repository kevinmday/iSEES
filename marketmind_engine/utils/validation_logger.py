import csv
import os
from datetime import datetime

LOG_PATH = r"C:\dev\IntentionalTradingSystem\logs\validation_log.csv"

HEADERS = [
    "timestamp","symbol","signal",
    "delta","drift","slope","prop","life","price"
]

def init_log():
    if not os.path.exists(LOG_PATH):
        with open(LOG_PATH, "w", newline="") as f:
            writer = csv.writer(f)
            writer.writerow(HEADERS)

def log_signal(symbol, signal, state, price):
    with open(LOG_PATH, "a", newline="") as f:
        writer = csv.writer(f)
        writer.writerow([
            datetime.utcnow().isoformat(),
            symbol,
            signal,
            state.get("delta_micro", 0),
            state.get("drift", 0),
            state.get("drift_slope", 0),
            state.get("propagation_score", 0),
            state.get("lifespan", 0),
            price
        ])