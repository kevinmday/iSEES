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

from marketmind_engine.intelligence.ignition_detector import IgnitionDetector

import threading
import hashlib


class NarrativeAdapter:

    def __init__(self):

        self.registry = FeedRegistry()
        self.fetcher = RSSFetcher()
        self.buffer = NarrativeBuffer()
        self.worker = RSSWorker(self.registry, self.fetcher, self.buffer)

        self.extractor = SymbolExtractor()
        self.propagation = PropagationEngine()
        self.identity_resolver = NarrativeIdentityResolver()
        self.ignition = IgnitionDetector()

        self._projection_events = []
        self._engine_time_counter = 0

        self._event_registry = {}

        # 🔥 CRITICAL — symbol continuity memory
        self._last_symbols = set()

        threading.Thread(
            target=self.worker.run_loop,
            daemon=True
        ).start()

    # -------------------------------------------------
    # PRICE INGESTION
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
                title=None,
                timestamp=None,
            )

            self.propagation.ingest_event(event)
            self._projection_events.append(event)

            # 🔥 keep symbol alive
            self._last_symbols.add(e.symbol)

        self._prune_projection_events()

    # -------------------------------------------------
    # HELPERS
    # -------------------------------------------------

    def _extract_title(self, item):

        if isinstance(item, dict):
            return item.get("title", "")

        return getattr(item, "title", "")

    def _extract_timestamp(self, item):

        if isinstance(item, dict):
            return item.get("published") or item.get("timestamp") or ""

        return getattr(item, "published", None) or getattr(item, "timestamp", "")

    # -------------------------------------------------
    # CORE PROJECTION
    # -------------------------------------------------

    def _update_projection(self):

        headlines = self.buffer.snapshot()

        self._event_registry = {}

        for item in headlines:

            title = self._extract_title(item)

            if not title:
                continue

            event_id = hashlib.md5(title.lower().encode()).hexdigest()

            if event_id not in self._event_registry:
                self._event_registry[event_id] = {
                    "count": 0,
                    "title": title,
                    "timestamp": self._extract_timestamp(item),
                }

            self._event_registry[event_id]["count"] += 1

        new_events = []
        current_symbols = set()

        for entry in self._event_registry.values():

            title = entry["title"]
            timestamp = entry.get("timestamp", "")
            weight = entry["count"]

            extracted_symbols = self.extractor.extract(title)

            if not extracted_symbols:
                continue

            narrative = self.identity_resolver.resolve(title)

            for symbol in extracted_symbols:

                current_symbols.add(symbol)

                self._engine_time_counter += 1

                event = ProjectionEvent(
                    symbol=symbol,
                    engine_time=self._engine_time_counter,
                    source="rss",
                    sentiment=0.0,
                    weight=weight,
                    title=title,
                    timestamp=timestamp,
                )

                new_events.append(event)
                narrative.assets.add(symbol)
                self.propagation.ingest_event(event)

        self._projection_events.extend(new_events)

        # 🔥 CRITICAL — persist symbols between cycles
        if current_symbols:
            self._last_symbols = current_symbols

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
    # 🔥 RESTORED — REQUIRED BY RUNTIME
    # -------------------------------------------------

    def get_projection_events(self):
        return list(self._projection_events)

    # -------------------------------------------------
    # SNAPSHOT
    # -------------------------------------------------

    def get_propagation_snapshot(self):

        self._update_projection()

        snapshot = self.propagation.snapshot()

        # 🔥 ensure continuity even if no new RSS cycle
        if not snapshot and self._last_symbols:
            return {s: {} for s in self._last_symbols}

        return snapshot

    # -------------------------------------------------
    # SHOCK
    # -------------------------------------------------

    def compute_narrative_shock(self) -> float:

        headlines = self.buffer.snapshot()

        if not headlines:
            return 0.0

        volume = len(headlines)

        shock = volume / 100.0

        return min(shock, 1.0)