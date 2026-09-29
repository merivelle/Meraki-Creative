/**
 * Permanent (308) redirects from the original static-site URLs to the Next.js routes.
 * Next.js carries query strings through automatically, and browsers keep the #hash,
 * so links like /packages.html#reel-refresh and /contact.html?package=… keep working.
 * Imported by next.config.ts and by the redirect tests.
 */
export const legacyRedirects: { source: string; destination: string }[] = [
  { source: "/index.html", destination: "/" },
  { source: "/services.html", destination: "/services" },
  { source: "/packages.html", destination: "/packages" },
  { source: "/portfolio.html", destination: "/work" },
  { source: "/about.html", destination: "/about" },
  { source: "/contact.html", destination: "/start" },
  { source: "/thanks.html", destination: "/start/thanks" },
  { source: "/website-design.html", destination: "/web-design" },
  { source: "/post-production.html", destination: "/post-production" },
  // Creative Materials was retired (Sep 2026); its page folds into the services overview.
  { source: "/creative-materials", destination: "/services" },
];
