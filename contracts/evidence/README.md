# EVIDENCE Contract Registry

This directory is the authoritative registry for the shared EVIDENCE runtime boundary. It defines future runtime obligations; it does not itself implement or deploy them.

| Contract | Status | Governing Canon | Purpose |
| --- | --- | --- | --- |
| [EVIDENCE-001 — Researcher-Directed Evidence Intake Runtime Contract](EVIDENCE-001_Researcher_Directed_Evidence_Intake_Runtime_Contract.md) | Authoritative; contracted, not implemented | [SC-027](../../isees-ui/docs/computational-canon/SC-027_Researcher_Directed_Evidence_Intake_and_Web_Discovery.md) | Researcher intake, provider-neutral Web Discovery, Candidate Evidence review and admission, explicit Research Inbox publication, durable Candidate Knowledge, Research Anchors, and governed revision proposals |

The governing progression is `Discovery → Candidate Evidence → Researcher Review → Explicit Publication → Candidate Knowledge → Governed Revision`. No stage is implicit and no earlier stage mutates Canon or the active Manifold.

The principal implementation owners remain the existing frontend Candidate Evidence/EVIDENCE modules, backend `isees_uap/candidate_evidence/` boundary, Research Bridge with `isees_uap/research_sources/` as the durable Research Inbox publication owner, and the existing operational graph revision owner. Implementations MUST extend them in place. Parallel Evidence, Candidate Evidence, Research Inbox, Candidate Knowledge, object identity, or revision systems are prohibited.

Live providers and automatic publication are not authorized. EVIDENCE-001 is current contract authority; the capabilities it specifies remain future implementation until separately authorized, implemented, and verified.
