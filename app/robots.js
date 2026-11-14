const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://craftityourself.gg';

export default function robots() {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/api/', '/account/', '/debug/', '/update/', '/login', '/signup'] },
      { userAgent: 'GPTBot',         disallow: '/' },
      { userAgent: 'ClaudeBot',      disallow: '/' },
      { userAgent: 'Google-Extended', disallow: '/' },
      { userAgent: 'CCBot',          disallow: '/' },
    ],
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  };
}
