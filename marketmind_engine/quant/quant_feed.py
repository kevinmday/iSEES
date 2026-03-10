import yfinance as yf
import pandas as pd


def fetch_quant_metrics(symbol: str):

    try:

        ticker = yf.Ticker(symbol)
        hist = ticker.history(period="2d", interval="1m")

        if hist.empty:
            return None

        last_price = hist["Close"].iloc[-1]
        prev_price = hist["Close"].iloc[-10]

        drift = (last_price - prev_price) / prev_price

        momentum = hist["Close"].pct_change().mean()

        volatility = hist["Close"].pct_change().std()

        liquidity = hist["Volume"].mean()

        return {
            "quant_drift": float(drift),
            "momentum": float(momentum),
            "volatility": float(volatility),
            "liquidity": float(liquidity),
        }

    except Exception as e:

        print(f"[QUANT] fetch failure {symbol}: {e}")
        return None