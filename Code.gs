/*
  Code.gs
  -------
  Paste this into the Apps Script editor of a Google Sheet (Extensions ->
  Apps Script), then deploy it as a Web App. Full steps in SETUP.md.

  Writes ONE ROW PER (expert response x case) to the "Responses" sheet --
  this "long" format is the easiest to pivot/analyze later (e.g. one
  PivotTable: rows = image_id, columns = rank_1..rank_7, values = count).

  Columns written:
    timestamp | response_id | experience_years | degree | specialty |
    institution | email | image_id | rank_1 | rank_2 | ... | rank_7
*/

const SHEET_NAME = "Responses";

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const payload = JSON.parse(e.postData.contents);
    const sheet = getOrCreateSheet();
    const responseId = Utilities.getUuid();
    const timestamp = payload.submitted_at || new Date().toISOString();

    const baseCols = [
      timestamp,
      responseId,
      payload.experience_years || "",
      payload.degree || "",
      payload.specialty || "",
      payload.institution || "",
      payload.email || "",
    ];

    (payload.responses || []).forEach(resp => {
      const ranking = resp.ranking || [];
      const row = baseCols.concat([resp.image_id]).concat(padTo(ranking, 7));
      sheet.appendRow(row);
    });

    return jsonResponse({ ok: true, response_id: responseId });
  } catch (err) {
    return jsonResponse({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function padTo(arr, n) {
  const out = arr.slice(0, n);
  while (out.length < n) out.push("");
  return out;
}

function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow([
      "timestamp", "response_id", "experience_years", "degree", "specialty",
      "institution", "email", "image_id",
      "rank_1_best", "rank_2", "rank_3", "rank_4", "rank_5", "rank_6", "rank_7_worst",
    ]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// Lets you sanity-check the deployment by opening the Web App URL directly
// in a browser (GET request) -- should show {"ok":true,"msg":"..."}.
function doGet() {
  return jsonResponse({ ok: true, msg: "Bone & Callus survey endpoint is live." });
}
