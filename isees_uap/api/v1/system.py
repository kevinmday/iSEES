"""Public, non-sensitive System Identity endpoint."""

from fastapi import APIRouter, Request

from isees_uap.system_identity import SystemIdentity

router = APIRouter(prefix="/api/v1/system", tags=["system"])


@router.get("/identity", response_model=SystemIdentity)
def get_system_identity(request: Request) -> SystemIdentity:
    return request.app.state.system_identity
