from typing import Dict, Optional


class DomainRegistry:
    """
    Symbol → Domain mapping.

    Provides deterministic classification
    of symbols into narrative domains.
    """

    def __init__(self):

        # initial static registry
        # this will expand over time
        self._symbol_domains: Dict[str, str] = {

            # metals
            "AAAU": "precious_metals",
            "PHYS": "precious_metals",
            "CEF": "precious_metals",
            "SPPP": "precious_metals",

            # biotech
            "VERU": "biotech",
            "ARCT": "biotech",

            # real estate
            "WHLRL": "real_estate",

            # defense
            "KTOS": "defense",

            # finance
            "SAJ": "finance",

            # energy
            "HGT": "energy",
        }

    def get_domain(self, symbol: str) -> Optional[str]:

        return self._symbol_domains.get(symbol)

    def register(self, symbol: str, domain: str):

        self._symbol_domains[symbol] = domain