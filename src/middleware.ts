import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async (context, next) => {
  const url = context.url.pathname;

  // 301 redirects for merged/deleted posts
  const redirects: Record<string, string> = {
    '/archery-accidents/': '/archery-injuries/',
    '/archery-bracers/': '/archery-arm-guard/',
    '/archery-apparel/': '/archery-clothing/',
    '/archery-hand-guard/': '/archery-gloves/',
    '/archery-finger-savers/': '/archery-gloves/',
    '/getting-into-archery/': '/archery-for-beginners/',
    '/archery-hunting-tip/': '/archery-accuracy-tips/',
    '/archery-decals/': '/archery-patches/',
  };
  if (redirects[url]) {
    return Response.redirect(new URL(redirects[url], context.url.origin).href, 301);
  }

  const response = await next();

  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' https://m.media-amazon.com https://www.google-analytics.com data:",
      "connect-src 'self' https://www.google-analytics.com https://analytics.google.com",
      "font-src 'self'",
      "frame-ancestors 'none'",
    ].join('; ')
  );

  // Cache headers
  if (url.startsWith('/_astro/') || url.startsWith('/fonts/')) {
    // Hashed static assets and fonts — cache for 1 year (immutable, content-hashed filenames)
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  } else if (url.startsWith('/images/')) {
    // Images — cache for 1 week (not content-hashed, could change)
    response.headers.set('Cache-Control', 'public, max-age=604800, s-maxage=2592000');
  } else if (url.endsWith('.xml') || url.endsWith('.json') || url === '/rss.xml') {
    // Feeds and data files — cache for 1 hour
    response.headers.set('Cache-Control', 'public, max-age=3600, s-maxage=86400');
  } else {
    // HTML pages — revalidate on every request, but allow edge caching
    response.headers.set('Cache-Control', 'public, max-age=0, s-maxage=86400, stale-while-revalidate=604800');
  }

  return response;
});
