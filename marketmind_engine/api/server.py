import os
print("🔥 RUNNING FILE:", os.path.abspath(__file__))

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import threading
import time
from collections import deque
from datetime import datetime
import pytz

from marketmind_engine.runtime.build_engine import build_engine
from marketmind_engine.api.models import (
    StartResponse,
    StopResponse,
    EngineStatus,
)

# 🔥 FIXED: NOW USING RUNTIME ENGINE (NOT INTELLIGENCE ENGINE)
from marketmind_engine.narrative.propagation_engine_runtime import PropagationEngine

from marketmind_engine.intelligence.symbol_validator import SymbolValidator


# ------------------------------------------------------------------
# LOGGING SETUP
# ------------------------------------------------------------------

LOG_DIR = "logs"
os.makedirs(LOG_DIR, exist_ok=True)

SESSION_LOG_FILE = os.path.join(
    LOG_DIR,
    f"engine_{time.strftime('%Y-%m-%d_%H-%M-%S')}.log"
)

engine_logs = deque(maxlen=200)


def log(message: str):
    entry = f"{time.strftime('%H:%M:%S')} | {message}"
    print(entry)
    engine_logs.append(entry)

    try:
        with open(SESSION_LOG_FILE, "a", encoding="utf-8") as f:
            f.write(entry + "\n")
    except Exception:
        pass


# ------------------------------------------------------------------
# ENGINE BOOTSTRAP
# ------------------------------------------------------------------

engine_controller = build_engine()

engine_loop_thread = None
engine_loop_running = False

rss_polling_active = False
symbol_evaluation_active = False

last_signature = None
last_full_run_ts = 0

RSS_POLL_INTERVAL = 15
last_rss_poll = 0

evaluation_symbols = []

provider = getattr(engine_controller, "provider", None)
rss_service = getattr(engine_controller, "rss_service", None)

propagation_engine = PropagationEngine(
    provider=provider,
    engine_controller=engine_controller,
    rss_service=rss_service,
)

symbol_validator = SymbolValidator()

# ------------------------------------------------------------------
# FASTAPI APP
# ------------------------------------------------------------------

app = FastAPI(title="MarketMind Engine API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class RunRequest(BaseModel):
    symbol: Optional[str] = None


# ------------------------------------------------------------------
# HELPERS
# ------------------------------------------------------------------

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


# ------------------------------------------------------------------
# PROPAGATION WRAPPER
# ------------------------------------------------------------------

def safe_propagation_update(engine, symbols):

    log("[DEBUG] entering safe_propagation_update")
    log(f"[DEBUG_ENGINE_TYPE] {engine} | has_update={hasattr(engine, 'update')}")
    log(f"[DEBUG_PROP_CALL] symbols={len(symbols)}")

    try:
        if hasattr(engine, "update"):
            engine.update(symbols)
            log(f"[PROP] update() applied to {len(symbols)} symbols")
        else:
            log("[PROP] No update() method found")
    except Exception as e:
        log(f"[PROP] error: {e}")


# ------------------------------------------------------------------
# ENGINE LOOP
# ------------------------------------------------------------------

def engine_loop():

    global engine_loop_running
    global last_signature, last_full_run_ts, last_rss_poll, evaluation_symbols

    while engine_loop_running:

        try:

            if engine_controller.is_running():

                now = time.time()
                symbols = set()
                events = None
                rss_changed = False

                # ---------------- RSS ----------------
                if rss_service and (now - last_rss_poll > RSS_POLL_INTERVAL):

                    rss_service.worker.poll_once()
                    rss_service._update_projection()

                    last_rss_poll = now
                    events = rss_service.get_projection_events()

                    log(f"RSS events: {len(events)}")

                    if events:
                        log(f"[DEBUG_EVENT_0] {normalize_event(events[0])}")

                        signature = hash(tuple(sorted(normalize_event(e) for e in events)))
                        rss_changed = signature != last_signature
                        last_signature = signature

                # ---------------- BUILD SYMBOL SET ----------------
                if events:
                    for e in events:
                        if hasattr(e, "symbol") and e.symbol:
                            symbols.add(e.symbol)
                        if hasattr(e, "symbols"):
                            symbols.update(e.symbols)

                # ---------------- VALIDATE ----------------
                validated = [s for s in symbols if symbol_validator.is_valid(s)]
                evaluation_symbols = validated[:30]

                log(f"Symbols: {evaluation_symbols}")

                # ---------------- EXECUTION ----------------
                if is_market_open():
                    for s in evaluation_symbols:
                        engine_controller.run_symbol_cycle(s)

                # ---------------- PROPAGATION ----------------
                safe_propagation_update(
                    propagation_engine,
                    evaluation_symbols
                )

        except Exception as e:
            log(f"Engine loop error: {e}")

        time.sleep(2)


# ------------------------------------------------------------------
# ROUTES
# ------------------------------------------------------------------

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


@app.post("/api/engine/stop", response_model=StopResponse)
def stop_engine():
    global engine_loop_running

    engine_controller.stop()
    engine_loop_running = False

    log("Engine stopped")
    return {"status": "stopped"}


@app.get("/api/engine/status", response_model=EngineStatus)
def engine_status():
    return {
        "running": engine_controller.is_running(),
        "rss_polling": rss_polling_active,
        "symbol_evaluation": symbol_evaluation_active
    }


@app.get("/api/engine/logs")
def engine_logs_endpoint():
    return {"logs": list(engine_logs)}