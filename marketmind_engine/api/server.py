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
from datetime import datetime
import pytz

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
# LOGGING SETUP
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
# PHASE 6B STATE
# ------------------------------------------------------------------

last_signature = None
last_full_run_ts = 0

RSS_POLL_INTERVAL = 15
last_rss_poll = 0

evaluation_symbols = []

# --- Drift Tracking ---
symbol_drift_history = {}
DRIFT_ACCEL_THRESHOLD = 0.002


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
# NORMALIZER
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


# ------------------------------------------------------------------
# MARKET HOURS
# ------------------------------------------------------------------

def is_market_open():

    try:
        now = datetime.now(pytz.timezone("US/Eastern"))

        if now.weekday() >= 5:
            return False

        market_open = now.replace(hour=9, minute=30, second=0, microsecond=0)
        market_close = now.replace(hour=16, minute=0, second=0, microsecond=0)

        return market_open <= now <= market_close

    except Exception:
        return True


# ------------------------------------------------------------------
# VOLUME FETCH
# ------------------------------------------------------------------

def fetch_volume(symbol):

    try:
        if hasattr(engine_controller, "provider") and engine_controller.provider:

            provider = engine_controller.provider

            if hasattr(provider, "get_latest_bar"):
                bar = provider.get_latest_bar(symbol)

                if bar and hasattr(bar, "volume"):
                    return bar.volume

        return None

    except Exception:
        return None


# ------------------------------------------------------------------
# DRIFT EXTRACTION
# ------------------------------------------------------------------

def extract_symbol_drift(engine_controller, symbol):

    try:
        last = engine_controller.get_last_result()

        if not last:
            return None

        symbols = last.get("symbols", {})

        if symbol in symbols:
            return symbols[symbol].get("drift")

        return None

    except Exception:
        return None


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

    global last_signature, last_full_run_ts
    global last_rss_poll, evaluation_symbols
    global symbol_drift_history

    while engine_loop_running:

        try:

            rss_polling_active = False
            symbol_evaluation_active = False

            if engine_controller.is_running():

                now = time.time()

                symbols = set()
                events = None
                rss_changed = False
                current_signature = last_signature

                # ---------------- RSS ----------------
                if rss_service and (now - last_rss_poll > RSS_POLL_INTERVAL):

                    try:
                        rss_service.worker.poll_once()
                        rss_service._update_projection()

                        rss_polling_active = True
                        last_rss_poll = now

                        events = rss_service.get_projection_events()

                        log(f"RSS headlines: {len(rss_service.buffer._headlines)}")
                        log(f"RSS events discovered: {len(events)}")

                        if events:
                            current_signature = hash(
                                tuple(sorted(normalize_event(e) for e in events))
                            )
                            rss_changed = current_signature != last_signature
                        else:
                            log("[NARRATIVE] WARNING: empty event set")

                    except Exception as e:
                        log(f"RSS polling error: {e}")

                # ---------------- FULL PIPELINE ----------------
                if rss_changed or (now - last_full_run_ts > 60):

                    log(f"[NARRATIVE] FULL | events={len(events or [])}")

                    if events:
                        for event in events:

                            if hasattr(event, "symbol") and event.symbol:
                                symbols.add(event.symbol)

                            if hasattr(event, "symbols") and event.symbols:
                                symbols.update(event.symbols)

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

                    ranked_symbols = list(validated_symbols)

                    try:
                        if events:
                            mention_count = {}

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

                    if ranked_symbols:
                        evaluation_symbols = ranked_symbols[:30]

                    log(f"Ranked evaluation set: {evaluation_symbols}")

                    last_signature = current_signature
                    last_full_run_ts = now

                else:
                    log(f"[NARRATIVE] QUANT | symbols={len(evaluation_symbols)}")

                # ---------------- SAFETY ----------------
                if not evaluation_symbols:
                    log("[SAFETY] WARNING: evaluation_symbols empty")
                    time.sleep(2)
                    continue

                # ---------------- EVALUATION ----------------
                market_open = is_market_open()

                if not market_open:
                    log("[MARKET] CLOSED — running narrative-only mode")

                for symbol in evaluation_symbols:

                    try:
                        symbol_evaluation_active = True

                        if market_open:

                            engine_controller.run_symbol_cycle(symbol)

                            # -------- NORMALIZED PRICE DELTA LOG --------
                            try:
                                last = engine_controller.get_last_result()
                                if last:
                                    symbols_block = last.get("symbols", {})
                                    if symbol in symbols_block:
                                        data = symbols_block[symbol]

                                        current_price = data.get("price")
                                        last_price = data.get("last_price")

                                        price_delta_pct = 0.0

                                        if current_price and last_price and last_price > 0:
                                            price_delta_pct = (current_price - last_price) / last_price

                                        log(f"[ΔP%] {symbol} {round(price_delta_pct,6)}")
                            except Exception:
                                pass

                            # -------- DRIFT TRACKING --------
                            drift_now = extract_symbol_drift(engine_controller, symbol)

                            if drift_now is not None:

                                history = symbol_drift_history.get(symbol, [])

                                if history:
                                    drift_prev = history[-1]
                                    drift_velocity = drift_now - drift_prev

                                    if drift_velocity > DRIFT_ACCEL_THRESHOLD:
                                        log(
                                            f"[ALPHA] {symbol} drift_accel={round(drift_velocity,6)} "
                                            f"drift={round(drift_now,6)}"
                                        )

                                history.append(drift_now)

                                if len(history) > 10:
                                    history.pop(0)

                                symbol_drift_history[symbol] = history

                            # -------- VOLUME --------
                            volume = fetch_volume(symbol)
                            if volume:
                                log(f"[VOL] {symbol} volume={volume}")

                        else:
                            pass

                    except Exception as e:
                        log(f"Symbol cycle error: {symbol} {e}")

                # ---------------- PROPAGATION ----------------
                safe_propagation_update(
                    propagation_engine,
                    evaluation_symbols
                )

                # ---------------- FIELD ----------------
                try:
                    snap = propagation_engine.snapshot()
                    n = snap.get("narrative", {})

                    log(
                        f"[FIELD] momentum={round(n.get('momentum',0),5)} "
                        f"conc={round(n.get('concentration',0),5)} "
                        f"bias={round(n.get('bias',0),5)}"
                    )
                except Exception as e:
                    log(f"[FIELD] snapshot error: {e}")

                log(f"[DRIFT] tracking {len(symbol_drift_history)} symbols")

                # ---------------- MODE ----------------
                if market_open:
                    log("[MODE] Full Quant Active")
                else:
                    log("[MODE] Narrative + Propagation ONLY")

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


# ------------------------------------------------------------------
# PROPAGATION SNAPSHOT
# ------------------------------------------------------------------

@app.get("/api/propagation")
def get_propagation_snapshot():

    try:

        if not propagation_engine:
            return {"error": "propagation_engine not initialized"}

        if hasattr(propagation_engine, "snapshot"):
            return propagation_engine.snapshot()

        if hasattr(propagation_engine, "get_state"):
            return propagation_engine.get_state()

        return {"error": "no snapshot method available"}

    except Exception as e:
        return {"error": str(e)}