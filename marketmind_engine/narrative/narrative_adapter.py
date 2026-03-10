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

        # Engine state
        self._projection_events = []
        self._engine_time_counter = 0

    # -------------------------------------------------
    # Deterministic Injection
    # -------------------------------------------------

    def inject_headlines(self, headlines):

        if headlines is None:
            headlines = []

        # normalize
        headlines = list(headlines)

        # update buffer
        self.buffer.update(headlines)

        # generate projection events
        self._update_projection()

    # -------------------------------------------------
    # Projection
    # -------------------------------------------------

    def _extract_title(self, item):

        if isinstance(item, dict):
            return item.get("title", "")

        return getattr(item, "title", "")

    def _update_projection(self):

        headlines = self.buffer.snapshot()

        events = []

        for item in headlines:

            title = self._extract_title(item)

            if not title:
                continue

            extracted_symbols = self.extractor.extract(title)

            if not extracted_symbols:
                continue

            for symbol in extracted_symbols:

                # deterministic engine time
                self._engine_time_counter += 1

                event = ProjectionEvent(
                    symbol=symbol,
                    engine_time=self._engine_time_counter,
                    source="rss",
                    sentiment=0.0,
                    weight=1.0,
                )

                events.append(event)

                # send to propagation engine
                self.propagation.ingest_event(event)

        self._projection_events = events

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