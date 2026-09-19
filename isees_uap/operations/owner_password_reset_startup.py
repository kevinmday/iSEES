from __future__ import annotations

import argparse
import logging
from typing import Mapping

from isees_uap.authentication.config import authentication_settings

from .pilot_account import manage_account

OWNER_EMAIL = "kevinmday@yahoo.com"
_LOGGER = logging.getLogger(__name__)


def run_owner_password_reset(values: Mapping[str, str]) -> str:
    request_id = values.get("ISEES_OWNER_RESET_REQUEST_ID")
    database_path = authentication_settings(values).database_path
    arguments = argparse.Namespace(
        action="reset-password",
        email=OWNER_EMAIL,
        database_path=str(database_path),
        persistent_root=None,
        confirm_email=OWNER_EMAIL,
        confirm_action="reset-password",
        request_id=request_id,
    )
    result = manage_account(arguments, values)
    _LOGGER.warning("OWNER_PASSWORD_RESET_COMPLETED %s", result)
    return result
