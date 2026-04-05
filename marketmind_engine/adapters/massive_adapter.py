import time
from collections import defaultdict, deque


class MassiveAdapter:
    def __init__(self, propagation_engine):
        self.engine = propagation_engine

        # rolling buffers per symbol
        self.prices = defaultdict(lambda: deque(maxlen=10))
        self.volumes = defaultdict(lambda: deque(maxlen=10))

        self.last_delta = {}

    def ingest_trade(self, symbol: str, price: float, size: float):
        """
        Called from WebSocket stream
        """

        now = time.time()

        self.prices[symbol].append(price)
        self.volumes[symbol].append(size)

        # 🔥 FIXED: only need 2 points, not 3
        if len(self.prices[symbol]) < 2:
            return

        delta = self._compute_delta(symbol)

        if delta is None:
            return

        # 🔥 inject into propagation engine
        self.engine.inject_delta(symbol, delta)

    def _compute_delta(self, symbol):

        prices = self.prices[symbol]
        volumes = self.volumes[symbol]

        if len(prices) < 2:
            return None

        p_now = prices[-1]
        p_prev = prices[0]

        if p_prev == 0:
            return None

        # price velocity
        delta_price = (p_now - p_prev) / p_prev

        # volume intensity
        vol_now = sum(volumes)
        avg_vol = max(sum(volumes) / len(volumes), 1e-6)

        volume_ratio = vol_now / avg_vol

        # 🔥 simplified Δ model
        delta = delta_price * (1 + volume_ratio)

        return delta