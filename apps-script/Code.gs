/** XBased booking backend. Deploy from calipxj@gmail.com. No secrets in this file. */
var LEGACY_COLUMNS = ['Timestamp', 'Name', 'Email', 'Phone', 'Business', 'Type', 'Has Site', 'Needs', 'Budget', 'Timeline', 'Socials', 'Source', 'File Link', 'Status', 'Notes'];
var LEAD_COLUMNS = LEGACY_COLUMNS.concat(['Confirmation Email', 'Confirmation Sent At', 'Owner Notification']);
var STATUSES = ['Pending', 'Confirmed', 'Declined', 'Cancelled'];
var OWNER_EMAIL = ['calipxj', 'gmail.com'].join('@');
var BUDGETS = ['Around $450 — a simple site', '$600–$1,199', '$1,200–$2,499', '$2,500+', 'Not sure yet — tell me what it should cost'];
var TIMELINES = ['', 'ASAP', 'Few weeks', 'Few months', 'Just exploring'];

function jsonResponse(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}
function rejectRequest() { return jsonResponse({ ok: false }); }
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
function leadHash(lead) {
  return Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, JSON.stringify(lead))).replace(/=+$/, '');
}
function getLeadsSheet(properties) {
  var id = properties.getProperty('SHEET_ID');
  if (!id) throw new Error('missing_sheet');
  var sheet = SpreadsheetApp.openById(id).getSheetByName('Leads');
  if (!sheet) throw new Error('missing_tab');
  var columns = sheet.getRange(1, 1, 1, LEAD_COLUMNS.length).getValues()[0];
  if (JSON.stringify(columns) !== JSON.stringify(LEAD_COLUMNS)) throw new Error('schema_mismatch');
  return sheet;
}
/** Run once as calipxj@gmail.com after setting SHEET_ID. Safe to run again. */
function setupLeads() {
  if (Session.getEffectiveUser().getEmail().toLowerCase() !== OWNER_EMAIL) throw new Error('Use calipxj@gmail.com to run setup.');
  var props = PropertiesService.getScriptProperties();
  var spreadsheet = SpreadsheetApp.openById(props.getProperty('SHEET_ID'));
  var sheet = spreadsheet.getSheetByName('Leads') || spreadsheet.insertSheet('Leads');
  var headers = sheet.getRange(1, 1, 1, LEAD_COLUMNS.length).getValues()[0];
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, LEAD_COLUMNS.length).setValues([LEAD_COLUMNS]);
  } else if (JSON.stringify(headers.slice(0, LEGACY_COLUMNS.length)) === JSON.stringify(LEGACY_COLUMNS) &&
             headers.slice(LEGACY_COLUMNS.length).every(function (v) { return v === ''; })) {
    sheet.getRange(1, 16, 1, 3).setValues([LEAD_COLUMNS.slice(15)]);
  }
  getLeadsSheet(props);
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, LEAD_COLUMNS.length).setFontWeight('bold');
  sheet.getRange(2, 14, sheet.getMaxRows() - 1, 1).setDataValidation(statusRule());
  var existing = ScriptApp.getProjectTriggers().filter(function (trigger) {
    return trigger.getHandlerFunction() === 'handleLeadStatusEdit' &&
      trigger.getTriggerSourceId() === spreadsheet.getId() &&
      trigger.getEventType() === ScriptApp.EventType.ON_EDIT;
  });
  if (!existing.length) ScriptApp.newTrigger('handleLeadStatusEdit').forSpreadsheet(spreadsheet).onEdit().create();
  // Remove only duplicate triggers for this handler and this spreadsheet.
  existing.slice(1).forEach(function (trigger) { ScriptApp.deleteTrigger(trigger); });
  console.log('Ready. Confirm one request at a time in the Leads Status column.');
}
function statusRule() {
  return SpreadsheetApp.newDataValidation().requireValueInList(STATUSES, true).setAllowInvalid(false).build();
}
function emailFailure(sheet, row, column, message) {
  sheet.getRange(row, column).setValue(message);
  console.error(message + ' (Leads row ' + row + ')');
}
/** Installable edit trigger; a simple onEdit cannot send authorized email. */
function handleLeadStatusEdit(e) {
  if (!e || !e.range || !e.source || e.range.getNumRows() !== 1 || e.range.getNumColumns() !== 1 ||
      e.range.getColumn() !== 14 || e.range.getRow() < 2 || e.value !== 'Confirmed' ||
      e.range.getSheet().getName() !== 'Leads') return;
  var props = PropertiesService.getScriptProperties();
  if (e.source.getId() !== props.getProperty('SHEET_ID') ||
      Session.getEffectiveUser().getEmail().toLowerCase() !== OWNER_EMAIL) return;
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var sheet = getLeadsSheet(props), row = e.range.getRow();
    var values = sheet.getRange(row, 1, 1, LEAD_COLUMNS.length).getValues()[0];
    // Re-read under the lock; edits can change while a trigger waits.
    if (values[13] !== 'Confirmed' || values[16] || ['Sent', 'Sending', 'Review needed'].indexOf(values[15]) >= 0) return;
    var address = String(values[2]).trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address) || /[\r\n]/.test(address)) {
      emailFailure(sheet, row, 16, 'Invalid email — correct column C, then set Pending and Confirmed');
      return;
    }
    if (MailApp.getRemainingDailyQuota() < 1) {
      emailFailure(sheet, row, 16, 'Quota exhausted — retry later by setting Pending then Confirmed');
      return;
    }
    // Persist a claim BEFORE sending. An uncertain failure must not auto-send twice.
    sheet.getRange(row, 16).setValue('Sending');
    SpreadsheetApp.flush();
    try {
      MailApp.sendEmail({
        to: address, replyTo: OWNER_EMAIL, name: 'Xavier at XBased',
        subject: 'Your project request is confirmed — XBased',
        body: 'Hi ' + values[1] + ',\n\nI’ve reviewed and confirmed your project request for ' + values[4] +
          '.\n\nYour request:\n' + values[7] +
          '\n\nI’ll follow up with you to agree on the scope, quote, and schedule.\n\nReply here if you need to add anything.\n\n— Xavier'
      });
    } catch (mailError) {
      emailFailure(sheet, row, 16, 'Review needed');
      sheet.getRange(row, 16).setNote('Mail delivery is uncertain. Check with the customer before retrying. To retry only after confirming no delivery, clear this cell and set Status to Pending, then Confirmed.');
      throw new Error('Confirmation delivery uncertain for Leads row ' + row + '; inspect column P before retrying.');
    }
    // If this write fails, Sending remains and prevents an automatic duplicate.
    sheet.getRange(row, 16, 1, 2).setValues([['Sent', new Date()]]);
    SpreadsheetApp.flush();
  } finally { lock.releaseLock(); }
}
function doPost(e) {
  var locked = false, lock;
  try {
    if (!e || !e.postData || !e.postData.contents || e.postData.contents.length > 24000) return rejectRequest();
    var data = JSON.parse(e.postData.contents);
    if (!data || typeof data !== 'object' || Array.isArray(data)) return rejectRequest();
    if (data.website) return rejectRequest();
    var lead = normalizeLead(data);
    var props = PropertiesService.getScriptProperties();
    lock = LockService.getScriptLock();
    locked = lock.tryLock(10000);
    if (!locked) throw new Error('busy');
    var cache = CacheService.getScriptCache();
    var fingerprint = 'lead:' + leadHash(lead);
    if (cache.get(fingerprint)) return jsonResponse({ ok: true, duplicate: true });
    var sheet = getLeadsSheet(props);
    var values = [lead.name, lead.email, lead.phone, lead.business, lead.type, lead.hasSite, lead.needs, lead.budget, lead.timeline, lead.socials, lead.source].map(sheetText);
    sheet.appendRow([new Date()].concat(values, ['', 'Pending', '', '', '', 'Pending']));
    var row = sheet.getLastRow();
    sheet.getRange(row, 14).setDataValidation(statusRule());
    SpreadsheetApp.flush();
    cache.put(fingerprint, 'saved', 600);
    // The customer receives no email until Xavier confirms the request in Sheets.
    var notificationSent = false;
    if (MailApp.getRemainingDailyQuota() >= 1) {
      try {
        MailApp.sendEmail({
          to: OWNER_EMAIL, replyTo: lead.email, name: 'XBased requests',
          subject: '[Pending request] ' + [lead.name, lead.business, lead.budget, lead.timeline || 'No timeline'].map(subjectText).join(' | '),
          body: ['New project request — awaiting your confirmation', '',
            'Name: ' + lead.name, 'Email: ' + lead.email, 'Phone: ' + lead.phone,
            'Business: ' + lead.business, 'Type: ' + (lead.type || 'Not supplied'),
            'Has a site: ' + (lead.hasSite || 'Not supplied'), 'Budget: ' + lead.budget,
            'Timeline: ' + (lead.timeline || 'Not supplied'), 'Socials: ' + (lead.socials || 'Not supplied'),
            'Found me through: ' + (lead.source || 'Not supplied'), '', 'What they need:', lead.needs, '',
            'Open this row and change Status (column N) from Pending to Confirmed to email the customer:',
            sheet.getParent().getUrl() + '#gid=' + sheet.getSheetId() + '&range=A' + row + ':R' + row,
            '', 'Reply to this message to contact the customer directly.'].join('\n')
        });
        notificationSent = true;
        sheet.getRange(row, 18).setValue('Sent');
      } catch (notificationError) { emailFailure(sheet, row, 18, 'Review needed — check email; request saved'); }
    } else { emailFailure(sheet, row, 18, 'Quota exhausted — request saved; check Leads manually'); }
    return jsonResponse({ ok: true, notificationSent: notificationSent });

  } catch (error) {
    // Never echo tokens, submitted contact details, or stack traces to visitors.
    console.error('Booking could not complete: ' + (['missing_sheet', 'missing_tab', 'schema_mismatch', 'busy', 'invalid_field', 'email', 'choice'].indexOf(error.message) >= 0 ? error.message : 'unexpected_error') + '. Check Leads before retrying.');
    return rejectRequest();
  } finally { if (locked) lock.releaseLock(); }
}
