export interface CapturePreview {
  exactText: string;
  finalUrl: string;
  canonicalUrl?: string;
  pageTitle?: string;
  publisher?: string;
  authorByline?: string;
  publishedAt?: string;
  modifiedAt?: string;
  language?: string;
  governingHeading?: string;
  prefixContext?: string;
  suffixContext?: string;
  selectionDirection?: "FORWARD" | "BACKWARD" | "NONE";
}

/**
 * Runs only via scripting.executeScript after the user presses Inspect.
 * Metadata precedence: Open Graph site name before application name; HTML author
 * before article:author; article:* timestamps before schema.org itemprop values.
 * Invalid or missing optional values stay absent.
 */
export function extractActiveSelection(): CapturePreview {
  const trimBound = (value: string | null | undefined, limit: number): string | undefined => {
    const clean = value?.trim();
    if (!clean) return undefined;
    let result = "";
    for (const character of clean) {
      if (new TextEncoder().encode(result + character).byteLength > limit) break;
      result += character;
    }
    return result || undefined;
  };
  const meta = (...selectors: string[]): string | undefined => {
    for (const selector of selectors) {
      const node = document.querySelector<HTMLMetaElement>(selector);
      const value = trimBound(node?.content, 4096); if (value) return value;
    }
    return undefined;
  };
  const timestamp = (...selectors: string[]): string | undefined => {
    const value = meta(...selectors); if (!value) return undefined;
    const parsed = new Date(value); return Number.isNaN(parsed.valueOf()) ? undefined : parsed.toISOString();
  };
  const httpUrl = (value: string | null | undefined): string | undefined => {
    if (!value) return undefined;
    try { const parsed = new URL(value, document.URL); const href = parsed.href; return (parsed.protocol === "http:" || parsed.protocol === "https:") && !parsed.username && !parsed.password && new TextEncoder().encode(href).byteLength <= 8192 ? href : undefined; } catch { return undefined; }
  };
  const visible = (element: Element): boolean => {
    const style = getComputedStyle(element); return style.display !== "none" && style.visibility !== "hidden" && style.opacity !== "0";
  };
  const selection = getSelection();
  const exactText = selection?.toString() ?? "";
  if (!selection || selection.rangeCount !== 1 || !exactText.trim()) throw new Error("EMPTY_SELECTION");
  if (new TextEncoder().encode(exactText).byteLength > 65_536) throw new Error("SELECTION_TOO_LARGE");
  const range = selection.getRangeAt(0);
  const common = range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE ? range.commonAncestorContainer as Element : range.commonAncestorContainer.parentElement;
  let heading: string | undefined;
  for (let current = common; current && !heading; current = current.parentElement) {
    const own = current.matches("h1,h2,h3,h4,h5,h6") ? current : null;
    const prior = current.previousElementSibling?.matches("h1,h2,h3,h4,h5,h6") ? current.previousElementSibling : null;
    const candidate = own ?? prior;
    if (candidate && visible(candidate)) heading = trimBound(candidate.textContent, 2048);
  }
  let direction: "FORWARD" | "BACKWARD" | "NONE" = "NONE";
  if (!selection.isCollapsed && selection.anchorNode && selection.focusNode) {
    const probe = document.createRange(); probe.setStart(selection.anchorNode, selection.anchorOffset); probe.setEnd(selection.focusNode, selection.focusOffset);
    direction = probe.collapsed ? "BACKWARD" : "FORWARD";
  }
  // Context is emitted only for a single text node, avoiding traversal or capture
  // of unrelated/hidden descendant content.
  const localText = range.startContainer === range.endContainer && range.startContainer.nodeType === Node.TEXT_NODE
    ? range.startContainer.nodeValue ?? "" : "";
  const localIndex = localText.indexOf(exactText);
  const prefixContext = localIndex >= 0 ? trimBound(localText.slice(Math.max(0, localIndex - 500), localIndex), 500) : undefined;
  const suffixContext = localIndex >= 0 ? trimBound(localText.slice(localIndex + exactText.length, localIndex + exactText.length + 500), 500) : undefined;
  const result: CapturePreview = { exactText, finalUrl: httpUrl(document.URL) ?? "" };
  const optional: Partial<CapturePreview> = {
    canonicalUrl: httpUrl(document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href),
    pageTitle: trimBound(document.title, 4096),
    publisher: meta('meta[property="og:site_name"]', 'meta[name="application-name"]'),
    authorByline: meta('meta[name="author"]', 'meta[property="article:author"]'),
    publishedAt: timestamp('meta[property="article:published_time"]', 'meta[itemprop="datePublished"]'),
    modifiedAt: timestamp('meta[property="article:modified_time"]', 'meta[itemprop="dateModified"]'),
    language: trimBound(document.documentElement.lang, 64), governingHeading: heading, prefixContext, suffixContext,
    selectionDirection: direction,
  };
  for (const [key, value] of Object.entries(optional)) if (value !== undefined) (result as unknown as Record<string, unknown>)[key] = value;
  if (!result.finalUrl) throw new Error("UNSUPPORTED_PAGE_URL");
  return result;
}
