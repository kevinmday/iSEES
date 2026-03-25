from .rss.feed_registry import FeedRegistry
from .rss.rss_fetcher import RSSFetcher
from .rss.narrative_buffer import NarrativeBuffer
from .rss.rss_worker import RSSWorker

from marketmind_engine.narrative.projection.symbol_extractor import (
    SymbolExtractor,
)

from marketmind_engine.narrative.projection.projection_event import (
    ProjectionEvent,
)

from marketmind_engine.narrative.propagation_engine import PropagationEngine

from marketmind_engine.narrative.narrative_identity import (
    NarrativeIdentityResolver,
)

# ✅ NEW (ignition)
from marketmind_engine.intelligence.ignition_detector import IgnitionDetector

import threading
import hashlib


class NarrativeAdapter:
    """
    Deterministic narrative shock adapter.

    🔥 NOW LIVE:
    - RSS worker runs in background
    - Projection updates continuously

    🔥 UPGRADE:
    - Cross-source duplicate aggregation (weight = frequency)
    - Carries narrative content (title + timestamp)
    """

    def __init__(self):

        # RSS ingestion stack
        self.registry = FeedRegistry()
        self.fetcher = RSSFetcher()
        self.buffer = NarrativeBuffer()
        self.worker = RSSWorker(self.registry, self.fetcher, self.buffer)

        # Symbol resolution
        self.extractor = SymbolExtractor()

        # Propagation engine
        self.propagation = PropagationEngine()

        # Narrative identity resolver
        self.identity_resolver = NarrativeIdentityResolver()

        # ✅ NEW (ignition)
        self.ignition = IgnitionDetector()

        # Engine state
        self._projection_events = []
        self._engine_time_counter = 0

        # 🔥 NEW — aggregated event registry
        self._event_registry = {}

        # 🔥 START RSS WORKER (BACKGROUND THREAD)
        threading.Thread(
            target=self.worker.run_loop,
            daemon=True
        ).start()

    # -------------------------------------------------
    # Deterministic Injection (RSS)
    # -------------------------------------------------

    def inject_headlines(self, headlines):

        if headlines is None:
            headlines = []

        headlines = list(headlines)

        self.buffer.update(headlines)

        self._update_projection()

    # -------------------------------------------------
    # ✅ Price → Ignition → Narrative
    # -------------------------------------------------

    def ingest_price_data(self, price_data: dict):

        events = self.ignition.process_batch(price_data)

        if not events:
            return

        for e in events:

            self._engine_time_counter += 1

            event = ProjectionEvent(
                symbol=e.symbol,
                engine_time=self._engine_time_counter,
                source="ignition",
                sentiment=0.0,
                weight=e.weight,
                title=None,          # safe
                timestamp=None,      # safe
            )

            self.propagation.ingest_event(event)
            self._projection_events.append(event)

        self._prune_projection_events()

    # -------------------------------------------------
    # Projection (RSS path)
    # -------------------------------------------------

    def _extract_title(self, item):

        if isinstance(item, dict):
            return item.get("title", "")

        return getattr(item, "title", "")

    def _extract_timestamp(self, item):
        """
        Best-effort timestamp extraction.
        Handles dict + object feeds.
        """

        if isinstance(item, dict):
            return item.get("published") or item.get("timestamp") or ""

        return getattr(item, "published", None) or getattr(item, "timestamp", "")

    def _update_projection(self):

        headlines = self.buffer.snapshot()

        # 🔥 reset aggregation each cycle
        self._event_registry = {}

        for item in headlines:

            title = self._extract_title(item)

            if not title:
                continue

            # 🔥 stable hash (not Python hash)
            event_id = hashlib.md5(title.lower().encode()).hexdigest()

            if event_id not in self._event_registry:
                self._event_registry[event_id] = {
                    "count": 0,
                    "title": title,
                    "timestamp": self._extract_timestamp(item),
                }

            self._event_registry[event_id]["count"] += 1

        new_events = []

        # 🔥 build events from aggregated registry
        for event_id, entry in self._event_registry.items():

            title = entry["title"]
            timestamp = entry.get("timestamp", "")
            weight = entry["count"]

            extracted_symbols = self.extractor.extract(title)

            if not extracted_symbols:
                continue

            narrative = self.identity_resolver.resolve(title)

            for symbol in extracted_symbols:

                self._engine_time_counter += 1

                event = ProjectionEvent(
                    symbol=symbol,
                    engine_time=self._engine_time_counter,
                    source="rss",
                    sentiment=0.0,
                    weight=weight,
                    title=title,            # 🔥 FIX
                    timestamp=timestamp,    # 🔥 FIX
                )

                new_events.append(event)

                narrative.assets.add(symbol)

                self.propagation.ingest_event(event)

        self._projection_events.extend(new_events)

        self._prune_projection_events()

    # -------------------------------------------------
    # PRUNING
    # -------------------------------------------------

    def _prune_projection_events(self):

        cutoff = self._engine_time_counter - 300

        self._projection_events = [
            e for e in self._projection_events
            if e.engine_time >= cutoff
        ]

    # -------------------------------------------------
    # Accessors
    # -------------------------------------------------

    def get_projection_events(self):
        return list(self._projection_events)

    # -------------------------------------------------
    # Propagation Snapshot
    # -------------------------------------------------

    def get_propagation_snapshot(self):

        self._update_projection()

        return self.propagation.snapshot()

    # -------------------------------------------------
    # Shock Calculation
    # -------------------------------------------------

    def compute_narrative_shock(self) -> float:

        headlines = self.buffer.snapshot()

        if not headlines:
            return 0.0

        volume = len(headlines)

        shock = volume / 100.0

        return min(shock, 1.0)