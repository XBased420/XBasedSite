import settings, { deployment } from '../../site.config.mjs';
export function GET() {
  const { site, base } = deployment(settings);
  return new Response(settings.launchReady ? `User-agent: *\nAllow: /\nSitemap: ${site}${base}sitemap.xml\n` : 'User-agent: *\nDisallow: /\n', { headers: { 'Content-Type': 'text/plain' } });
}
