from __future__ import annotations

from pydantic import ValidationError

from .config import (
    STUDIO_DRAFTING_MAX_CONTEXT_BYTES, STUDIO_DRAFTING_MAX_NOTE_BYTES,
    STUDIO_DRAFTING_MAX_SOURCE_BYTES,
)
from .errors import (
    DraftingProviderFailure, DraftingProviderTimeout, DraftingProviderUnavailable,
    InvalidDraftingContext, InvalidDraftingProviderResponse,
)
from .hashing import canonical_hash, canonical_json
from .schemas import DraftProposal, GenerateDraftProposal


class ProviderUnavailableError(Exception):
    pass


class ProviderTimeoutError(Exception):
    pass


class ProviderFailureError(Exception):
    pass


def validate_request(command: GenerateDraftProposal) -> None:
    context = command.context
    if command.investigationId != context.investigationId:
        raise InvalidDraftingContext("Request and context Investigation identities must agree")
    if len(canonical_json(context.model_dump(mode="json")).encode("utf-8")) > STUDIO_DRAFTING_MAX_CONTEXT_BYTES:
        raise InvalidDraftingContext("Drafting context exceeds the byte limit")
    if canonical_hash(context.model_dump(mode="json")) != command.contextHash:
        raise InvalidDraftingContext("Drafting context hash does not match canonical context")
    source_ids = [source.anchorId for source in context.sources]
    if source_ids != sorted(source_ids):
        raise InvalidDraftingContext("Drafting sources must use canonical anchor identity order")
    if len(source_ids) != len(set(source_ids)):
        raise InvalidDraftingContext("Drafting source identities must be unique")
    stable_source_ids = [source.sourceIdentity for source in context.sources]
    if len(stable_source_ids) != len(set(stable_source_ids)):
        raise InvalidDraftingContext("Drafting stable source identities must be unique")
    if len(context.selectedSourceAnchorIds) != len(set(context.selectedSourceAnchorIds)):
        raise InvalidDraftingContext("Selected source identities must be unique")
    if len(context.selectedResearcherNoteNodeIds) != len(set(context.selectedResearcherNoteNodeIds)):
        raise InvalidDraftingContext("Selected researcher-note identities must be unique")
    if any(source.investigationId != context.investigationId for source in context.sources):
        raise InvalidDraftingContext("Drafting sources must belong to the active Investigation")
    if any(len(canonical_json(source.model_dump(mode="json")).encode("utf-8")) > STUDIO_DRAFTING_MAX_SOURCE_BYTES
           for source in context.sources):
        raise InvalidDraftingContext("Drafting source exceeds the byte limit")
    for source in context.sources:
        source_value = source.model_dump(mode="json")
        source_hash = source_value.pop("immutableSourceHash")
        if canonical_hash(source_value) != source_hash:
            raise InvalidDraftingContext("Drafting source hash does not match its immutable provenance")
    if any(len(note.text.encode("utf-8")) > STUDIO_DRAFTING_MAX_NOTE_BYTES for note in context.researcherNotes):
        raise InvalidDraftingContext("Researcher note exceeds the byte limit")
    if not context.sources and not context.researcherNotes:
        raise InvalidDraftingContext("At least one eligible source or researcher note is required")
    selected = set(context.selectedSourceAnchorIds)
    included = set(source_ids)
    if context.sourceSelectionMode == "SUBSET" and selected != included:
        raise InvalidDraftingContext("SUBSET must include exactly the explicitly selected eligible sources")
    if context.sourceSelectionMode == "ALL" and context.selectedSourceAnchorIds:
        raise InvalidDraftingContext("ALL does not accept an explicit selected-source list")
    note_ids = [note.nodeId for note in context.researcherNotes]
    if context.selectedResearcherNoteNodeIds != note_ids:
        raise InvalidDraftingContext("Researcher notes must match explicit selection in document order")


def generate(provider, command: GenerateDraftProposal) -> DraftProposal:
    validate_request(command)
    try:
        raw = provider.generate_proposal(request=command)
    except ProviderUnavailableError as exc:
        raise DraftingProviderUnavailable("The drafting provider is unavailable") from exc
    except ProviderTimeoutError as exc:
        raise DraftingProviderTimeout("The drafting provider timed out") from exc
    except ProviderFailureError as exc:
        raise DraftingProviderFailure("The drafting provider failed") from exc
    except Exception as exc:
        raise DraftingProviderFailure("The drafting provider failed") from exc
    try:
        proposal = DraftProposal.model_validate(raw)
    except (ValidationError, ValueError, TypeError) as exc:
        raise InvalidDraftingProviderResponse("The drafting provider returned an invalid proposal") from exc
    context = command.context
    if (proposal.investigationId != context.investigationId
            or proposal.documentId != context.documentId
            or proposal.baseIdentity != context.baseIdentity
            or proposal.artifactDesign != context.artifactDesign
            or proposal.contextContractVersion != context.contextContractVersion
            or proposal.contextHash != command.contextHash):
        raise InvalidDraftingProviderResponse("The drafting proposal does not match its context")
    if proposal.providerId != provider.provider_id or proposal.modelId != provider.model_id:
        raise InvalidDraftingProviderResponse("The drafting proposal provider identity is invalid")
    supplied = {source.anchorId for source in context.sources}
    if any(reference.anchorId not in supplied for block in proposal.blocks
           for reference in block.sourceReferences):
        raise InvalidDraftingProviderResponse("The drafting proposal cites an unknown source")
    return proposal
