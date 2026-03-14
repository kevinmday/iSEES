from .sec_fetcher import SECFetcher
from .sec_parser import SECParser


class SECWorker:

    def __init__(self):

        self.fetcher = SECFetcher()
        self.parser = SECParser()

    def run(self):

        xml = self.fetcher.fetch()

        if not xml:
            return []

        events = self.parser.parse(xml)

        return events