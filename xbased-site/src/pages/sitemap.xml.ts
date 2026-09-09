import settings, { deployment } from '../../site.config.mjs';
export function GET() {
  const { site, base } = deployment(settings);
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${site}${base}</loc></url></urlset>`, { headers: { 'Content-Type': 'application/xml' } });
}
