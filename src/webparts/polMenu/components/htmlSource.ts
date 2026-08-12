import DOMPurify from 'dompurify';

/**
 * Schemes that may appear in href/src attributes of the embedded markup.
 * Anything else (javascript:, data:, blob:, vbscript:) is dropped by DOMPurify.
 */
const ALLOWED_URI_REGEXP: RegExp = /^(https?|mailto|tel|#|\/)/i;

/**
 * CSS constructs that have historically been able to execute script. Every
 * current browser ignores them, but DOMPurify does not inspect CSS and the
 * stylesheet here is author-supplied, so they are stripped as a cheap backstop.
 * data: is deliberately not listed: inline data:image icons are legitimate and
 * cannot execute.
 */
const DANGEROUS_CSS: RegExp = /(?:javascript|vbscript)\s*:|expression\s*\(|behaviou?r\s*:|-moz-binding/i;

let hooksRegistered: boolean = false;

function registerCssHook(): void {
  if (hooksRegistered) {
    return;
  }
  hooksRegistered = true;

  DOMPurify.addHook('afterSanitizeAttributes', (node: Element): void => {
    if (typeof node.getAttribute === 'function' && DANGEROUS_CSS.test(node.getAttribute('style') || '')) {
      node.removeAttribute('style');
    }
    if (node.tagName === 'STYLE' && DANGEROUS_CSS.test(node.textContent || '')) {
      node.textContent = '';
    }
  });
}

/**
 * Parses the comma-separated allowedHosts property into a list of origins.
 * Accepts bare hostnames ("cdn.example.com") as well as full origins
 * ("https://cdn.example.com"); both normalise to an https origin.
 */
export function parseAllowedHosts(allowedHosts: string | undefined): string[] {
  if (!allowedHosts) {
    return [];
  }

  return allowedHosts
    .split(',')
    .map(entry => entry.trim())
    .filter(entry => entry.length > 0)
    .map(entry => {
      const withScheme = /^https?:\/\//i.test(entry) ? entry : `https://${entry}`;
      try {
        return new URL(withScheme).origin;
      } catch {
        // Unparseable entries can never match an origin, so drop them here
        // rather than letting them silently widen the allow list.
        return '';
      }
    })
    .filter(origin => origin.length > 0);
}

/**
 * The full set of origins this web part may load markup from: the current site
 * plus whatever the author has explicitly allow-listed.
 */
export function permittedOrigins(pageOrigin: string, allowedHosts: string | undefined): string[] {
  let base: URL;
  try {
    base = new URL(pageOrigin);
  } catch {
    throw new Error('Could not determine the current site origin.');
  }

  return [base.origin].concat(parseAllowedHosts(allowedHosts));
}

/**
 * Resolves the author-supplied path against the page origin and rejects any
 * source that is neither same-origin nor explicitly allow-listed.
 *
 * Resolving through the URL constructor is what closes off data:, javascript:,
 * blob: and protocol-relative ("//evil.com/x") sources in one step: they either
 * fail to parse relative to the page or resolve to an origin that is not
 * permitted.
 */
export function resolveAllowedUrl(
  path: string,
  pageOrigin: string,
  allowedHosts: string | undefined
): string {
  const trimmed = (path || '').trim();
  if (trimmed.length === 0) {
    throw new Error('No HTML file URL is configured.');
  }

  const permitted = permittedOrigins(pageOrigin, allowedHosts);

  let resolved: URL;
  try {
    resolved = new URL(trimmed, permitted[0]);
  } catch {
    throw new Error(`"${trimmed}" is not a valid URL.`);
  }

  if (resolved.protocol !== 'https:') {
    throw new Error(`Only https:// sources are allowed (got "${resolved.protocol}").`);
  }

  if (permitted.indexOf(resolved.origin) === -1) {
    throw new Error(
      `"${resolved.origin}" is not an allowed source. Add it to "Allowed external hosts" to permit it.`
    );
  }

  return resolved.href;
}

/**
 * Re-checks the origin a response actually came from. Without this, a
 * same-origin URL that redirects off-tenant would slip past resolveAllowedUrl,
 * which only ever sees the pre-redirect address.
 */
export function assertAllowedResponseOrigin(
  responseUrl: string,
  pageOrigin: string,
  allowedHosts: string | undefined
): void {
  if (!responseUrl) {
    return;
  }

  let actual: URL;
  try {
    actual = new URL(responseUrl);
  } catch {
    throw new Error('The server returned an unreadable URL.');
  }

  if (permittedOrigins(pageOrigin, allowedHosts).indexOf(actual.origin) === -1) {
    throw new Error(`The request was redirected to "${actual.origin}", which is not an allowed source.`);
  }
}

/**
 * Strips anything executable from the fetched markup while keeping the HTML and
 * CSS the web part exists to render: tags, inline style attributes and <style>
 * blocks all survive, on* handlers and script-bearing elements do not.
 */
export function sanitizeHtml(raw: string): string {
  registerCssHook();

  // The HTML parser hoists a leading <style> into <head>, and DOMPurify returns
  // body content only — so a menu file that opens with its stylesheet would
  // lose it entirely. Parsing inside a wrapper keeps everything in body
  // position; the wrapper is unwrapped again below.
  const body = DOMPurify.sanitize(`<div>${raw}</div>`, {
    ALLOWED_URI_REGEXP,
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'base', 'form'],
    FORBID_ATTR: ['srcdoc', 'formaction', 'ping'],
    RETURN_DOM: true
  }) as unknown as HTMLElement;

  // Markup containing a stray </div> can close the wrapper early and leave
  // siblings behind it, so only unwrap when the wrapper is genuinely the sole
  // root; otherwise return everything.
  const wrapper = body.firstElementChild;
  const unwrappable =
    body.childNodes.length === 1 && wrapper !== null && wrapper.tagName === 'DIV';

  return unwrappable ? (wrapper as HTMLElement).innerHTML : body.innerHTML;
}
