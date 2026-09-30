/**
 * RSVP receiver for achupradeep.online/invitation — paste into the Sheet's Extensions → Apps Script.
 *
 * 1. Run setup() once (it asks for permission to edit this Sheet).
 * 2. Deploy → New deployment → Web app · Execute as: Me · Who has access: Anyone → copy the /exec URL.
 * 3. Put that URL in js/config.js → RSVP_URL.
 *
 * Each browser sends a random RSVP id, so "Edit response" updates that guest's row instead of adding another.
 */

const SHEET = 'RSVPs';
const SUMMARY = 'Summary';
const NOTIFY_EMAIL = '';   // optional: an address to email on every RSVP, e.g. your own Gmail. Blank = no email.
const ATTEND = ['Both events', 'Wedding only', 'Reception only', 'Can’t make it'];
const HEADERS = ['Submitted', 'Updated', 'Name', 'Phone', 'Attending', 'Guests', 'Note', 'Language', 'RSVP id'];
const COL_ID = 9;

function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(SHEET) || ss.insertSheet(SHEET);
  if (sh.getLastRow() === 0) {
    sh.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  sh.getRange('D:D').setNumberFormat('@');           // phone numbers stay text (keeps +91 and leading zeros)
  sh.getRange('A:B').setNumberFormat('dd mmm yyyy hh:mm');

  const sm = ss.getSheetByName(SUMMARY) || ss.insertSheet(SUMMARY);
  sm.clear();
  const r = `${SHEET}!E2:E`, g = `${SHEET}!F2:F`;
  const rows = [['', 'Responses', 'Guests']];
  ATTEND.forEach((a, i) => rows.push([a, `=COUNTIF(${r},A${i + 2})`, `=SUMIF(${r},A${i + 2},${g})`]));
  rows.push(['Coming to the wedding · 5 Dec, Chavara', '=B2+B3', '=C2+C3']);
  rows.push(['Coming to the reception · 6 Dec, Varkala', '=B2+B4', '=C2+C4']);
  rows.push(['All responses', `=COUNTA(${SHEET}!I2:I)`, `=SUM(${g})`]);
  sm.getRange(1, 1, rows.length, 3).setValues(rows);
  sm.getRange('A1:C1').setFontWeight('bold');
  sm.getRange('A6:C8').setFontWeight('bold');
  sm.autoResizeColumn(1);
}

function doPost(e) {
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (body.website) return json({ ok: true });      // honeypot filled: a bot, not a guest

    const name = String(body.name || '').trim();
    if (!name || name.length > 80) return json({ ok: false, error: 'name' });
    const phone = String(body.phone || '').trim();
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10 || digits.length > 15 || phone.length > 20) return json({ ok: false, error: 'phone' });
    const attend = Number(body.attend);
    if (!Number.isInteger(attend) || attend < 0 || attend >= ATTEND.length) return json({ ok: false, error: 'attend' });
    let guests = Number(body.guests);
    if (attend === 3) guests = 0;
    else if (!Number.isInteger(guests) || guests < 1 || guests > 15) return json({ ok: false, error: 'guests' });
    const note = String(body.note || '').trim();
    if (note.length > 500) return json({ ok: false, error: 'note' });
    const lang = body.lang === 'ml' ? 'ml' : 'en';
    const id = String(body.rsvpId || '');
    if (!/^[A-Za-z0-9-]{8,64}$/.test(id)) return json({ ok: false, error: 'id' });

    const cache = CacheService.getScriptCache();
    if (cache.get('t_' + id)) return json({ ok: false, error: 'busy' });   // double-tap / replay guard

    const lock = LockService.getScriptLock();
    lock.waitLock(20000);
    let updated = false;
    try {
      const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET);
      if (!sh) return json({ ok: false, error: 'setup' });
      const now = new Date();
      const row = [safe(name), safe(phone), ATTEND[attend], guests, safe(note), lang, id];
      const last = sh.getLastRow();
      const ids = last > 1 ? sh.getRange(2, COL_ID, last - 1, 1).getValues() : [];
      const at = ids.findIndex(v => v[0] === id);
      if (at >= 0) {
        sh.getRange(at + 2, 2, 1, 8).setValues([[now].concat(row)]);
        updated = true;
      } else {
        sh.getRange(last + 1, 1, 1, 9).setValues([[now, ''].concat(row)]);
      }
      SpreadsheetApp.flush();
    } finally {
      lock.releaseLock();
    }
    cache.put('t_' + id, '1', 3);

    if (NOTIFY_EMAIL) {
      try {
        MailApp.sendEmail(NOTIFY_EMAIL, `RSVP ${updated ? 'updated' : ''}: ${name} — ${ATTEND[attend]}${guests ? ' · ' + guests : ''}`,
          `${name}\n${phone}\n${ATTEND[attend]} · ${guests} guest(s)\n\n${note}`);
      } catch (err) { /* the RSVP is saved; a failed email must not fail it */ }
    }
    return json({ ok: true, updated: updated });
  } catch (err) {
    return json({ ok: false, error: 'server' });
  }
}

/**
 * Opening the /exec URL in a browser shows a hello — a quick check that the deployment is live.
 * With ?action=list&key=<READ_KEY> it returns the RSVPs (for the wedding-sender app to tick off who replied).
 * The key lives in Project Settings → Script properties → READ_KEY (run makeReadKey() once to create it);
 * without the right key the list is never returned, because it holds guests' phone numbers.
 */
function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p.action !== 'list') return json({ ok: true, service: 'wedding-rsvp' });
  const key = PropertiesService.getScriptProperties().getProperty('READ_KEY');
  if (!key || !p.key || p.key !== key) return json({ ok: false, error: 'key' });
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET);
  const last = sh ? sh.getLastRow() : 0;
  const rows = last > 1 ? sh.getRange(2, 1, last - 1, HEADERS.length).getValues() : [];
  return json({
    ok: true,
    rsvps: rows.filter(r => r[2]).map(r => ({
      submitted: r[0] instanceof Date ? r[0].toISOString() : String(r[0]),
      updated: r[1] instanceof Date ? r[1].toISOString() : String(r[1] || ''),
      name: String(r[2]), phone: String(r[3]), attending: String(r[4]), guests: Number(r[5]) || 0
    }))
  });
}

/** Run once: creates the READ_KEY and prints it (View → Logs / Execution log). Paste it into the wedding-sender Settings. */
function makeReadKey() {
  const key = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '');
  PropertiesService.getScriptProperties().setProperty('READ_KEY', key);
  Logger.log('READ_KEY = ' + key);
}

/** A value starting with = + - @ would be run by Sheets as a formula; the apostrophe keeps it as text. */
function safe(s) {
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function json(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
