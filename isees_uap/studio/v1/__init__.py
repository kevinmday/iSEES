"""Additive A23 STUDIO V1 domain contracts; not connected to live runtime behavior."""
from .application import (ApplicationState, PrivateStudioV1Application,
                          StudioV1ApplicationSettings, StudioV1Readiness,
                          compose_private_studio_v1_application)
from .persistence import FailureCode, ProjectionSpecification, SaveCommand, SaveResult, StudioV1Failure
from .save_service import StudioV1SaveService, projection_identity, request_fingerprint
from .sqlite_store import SQLiteStudioV1Store
from .profile_registry import (PROFILE_REGISTRY, REGISTRY_SCHEMA_VERSION,
                               get_profile, get_profile_version, list_profiles,
                               list_verified_available_profiles,
                               validate_profile_registry)

__all__ = ["FailureCode", "ProjectionSpecification", "SaveCommand", "SaveResult",
           "StudioV1Failure", "StudioV1SaveService", "SQLiteStudioV1Store",
           "projection_identity", "request_fingerprint", "ApplicationState",
           "PrivateStudioV1Application", "StudioV1ApplicationSettings", "StudioV1Readiness",
           "compose_private_studio_v1_application", "PROFILE_REGISTRY",
           "REGISTRY_SCHEMA_VERSION", "get_profile", "get_profile_version",
           "list_profiles", "list_verified_available_profiles", "validate_profile_registry"]
