import json
import os
import time

from marketmind_engine.intelligence.symbol_state_registry import SymbolState

SNAPSHOT_DIR = "snapshots"
SNAPSHOT_FILE = os.path.join(SNAPSHOT_DIR, "field_snapshot.json")

os.makedirs(SNAPSHOT_DIR, exist_ok=True)


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