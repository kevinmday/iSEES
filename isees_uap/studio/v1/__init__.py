"""Additive A23 STUDIO V1 domain contracts; not connected to live runtime behavior."""
from .persistence import FailureCode, ProjectionSpecification, SaveCommand, SaveResult, StudioV1Failure
from .save_service import StudioV1SaveService, projection_identity, request_fingerprint
from .sqlite_store import SQLiteStudioV1Store

__all__ = ["FailureCode", "ProjectionSpecification", "SaveCommand", "SaveResult",
           "StudioV1Failure", "StudioV1SaveService", "SQLiteStudioV1Store",
           "projection_identity", "request_fingerprint"]
