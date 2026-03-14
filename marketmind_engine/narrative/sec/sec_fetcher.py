import requests

SEC_FEED = "https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent&type=8-K&count=100&output=atom"


class SECFetcher:

    def fetch(self):

        headers = {
            "User-Agent": "MarketMind Research Engine"
        }

        response = requests.get(SEC_FEED, headers=headers, timeout=10)

        if response.status_code != 200:
            return None

        return response.text