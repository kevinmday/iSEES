# ---------------------------------------------------------------------
# MarketMind Ignition Detector
# ---------------------------------------------------------------------
# Detects price-led ignition events before narrative appears.
# Emits synthetic narrative events into the system.
#
# DESIGN:
# - Deterministic (no randomness)
# - Replay-safe (state evolves strictly forward)
# - Domain-aware (market ignition)
# - Noise-controlled (cooldown + rolling baseline)
# ---------------------------------------------------------------------

from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List, Optional
from collections import deque
import time


# ---------------------------------------------------------------------
# CONFIG DEFAULTS
# ---------------------------------------------------------------------

DEFAULT_PRICE_THRESHOLD = 0.02       # 2%
DEFAULT_VOLUME_MULTIPLIER = 2.0      # 2x baseline
DEFAULT_BASELINE_WINDOW = 20         # ticks
DEFAULT_COOLDOWN_SECONDS = 300       # 5 minutes


# ---------------------------------------------------------------------
# EVENT STRUCTURE
# ---------------------------------------------------------------------

@dataclass(frozen=True)
class IgnitionEvent:
    symbol: str
    price_change_pct: float
    volume_ratio: float
    timestamp: float
    source: str = "ignition"
    domain: str = "market"
    weight: float = 2.5

    def to_narrative(self) -> Dict:
        """
        Convert to NarrativeAdapter-compatible event.
        """
        return {
            "symbol": self.symbol,
            "source": self.source,
            "domain": self.domain,
            "sentiment": 0.0,
            "weight": self.weight,
            "price_change_pct": self.price_change_pct,
            "volume_ratio": self.volume_ratio,
            "timestamp": self.timestamp,
        }


# ---------------------------------------------------------------------
# INTERNAL STATE
# ---------------------------------------------------------------------

class SymbolState:
    def __init__(self, baseline_window: int):
        self.last_price: Optional[float] = None
        self.volume_window: deque = deque(maxlen=baseline_window)
        self.last_trigger_time: float = 0.0


# ---------------------------------------------------------------------
# IGNITION DETECTOR
# ---------------------------------------------------------------------

class IgnitionDetector:
    def __init__(
        self,
        price_threshold: float = DEFAULT_PRICE_THRESHOLD,
        volume_multiplier: float = DEFAULT_VOLUME_MULTIPLIER,
        baseline_window: int = DEFAULT_BASELINE_WINDOW,
        cooldown_seconds: int = DEFAULT_COOLDOWN_SECONDS,
    ):
        self.price_threshold = price_threshold
        self.volume_multiplier = volume_multiplier
        self.baseline_window = baseline_window
        self.cooldown_seconds = cooldown_seconds

        self.state: Dict[str, SymbolState] = {}

    # -----------------------------------------------------------------
    # CORE UPDATE
    # -----------------------------------------------------------------

    def update(
        self,
        symbol: str,
        price: float,
        volume: float,
        timestamp: Optional[float] = None,
    ) -> Optional[IgnitionEvent]:

        now = timestamp if timestamp is not None else time.time()

        state = self.state.get(symbol)
        if state is None:
            state = SymbolState(self.baseline_window)
            self.state[symbol] = state

        # -----------------------------
        # Compute baseline volume
        # -----------------------------
        if len(state.volume_window) > 0:
            baseline_volume = sum(state.volume_window) / len(state.volume_window)
        else:
            baseline_volume = volume

        # -----------------------------
        # Compute price change
        # -----------------------------
        price_change_pct = 0.0

        if state.last_price is not None and state.last_price > 0:
            price_change_pct = (price - state.last_price) / state.last_price

        # -----------------------------
        # Compute volume ratio
        # -----------------------------
        volume_ratio = 1.0
        if baseline_volume > 0:
            volume_ratio = volume / baseline_volume

        # -----------------------------
        # Update rolling window (AFTER baseline calc)
        # -----------------------------
        state.volume_window.append(volume)

        # -----------------------------
        # Cooldown check
        # -----------------------------
        if now - state.last_trigger_time < self.cooldown_seconds:
            state.last_price = price
            return None

        # -----------------------------
        # IGNITION CONDITION
        # -----------------------------
        if (
            abs(price_change_pct) >= self.price_threshold
            and volume_ratio >= self.volume_multiplier
        ):
            state.last_trigger_time = now
            state.last_price = price

            return IgnitionEvent(
                symbol=symbol,
                price_change_pct=price_change_pct,
                volume_ratio=volume_ratio,
                timestamp=now,
            )

        # -----------------------------
        # Update last price
        # -----------------------------
        state.last_price = price

        return None

    # -----------------------------------------------------------------
    # BATCH PROCESSING
    # -----------------------------------------------------------------

    def process_batch(
        self,
        price_data: Dict[str, Dict[str, float]],
        timestamp: Optional[float] = None,
    ) -> List[IgnitionEvent]:
        """
        price_data format:
        {
            "AAPL": {"price": 190.0, "volume": 1200000},
            "NVDA": {"price": 900.0, "volume": 3000000},
        }
        """

        events: List[IgnitionEvent] = []

        for symbol, data in price_data.items():

            price = data.get("price")
            volume = data.get("volume")

            if price is None or volume is None:
                continue

            event = self.update(
                symbol=symbol,
                price=price,
                volume=volume,
                timestamp=timestamp,
            )

            if event:
                events.append(event)

        return events


# ---------------------------------------------------------------------
# INTEGRATION HELPER
# ---------------------------------------------------------------------

def inject_into_narrative(adapter, events: List[IgnitionEvent]) -> None:
    """
    Clean integration hook for NarrativeAdapter.
    """

    for event in events:
        adapter.ingest_event(event.to_narrative())