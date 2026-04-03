class ExecutionLayer:
    def __init__(self):
        self.last_candidates = []

    def evaluate(self, signals):
        """
        signals: output from signal_layer.compute()
        """

        candidates = []

        for s in signals:
            signal = s.get("signal")
            persistence = s.get("persistence", s.get("persist", 1))
            confidence = s.get("confidence", 0)
            symbol = s.get("symbol")

            # --- RULE 1 (minimal scaffold) ---
            if (
                signal == "ACCELERATING"
                and persistence >= 3
                and confidence > 0
            ):
                candidates.append({
                    "symbol": symbol,
                    "confidence": confidence,
                    "persistence": persistence,
                    "signal": signal
                })

        self.last_candidates = candidates
        return candidates

    def print_candidates(self, candidates):
        print("\n================ EXECUTION =================")

        if not candidates:
            print("No candidates")
        else:
            for c in candidates:
                print(
                    f"{c['symbol']} → LONG | "
                    f"p={c['persistence']} "
                    f"conf={c['confidence']:.4f}"
                )

        print("===========================================\n")