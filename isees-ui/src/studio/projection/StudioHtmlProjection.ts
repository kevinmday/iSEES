import type { ComputationalAuthorDocument } from "../../author/model/AuthorDocument.ts";
import type { AuthorNode } from "../../author/model/AuthorNodeTypes.ts";
import { canonicalSerialize, canonicalSha256 } from "../contracts/StudioCanonicalSerialization.ts";

export const STUDIO_HTML_RENDERER_VERSION = "studio-local-html/v1" as const;
export const STUDIO_HTML_TEMPLATE_VERSION = "studio-current-draft/v1" as const;

type Json = null | boolean | number | string | readonly Json[] | { readonly [key: string]: Json };
export interface StudioHtmlProjection { readonly sourceHash: string; readonly configurationHash: string; readonly projectionId: string; readonly rendererVersion: typeof STUDIO_HTML_RENDERER_VERSION; readonly templateVersion: typeof STUDIO_HTML_TEMPLATE_VERSION; readonly html: string }

const temporalKeys = new Set(["createdAt", "modifiedAt", "insertedAt", "collectedAt"]);
const jsonValue = (value: unknown): Json => {
  if (value === null || typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "number") return Number.isFinite(value) ? value : String(value);
  if (Array.isArray(value)) return value.map(jsonValue);
  if (typeof value === "object") return Object.fromEntries(Object.entries(value).filter(([key]) => !temporalKeys.has(key)).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([key, item]) => [key, jsonValue(item)]));
  return `[unsupported ${typeof value}]`;
};

export function normalizeStudioHtmlSource(document: ComputationalAuthorDocument): Json {
  return { documentId: document.identity.id, documentType: document.type, metadata: { author: document.metadata.author, description: document.metadata.description, title: document.metadata.title, version: document.metadata.version }, nodes: document.nodes.map(node => jsonValue(node)) };
}

export function escapeStudioHtml(value: unknown): string {
  return String(value ?? "").replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!);
}

const record = (node: AuthorNode): Record<string, unknown> => node as unknown as Record<string, unknown>;
const text = (node: AuthorNode, key: string): string | undefined => typeof record(node)[key] === "string" ? String(record(node)[key]) : undefined;
const malformed = (node: AuthorNode, reason: string): string => `<aside class="unsupported" data-node-type="${escapeStudioHtml(node.type)}"><strong>Unsupported or malformed ${escapeStudioHtml(node.type)} content</strong><p>${escapeStudioHtml(reason)}</p><pre>${escapeStudioHtml(canonicalSerialize(jsonValue(node)))}</pre></aside>`;

function renderNode(node: AuthorNode): string {
  const value = record(node);
  switch (node.type) {
    case "PARAGRAPH": return text(node, "text") === undefined ? malformed(node, "Paragraph text is unavailable.") : `<p>${escapeStudioHtml(value.text)}</p>`;
    case "HEADING": { if (text(node, "text") === undefined) return malformed(node, "Heading text is unavailable."); const level = typeof value.level === "number" && Number.isInteger(value.level) ? Math.max(1, Math.min(6, value.level)) : 2; return `<h${level}>${escapeStudioHtml(value.text)}</h${level}>`; }
    case "QUOTE": return text(node, "text") === undefined ? malformed(node, "Quotation text is unavailable.") : `<blockquote>${escapeStudioHtml(value.text)}</blockquote>`;
    case "LIST": { if (!Array.isArray(value.items)) return malformed(node, "List items are unavailable."); const items = value.items.map(item => typeof item === "string" ? item : item && typeof item === "object" && "text" in item ? String(item.text) : canonicalSerialize(jsonValue(item))); return `<ul>${items.map(item => `<li>${escapeStudioHtml(item)}</li>`).join("")}</ul>`; }
    case "CODE": { const code = text(node, "code") ?? text(node, "text"); return code === undefined ? malformed(node, "Code content is unavailable.") : `<pre><code>${escapeStudioHtml(code)}</code></pre>`; }
    case "TABLE": return typeof value.rows !== "number" || typeof value.columns !== "number" ? malformed(node, "Table dimensions are unavailable.") : `<figure class="placeholder"><strong>Table</strong><p>${escapeStudioHtml(value.rows)} rows × ${escapeStudioHtml(value.columns)} columns</p></figure>`;
    case "IMAGE": return text(node, "source") === undefined ? malformed(node, "Image source label is unavailable.") : `<figure class="placeholder"><strong>Image</strong><p>${escapeStudioHtml(value.source)}</p></figure>`;
    case "CITATION": return text(node, "citation") === undefined ? malformed(node, "Citation text is unavailable.") : `<p class="citation"><strong>Citation:</strong> ${escapeStudioHtml(value.citation)}</p>`;
    case "REFERENCE": { if (text(node, "title") === undefined || text(node, "targetId") === undefined) return malformed(node, "Reference identity is incomplete."); return `<article class="reference"><strong>${escapeStudioHtml(value.title)}</strong>${text(node, "summary") === undefined ? "" : `<p>${escapeStudioHtml(value.summary)}</p>`}<dl><dt>Target</dt><dd>${escapeStudioHtml(value.targetType)} · ${escapeStudioHtml(value.targetId)}</dd><dt>Source</dt><dd>${escapeStudioHtml(value.source)} · ${escapeStudioHtml(value.corpusId)}</dd></dl></article>`; }
    case "OBSERVATION": return text(node, "text") === undefined ? malformed(node, "Observation text is unavailable.") : `<aside class="observation"><strong>Researcher observation</strong><p>${escapeStudioHtml(value.text)}</p></aside>`;
    case "DIVIDER": return "<hr>";
    case "CUSTOM": return `<aside class="custom"><strong>Custom authored content</strong><pre>${escapeStudioHtml(canonicalSerialize(jsonValue(node)))}</pre></aside>`;
    default: return malformed(node, "The author node type is not admitted by this renderer.");
  }
}

