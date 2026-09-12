from __future__ import annotations

import argparse
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Mapping, Sequence

from isees_uap.authentication.candidate_access import normalize_email
from isees_uap.authentication.models import AccountStatus
from isees_uap.authentication.sqlite_repository import SQLiteAuthenticationRepository


def _database_path(arguments: argparse.Namespace, values: Mapping[str, str]) -> Path:
    if arguments.database_path:
        path = Path(arguments.database_path)
    else:
        root_value = arguments.persistent_root or values.get("ISEES_PERSISTENT_ROOT")
        if not root_value:
            raise ValueError("an explicit database path or persistent root is required")
        path = Path(root_value) / "databases" / "authentication.sqlite3"
    if not path.is_absolute():
        raise ValueError("the resolved database path must be absolute")
    if not path.is_file():
        raise ValueError("the authentication database does not exist")
    return path


def manage_account(arguments: argparse.Namespace,
                   values: Mapping[str, str] = os.environ) -> str:
    normalized = normalize_email(arguments.email)
    repository = SQLiteAuthenticationRepository(_database_path(arguments, values))
    account = repository.find_account_by_normalized_email(normalized)
    if account is None:
        raise ValueError("exactly one account was not found")
    revoked = None
    if arguments.action != "lookup":
        if arguments.confirm_email != normalized or arguments.confirm_action != arguments.action:
            raise ValueError("mutation confirmation does not match the account and action")
        now = datetime.now(timezone.utc)
        if arguments.action in {"disable", "enable"}:
            status = (AccountStatus.DISABLED if arguments.action == "disable"
                      else AccountStatus.ACTIVE)
            account = repository.set_account_status(
                account_id=account.account_id, status=status, occurred_at=now)
            if status is AccountStatus.DISABLED:
                revoked = repository.revoke_all_sessions(
                    account_id=account.account_id, revoked_at=now)
        else:
            revoked = repository.revoke_all_sessions(
                account_id=account.account_id, revoked_at=now)
        account = repository.find_account_by_normalized_email(normalized)
    fields = [f"account_id={account.account_id}", f"email={account.normalized_email}",
              f"status={account.status.value}"]
    if revoked is not None:
        fields.append(f"sessions_revoked={revoked}")
    return " ".join(fields)


def parser() -> argparse.ArgumentParser:
    result = argparse.ArgumentParser(description="Manage one iSEES pilot account locally")
    result.add_argument("action", choices=("lookup", "disable", "enable", "revoke"))
    result.add_argument("--email", required=True)
    location = result.add_mutually_exclusive_group()
    location.add_argument("--database-path")
    location.add_argument("--persistent-root")
    result.add_argument("--confirm-email")
    result.add_argument("--confirm-action", choices=("disable", "enable", "revoke"))
    return result


def main(argv: Sequence[str] | None = None) -> int:
    try:
        print(manage_account(parser().parse_args(argv)))
        return 0
    except (RuntimeError, ValueError) as error:
        print(f"account operation failed: {error}")
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
