# ============================================================
# iSEES-UAP Tensor + Search Vector Engine
# Kevin M. Day, USN (Ret.)
# Deterministic Multimodal Interaction Framework
# ============================================================

import numpy as np
from dataclasses import dataclass, field
from typing import List, Dict


@dataclass
class SensorData:
    values: np.ndarray
    delta: float
    noise: float


@dataclass
class ReportData:
    values: np.ndarray
    delta: float
    confidence: float


@dataclass
class EnvironmentData:
    values: np.ndarray
    stability: float


@dataclass
class SearchVector:
    phrase: str
    score: float
    source: Dict


@dataclass
class UAPEventResult:
    coherence: float
    entropy: float
    classification: str
    search_vectors: List[SearchVector] = field(default_factory=list)


class ISEES_UAP:

    def __init__(self, ttcf: float = 1.0, coherence_threshold: float = 0.5, entropy_limit: float = 0.3):
        self.ttcf = ttcf
        self.coherence_threshold = coherence_threshold
        self.entropy_limit = entropy_limit

    def fidelity(self, signal, noise):
        return signal / noise if noise != 0 else signal

    def triadic_filter(self, s: SensorData, r: ReportData, e: EnvironmentData):
        return (
            self.fidelity(np.mean(s.values), s.noise) > 0.2 and
            r.confidence > 0.2 and
            e.stability > 0.2
        )

    def build_tensor(self, s, r, e):
        Z = np.tensordot(s.values, r.values, axes=0)
        Z = np.tensordot(Z, e.values, axes=0)
        return Z

    # ============================================================
    # NORMALIZED + STRENGTH-WEIGHTED COHERENCE
    # ============================================================
    def compute_coherence(self, Z, s: SensorData):
        size = Z.size if Z.size > 0 else 1
        base_coherence = (np.linalg.norm(Z) / np.sqrt(size)) / self.ttcf

        signal_strength = np.mean(s.values)

        # nonlinear separation
        strength_factor = max(0.3, signal_strength ** 1.5)

        return base_coherence * strength_factor

    def compute_entropy(self, s, r):
        return abs(s.delta - r.delta)

    # ============================================================
    # FIXED: STABLE CLASSIFICATION (NO MORE ALL/NOTHING FLIPS)
    # ============================================================
    def classify(self, C, H):

        # must have structured signal
        if H >= self.entropy_limit:
            return "NOISE"

        # stable bands (tuned for normalized coherence scale)
        if C >= 1.2:
            return "HIGH_CONFIDENCE"
        elif C >= 0.6:
            return "PARTIAL"
        else:
            return "NOISE"

    def extract_tokens(self, s, r, e):
        sensor_tokens = []
        report_tokens = []
        env_tokens = []

        if np.mean(s.values) > 0.7:
            sensor_tokens.append("radar high speed")
        if s.delta > 0.5:
            sensor_tokens.append("persistent track")
        if s.noise < 0.3:
            sensor_tokens.append("clean signal")
        sensor_tokens.append("no IFF")

        if r.confidence > 0.7:
            report_tokens.append("pilot visual")
        if r.delta > 0.4:
            report_tokens.append("maneuvering object")
        report_tokens.append("no propulsion")

        if e.stability > 0.7:
            env_tokens.append("clear weather")
        env_tokens.append("stable atmosphere")

        return sensor_tokens, report_tokens, env_tokens

    def apply_templates(self, s_tokens, r_tokens, e_tokens):
        phrases = []

        for s_tok in s_tokens:
            for r_tok in r_tokens:
                phrases.append(f"{s_tok} {r_tok}")

        for s_tok in s_tokens:
            for e_tok in e_tokens:
                phrases.append(f"{s_tok} {e_tok}")

        for s_tok in s_tokens:
            for r_tok in r_tokens:
                for e_tok in e_tokens:
                    phrases.append(f"{s_tok} {r_tok} {e_tok}")

        for r_tok in r_tokens:
            phrases.append(f"{r_tok} not on radar")

        for s_tok in s_tokens:
            for r_tok in r_tokens:
                phrases.append(f"{s_tok} inconsistent with {r_tok}")

        return list(set(phrases))

    def generate_search_vectors(self, s, r, e, C, H):
        s_tokens, r_tokens, e_tokens = self.extract_tokens(s, r, e)
        phrases = self.apply_templates(s_tokens, r_tokens, e_tokens)

        vectors = []
        for p in phrases:
            score = round(C * (1 - H), 4)
            vectors.append(SearchVector(
                phrase=p,
                score=score,
                source={
                    "coherence": C,
                    "entropy": H,
                    "sensor_mean": float(np.mean(s.values)),
                    "report_conf": r.confidence,
                    "env_stability": e.stability
                }
            ))

        return sorted(vectors, key=lambda x: x.score, reverse=True)

    def run(self, s: SensorData, r: ReportData, e: EnvironmentData):

        if not self.triadic_filter(s, r, e):
            return UAPEventResult(0, 0, "REJECTED", [])

        Z = self.build_tensor(s, r, e)

        C = round(self.compute_coherence(Z, s), 4)
        H = round(self.compute_entropy(s, r), 4)

        classification = self.classify(C, H)

        search_vectors = self.generate_search_vectors(s, r, e, C, H)

        return UAPEventResult(C, H, classification, search_vectors)