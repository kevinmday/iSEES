CREATE TABLE rex_assignments(
 assignment_id TEXT PRIMARY KEY, owner_subject_id TEXT NOT NULL, governing_subject_id TEXT NOT NULL,
 investigation_id TEXT NOT NULL, target_id TEXT NOT NULL, target_kind TEXT NOT NULL,
 current_revision_id TEXT NOT NULL UNIQUE, lifecycle TEXT NOT NULL, created_at TEXT NOT NULL,
 updated_at TEXT NOT NULL, creation_payload BLOB NOT NULL, creation_hash TEXT NOT NULL);
CREATE TABLE rex_assignment_revisions(
 revision_id TEXT PRIMARY KEY, assignment_id TEXT NOT NULL REFERENCES rex_assignments(assignment_id),
 revision_number INTEGER NOT NULL CHECK(revision_number>0), parent_revision_id TEXT UNIQUE REFERENCES rex_assignment_revisions(revision_id),
 lifecycle TEXT NOT NULL, payload BLOB NOT NULL, content_hash TEXT NOT NULL, effective_at TEXT NOT NULL,
 actor_id TEXT NOT NULL, reason TEXT NOT NULL, UNIQUE(assignment_id,revision_number));
CREATE TABLE rex_eligibility_events(
 event_id TEXT PRIMARY KEY, assignment_id TEXT NOT NULL REFERENCES rex_assignments(assignment_id),
 assignment_revision_id TEXT NOT NULL REFERENCES rex_assignment_revisions(revision_id), manifold_revision_id TEXT NOT NULL,
 manifold_revision_hash TEXT NOT NULL, trigger_kind TEXT NOT NULL, normalized_trigger_identity TEXT NOT NULL,
 coalescing_key TEXT NOT NULL, created_at TEXT NOT NULL, consumed_at TEXT,
 payload BLOB NOT NULL, content_hash TEXT NOT NULL);
CREATE UNIQUE INDEX rex_pending_coalescing ON rex_eligibility_events(assignment_id,coalescing_key) WHERE consumed_at IS NULL;
CREATE TABLE rex_authorization_decisions(
 decision_id TEXT PRIMARY KEY, assignment_revision_id TEXT NOT NULL REFERENCES rex_assignment_revisions(revision_id),
 eligibility_event_id TEXT NOT NULL REFERENCES rex_eligibility_events(event_id), entitlement_snapshot_id TEXT NOT NULL,
 entitlement_snapshot_hash TEXT NOT NULL, manifold_revision_id TEXT NOT NULL, manifold_revision_hash TEXT NOT NULL,
 disposition TEXT NOT NULL, denial_reason TEXT NOT NULL, policy_version TEXT NOT NULL, utility_units INTEGER NOT NULL,
 utility_threshold_units INTEGER NOT NULL, circuit_breaker_payload BLOB NOT NULL, payload BLOB NOT NULL,
 content_hash TEXT NOT NULL, decided_at TEXT NOT NULL);
CREATE TABLE rex_search_executions(
 execution_id TEXT PRIMARY KEY, authorization_decision_id TEXT NOT NULL REFERENCES rex_authorization_decisions(decision_id),
 semantic_duplicate_key TEXT NOT NULL, disposition TEXT NOT NULL, status TEXT NOT NULL,
 original_execution_id TEXT REFERENCES rex_search_executions(execution_id), context_payload BLOB NOT NULL,
 context_hash TEXT NOT NULL, created_at TEXT NOT NULL, completed_at TEXT, failed_at TEXT, failure_category TEXT);
CREATE UNIQUE INDEX rex_executable_duplicate_key ON rex_search_executions(semantic_duplicate_key) WHERE disposition='EXECUTABLE';
CREATE TABLE rex_jobs(
 job_id TEXT PRIMARY KEY, execution_id TEXT NOT NULL UNIQUE REFERENCES rex_search_executions(execution_id), status TEXT NOT NULL,
 attempt_number INTEGER NOT NULL DEFAULT 0, available_at TEXT NOT NULL, claimed_at TEXT, lease_owner TEXT,
 lease_id TEXT, lease_expires_at TEXT, completed_at TEXT, failed_at TEXT, failure_category TEXT);
CREATE TABLE rex_budget_reservations(
 reservation_id TEXT PRIMARY KEY, execution_id TEXT NOT NULL REFERENCES rex_search_executions(execution_id),
 scope_kind TEXT NOT NULL, scope_identity TEXT NOT NULL, period_identity TEXT NOT NULL,
 estimated_micros INTEGER NOT NULL CHECK(estimated_micros>=0), reserved_micros INTEGER NOT NULL CHECK(reserved_micros>=0),
 status TEXT NOT NULL, policy_version TEXT NOT NULL, estimator_version TEXT NOT NULL,
 created_at TEXT NOT NULL, released_at TEXT, reconciled_at TEXT, UNIQUE(execution_id,scope_kind,scope_identity,period_identity));
CREATE TABLE rex_usage_ledger(
 ledger_id TEXT PRIMARY KEY, execution_id TEXT NOT NULL REFERENCES rex_search_executions(execution_id),
 estimated_micros INTEGER NOT NULL CHECK(estimated_micros>=0), reserved_micros INTEGER NOT NULL CHECK(reserved_micros>=0),
 actual_micros INTEGER CHECK(actual_micros IS NULL OR actual_micros>=0), charged_micros INTEGER NOT NULL CHECK(charged_micros>=0),
 released_micros INTEGER NOT NULL CHECK(released_micros>=0), reconciliation_status TEXT NOT NULL,
 estimator_version TEXT NOT NULL, measured_at TEXT NOT NULL, payload BLOB NOT NULL, content_hash TEXT NOT NULL);
