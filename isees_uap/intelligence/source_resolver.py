# ============================================================
# source_resolver.py — V3 (NO API • GLOBAL • DETERMINISTIC)
# ============================================================

from typing import List, Dict
import requests
import re
from urllib.parse import urlparse

HEADERS = {
    "User-Agent": "Mozilla/5.0"
}

TIMEOUT = 3


# ------------------------------------------------------------
# 1. TOKEN EXPANSION
# ------------------------------------------------------------

def expand_location_tokens(location: str) -> List[str]:
    clean = re.sub(r"[^a-zA-Z0-9\s]", "", location.lower())
    parts = clean.split()

    tokens = set(parts)

    # generate combinations
    if len(parts) >= 2:
        tokens.add("".join(parts))  # cavejunction
        tokens.add("-".join(parts)) # cave-junction

    return list(tokens)


# ------------------------------------------------------------
# 2. DOMAIN SYNTHESIS
# ------------------------------------------------------------

MEDIA_SUFFIXES = [
    "news", "times", "press", "journal",
    "radio", "tv", "media", "gazette"
]

TLDs = [".com", ".org", ".net"]


def generate_candidate_domains(tokens: List[str]) -> List[str]:
    domains = []

    for t in tokens:
        for suffix in MEDIA_SUFFIXES:
            for tld in TLDs:
                domains.append(f"http://{t}{suffix}{tld}")
                domains.append(f"http://{t}-{suffix}{tld}")

    return list(set(domains))


# ------------------------------------------------------------
# 3. LIGHTWEIGHT PROBE
# ------------------------------------------------------------

def probe_url(url: str) -> Dict:
    try:
        res = requests.get(url, headers=HEADERS, timeout=TIMEOUT)

        if res.status_code != 200:
            return None

        text = res.text[:5000].lower()

        # crude media signal detection
        score = 0

        if "news" in text: score += 2
        if "radio" in text: score += 1
        if "tv" in text: score += 1
        if "report" in text: score += 1
        if "contact" in text: score += 1

        title = extract_title(res.text)

        return {
            "name": title or urlparse(url).netloc,
            "url": url,
            "score": score
        }

    except Exception:
        return None


def extract_title(html: str) -> str:
    match = re.search(r"<title>(.*?)</title>", html, re.IGNORECASE)
    if match:
        return match.group(1).strip()
    return None


# ------------------------------------------------------------
# 4. CONTACT EXTRACTION (LIGHT)
# ------------------------------------------------------------

def extract_contacts(url: str) -> List[Dict]:
    try:
        res = requests.get(url, headers=HEADERS, timeout=TIMEOUT)
        emails = set(re.findall(
            r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}",
            res.text
        ))

        return [{"type": "email", "value": e} for e in emails]

    except Exception:
        return []


# ------------------------------------------------------------
# 5. MAIN RESOLVER
# ------------------------------------------------------------

def resolve_sources(location: str) -> List[Dict]:
    tokens = expand_location_tokens(location)
    candidates = generate_candidate_domains(tokens)

    results = []

    for url in candidates[:30]:  # cap for speed
        r = probe_url(url)

        if not r:
            continue

        if r["score"] < 2:
            continue

        contacts = extract_contacts(url)

        results.append({
            "name": r["name"],
            "url": r["url"],
            "contacts": contacts,
            "score": r["score"]
        })

    # sort by score
    results.sort(key=lambda x: x["score"], reverse=True)

    return results[:5]


# ------------------------------------------------------------
# 6. ACTION BUILDER
# ------------------------------------------------------------

def build_actions_from_sources(sources: List[Dict], location: str) -> Dict:
    if not sources:
        return {
            "next_steps": [
                f"Search local sources for '{location}'",
                "Check regional activity reports"
            ],
            "contacts": []
        }

    steps = []
    contacts = []

    for s in sources:
        steps.append(f"Search {s['name']} for '{location}'")

        for c in s["contacts"]:
            contacts.append({
                "source": s["name"],
                "email": c["value"]
            })

    return {
        "next_steps": list(set(steps)),
        "contacts": contacts
    }