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


class NarrativeAdapter:
    """
    Deterministic narrative shock adapter.

    Engine-safe.
    Projection contract locked.
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
    # ✅ NEW — Price → Ignition → Narrative
    # -------------------------------------------------

    def ingest_price_data(self, price_data: dict):
        """
        Accept price updates and convert to ignition events.
        """

        events = self.ignition.process_batch(price_data)

        if not events:
            return

        for e in events:

            # deterministic engine time
            self._engine_time_counter += 1

            event = ProjectionEvent(
                symbol=e.symbol,
                engine_time=self._engine_time_counter,
                source="ignition",
                sentiment=0.0,
                weight=e.weight,
            )

            # push directly into propagation (same as RSS path)
            self.propagation.ingest_event(event)

            # 🔥 persist ignition events as well
            self._projection_events.append(event)

        # 🔥 prune after ingestion
        self._prune_projection_events()

    # -------------------------------------------------
    # Projection (RSS path)
    # -------------------------------------------------

    def _extract_title(self, item):

        if isinstance(item, dict):
            return item.get("title", "")

        return getattr(item, "title", "")

    def _update_projection(self):

        headlines = self.buffer.snapshot()

        new_events = []

        for item in headlines:

            title = self._extract_title(item)

            if not title:
                continue

            extracted_symbols = self.extractor.extract(title)

            if not extracted_symbols:
                continue

            # Resolve Narrative Identity
            narrative = self.identity_resolver.resolve(title)

            for symbol in extracted_symbols:

                self._engine_time_counter += 1

                event = ProjectionEvent(
                    symbol=symbol,
                    engine_time=self._engine_time_counter,
                    source="rss",
                    sentiment=0.0,
                    weight=1.0,
                )

                new_events.append(event)

                narrative.assets.add(symbol)

                # 🔥 feed propagation immediately
                self.propagation.ingest_event(event)

        # ==========================================================
        # 🔥 PERSISTENCE (FIELD MEMORY)
        # ==========================================================

        self._projection_events.extend(new_events)

        # 🔥 prune after update
        self._prune_projection_events()

    # -------------------------------------------------
    # 🔥 PRUNING (SHARED)
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