import os
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import threading
import time

from marketmind_engine.runtime.build_engine import build_engine
from marketmind_engine.api.models import (
    StartResponse,
    StopResponse,
    EngineStatus,
    RunDecisionResult,
    EngineStateSnapshot,
)

from marketmind_engine.intelligence.propagation_engine import PropagationEngine
from marketmind_engine.intelligence.symbol_validator import SymbolValidator


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
# CORS (UI POLLING)
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

                # --------------------------------------------------
                # RSS POLLING
                # --------------------------------------------------

                if rss_service:

                    try:

                        rss_service.worker.poll_once()
                        rss_service._update_projection()

                        rss_polling_active = True

                        events = rss_service.get_projection_events()

                        print("RSS headlines:", len(rss_service.buffer._headlines))
                        print("RSS events discovered:", len(events))

                        for event in events:

                            if hasattr(event, "symbol") and event.symbol:
                                symbols.add(event.symbol)

                            if hasattr(event, "symbols") and event.symbols:
                                for s in event.symbols:
                                    symbols.add(s)

                    except Exception as e:
                        print("RSS polling error:", e)

                # --------------------------------------------------
                # SYMBOL VALIDATION
                # --------------------------------------------------

                validated_symbols = set()

                for symbol in symbols:

                    try:

                        if symbol_validator.is_valid(symbol):
                            validated_symbols.add(symbol)
                        else:
                            print("Filtered symbol:", symbol)

                    except Exception:
                        pass

                print("Validated symbols:", validated_symbols)

                # --------------------------------------------------
                # ENGINE EVALUATION
                # --------------------------------------------------

                if validated_symbols:

                    for symbol in validated_symbols:

                        try:

                            symbol_evaluation_active = True
                            engine_controller.run_symbol_cycle(symbol)

                        except Exception as e:
                            print("Symbol cycle error:", symbol, e)

                    # --------------------------------------------------
                    # PROPAGATION UPDATE
                    # --------------------------------------------------

                    try:
                        propagation_engine.update(validated_symbols)
                    except Exception:
                        pass

                else:
                    print("No validated RSS symbols this cycle")

        except Exception as e:
            print("Engine loop error:", e)

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

    return {"status": "started"}


@app.post("/api/engine/stop", response_model=StopResponse)
def stop_engine():

    global engine_loop_running

    engine_controller.stop()
    engine_loop_running = False

    return {"status": "stopped"}


# ------------------------------------------------------------------
# ENGINE STATUS
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
# ENGINE STATE SNAPSHOT
# ------------------------------------------------------------------

@app.get("/api/engine/state", response_model=EngineStateSnapshot)
def engine_state():

    last = engine_controller.get_last_result()

    if not last:

        return {
            "running": engine_controller.is_running(),
            "regime": {
                "timestamp": 0.0,
                "regime": "unknown",
                "execution": {},
                "composite_score": 0.0,
                "recovery_modifier": 1.0,
                "domain_modifier": 1.0,
            },
            "engine_time": 0,
            "last_cycle_timestamp": None,
            "regime_name": "unknown",
            "flatten_triggered": False,
            "block_new_entries": False
        }

    regime_snapshot = last.get("regime")

    regime_name = regime_snapshot.get("regime", "unknown")

    execution = regime_snapshot.get("execution", {})

    allow_entries = execution.get("allow_entries", True)

    flatten_triggered = not allow_entries
    block_new_entries = not allow_entries

    return {
        "running": engine_controller.is_running(),
        "regime": regime_snapshot,
        "engine_time": last.get("engine_time", 0),
        "last_cycle_timestamp": regime_snapshot.get("timestamp"),
        "regime_name": regime_name,
        "flatten_triggered": flatten_triggered,
        "block_new_entries": block_new_entries
    }


# ------------------------------------------------------------------
# PROPAGATION OBSERVATORY
# ------------------------------------------------------------------

@app.get("/api/propagation_snapshot")
def propagation_snapshot():

    try:
        return propagation_engine.snapshot()
    except Exception:
        return {"status": "propagation_unavailable"}


# ------------------------------------------------------------------
# PSIQUANTA OBSERVATORY
# ------------------------------------------------------------------

@app.get("/api/psiquant")
def psiquant_snapshot():

    try:

        last = engine_controller.get_last_result()

        if not last:
            return {"psiquant_score": None}

        decision_payload = last.get("decision_payload", {})
        psi = decision_payload.get("psiquant_score")

        return {"psiquant_score": psi}

    except Exception as e:

        return {
            "psiquant_score": None,
            "error": str(e)
        }


# ------------------------------------------------------------------
# LAST ENGINE RESULT (UI PRIMARY DATA SOURCE)
# ------------------------------------------------------------------

@app.get("/api/engine/last")
def last_result():

    try:

        last = engine_controller.get_last_result()

        if not last:
            return {"status": "no_engine_result"}

        decision_payload = last.get("decision_payload", {})

        psi = decision_payload.get("psiquant_score")

        last["psiquant_score"] = psi

        return last

    except Exception as e:

        return {
            "error": str(e)
        }


# ------------------------------------------------------------------
# NARRATIVE RADAR FEED (LEFT PANEL)
# ------------------------------------------------------------------

@app.get("/api/rss_events")
def rss_events():

    try:

        if not rss_service:
            return {"events": []}

        events = rss_service.get_projection_events()

        output = []

        for e in events[-25:]:

            output.append({
                "timestamp": getattr(e, "timestamp", 0),
                "symbol": getattr(e, "symbol", None),
                "symbols": getattr(e, "symbols", []),
                "headline": getattr(e, "headline", ""),
                "source": getattr(e, "source", "rss")
            })

        return {"events": output}

    except Exception as e:

        return {
            "events": [],
            "error": str(e)
        }