export function projectCurrentDraftHtml(document: ComputationalAuthorDocument): StudioHtmlProjection {
  const sourceHash = canonicalSha256(normalizeStudioHtmlSource(document));
  const configuration = { format: "HTML", rendererVersion: STUDIO_HTML_RENDERER_VERSION, templateVersion: STUDIO_HTML_TEMPLATE_VERSION };
  const configurationHash = canonicalSha256(configuration);
  const projectionId = `html-preview:${canonicalSha256({ configurationHash, sourceHash }).slice(7)}`;
  const title = escapeStudioHtml(document.metadata.title || "Untitled .author document");
  const description = document.metadata.description ? `<p class="description">${escapeStudioHtml(document.metadata.description)}</p>` : "";
  const body = document.nodes.length ? document.nodes.map(renderNode).join("") : '<p class="empty">This working .author document contains no authored blocks.</p>';
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src 'none'; media-src 'none'; frame-src 'none'; connect-src 'none'; form-action 'none'; base-uri 'none'"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><style>:root{color-scheme:light}*{box-sizing:border-box}body{margin:0;padding:2rem;max-width:52rem;font:16px/1.65 Georgia,serif;color:#172033;background:#fff}header{border-bottom:2px solid #dbe3ee;margin-bottom:1.75rem}h1{font:700 2rem/1.2 system-ui,sans-serif;margin:.2rem 0}.description{color:#526077}h2,h3,h4,h5,h6{font-family:system-ui,sans-serif;margin:1.6rem 0 .55rem}blockquote,.observation,.reference,.custom,.unsupported,.placeholder{margin:1rem 0;padding:.8rem 1rem;border-left:3px solid #64748b;background:#f8fafc}.observation{border-color:#2563eb}.reference{border-color:#0891b2}.unsupported{border-color:#b45309;background:#fffbeb}.citation{font-size:.92rem;color:#475569}pre{white-space:pre-wrap;overflow-wrap:anywhere;background:#eef2f7;padding:.8rem}dl{display:grid;grid-template-columns:max-content 1fr;gap:.25rem .75rem;font-size:.9rem}dt{font-weight:700}.empty{padding:2rem;border:1px dashed #94a3b8;text-align:center;color:#526077}</style></head><body><header><small>LOCAL HTML PROJECTION · CURRENT DRAFT</small><h1>${title}</h1>${description}</header><main>${body}</main></body></html>`;
  return Object.freeze({ sourceHash, configurationHash, projectionId, rendererVersion: STUDIO_HTML_RENDERER_VERSION, templateVersion: STUDIO_HTML_TEMPLATE_VERSION, html });
}
