# ============================================================
# replay_engine.py
# TEMPORAL COGNITION REPLAY ENGINE
# ============================================================

"""
Temporal cognition reconstruction engine.

Consumes:

    immutable snapshots
    epistemic deltas
    append-only cognition logs

Produces:

    replay cognition states
    temporal cognition transitions
    reconstructed operator states

Replay outputs are NON-CANONICAL.

Replay MUST NEVER mutate historical lineage.
"""
