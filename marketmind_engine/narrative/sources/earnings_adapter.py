# marketmind_engine/narrative/sources/earnings_adapter.py

from datetime import datetime


class EarningsAdapter:
    def __init__(self):
        pass

    def parse_webhook(self, payload: dict):
        """
        Accepts Benzinga-style earnings webhook payload
        Returns list of normalized ProjectionEvent dicts
        """

        events = []

        try:
            data = payload.get("data", {})
            content = data.get("content", {})

            ticker = content.get("ticker")
            timestamp = data.get("timestamp")

            if not ticker or not timestamp:
                return []

            # --- core metrics ---
            eps = self._safe_float(content.get("eps"))
            eps_est = self._safe_float(content.get("eps_est"))
            revenue = self._safe_float(content.get("revenue"))
            revenue_est = self._safe_float(content.get("revenue_est"))

            eps_delta = None
            rev_delta = None

            if eps is not None and eps_est is not None:
                eps_delta = eps - eps_est

            if revenue is not None and revenue_est is not None:
                rev_delta = revenue - revenue_est

            # --- build text (light narrative layer) ---
            text_parts = [f"{ticker} earnings"]

            if eps_delta is not None:
                text_parts.append(f"EPS Δ={round(eps_delta, 4)}")

            if rev_delta is not None:
                text_parts.append(f"REV Δ={int(rev_delta)}")

            text = " | ".join(text_parts)

            # --- dynamic weight (initial simple model) ---
            weight = self._compute_weight(eps_delta, rev_delta)

            event = {
                "timestamp": timestamp,
                "text": text,
                "source": "benzinga_earnings",
                "symbols": [ticker],
                "weight": weight,
                "metrics": {
                    "eps": eps,
                    "eps_est": eps_est,
                    "eps_delta": eps_delta,
                    "revenue": revenue,
                    "revenue_est": revenue_est,
                    "revenue_delta": rev_delta,
                }
            }

            events.append(event)

        except Exception as e:
            print(f"[EARNINGS_ADAPTER_ERROR] {e}")

        return events

    def _safe_float(self, value):
        try:
            if value is None:
                return None
            return float(value)
        except:
            return None

    def _compute_weight(self, eps_delta, rev_delta):
        """
        VERY IMPORTANT:
        Keep simple for now (no overfitting)
        """

        weight = 1.0

        if eps_delta is not None:
            weight += min(abs(eps_delta), 1.0)

        if rev_delta is not None:
            # scale revenue delta to manageable influence
            weight += min(abs(rev_delta) / 1e10, 1.0)

        return round(weight, 3)