CREATE TABLE rex_candidate_bundles(
 bundle_id TEXT PRIMARY KEY, execution_id TEXT NOT NULL REFERENCES rex_search_executions(execution_id),
 assignment_revision_id TEXT NOT NULL REFERENCES rex_assignment_revisions(revision_id), manifold_revision_id TEXT NOT NULL,
 manifold_revision_hash TEXT NOT NULL, source_payload BLOB NOT NULL, source_hash TEXT NOT NULL,
 bundle_payload BLOB NOT NULL, bundle_hash TEXT NOT NULL, epistemic_classification TEXT NOT NULL,
 review_status TEXT NOT NULL, canon_effect TEXT NOT NULL, ai_assistance_status TEXT NOT NULL,
 provider_classification TEXT NOT NULL, model_classification TEXT NOT NULL, created_at TEXT NOT NULL);
CREATE TABLE rex_candidate_lineage(
 bundle_id TEXT NOT NULL REFERENCES rex_candidate_bundles(bundle_id), candidate_id TEXT NOT NULL,
 field_order INTEGER NOT NULL, field_identity TEXT NOT NULL, source_locator TEXT NOT NULL, source_version TEXT NOT NULL,
 source_field_or_span TEXT NOT NULL, exact_value TEXT NOT NULL, normalization_rule TEXT NOT NULL,
 adapter_version TEXT NOT NULL, normalizer_version TEXT NOT NULL, payload BLOB NOT NULL, content_hash TEXT NOT NULL,
 PRIMARY KEY(bundle_id,candidate_id,field_order));
CREATE TABLE rex_research_publications(
 publication_id TEXT PRIMARY KEY, investigation_id TEXT NOT NULL, candidate_bundle_id TEXT NOT NULL UNIQUE REFERENCES rex_candidate_bundles(bundle_id),
 research_anchor_id TEXT NOT NULL UNIQUE, publication_classification TEXT NOT NULL, review_status TEXT NOT NULL,
 canon_effect TEXT NOT NULL CHECK(canon_effect='NONE'), created_at TEXT NOT NULL, payload BLOB NOT NULL, content_hash TEXT NOT NULL);
CREATE TABLE rex_state_history(
 history_id INTEGER PRIMARY KEY AUTOINCREMENT, entity_kind TEXT NOT NULL, entity_id TEXT NOT NULL,
 state TEXT NOT NULL, actor_id TEXT NOT NULL, reason TEXT NOT NULL, occurred_at TEXT NOT NULL, payload BLOB NOT NULL, content_hash TEXT NOT NULL);
CREATE TRIGGER rex_no_revision_update BEFORE UPDATE ON rex_assignment_revisions BEGIN SELECT RAISE(ABORT,'immutable record'); END;
CREATE TRIGGER rex_no_revision_delete BEFORE DELETE ON rex_assignment_revisions BEGIN SELECT RAISE(ABORT,'immutable record'); END;
CREATE TRIGGER rex_no_decision_update BEFORE UPDATE ON rex_authorization_decisions BEGIN SELECT RAISE(ABORT,'immutable record'); END;
CREATE TRIGGER rex_no_decision_delete BEFORE DELETE ON rex_authorization_decisions BEGIN SELECT RAISE(ABORT,'immutable record'); END;
CREATE TRIGGER rex_no_execution_delete BEFORE DELETE ON rex_search_executions BEGIN SELECT RAISE(ABORT,'immutable record'); END;
CREATE TRIGGER rex_execution_context_immutable BEFORE UPDATE OF context_payload,context_hash,authorization_decision_id,semantic_duplicate_key,disposition,original_execution_id,created_at ON rex_search_executions BEGIN SELECT RAISE(ABORT,'immutable context'); END;
CREATE TRIGGER rex_no_ledger_update BEFORE UPDATE ON rex_usage_ledger BEGIN SELECT RAISE(ABORT,'immutable record'); END;
CREATE TRIGGER rex_no_ledger_delete BEFORE DELETE ON rex_usage_ledger BEGIN SELECT RAISE(ABORT,'immutable record'); END;
CREATE TRIGGER rex_no_bundle_update BEFORE UPDATE ON rex_candidate_bundles BEGIN SELECT RAISE(ABORT,'immutable record'); END;
CREATE TRIGGER rex_no_bundle_delete BEFORE DELETE ON rex_candidate_bundles BEGIN SELECT RAISE(ABORT,'immutable record'); END;
CREATE TRIGGER rex_no_lineage_update BEFORE UPDATE ON rex_candidate_lineage BEGIN SELECT RAISE(ABORT,'immutable record'); END;
CREATE TRIGGER rex_no_lineage_delete BEFORE DELETE ON rex_candidate_lineage BEGIN SELECT RAISE(ABORT,'immutable record'); END;
CREATE TRIGGER rex_no_publication_update BEFORE UPDATE ON rex_research_publications BEGIN SELECT RAISE(ABORT,'immutable record'); END;
CREATE TRIGGER rex_no_publication_delete BEFORE DELETE ON rex_research_publications BEGIN SELECT RAISE(ABORT,'immutable record'); END;
