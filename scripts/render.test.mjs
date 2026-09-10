import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import settings, { deployment } from '../site.config.mjs';
import { renderPage } from '../src/render.mjs';
test('repository subpath reaches every public asset', () => {
  const html = renderPage({ settings, site: 'https://xbased420.github.io', base: '/test-repo/' });
  for (const match of html.matchAll(/(?:href|src)="(\/[^"#]+)"/g)) {
    assert.ok(match[1].startsWith('/test-repo/'), match[1]);
    assert.ok(existsSync(new URL('../public/' + match[1].slice('/test-repo/'.length), import.meta.url)));
  }
  assert.match(html, /https:\/\/xbased420.github.io\/test-repo\//);
});
test('custom domain and profile-repository deploy without base path', () => {
  assert.deepEqual(deployment({ ...settings, customDomain: 'xbased.dev' }), { site: 'https://xbased.dev', base: '/' });
  assert.equal(deployment(settings, 'XBased420/XBased420.github.io').base, '/');
});
test('draft cannot pretend booking is connected, and contains no unobfuscated email', () => {
  const html = renderPage({ settings: { ...settings, endpoint: '' }, ...deployment(settings) });
  assert.match(html, /Preview mode/); assert.ok(!html.includes('calipxj@gmail.com'));
  assert.equal((html.match(/<details class="project/g) || []).length, 4);
  assert.equal((html.match(/<article class="service/g) || []).length, 8);
  assert.ok(!html.includes('tel:')); assert.match(html, /\$450/); assert.match(html, /50%/);
});
test('all input fields have labels and six are required', () => {
  const html = renderPage({ settings, ...deployment(settings) });
  for (const match of html.matchAll(/<(?:input|textarea|select) id="([^"]+)"/g)) assert.ok(html.includes(`for="${match[1]}"`));
  assert.equal((html.match(/ required /g) || []).length, 6);
});
test('fonts are genuine WOFF2 and styles honor reduced motion', () => {
  for (const name of ['manrope', 'space-grotesk']) assert.equal(readFileSync(new URL(`../public/assets/fonts/${name}-latin.woff2`, import.meta.url)).subarray(0, 4).toString(), 'wOF2');
  assert.match(readFileSync(new URL('../public/styles.css', import.meta.url), 'utf8'), /prefers-reduced-motion:reduce/);
});

test('connected form needs only endpoint and renders exactly configured budgets', () => {
  const html = renderPage({ settings: { ...settings, endpoint: 'https://script.google.com/macros/s/example/exec' }, ...deployment(settings) });
  assert.ok(!html.includes('Preview mode'));
  const choices = [...html.match(/<select id="budget"[\s\S]*?<\/select>/)[0].matchAll(/<option>(.*?)<\/option>/g)].map(m => m[1]);
  assert.deepEqual(choices, settings.budgets);
  assert.ok(!/turnstile|cloudflare/i.test(html));
  assert.match(html, /email you after I approve it/);
});
