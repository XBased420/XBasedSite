// Makes a self-contained review copy without invoking Astro. Never sends inquiries.
import { readFile, writeFile } from 'node:fs/promises';
import settings from '../site.config.mjs';
import { renderPage } from '../src/render.mjs';
const publicFile = name => new URL('../public/' + name, import.meta.url);
let css = await readFile(publicFile('styles.css'), 'utf8');
for (const name of ['manrope', 'space-grotesk']) {
  const font = await readFile(publicFile(`assets/fonts/${name}-latin.woff2`));
  css = css.replace(`./assets/fonts/${name}-latin.woff2`, `data:font/woff2;base64,${font.toString('base64')}`);
}
const js = await readFile(publicFile('site.js'), 'utf8');
const favicon = await readFile(publicFile('favicon.svg'));
let html = renderPage({ settings: { ...settings, endpoint: '', turnstileSiteKey: '', analyticsToken: '', launchReady: false }, site: 'https://xbased420.github.io', base: '/' });
html = html.replace('<link rel="stylesheet" href="/styles.css">', `<style>${css}</style>`)
  .replace('<script defer src="/site.js"></script>', `<script>${js.replace(/<\/script/gi, '<\\/script')}</script>`)
  .replace('href="/favicon.svg"', `href="data:image/svg+xml;base64,${favicon.toString('base64')}"`)
  .replace(/<link rel="preload"[^>]+>/g, '');
const destination = new URL('../../xbased-preview.html', import.meta.url);
await writeFile(destination, html);
console.log(`Standalone preview written (${Buffer.byteLength(html)} bytes).`);
