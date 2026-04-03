import os
import sys
import time

MM_ROLE = os.getenv("MM_ROLE", "UNKNOWN")

try:
    if sys.platform == "win32":
        if MM_ROLE == "SANDBOX":
            os.system("title MMAI SANDBOX (8000)")
            os.system("color 0A")
        elif MM_ROLE == "STATE":
            os.system("title MMAI STATE (8002)")
            os.system("color 0B")
        else:
            os.system("title MMAI UNKNOWN")
except Exception:
    pass

print("\n" + "="*60)
print("🚀 MARKETMIND ENGINE START")
print(f"🔥 ROLE: {MM_ROLE}")
print(f"📂 FILE: {os.path.abspath(__file__)}")
print("="*60 + "\n")

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import threading
from collections import deque
from datetime import datetime
import pytz

from marketmind_engine.runtime.build_engine import build_engine
from marketmind_engine.api.models import StartResponse, StopResponse, EngineStatus
from marketmind_engine.narrative.propagation_engine_runtime import PropagationEngine
from marketmind_engine.intelligence.symbol_validator import SymbolValidator

# --------------------------------------------------
# GLOBAL STATE
# --------------------------------------------------

engine_logs = deque(maxlen=1000)

def log(message: str):
    entry = f"{time.strftime('%H:%M:%S')} | [{MM_ROLE}] {message}"
    print(entry)
    engine_logs.append(entry)

# 🔥 CAPTURE RAW PRINT OUTPUT
class CapturePrint:
    def __init__(self, original):
        self.original = original

    def write(self, data):
        self.original.write(data)

        if "[STATE]" in data:
            engine_logs.append(data.strip())

    def flush(self):
        self.original.flush()

sys.stdout = CapturePrint(sys.stdout)

# --------------------------------------------------
# ENGINE
# --------------------------------------------------

engine_controller = build_engine()

provider = getattr(engine_controller, "provider", None)
rss_service = getattr(engine_controller, "rss_service", None)

propagation_engine = PropagationEngine(
    provider=provider,
    engine_controller=engine_controller,
    rss_service=rss_service,
)

symbol_validator = SymbolValidator()

engine_loop_thread = None
engine_loop_running = False

RSS_POLL_INTERVAL = 15
last_rss_poll = 0

evaluation_symbols = []

# --------------------------------------------------
# FASTAPI
# --------------------------------------------------

app = FastAPI(title=f"MarketMind Engine API ({MM_ROLE})")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class RunRequest(BaseModel):
    symbol: Optional[str] = None

# --------------------------------------------------
# HELPERS
# --------------------------------------------------

def normalize_event(e):
    try:
        return (
            getattr(e, "title", "").strip(),
            getattr(e, "source", "").strip(),
            str(getattr(e, "timestamp", ""))[:16],
        )
    except Exception:
        return str(e)

def is_market_open():
    try:
        now = datetime.now(pytz.timezone("US/Eastern"))
        if now.weekday() >= 5:
            return False
        return now.replace(hour=9, minute=30) <= now <= now.replace(hour=16, minute=0)
    except Exception:
        return True

# --------------------------------------------------
# PROPAGATION
# --------------------------------------------------

def safe_propagation_update(engine, symbols):
    log("[DEBUG] entering safe_propagation_update")
    try:
        if hasattr(engine, "update"):
            engine.update(symbols)
    except Exception as e:
        log(f"[PROP ERROR] {e}")

# --------------------------------------------------
# SNAPSHOT (FIXED + RANKING)
# --------------------------------------------------

def generate_snapshot():

    rows = []

    for line in list(engine_logs)[-300:]:

        if "[STATE]" in line:
            try:
                parts = line.split()

                symbol = parts[1]

                drift = 0.0
                ucip = 0.0
                life = 0

                for p in parts:
                    if p.startswith("DRIFT="):
                        drift = float(p.split("=")[1])
                    elif p.startswith("UCIP="):
                        ucip = float(p.split("=")[1])
                    elif p.startswith("LIFE="):
                        life = int(p.split("=")[1])

                if life == 0:
                    continue

                score = drift * ucip * life

                rows.append((symbol, score, drift, ucip, life))

            except Exception:
                pass

    if not rows:
        log("[SNAPSHOT] no data")
        return

    rows_sorted = sorted(rows, key=lambda x: x[1], reverse=True)

    top = rows_sorted[:5]
    bottom = rows_sorted[-5:]

    avg = sum([r[2] for r in rows]) / len(rows)

    log("================ SNAPSHOT ================")
    log(f"TIME: {time.strftime('%H:%M:%S')}")
    log(f"SYMBOLS: {len(rows)}")

    log("TOP SCORE:")
    for s, score, d, p, L in top:
        log(f"  {s:<6} score={score:+.4f}  d={d:+.5f}  p={p:+.5f}  L={L}")

    log("BOTTOM SCORE:")
    for s, score, d, p, L in bottom:
        log(f"  {s:<6} score={score:+.4f}  d={d:+.5f}  p={p:+.5f}  L={L}")

    log(f"AVG DRIFT: {avg:+.6f}")
    log("========================================")

# --------------------------------------------------
# ENGINE LOOP
# --------------------------------------------------

def engine_loop():

    global engine_loop_running
    global last_rss_poll, evaluation_symbols

    while engine_loop_running:

        try:

            if engine_controller.is_running():

                now = time.time()
                symbols = set()
                events = None

                if rss_service and (now - last_rss_poll > RSS_POLL_INTERVAL):

                    rss_service.worker.poll_once()
                    rss_service._update_projection()

                    last_rss_poll = now
                    events = rss_service.get_projection_events()

                    log(f"RSS events: {len(events)}")

                    if events:
                        log(f"[DEBUG_EVENT_0] {normalize_event(events[0])}")

                if events:
                    for e in events:
                        if hasattr(e, "symbol") and e.symbol:
                            symbols.add(e.symbol)
                        if hasattr(e, "symbols"):
                            symbols.update(e.symbols)

                validated = [s for s in symbols if symbol_validator.is_valid(s)]
                evaluation_symbols = validated[:30]

                log(f"Symbols: {evaluation_symbols}")

                if is_market_open():
                    for s in evaluation_symbols:
                        engine_controller.run_symbol_cycle(s)

                safe_propagation_update(propagation_engine, evaluation_symbols)

                # 🔥 RANKING SNAPSHOT ACTIVE
                generate_snapshot()

        except Exception as e:
            log(f"Engine loop error: {e}")

        time.sleep(2)

# --------------------------------------------------
# ROUTES
# --------------------------------------------------

@app.post("/api/engine/start", response_model=StartResponse)
def start_engine():
    global engine_loop_running, engine_loop_thread

    engine_controller.start()

    if not engine_loop_running:
        engine_loop_running = True
        engine_loop_thread = threading.Thread(target=engine_loop, daemon=True)
        engine_loop_thread.start()

    log("Engine started")
    return {"status": "started"}