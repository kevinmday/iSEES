import json
import os
import time

from marketmind_engine.intelligence.symbol_state_registry import SymbolState

SNAPSHOT_DIR = "snapshots"
SNAPSHOT_FILE = os.path.join(SNAPSHOT_DIR, "field_snapshot.json")

os.makedirs(SNAPSHOT_DIR, exist_ok=True)


# =========================
# SAVE SNAPSHOT (UNCHANGED)
# =========================
def save_snapshot(symbol_state_registry):
    try:
        data = {
            "timestamp": time.time(),
            "symbols": {}
        }

        for symbol, state in symbol_state_registry._states.items():
            data["symbols"][symbol] = {
                "fils": state.last_fils,
                "ucip": state.last_ucip,
                "drift": state.last_drift,
                "timestamp": state.last_timestamp,
            }

        with open(SNAPSHOT_FILE, "w") as f:
            json.dump(data, f)

        print(f"[SNAPSHOT] saved {len(data['symbols'])} symbols")

    except Exception as e:
        print(f"[SNAPSHOT] save error: {e}")


# =========================
# LOAD SNAPSHOT (UNCHANGED)
# =========================
def load_snapshot(symbol_state_registry):
    try:
        if not os.path.exists(SNAPSHOT_FILE):
            print("[SNAPSHOT] no snapshot found")
            return

        with open(SNAPSHOT_FILE, "r") as f:
            data = json.load(f)

        count = 0

        for symbol, s in data.get("symbols", {}).items():
            symbol_state_registry._states[symbol] = SymbolState(
                symbol=symbol,
                last_fils=s["fils"],
                last_ucip=s["ucip"],
                last_drift=s["drift"],
                last_timestamp=s["timestamp"],
            )
            count += 1

        print(f"[SNAPSHOT] loaded {count} symbols")

    except Exception as e:
        print(f"[SNAPSHOT] load error: {e}")


# =========================================
# NEW: BUILD RANKED SNAPSHOT (READ-ONLY)
# =========================================
def build_ranked_snapshot(symbol_state_registry):
    try:
        states = symbol_state_registry._states

        if not states:
            print("[SNAPSHOT] no state data available")
            return

        rows = []
        total_drift = 0.0
        count = 0

        for symbol, state in states.items():
            drift = float(getattr(state, "last_drift", 0.0) or 0.0)
            prop = float(getattr(state, "last_ucip", 0.0) or 0.0)  # using UCIP as PROP
            life = int(time.time() - getattr(state, "last_timestamp", time.time()))

            score = drift * prop * life

            rows.append((symbol, score, drift, prop, life))

            total_drift += drift
            count += 1

        # SORT BY SCORE
        rows_sorted = sorted(rows, key=lambda x: x[1], reverse=True)

        top = rows_sorted[:5]
        bottom = rows_sorted[-5:]

        avg_drift = total_drift / count if count else 0.0
        now = time.strftime("%H:%M:%S")

        print("\n================ SNAPSHOT ================")
        print(f"TIME: {now}")
        print(f"SYMBOLS: {count}")
        print("")

        print("TOP SCORE:")
        for sym, score, d, p, L in top:
            print(f"  {sym:<6} score={score:+.4f}  d={d:+.5f}  p={p:+.5f}  L={L}")

        print("")

        print("BOTTOM SCORE:")
        for sym, score, d, p, L in bottom:
            print(f"  {sym:<6} score={score:+.4f}  d={d:+.5f}  p={p:+.5f}  L={L}")

        print("")
        print(f"AVG DRIFT: {avg_drift:+.5f}")
        print("========================================")

    except Exception as e:
        print(f"[SNAPSHOT] ranking error: {e}")