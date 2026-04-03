# marketmind_engine/intelligence/signal_layer.py

class SignalLayer:
    def __init__(self):
        self.prev_scores = {}

    def compute(self, ranked_symbols):
        """
        ranked_symbols = list of dicts OR tuples
        must include:
            symbol, score, drift, ucip, life
        """

        results = []

        for item in ranked_symbols:
            # support both tuple and dict safely
            if isinstance(item, dict):
                symbol = item["symbol"]
                score = item["score"]
                drift = item.get("drift", 0)
                ucip = item.get("ucip", 0)
                life = item.get("life", 0)
            else:
                symbol, score, drift, ucip, life = item

            prev = self.prev_scores.get(symbol, score)
            delta = score - prev
            self.prev_scores[symbol] = score

            signal = self.classify(score, delta)

            results.append({
                "symbol": symbol,
                "score": score,
                "delta": delta,
                "signal": signal,
                "drift": drift,
                "ucip": ucip,
                "life": life,
            })

        return results

    def classify(self, score, delta):
        if abs(delta) < 1e-6:
            return "STABLE"

        if score > 0:
            if delta > 0:
                return "CONTINUATION"
            if delta < 0:
                return "EXHAUSTION"

        if score <= 0 and delta > 0:
            return "IGNITION"

        return "STABLE"