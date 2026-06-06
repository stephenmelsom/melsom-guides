// Cloudflare Pages Function — catch-all middleware.
//
// Responsibilities (see specs/TECH-SPEC-melsom-guide.md → "Cloudflare Pages Function"):
//   1. Pass real static assets straight through (*.css, *.js, /guides/*.json, /assets/*, favicon).
//   2. For app routes (/, /<guide>, /<guide>/<place>): serve index.html with this guide's
//      <title> / meta description / canonical / og:* / twitter:* injected, so shared links preview
//      correctly (FR-26). Doubles as the SPA deep-link fallback (FR-7). Previews are guide-level,
//      including for /<guide>/<place> (FR-28). og:image ← guide.ogImage else /assets/og/default.png.

const STATIC_EXTENSIONS = new Set([
  '.css', '.js', '.json', '.png', '.svg', '.ico',
  '.jpg', '.jpeg', '.webp', '.woff', '.woff2', '.txt',
]);

function isStaticAsset(pathname) {
  if (pathname.startsWith('/assets/') || pathname.startsWith('/guides/')) return true;
  const dot = pathname.lastIndexOf('.');
  if (dot !== -1) {
    const ext = pathname.slice(dot).toLowerCase();
    if (STATIC_EXTENSIONS.has(ext)) return true;
  }
  return false;
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function injectMeta(html, guide) {
  const title       = guide.title       || 'The Melsom Guides';
  const description = guide.description || 'Our favorite spots, shared with family and friends.';
  const canonicalUrl = `https://melsom.guide/${guide.slug}`;
  const ogImage = guide.ogImage
    ? `https://melsom.guide${guide.ogImage}`
    : 'https://melsom.guide/assets/og/default.png';

  return html
    .replace(
      '<title>The Melsom Guides</title>',
      `<title>${escHtml(title)}</title>`
    )
    .replace(
      'name="description" content="Our favorite spots, shared with family and friends."',
      `name="description" content="${escHtml(description)}"`
    )
    .replace(
      'href="https://melsom.guide/"',
      `href="${escHtml(canonicalUrl)}"`
    )
    .replace(
      'property="og:title" content="The Melsom Guides"',
      `property="og:title" content="${escHtml(title)}"`
    )
    .replace(
      'property="og:description" content="Our favorite spots, shared with family and friends."',
      `property="og:description" content="${escHtml(description)}"`
    )
    .replace(
      'property="og:url" content="https://melsom.guide/"',
      `property="og:url" content="${escHtml(canonicalUrl)}"`
    )
    .replace(
      'property="og:image" content="https://melsom.guide/assets/og/default.png"',
      `property="og:image" content="${escHtml(ogImage)}"`
    )
    .replace(
      'name="twitter:title" content="The Melsom Guides"',
      `name="twitter:title" content="${escHtml(title)}"`
    )
    .replace(
      'name="twitter:description" content="Our favorite spots, shared with family and friends."',
      `name="twitter:description" content="${escHtml(description)}"`
    )
    .replace(
      'name="twitter:image" content="https://melsom.guide/assets/og/default.png"',
      `name="twitter:image" content="${escHtml(ogImage)}"`
    );
}

export async function onRequest(context) {
  const request  = context.request;
  const url      = new URL(request.url);
  const pathname = url.pathname;

  // 1. Static assets — pass through unchanged.
  if (isStaticAsset(pathname)) {
    return context.env.ASSETS.fetch(request);
  }

  // 2. App routes — inject per-guide meta into index.html.
  try {
    const baseUrl = url.origin;

    // Parse the pathname to identify the requested guide slug.
    const parts = pathname.replace(/^\/|\/$/g, '').split('/').filter(Boolean);
    const requestedSlug = parts[0] || null;

    // Fetch the shell HTML and the guide manifest in parallel.
    const [indexRes, manifestRes] = await Promise.all([
      context.env.ASSETS.fetch(new Request(`${baseUrl}/index.html`)),
      context.env.ASSETS.fetch(new Request(`${baseUrl}/guides/index.json`)),
    ]);

    // If either fetch failed, fall back to serving the request as-is.
    if (!indexRes.ok || !manifestRes.ok) {
      return context.env.ASSETS.fetch(request);
    }

    const [html, manifest] = await Promise.all([
      indexRes.text(),
      manifestRes.json(),
    ]);

    // Determine which guide to load: use the requested slug if it's in the manifest,
    // otherwise fall back to the default guide.
    const defaultSlug = manifest.defaultGuide;
    const isValid     = requestedSlug && manifest.guides.some(g => g.slug === requestedSlug);
    const targetSlug  = isValid ? requestedSlug : defaultSlug;

    // Fetch the guide JSON.
    const guideRes = await context.env.ASSETS.fetch(
      new Request(`${baseUrl}/guides/${targetSlug}.json`)
    );
    const guide = guideRes.ok ? await guideRes.json() : null;

    // If we couldn't load the guide data, return the unmodified shell.
    if (!guide) {
      return new Response(html, {
        headers: { 'Content-Type': 'text/html; charset=UTF-8' },
      });
    }

    const injected = injectMeta(html, guide);
    return new Response(injected, {
      headers: { 'Content-Type': 'text/html; charset=UTF-8' },
    });
  } catch (err) {
    // On any unexpected error, fall back to letting ASSETS serve the request.
    return context.env.ASSETS.fetch(request);
  }
}
