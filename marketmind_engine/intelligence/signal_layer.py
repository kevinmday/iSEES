# marketmind_engine/intelligence/signal_layer.py

class SignalLayer:
    def __init__(self):
        self.prev_scores = {}
        self.prev_deltas = {}  # 🔥 NEW (Δ memory for ΔΔ)

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

            # --- Δ (velocity) ---
            prev_score = self.prev_scores.get(symbol, score)
            delta = score - prev_score

            # --- ΔΔ (acceleration) ---
            prev_delta = self.prev_deltas.get(symbol, 0.0)
            accel = delta - prev_delta

            # --- store memory ---
            self.prev_scores[symbol] = score
            self.prev_deltas[symbol] = delta

            # --- classification ---
            signal = self.classify(score, delta, accel)

            results.append({
                "symbol": symbol,
                "score": score,
                "delta": delta,
                "accel": accel,        # 🔥 NEW
                "signal": signal,      # preserved field name
                "drift": drift,
                "ucip": ucip,
                "life": life,
            })

        return results

    # --------------------------------------------------
    # 🔥 EXTENDED CLASSIFIER (Δ + ΔΔ)
    # --------------------------------------------------
    def classify(self, score, delta, accel):
        # --- near-zero guard ---
        if abs(delta) < 1e-6 and abs(accel) < 1e-6:
            return "STABLE"

        # --- classic behavior preserved first ---
        if score > 0:
            if delta > 0:
                # now refined by acceleration
                if accel > 0:
                    return "ACCELERATING"
                if accel < 0:
                    return "DECELERATING"
                return "CONTINUATION"

            if delta < 0:
                if accel < 0:
                    return "COLLAPSING"
                if accel > 0:
                    return "STABILIZING"
                return "EXHAUSTION"

        if score <= 0 and delta > 0:
            if accel > 0:
                return "IGNITION_ACCEL"
            return "IGNITION"

        # --- fallback ---
        return "STABLE"