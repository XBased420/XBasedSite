import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const code = readFileSync(new URL('../apps-script/Code.gs', import.meta.url), 'utf8');
const valid = { name: 'Test Visitor', email: 'visitor@example.com', phone: '(214) 555-0100', business: 'Test Business', type: 'Barber', hasSite: 'No', needs: 'A booking request website.', budget: 'Not sure yet — tell me what it should cost', timeline: 'Few weeks', socials: '', source: '', website: '', turnstileToken: 'valid-test-token' };
function backend(options = {}) {
  const rows = [], emails = [], events = [], cache = new Map();
  const props = { SHEET_ID: 'test-sheet', TURNSTILE_SECRET: 'test-only-secret', ALLOWED_HOSTNAMES: 'xbased420.github.io, xbased.dev' };
  const sheet = { getRange: () => ({ getValues: () => [context.LEAD_COLUMNS] }), appendRow: row => { if (options.writeFails) throw Error('write failed'); rows.push(row); events.push('row'); } };
  const context = vm.createContext({
    console: { log() {}, error() {}, warn() {} },
    ContentService: { MimeType: { JSON: 'json' }, createTextOutput: text => ({ text, setMimeType() { return this; } }) },
    PropertiesService: { getScriptProperties: () => ({ getProperty: key => props[key] }) },
    UrlFetchApp: { fetch: (url, request) => { events.push('verify'); assert.equal(url, 'https://challenges.cloudflare.com/turnstile/v0/siteverify'); assert.equal(request.payload.secret, 'test-only-secret'); return { getResponseCode: () => 200, getContentText: () => JSON.stringify({ success: !options.invalidToken, hostname: options.hostname || 'xbased420.github.io', action: options.action || 'booking' }) }; } },
    LockService: { getScriptLock: () => ({ tryLock: () => !options.lockFails, releaseLock: () => events.push('unlock') }) },
    CacheService: { getScriptCache: () => ({ get: key => cache.get(key), put: (key, value) => cache.set(key, value) }) },
    Utilities: { DigestAlgorithm: { SHA_256: 'sha256' }, computeDigest: (_, text) => createHash('sha256').update(text).digest(), base64EncodeWebSafe: bytes => Buffer.from(bytes).toString('base64url') },
    SpreadsheetApp: { openById: () => ({ getSheetByName: () => sheet }), flush() {} },
    MailApp: { getRemainingDailyQuota: () => options.quota ?? 100, sendEmail: message => { if (options.emailFails) throw Error('send failed'); emails.push(message); events.push('email'); } }
  });
  vm.runInContext(code, context);
  const submit = data => JSON.parse(context.doPost({ postData: { contents: typeof data === 'string' ? data : JSON.stringify(data) } }).text);
  return { context, submit, rows, emails, events };
}
test('valid request saves exact schema and sends two correctly addressed emails', () => {
  const b = backend(); const result = b.submit(valid);
  assert.equal(result.ok, true); assert.equal(b.rows.length, 1); assert.equal(b.rows[0].length, 15); assert.deepEqual(Array.from(b.rows[0].slice(-3)), ['', '', '']);
  assert.equal(b.emails.length, 2); assert.equal(b.emails[0].to, 'calipxj@gmail.com'); assert.equal(b.emails[0].replyTo, valid.email); assert.equal(b.emails[1].replyTo, 'calipxj@gmail.com'); assert.equal(b.emails[1].to, valid.email);
  for (const value of [valid.name, valid.business, valid.budget, valid.timeline]) assert.ok(b.emails[0].subject.includes(value));
  assert.ok(b.emails[1].body.split(/\s+/).length < 120); assert.ok(b.events.indexOf('row') < b.events.indexOf('email'));
});
for (const [name, data, options] of [
  ['honeypot', { ...valid, website: 'bot' }, {}],
  ['missing token', { ...valid, turnstileToken: '' }, {}],
  ['failed Turnstile', valid, { invalidToken: true }],
  ['wrong hostname', valid, { hostname: 'attacker.example' }],
  ['wrong action', valid, { action: 'login' }],
  ['bad email', { ...valid, email: 'bad\r\nBcc:bad@example.com' }, {}],
  ['bad phone', { ...valid, phone: '123' }, {}],
  ['invalid budget', { ...valid, budget: 'other' }, {}],
  ['oversized need', { ...valid, needs: 'x'.repeat(4001) }, {}],
  ['non-string field', { ...valid, name: { bad: true } }, {}],
  ['malformed JSON', '{broken', {}],
  ['write failure', valid, { writeFails: true }],
  ['lock contention', valid, { lockFails: true }]
]) test(`${name} cannot write a lead or send email`, () => { const b = backend(options); assert.equal(b.submit(data).ok, false); assert.equal(b.rows.length, 0); assert.equal(b.emails.length, 0); });
test('repeat verified request is deduplicated for ten minutes', () => { const b = backend(); b.submit(valid); assert.equal(b.submit(valid).duplicate, true); assert.equal(b.rows.length, 1); assert.equal(b.emails.length, 2); });
test('formula-like content stays literal in Sheets', () => { const b = backend(); b.submit({ ...valid, business: '=IMPORTXML("x")' }); assert.equal(b.rows[0][4], "'=IMPORTXML(\"x\")"); });
test('exhausted email quota preserves the lead without claiming emails were sent', () => { const b = backend({ quota: 1 }); const result = b.submit(valid); assert.equal(result.ok, true); assert.equal(result.autoReplySent, false); assert.equal(result.notificationSent, false); assert.equal(b.rows.length, 1); assert.equal(b.emails.length, 0); });
test('email service failure does not lose a saved lead', () => { const b = backend({ emailFails: true }); assert.equal(b.submit(valid).ok, true); assert.equal(b.rows.length, 1); });
