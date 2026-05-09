# ============================================================
# domain_entanglement.py — DOMAIN ENTANGLEMENT ENGINE (V1)
# ============================================================

from typing import List, Dict

from isees_uap.kod.topology.topology_models import (
    DomainLink,
    DomainEntanglement,
)

from isees_uap.kod.topology.topology_types import (
    DomainLinkType,
    EntanglementState,
)


# ============================================================
# DEFAULT DOMAIN COOPERATION MATRIX
# ============================================================

DEFAULT_COOPERATION_MATRIX = {

    ("aviation", "weather"): 0.75,

    ("aviation", "sensor"): 0.65,

    ("weather", "sensor"): 0.60,

    ("astronomical", "weather"): 0.40,

    ("astronomical", "sensor"): 0.50,
}


# ============================================================
# DOMAIN PAIR KEY
# ============================================================

def _build_domain_pair(
    domain_a: str,
    domain_b: str,
) -> tuple:

    return tuple(
        sorted([
            domain_a.strip().lower(),
            domain_b.strip().lower(),
        ])
    )


# ============================================================
# RESOLVE ENTANGLEMENT STATE
# ============================================================

def resolve_entanglement_state(
    score: float,
) -> EntanglementState:

    if score >= 0.85:
        return EntanglementState.CRITICAL

    if score >= 0.65:
        return EntanglementState.STRONG

    if score >= 0.45:
        return EntanglementState.MODERATE

    if score >= 0.20:
        return EntanglementState.WEAK

    return EntanglementState.ISOLATED


# ============================================================
# BUILD DOMAIN LINK
# ============================================================

def build_domain_link(
    source_domain: str,
    target_domain: str,
    collapse_gain: float,
) -> DomainLink:

    dependency_strength = round(
        max(0.0, min(collapse_gain, 1.0)),
        4,
    )

    if dependency_strength >= 0.60:

        link_type = DomainLinkType.ENTANGLED

    elif dependency_strength >= 0.35:

        link_type = DomainLinkType.PARTIAL

    else:

        link_type = DomainLinkType.SUPPORTIVE

    return DomainLink(

        source_domain=source_domain,

        target_domain=target_domain,

        link_type=link_type,

        dependency_strength=dependency_strength,

        collapse_gain=dependency_strength,
    )


# ============================================================
# BUILD ENTANGLEMENT
# ============================================================

def build_entanglement(
    domain_a: str,
    domain_b: str,
    shared_residuals: List[str],
) -> DomainEntanglement:

    pair_key = _build_domain_pair(
        domain_a,
        domain_b,
    )

    entanglement_score = (
        DEFAULT_COOPERATION_MATRIX.get(
            pair_key,
            0.15,
        )
    )

    state = resolve_entanglement_state(
        entanglement_score
    )

    return DomainEntanglement(

        domains=[
            domain_a,
            domain_b,
        ],

        entanglement_state=state,

        entanglement_score=round(
            entanglement_score,
            4,
        ),

        shared_residuals=shared_residuals,
    )


# ============================================================
# BUILD DOMAIN LINKS
# ============================================================

def build_domain_links(
    entanglements: List[DomainEntanglement],
) -> List[DomainLink]:

    links = []

    for entanglement in entanglements:

        domains = entanglement.domains

        if len(domains) < 2:
            continue

        link = build_domain_link(

            source_domain=domains[0],

            target_domain=domains[1],

            collapse_gain=(
                entanglement.entanglement_score
            ),
        )

        links.append(link)

    return links


# ============================================================
# GLOBAL ENTANGLEMENT SCORE
# ============================================================

def compute_global_entanglement_score(
    entanglements: List[DomainEntanglement],
) -> float:

    if not entanglements:
        return 0.0

    scores = [

        entanglement.entanglement_score

        for entanglement in entanglements
    ]

    return round(
        sum(scores) / len(scores),
        4,
    )


# ============================================================
# HIGH ENTANGLEMENT DOMAINS
# ============================================================

def get_high_entanglements(
    entanglements: List[DomainEntanglement],
    threshold: float = 0.65,
) -> List[DomainEntanglement]:

    return [

        entanglement

        for entanglement in entanglements

        if entanglement.entanglement_score
        >= threshold
    ]


# ============================================================
# ENTANGLEMENT SUMMARY
# ============================================================

def build_entanglement_summary(
    entanglements: List[DomainEntanglement],
) -> Dict:

    global_score = (
        compute_global_entanglement_score(
            entanglements
        )
    )

    high_entanglements = (
        get_high_entanglements(
            entanglements
        )
    )

    return {

        "entanglement_count":
            len(entanglements),

        "global_entanglement_score":
            global_score,

        "high_entanglement_count":
            len(high_entanglements),

        "high_entanglement_domains": [

            entanglement.domains

            for entanglement in high_entanglements
        ],
    }