import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import settings from '../site.config.mjs';
const code = readFileSync(new URL('../apps-script/Code.gs', import.meta.url), 'utf8');
const valid = { name: 'Test Visitor', email: 'visitor@example.com', phone: '(214) 555-0100', business: 'Test Business', type: 'Barber', hasSite: 'No', needs: 'A booking request website.', budget: 'Not sure yet — tell me what it should cost', timeline: 'Few weeks', socials: '', source: '', website: '' };
function backend(options = {}) {
  const cells = [], emails = [], events = [], cache = new Map(), triggers = [], notes = new Map();
  let context, sheetExists = !options.noSheet;
  function range(r, c, nr = 1, nc = 1) {
    return {
      getValues: () => Array.from({ length: nr }, (_, i) => Array.from({ length: nc }, (_, j) => cells[r - 1 + i]?.[c - 1 + j] ?? '')),
      setValues(data) { if (options.receiptWriteFails && c === 16 && nc === 2) throw Error('receipt write failed'); data.forEach((values, i) => values.forEach((v, j) => { (cells[r - 1 + i] ??= [])[c - 1 + j] = v; })); return this; },
      setValue(v) { return this.setValues([[v]]); }, setNote(v) { notes.set(r + ':' + c, v); return this; },
      setFontWeight() { return this; }, setDataValidation() { return this; },
      getRow: () => r, getColumn: () => c, getNumRows: () => nr, getNumColumns: () => nc, getSheet: () => sheet
    };
  }
  const sheet = { getRange: range, getName: () => 'Leads', getSheetId: () => 7, getParent: () => spreadsheet,
    getLastRow: () => cells.length, getMaxRows: () => 1000, setFrozenRows() {},
    appendRow(row) { if (options.writeFails) throw Error('write failed'); cells.push(Array.from(row)); events.push('row'); }
  };
  const spreadsheet = { getId: () => 'test-sheet', getUrl: () => 'https://docs.google.com/spreadsheets/d/test-sheet/edit', getSheetByName: () => sheetExists ? sheet : null, insertSheet: () => { sheetExists = true; return sheet; } };
  const validation = { requireValueInList(values) { assert.deepEqual(Array.from(values), ['Pending', 'Confirmed', 'Declined', 'Cancelled']); return this; }, setAllowInvalid: () => validation, build: () => ({}) };
  context = vm.createContext({
    console: { log() {}, error() {}, warn() {} },
    Session: { getEffectiveUser: () => ({ getEmail: () => options.owner || 'calipxj@gmail.com' }) },
    ScriptApp: { EventType: { ON_EDIT: 'edit' }, getProjectTriggers: () => triggers, deleteTrigger(t) { triggers.splice(triggers.indexOf(t), 1); }, newTrigger(handler) { const builder = { forSpreadsheet: () => builder, onEdit: () => builder, create: () => triggers.push({ getHandlerFunction: () => handler, getTriggerSourceId: () => 'test-sheet', getEventType: () => 'edit' }) }; return builder; } },
    ContentService: { MimeType: { JSON: 'json' }, createTextOutput: text => ({ text, setMimeType() { return this; } }) },
    PropertiesService: { getScriptProperties: () => ({ getProperty: key => key === 'SHEET_ID' ? 'test-sheet' : '' }) },
    LockService: { getScriptLock: () => ({ tryLock: () => !options.lockFails, waitLock() { if (options.lockFails) throw Error('busy'); }, releaseLock: () => events.push('unlock') }) },
    CacheService: { getScriptCache: () => ({ get: key => cache.get(key), put: (key, value) => cache.set(key, value) }) },
    Utilities: { DigestAlgorithm: { SHA_256: 'sha256' }, computeDigest: (_, text) => createHash('sha256').update(text).digest(), base64EncodeWebSafe: bytes => Buffer.from(bytes).toString('base64url') },
    SpreadsheetApp: { openById: () => spreadsheet, newDataValidation: () => validation, flush() {} },
    MailApp: { getRemainingDailyQuota: () => options.quota ?? 100, sendEmail(message) { if (options.emailFails || (options.confirmationFails && message.to === valid.email)) throw Error('send failed'); emails.push(message); events.push('email'); } }
  });
  vm.runInContext(code, context);
  if (!options.empty) cells.push(Array.from(options.legacy ? context.LEGACY_COLUMNS : context.LEAD_COLUMNS));
  const submit = data => JSON.parse(context.doPost({ postData: { contents: typeof data === 'string' ? data : JSON.stringify(data) } }).text);
  const edit = (value = 'Confirmed', overrides = {}) => { range(2, 14).setValue(value); return context.handleLeadStatusEdit({ range: range(2, 14), value, source: spreadsheet, ...overrides }); };
  return { context, submit, cells, emails, events, triggers, edit, range, options };
}
test('request saves Pending and emails only owner with reply-to and row link', () => {
  const b = backend(); assert.equal(b.submit({ ...valid, status: 'Confirmed' }).ok, true);
  assert.equal(b.cells[1].length, 18); assert.equal(b.cells[1][13], 'Pending'); assert.equal(b.cells[1][15], '');
  assert.equal(b.emails.length, 1); assert.equal(b.emails[0].to, 'calipxj@gmail.com'); assert.equal(b.emails[0].replyTo, valid.email);
  assert.match(b.emails[0].body, /#gid=7&range=A2:R2/); assert.ok(b.emails[0].body.includes('\nName:'));
  assert.ok(b.events.indexOf('row') < b.events.indexOf('email'));
});
test('confirmation sends once to customer and records durable receipt', () => {
  const b = backend(); b.submit(valid); b.edit();
  assert.equal(b.emails.length, 2); assert.equal(b.emails[1].to, valid.email); assert.equal(b.emails[1].replyTo, 'calipxj@gmail.com');
  assert.ok(b.emails[1].body.includes('\n\n')); assert.equal(b.cells[1][15], 'Sent'); assert.ok(b.cells[1][16]);
  b.edit('Pending'); b.edit(); b.edit(); assert.equal(b.emails.length, 2);
});
test('other statuses, unrelated cells, bulk edits, other Sheets and manual runs cannot email', () => {
  const b = backend(); b.submit(valid); b.edit('Declined'); b.edit('Cancelled'); b.edit('Pending');
  b.edit('Confirmed', { range: b.range(2, 15) }); b.edit('Confirmed', { range: b.range(2, 14, 2, 1) });
  b.edit('Confirmed', { source: { getId: () => 'other-sheet' } }); b.context.handleLeadStatusEdit(); assert.equal(b.emails.length, 1);
});
for (const [name, data, options] of [
  ['honeypot', { ...valid, website: 'bot' }, {}], ['bad email', { ...valid, email: 'bad\r\nBcc:bad@example.com' }, {}],
  ['bad phone', { ...valid, phone: '123' }, {}], ['invalid budget', { ...valid, budget: 'other' }, {}],
  ['oversized need', { ...valid, needs: 'x'.repeat(4001) }, {}], ['non-string field', { ...valid, name: {} }, {}],
  ['malformed JSON', '{broken', {}], ['write failure', valid, { writeFails: true }], ['lock contention', valid, { lockFails: true }]
]) test(name + ' creates no lead or email', () => { const b = backend(options); assert.equal(b.submit(data).ok, false); assert.equal(b.cells.length, 1); assert.equal(b.emails.length, 0); });
test('repeat submissions are suppressed', () => { const b = backend(); b.submit(valid); assert.equal(b.submit(valid).duplicate, true); assert.equal(b.cells.length, 2); assert.equal(b.emails.length, 1); });
test('formula-like input stays literal', () => { const b = backend(); b.submit({ ...valid, business: '=IMPORTXML("x")' }); assert.equal(b.cells[1][4], "'=IMPORTXML(\"x\")"); });
test('owner quota/mail failures preserve Pending row and visible warning', () => {
  for (const options of [{ quota: 0 }, { emailFails: true }]) { const b = backend(options); assert.equal(b.submit(valid).ok, true); assert.equal(b.cells[1][13], 'Pending'); assert.notEqual(b.cells[1][17], 'Sent'); }
});
test('confirmation quota exhaustion records failure and supports explicit retry', () => {
  const b = backend(); b.submit(valid); b.options.quota = 0; b.edit(); assert.match(b.cells[1][15], /Quota/); assert.equal(b.emails.length, 1);
  b.options.quota = 10; b.edit('Pending'); b.edit(); assert.equal(b.emails.length, 2);
});
test('uncertain mail failure requires review and does not resend automatically', () => {
  const b = backend({ confirmationFails: true }); b.submit(valid); assert.throws(() => b.edit(), /uncertain/);
  assert.equal(b.cells[1][15], 'Review needed'); b.options.confirmationFails = false; b.edit('Pending'); b.edit(); assert.equal(b.emails.length, 1);
});
test('receipt write failure after successful mail leaves claim and prevents duplicates', () => {
  const b = backend({ receiptWriteFails: true }); b.submit(valid); assert.throws(() => b.edit(), /receipt/); assert.equal(b.cells[1][15], 'Sending');
  b.options.receiptWriteFails = false; b.edit('Pending'); b.edit(); assert.equal(b.emails.length, 2);
});
test('invalid edited customer email is not sent', () => { const b = backend(); b.submit(valid); b.range(2, 3).setValue('invalid'); b.edit(); assert.match(b.cells[1][15], /Invalid email/); assert.equal(b.emails.length, 1); });
test('setup creates headers and one installable trigger across repeated runs', () => {
  const b = backend({ empty: true, noSheet: true }); b.context.setupLeads(); b.context.setupLeads(); assert.equal(b.cells[0].length, 18); assert.equal(b.triggers.length, 1);
});
test('setup preserves legacy rows and rejects conflicting schema', () => {
  const b = backend({ legacy: true }); b.cells.push(['existing lead']); b.context.setupLeads(); assert.equal(b.cells[1][0], 'existing lead'); assert.equal(b.cells[0].length, 18);
  b.cells[0][0] = 'Wrong'; assert.throws(() => b.context.setupLeads(), /schema_mismatch/);
});
test('setup refuses wrong sender account', () => { const b = backend({ owner: 'other@example.com' }); assert.throws(() => b.context.setupLeads(), /calipxj/); assert.equal(b.triggers.length, 0); });
test('every configured budget is accepted exactly by backend', () => { const b = backend(); assert.deepEqual(Array.from(b.context.BUDGETS), settings.budgets); for (const budget of settings.budgets) assert.equal(b.submit({ ...valid, budget }).ok, true); });
