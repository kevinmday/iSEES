from dataclasses import dataclass
from typing import List, Dict
from marketmind_engine.config.feed_loader import load_feeds_by_type

# NEW: SEC integration
from marketmind_engine.narrative.sec.sec_worker import SECWorker


@dataclass(frozen=True)
class NarrativeItem:
    title: str
    link: str
    source: str
    domain: str
    weight: float


class FeedAggregator:
    """
    Normalizes narrative inputs from multiple sources.

    Sources currently supported:
        RSS
        SEC filings

    No engine logic.
    No trading logic.
    """

    def __init__(self):

        # RSS feed configs
        self.feed_configs = {
            f.url: f for f in load_feeds_by_type("rss")
        }

        # SEC worker
        self.sec_worker = SECWorker()

    def aggregate(self, raw_entries: Dict[str, List[dict]]) -> List[NarrativeItem]:
        """
        raw_entries:
            {
                "feed_url": [ {entry_dict}, {entry_dict} ]
            }
        """

        seen_links = set()
        results: List[NarrativeItem] = []

        # --------------------------------------------------
        # RSS Aggregation
        # --------------------------------------------------

        for feed_url, entries in raw_entries.items():

            config = self.feed_configs.get(feed_url)

            if not config:
                continue

            for entry in entries:

                link = entry.get("link")
                title = entry.get("title", "")
                source = feed_url

                if not link or link in seen_links:
                    continue

                seen_links.add(link)

                results.append(
                    NarrativeItem(
                        title=title,
                        link=link,
                        source=source,
                        domain=config.domain,
                        weight=config.weight,
                    )
                )

        # --------------------------------------------------
        # SEC Aggregation
        # --------------------------------------------------

        sec_events = self.sec_worker.run()

        for event in sec_events:

            title = event.get("title", "")

            # SEC events don't always have links in this simplified version
            link = f"SEC:{title}"

            if link in seen_links:
                continue

            seen_links.add(link)

            results.append(
                NarrativeItem(
                    title=title,
                    link=link,
                    source="SEC_EDGAR",
                    domain="regulatory",
                    weight=2.5,  # stronger narrative signal
                )
            )

        return results