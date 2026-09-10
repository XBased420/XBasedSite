import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
const code = readFileSync(new URL('../public/site.js', import.meta.url), 'utf8');
function browser(endpoint = 'https://script.google.com/macros/s/test/exec', reject = false) {
  const nodes = new Map(), requests = [];
  function node(id) {
    if (!nodes.has(id)) nodes.set(id, { id, events: {}, hidden: false, innerHTML: 'Send', style: {},
      addEventListener(name, callback) { this.events[name] = callback; }, setAttribute() {}, removeAttribute() {}, focus() {}, append() {}, replaceChildren() {} });
    return nodes.get(id);
  }
  const values = { name: 'Visitor', email: 'visitor@example.com', phone: '2145550100', business: 'Test', type: '', hasSite: '', needs: 'A simple website', budget: 'Around $450 — a simple site', timeline: '', socials: '', source: '', website: '' };
  const fields = Object.entries(values).filter(([name]) => name !== 'website').map(([name, value]) => Object.assign(node(name), { name, value, required: ['name', 'email', 'phone', 'business', 'needs', 'budget'].includes(name) }));
  const form = node('booking-form'); form.querySelector = () => node('submit'); form.querySelectorAll = () => fields;
  node('site-config').textContent = JSON.stringify({ endpoint }); node('form-success').hidden = true;
  const context = vm.createContext({
    document: { getElementById: node, querySelectorAll: () => [], querySelector: node, createTextNode: text => text, createElement: node },
    window: { addEventListener() {} }, matchMedia: () => ({ matches: true, addEventListener() {} }),
    AbortController, setTimeout, clearTimeout, FormData: class { entries() { return Object.entries(values); } },
    fetch: async (url, options) => { requests.push({ url, options }); if (reject) throw Error('offline'); return { type: 'opaque' }; }
  });
  vm.runInContext(code, context);
  return { nodes, requests, submit: () => form.events.submit({ preventDefault() {} }) };
}
test('valid form posts all keys and honeypot without any CAPTCHA configuration', async () => {
  const b = browser(); await b.submit(); assert.equal(b.requests.length, 1);
  const request = b.requests[0], payload = JSON.parse(request.options.body);
  assert.deepEqual(Object.keys(payload).sort(), ['name', 'email', 'phone', 'business', 'type', 'hasSite', 'needs', 'budget', 'timeline', 'socials', 'source', 'website'].sort());
  assert.equal(payload.website, ''); assert.equal(request.options.mode, 'no-cors');
  assert.equal(b.nodes.get('booking-form').hidden, true); assert.equal(b.nodes.get('form-success').hidden, false);
});
test('network failure retains form and reports error', async () => {
  const b = browser(undefined, true); await b.submit(); assert.equal(b.nodes.get('booking-form').hidden, false); assert.equal(b.nodes.get('form-error').hidden, false);
});
test('missing endpoint never sends a request', async () => { const b = browser(''); await b.submit(); assert.equal(b.requests.length, 0); assert.equal(b.nodes.get('booking-form').hidden, false); });
