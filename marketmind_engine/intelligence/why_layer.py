class WhyLayer:
    def __init__(self):
        pass

    def analyze(self, symbol, events):
        """
        events = list of projection events
        """

        reasons = []
        themes = set()
        catalysts = set()
        mentions = 0

        for e in events:
            text = ""

            if hasattr(e, "title"):
                text += e.title.lower()

            if symbol.lower() in text:
                mentions += 1

                # --- THEME DETECTION ---
                if "ai" in text or "artificial intelligence" in text:
                    themes.add("AI")

                if "biometric" in text or "facial" in text:
                    themes.add("biometrics")

                if "defense" in text or "pentagon" in text:
                    themes.add("defense")

                if "health" in text or "biotech" in text:
                    themes.add("biotech")

                # --- CATALYST DETECTION ---
                if "award" in text or "best" in text:
                    catalysts.add("validation")

                if "launch" in text or "release" in text:
                    catalysts.add("product")

                if "ipo" in text or "listing" in text:
                    catalysts.add("ipo_cycle")

                if "contract" in text or "deal" in text:
                    catalysts.add("contract")

        # --- SUMMARY ---
        if mentions > 0:
            reasons.append(f"{mentions} recent mentions")

        if themes:
            reasons.append("themes: " + ", ".join(sorted(themes)))

        if catalysts:
            reasons.append("catalysts: " + ", ".join(sorted(catalysts)))

        return {
            "symbol": symbol,
            "mentions": mentions,
            "themes": list(themes),
            "catalysts": list(catalysts),
            "summary": " | ".join(reasons) if reasons else "no narrative signal"
        }

    def print_why(self, why_results):
        print("\n================ WHY =================")

        for w in why_results:
            print(f"{w['symbol']} → {w['summary']}")

        print("=====================================\n")