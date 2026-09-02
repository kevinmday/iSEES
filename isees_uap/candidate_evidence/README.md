# Candidate Evidence local backend

This module owns only pre-canonical Candidate Evidence metadata. Its three provenance/intake lanes are `DISCOVERY` (automated WWW or external-repository results), `SUBMISSION` (direct researcher inputs), and `CURATED_REPOSITORY` (references to artifacts still owned by an iSEES-curated repository). These are not truth rankings. Curated records store only a reference and review state, never a duplicate canonical artifact.

The future EVIDENCE presentation boundary distinguishes Investigation Evidence (human-admitted and investigation-qualified), Candidate Evidence (discoveries and submissions awaiting review), and Curated Context (curated-repository references not yet admitted). This increment performs no admission or canonical materialization. Curated references begin `REFERENCED` and must proceed through human review; unknown version, hash, locator, provenance, custody, and availability remain explicitly unknown and are never inferred.

The default database is the absolute resolution of `runtime/candidate_evidence.sqlite3` from the process working directory (normally `C:\dev\IntentionalTradingSystem\runtime\candidate_evidence.sqlite3`). Override it with an absolute `ISEES_CANDIDATE_DB_PATH`. The database and its WAL files are local runtime state and are ignored by Git. Migrations `001_candidate_evidence.sql` and `002_candidate_evidence.sql` are owned by this module; version 2 copies version-1 records while widening only the origin constraint.

Start locally from the repository root:

```powershell
python -m uvicorn isees_uap.api:app --host 127.0.0.1 --port 8001
```

Every Candidate Evidence request requires `X-ISEES-Principal-Id`. Local V1 treats that value as an explicit ownership boundary, not authenticated identity. Run one API process against a stable local filesystem. Preserve the `.sqlite3`, `-wal`, and `-shm` files together when backing up a live database; stopping the process first is preferred.
