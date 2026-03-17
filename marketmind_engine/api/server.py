import os
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import threading
import time
from collections import deque

from marketmind_engine.runtime.build_engine import build_engine
from marketmind_engine.api.models import (
    StartResponse,
    StopResponse,
    EngineStatus,
    EngineStateSnapshot,
)

from marketmind_engine.intelligence.propagation_engine import PropagationEngine
from marketmind_engine.intelligence.symbol_validator import SymbolValidator


# ------------------------------------------------------------------
# LOGGING SETUP (PERSISTENT + TERMINAL + UI BUFFER)
# ------------------------------------------------------------------

LOG_DIR = "logs"
os.makedirs(LOG_DIR, exist_ok=True)

SESSION_LOG_FILE = os.path.join(
    LOG_DIR,
    f"engine_{time.strftime('%Y-%m-%d_%H-%M-%S')}.log"
)

LOG_BUFFER_SIZE = 200
engine_logs = deque(maxlen=LOG_BUFFER_SIZE)


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


# ------------------------------------------------------------------
# SAFE ATTRIBUTE DISCOVERY
# ------------------------------------------------------------------

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


# ------------------------------------------------------------------
# CORS
# ------------------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class RunRequest(BaseModel):
    symbol: Optional[str] = None


# ------------------------------------------------------------------
# PROPAGATION SAFE WRAPPER
# ------------------------------------------------------------------

def safe_propagation_update(engine, symbols):

    try:

        if hasattr(engine, "update"):
            engine.update(symbols)
            log(f"[PROP] update() applied to {len(symbols)} symbols")

        elif hasattr(engine, "propagate"):
            engine.propagate(symbols)
            log(f"[PROP] propagate() fallback applied to {len(symbols)} symbols")

        else:
            log("[PROP] No valid propagation method found")

    except Exception as e:
        log(f"[PROP] error: {e}")


# ------------------------------------------------------------------
# ENGINE LOOP
# ------------------------------------------------------------------

def engine_loop():

    global engine_loop_running
    global rss_polling_active
    global symbol_evaluation_active

    while engine_loop_running:

        try:

            rss_polling_active = False
            symbol_evaluation_active = False

            if engine_controller.is_running():

                symbols = set()

                # ---------------- RSS ----------------
                if rss_service:

                    try:
                        rss_service.worker.poll_once()
                        rss_service._update_projection()

                        rss_polling_active = True

                        events = rss_service.get_projection_events()

                        log(f"RSS headlines: {len(rss_service.buffer._headlines)}")
                        log(f"RSS events discovered: {len(events)}")

                        for event in events:

                            if hasattr(event, "symbol") and event.symbol:
                                symbols.add(event.symbol)

                            if hasattr(event, "symbols") and event.symbols:
                                symbols.update(event.symbols)

                    except Exception as e:
                        log(f"RSS polling error: {e}")

                # ---------------- VALIDATION ----------------
                validated_symbols = set()

                for symbol in symbols:

                    try:
                        if symbol_validator.is_valid(symbol):
                            validated_symbols.add(symbol)
                        else:
                            log(f"Filtered symbol: {symbol}")
                    except Exception:
                        pass

                log(f"Validated symbols: {validated_symbols}")

                # ---------------- RANKING ----------------
                ranked_symbols = list(validated_symbols)

                try:
                    if rss_service:

                        mention_count = {}
                        events = rss_service.get_projection_events()

                        for e in events:

                            if hasattr(e, "symbol") and e.symbol:
                                mention_count[e.symbol] = mention_count.get(e.symbol, 0) + 1

                            if hasattr(e, "symbols") and e.symbols:
                                for s in e.symbols:
                                    mention_count[s] = mention_count.get(s, 0) + 1

                        ranked_symbols.sort(
                            key=lambda s: mention_count.get(s, 0),
                            reverse=True
                        )

                except Exception as e:
                    log(f"Ranking error: {e}")

                evaluation_symbols = ranked_symbols[:30]

                log(f"Ranked evaluation set: {evaluation_symbols}")

                # ---------------- EVALUATION ----------------
                if evaluation_symbols:

                    for symbol in evaluation_symbols:

                        try:
                            symbol_evaluation_active = True
                            engine_controller.run_symbol_cycle(symbol)

                        except Exception as e:
                            log(f"Symbol cycle error: {symbol} {e}")

                    # ---------------- PROPAGATION ----------------
                    safe_propagation_update(
                        propagation_engine,
                        validated_symbols
                    )

                else:
                    log("No validated RSS symbols this cycle")

        except Exception as e:
            log(f"Engine loop error: {e}")

        time.sleep(2)


# ------------------------------------------------------------------
# ENGINE CONTROL
# ------------------------------------------------------------------

@app.post("/api/engine/start", response_model=StartResponse)
def start_engine():

    global engine_loop_thread
    global engine_loop_running

    engine_controller.start()

    if not engine_loop_running:

        engine_loop_running = True

        engine_loop_thread = threading.Thread(
            target=engine_loop,
            daemon=True
        )

        engine_loop_thread.start()

    log(f"Engine started (log file: {SESSION_LOG_FILE})")

    return {"status": "started"}


@app.post("/api/engine/stop", response_model=StopResponse)
def stop_engine():

    global engine_loop_running

    engine_controller.stop()
    engine_loop_running = False

    log("Engine stopped")

    return {"status": "stopped"}


# ------------------------------------------------------------------
# STATUS
# ------------------------------------------------------------------

@app.get("/api/engine/status", response_model=EngineStatus)
def engine_status():

    last = engine_controller.get_last_result()

    regime_name = None
    engine_time = None
    timestamp = None

    if last:

        engine_time = last.get("engine_time")
        regime_snapshot = last.get("regime")

        if isinstance(regime_snapshot, dict):
            regime_name = regime_snapshot.get("regime")
            timestamp = regime_snapshot.get("timestamp")

    return {
        "running": engine_controller.is_running(),
        "regime": regime_name,
        "engine_time": engine_time,
        "last_cycle_timestamp": timestamp,
        "rss_polling": rss_polling_active,
        "symbol_evaluation": symbol_evaluation_active
    }


# ------------------------------------------------------------------
# LOG ENDPOINT
# ------------------------------------------------------------------

@app.get("/api/engine/logs")
def engine_logs_endpoint():

    return {
        "logs": list(engine_logs)
    }