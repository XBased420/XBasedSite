/** XBased booking backend. Deploy from calipxj@gmail.com. No secrets in this file. */
var LEAD_COLUMNS = ['Timestamp', 'Name', 'Email', 'Phone', 'Business', 'Type', 'Has Site', 'Needs', 'Budget', 'Timeline', 'Socials', 'Source', 'File Link', 'Status', 'Notes'];
var OWNER_EMAIL = ['calipxj', 'gmail.com'].join('@');
var BUDGETS = ['Something simple — $100–$500', '$500–$1,000', '$1,000–$2,500', '$2,500+', 'Not sure yet — tell me what it should cost'];
var TIMELINES = ['', 'ASAP', 'Few weeks', 'Few months', 'Just exploring'];

function jsonResponse(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}
// Bot/validation rejections look like acceptance on the wire, with no side effects.
function rejectRequest() { return jsonResponse({ ok: true }); }
function cleanText(data, name, max, required) {
  var value = data[name];
  if (value === undefined || value === null) value = '';
  if (typeof value !== 'string') throw new Error('invalid_field');
  value = value.replace(/\u0000/g, '').trim();
  if ((required && !value) || value.length > max) throw new Error('invalid_field');
  return value;
}
function normalizeLead(data) {
  var lead = {};
  ['name', 'email', 'phone', 'business', 'type', 'hasSite', 'needs', 'budget', 'timeline', 'socials', 'source'].forEach(function (key) {
    lead[key] = cleanText(data, key, key === 'needs' ? 4000 : key === 'phone' ? 30 : 200, ['name', 'email', 'phone', 'business', 'needs', 'budget'].indexOf(key) >= 0);
  });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email) || /[\r\n]/.test(lead.email)) throw new Error('email');
  var digits = lead.phone.replace(/\D/g, '');
  var validPhone = lead.phone.charAt(0) === '+' ? digits.length >= 8 && digits.length <= 15 : digits.length === 10 || (digits.length === 11 && digits.charAt(0) === '1');
  if (!validPhone || BUDGETS.indexOf(lead.budget) < 0 || TIMELINES.indexOf(lead.timeline) < 0 || ['', 'Yes', 'No', 'Sort of'].indexOf(lead.hasSite) < 0) throw new Error('choice');
  return lead;
}
// Keep user content literal when Sheets interprets formula-leading characters.
function sheetText(value) { return /^[\s]*[=+\-@]/.test(value) ? "'" + value : value; }
function subjectText(value) { return value.replace(/[\r\n\t]+/g, ' ').slice(0, 80); }
function hashText(value) { return Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, value)).replace(/=+$/, ''); }
function leadHash(lead) { return hashText(JSON.stringify(lead)); }
function senderHash(lead) { return hashText(lead.email.toLowerCase() + '|' + lead.phone.replace(/\D/g, '')); }
function getLeadsSheet(properties) {
  var id = properties.getProperty('SHEET_ID');
  if (!id) throw new Error('missing_sheet');
  var sheet = SpreadsheetApp.openById(id).getSheetByName('Leads');
  if (!sheet) throw new Error('missing_tab');
  var columns = sheet.getRange(1, 1, 1, LEAD_COLUMNS.length).getValues()[0];
  if (JSON.stringify(columns) !== JSON.stringify(LEAD_COLUMNS)) throw new Error('schema_mismatch');
  return sheet;
}
/** Run once in the editor after setting SHEET_ID. Existing leads are never erased. */
function setupLeads() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty('SHEET_ID');
  var spreadsheet;
  if (id) spreadsheet = SpreadsheetApp.openById(id);
  else {
    spreadsheet = SpreadsheetApp.create('XBased — Project requests');
    spreadsheet.setSpreadsheetTimeZone('America/Chicago');
    props.setProperty('SHEET_ID', spreadsheet.getId());
  }
  var sheet = spreadsheet.getSheetByName('Leads') || spreadsheet.insertSheet('Leads');
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, LEAD_COLUMNS.length).setValues([LEAD_COLUMNS]);
    sheet.setFrozenRows(1);
  }
  getLeadsSheet(props);
  console.log('Leads Sheet: ' + spreadsheet.getUrl());
}
function doPost(e) {
  var locked = false, lock;
  try {
    if (!e || !e.postData || !e.postData.contents || e.postData.contents.length > 24000) return rejectRequest();
    var data = JSON.parse(e.postData.contents);
    if (!data || typeof data !== 'object' || Array.isArray(data)) return rejectRequest();
    if (data.website) return rejectRequest();
    // Heuristic only: clients can forge elapsed time, so it is layered with the honeypot,
    // strict validation, duplicate suppression, and a short per-sender cooldown below.
    if (typeof data.elapsedSeconds !== 'number' || !isFinite(data.elapsedSeconds) || data.elapsedSeconds < 3) return rejectRequest();
    var lead = normalizeLead(data);
    var props = PropertiesService.getScriptProperties();
    lock = LockService.getScriptLock();
    locked = lock.tryLock(10000);
    if (!locked) throw new Error('busy');
    var cache = CacheService.getScriptCache();
    var fingerprint = 'lead:' + leadHash(lead);
    if (cache.get(fingerprint)) return jsonResponse({ ok: true, duplicate: true });
    var senderKey = 'sender:' + senderHash(lead);
    if (cache.get(senderKey)) return jsonResponse({ ok: true, throttled: true });
    var sheet = getLeadsSheet(props);
    var values = [lead.name, lead.email, lead.phone, lead.business, lead.type, lead.hasSite, lead.needs, lead.budget, lead.timeline, lead.socials, lead.source].map(sheetText);
    sheet.appendRow([new Date()].concat(values, ['', '', '']));
    SpreadsheetApp.flush();
    cache.put(fingerprint, 'saved', 600);
    cache.put(senderKey, 'saved', 60);
    // Row is durable before email. Status and Notes remain Xavier's manual fields.
    var notificationSent = false, autoReplySent = false;
    if (MailApp.getRemainingDailyQuota() >= 2) {
      try {
        MailApp.sendEmail({
          to: OWNER_EMAIL, replyTo: lead.email, name: 'XBased requests',
          subject: '[Project] ' + [lead.name, lead.business, lead.budget, lead.timeline || 'No timeline'].map(subjectText).join(' | '),
          body: ['New project request', '', 'Name: ' + lead.name, 'Email: ' + lead.email, 'Phone: ' + lead.phone, 'Business: ' + lead.business, 'Type: ' + (lead.type || 'Not supplied'), 'Has a site: ' + (lead.hasSite || 'Not supplied'), 'Budget: ' + lead.budget, 'Timeline: ' + (lead.timeline || 'Not supplied'), 'Socials: ' + (lead.socials || 'Not supplied'), 'Found me through: ' + (lead.source || 'Not supplied'), '', 'What they need:', lead.needs, '', 'Hit reply to answer them.'].join('\n')
        });
        notificationSent = true;
      } catch (notificationError) { console.error('Notification failed; lead saved. Check Leads manually.'); }
      try {
        if (MailApp.getRemainingDailyQuota() < 1) throw new Error('quota');
        MailApp.sendEmail({
          to: lead.email, replyTo: OWNER_EMAIL, name: 'Xavier at XBased', subject: 'Got your project request — Xavier',
          body: 'Hey ' + lead.name + ',\n\nGot your request for ' + lead.business + '. Thanks for sending it over.\n\nI’ll get back to you within 24 hours with a few times to talk and a rough quote. We’ll figure out the details before anything starts.\n\nForgot a detail or have photos to send? Reply to this email and add them here.\n\n— Xavier'
        });
        autoReplySent = true;
      } catch (replyError) { console.error('Auto-reply failed; lead saved. Check Leads manually.'); }
    } else { console.warn('Email quota low; lead saved without emails. Check Leads manually.'); }
    return jsonResponse({ ok: true, notificationSent: notificationSent, autoReplySent: autoReplySent });
  } catch (error) {
    // Never echo tokens, submitted contact details, or stack traces to visitors.
    console.error('Booking could not complete. Check configuration and Leads before retrying.');
    return rejectRequest();
  } finally { if (locked) lock.releaseLock(); }
}
