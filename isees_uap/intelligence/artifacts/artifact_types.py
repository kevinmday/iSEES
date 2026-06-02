# ============================================================
# artifact_types.py
# iSEES-UAP — ARTIFACT TYPE SYSTEM
# ============================================================

"""
Defines canonical artifact-space types.

Artifacts are NOT truth.

Artifacts represent:
observable cognition surfaces
retrieved from external domains.

This layer exists to normalize:
artifact identity,
artifact provenance,
and retrieval semantics
across heterogeneous sources.

Examples:
- NotebookLM
- FAA documents
- RSS feeds
- witness reports
- radar captures
- media archives
- transcripts
- ATC audio
"""

from __future__ import annotations

from enum import Enum


# ============================================================
# ARTIFACT DOMAIN
# ============================================================

class ArtifactDomain(str, Enum):

    NOTEBOOKLM = "NOTEBOOKLM"

    FAA = "FAA"

    ADSB = "ADSB"

    WEATHER = "WEATHER"

    SATELLITE = "SATELLITE"

    RADAR = "RADAR"

    ATC = "ATC"

    NEWS = "NEWS"

    RSS = "RSS"

    OSINT = "OSINT"

    MUFON = "MUFON"

    AARO = "AARO"

    LOCAL_ARCHIVE = "LOCAL_ARCHIVE"

    MANUAL_UPLOAD = "MANUAL_UPLOAD"

    UNKNOWN = "UNKNOWN"


# ============================================================
# ARTIFACT TYPE
# ============================================================

class ArtifactType(str, Enum):

    PDF = "PDF"

    DOCUMENT = "DOCUMENT"

    NOTEBOOK_REFERENCE = "NOTEBOOK_REFERENCE"

    TRANSCRIPT = "TRANSCRIPT"

    REPORT = "REPORT"

    IMAGE = "IMAGE"

    VIDEO = "VIDEO"

    AUDIO = "AUDIO"

    RADAR_CAPTURE = "RADAR_CAPTURE"

    SATELLITE_FRAME = "SATELLITE_FRAME"

    SENSOR_EXPORT = "SENSOR_EXPORT"

    FLIGHT_TRACK = "FLIGHT_TRACK"

    WEATHER_RECORD = "WEATHER_RECORD"

    NEWS_ARTICLE = "NEWS_ARTICLE"

    RSS_ITEM = "RSS_ITEM"

    WITNESS_REPORT = "WITNESS_REPORT"

    INVESTIGATION_NOTE = "INVESTIGATION_NOTE"

    GOVERNMENT_RECORD = "GOVERNMENT_RECORD"

    FOIA_DOCUMENT = "FOIA_DOCUMENT"

    SOCIAL_MEDIA = "SOCIAL_MEDIA"

    SCREENSHOT = "SCREENSHOT"

    TIMELINE = "TIMELINE"

    MAP = "MAP"

    UNKNOWN = "UNKNOWN"


# ============================================================
# ARTIFACT AUTHORITY
# ============================================================

class ArtifactAuthority(str, Enum):

    PRIMARY_SOURCE = "PRIMARY_SOURCE"

    GOVERNMENT_SOURCE = "GOVERNMENT_SOURCE"

    SENSOR_SOURCE = "SENSOR_SOURCE"

    INVESTIGATOR_SOURCE = "INVESTIGATOR_SOURCE"

    MEDIA_SOURCE = "MEDIA_SOURCE"

    COMMUNITY_SOURCE = "COMMUNITY_SOURCE"

    EXTERNAL_AI_SOURCE = "EXTERNAL_AI_SOURCE"

    USER_IMPORTED = "USER_IMPORTED"

    SYNTHETIC = "SYNTHETIC"

    UNKNOWN = "UNKNOWN"


# ============================================================
# RETRIEVAL MODE
# ============================================================

class RetrievalMode(str, Enum):

    MANUAL = "MANUAL"

    VECTOR_RETRIEVAL = "VECTOR_RETRIEVAL"

    TOPOLOGY_TRIGGERED = "TOPOLOGY_TRIGGERED"

    EVENT_TRIGGERED = "EVENT_TRIGGERED"

    REPLAY_TRIGGERED = "REPLAY_TRIGGERED"

    MEMORY_TRIGGERED = "MEMORY_TRIGGERED"

    OPERATOR_REQUESTED = "OPERATOR_REQUESTED"

    CROSS_REFERENCE = "CROSS_REFERENCE"

    UNKNOWN = "UNKNOWN"


# ============================================================
# ARTIFACT STATE
# ============================================================

class ArtifactState(str, Enum):

    DISCOVERED = "DISCOVERED"

    IMPORTED = "IMPORTED"

    INDEXED = "INDEXED"

    REFERENCED = "REFERENCED"

    ATTACHED_TO_RUNTIME = "ATTACHED_TO_RUNTIME"

    ARCHIVED = "ARCHIVED"

    INVALIDATED = "INVALIDATED"

    UNKNOWN = "UNKNOWN"


# ============================================================
# SEMANTIC CLASS
# ============================================================

class SemanticClass(str, Enum):

    OBSERVATIONAL = "OBSERVATIONAL"

    INFRASTRUCTURE = "INFRASTRUCTURE"

    SENSOR = "SENSOR"

    TOPOLOGICAL = "TOPOLOGICAL"

    INVESTIGATIVE = "INVESTIGATIVE"

    HISTORICAL = "HISTORICAL"

    ENVIRONMENTAL = "ENVIRONMENTAL"

    BEHAVIORAL = "BEHAVIORAL"

    ANOMALOUS = "ANOMALOUS"

    CONTEXTUAL = "CONTEXTUAL"

    UNKNOWN = "UNKNOWN"


# ============================================================
# EXPORTS
# ============================================================

__all__ = [

    "ArtifactDomain",

    "ArtifactType",

    "ArtifactAuthority",

    "RetrievalMode",

    "ArtifactState",

    "SemanticClass",
]