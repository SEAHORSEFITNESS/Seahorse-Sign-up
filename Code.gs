/**
 * Seahorse Fitness Inc. registration form backend.
 * Saves each submission as a PDF in Google Drive and also logs the submission in Google Sheets.
 *
 * SETUP:
 * 1) Create a Google Sheet and set SPREADSHEET_ID below.
 * 2) Set PDF_FOLDER_ID to an existing Drive folder ID, or leave blank to create/use a folder by name.
 * 3) Paste into Extensions > Apps Script, save, then Deploy > New deployment > Web app.
 * 4) Execute as: Me. Who has access: Anyone (needed for public GitHub Pages form).
 * 5) Put the deployed /exec URL into index.html as SCRIPT_URL.
 *
 * NOTE: A public endpoint needs spam protection/validation before production.
 */
const SPREADSHEET_ID = "1eIdNk32NDLlsdKfb-gJxT1jrf0lKQmGYOJpqEFReEDM";
const SHEET_NAME = "Registration Responses";
const PDF_FOLDER_ID = "1CtWAxaGGUQ-5VHrQCXgQ_LS9DzAyax_O";
const PDF_FOLDER_NAME = "Seahorse Registration PDFs";

function doPost(e) {
  try {
    const data = JSON.parse(e && e.postData && e.postData.contents ? e.postData.contents : "{}");
    const folder = getOrCreateFolder_();

    const pdfBlob = createRegistrationPdf_(data);
    const first = safeName_(data.studentFirst || "Student");
    const last = safeName_(data.studentLast || "Unknown");
    const fileName = first + "_" + last + "_info.pdf";
    pdfBlob.setName(fileName);
    const pdfFile = folder.createFile(pdfBlob);

    // Optional audit log in Google Sheets, so the office can search submissions.
    if (SPREADSHEET_ID && SPREADSHEET_ID !== "PASTE_YOUR_GOOGLE_SHEET_ID_HERE") {
      const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
      let sheet = ss.getSheetByName(SHEET_NAME);
      if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
      const headers = [
        "Submitted At","Student First Name","Student Last Name","PDF File Name","PDF URL",
        "Email","Guardian First Name","Guardian Last Name","Mobile Phone","Selected Days",
        "Selected Class","Preferred Time","Applicant Printed Name","Emergency Contact","Emergency Contact Phone"
      ];
      if (sheet.getLastRow() === 0) sheet.appendRow(headers);
      sheet.appendRow([
        data.submittedAt || new Date().toISOString(),
        data.studentFirst || "", data.studentLast || "", fileName, pdfFile.getUrl(),
        data.email || "", data.guardianFirst || "", data.guardianLast || "", data.mobilePhone || "",
        Array.isArray(data.scheduleDays) ? data.scheduleDays.join(", ") : "",
        data.selectedClass || "", data.selectedTime || "", data.applicantName || "",
        data.emergencyContact || "", data.emergencyPhone || ""
      ]);
    }

    return ContentService.createTextOutput(JSON.stringify({ok:true, fileName:fileName, fileUrl:pdfFile.getUrl()}))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    console.error(err);
    return ContentService.createTextOutput(JSON.stringify({ok:false,error:String(err)}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function createRegistrationPdf_(d) {
  const doc = DocumentApp.create("TEMP_REGISTRATION_" + new Date().getTime());
  const body = doc.getBody();
  body.appendParagraph("海馬游泳訓練中心 SEAHORSE FITNESS INC.")
    .setHeading(DocumentApp.ParagraphHeading.TITLE);
  body.appendParagraph("Student Registration / 學生報名資料")
    .setHeading(DocumentApp.ParagraphHeading.HEADING1);

  addSection_(body, "Student Information / 學生資料");
  addField_(body, "First Name / 名字", d.studentFirst);
  addField_(body, "Last Name / 姓氏", d.studentLast);
  addField_(body, "Chinese Name / 中文姓名", d.studentChinese);
  addField_(body, "Date of Birth / 出生日期", d.dob);
  addField_(body, "Address / 地址", d.address);
  addField_(body, "City / 城市", d.city);
  addField_(body, "State / ZIP / 州及郵區", d.stateZip);
  addField_(body, "Home Phone / 家庭電話", d.homePhone);
  addField_(body, "Sex / 性別", d.sex);
  addField_(body, "Email / 電郵", d.email);

  addSection_(body, "Parent / Guardian Information / 家長資料");
  addField_(body, "First Name / 名字", d.guardianFirst);
  addField_(body, "Last Name / 姓氏", d.guardianLast);
  addField_(body, "Work Phone / 工作電話", d.workPhone);
  addField_(body, "Mobile Phone / 手機", d.mobilePhone);
  addField_(body, "Relation to Student / 與學生關係", d.relation);

  addSection_(body, "Selected Schedule / 所選課程");
  addField_(body, "Days / 星期", Array.isArray(d.scheduleDays) ? d.scheduleDays.join(", ") : "");
  addField_(body, "Selected Class / 所選課程", d.selectedClass);
  addField_(body, "Preferred Time / 所選時間", d.selectedTime);

  addSection_(body, "Waiver and Release / 免责及责任豁免");
  body.appendParagraph("I have read and understand the Waiver and Release presented on the online registration form, and acknowledge my consent to its terms for myself and/or my child, if applicable.");
  addField_(body, "Applicant's Printed Name / 申請人正楷姓名", d.applicantName);
  addField_(body, "Child's Printed Name / 孩子正楷姓名", d.childName);
  addField_(body, "Waiver Agreed / 是否同意", d.agreeWaiver ? "Yes / 是" : "No / 否");
  addField_(body, "Daytime Telephone / 日間電話", d.daytimePhone);
  addField_(body, "Evening Telephone / 晚間電話", d.eveningPhone);
  addField_(body, "Cell Phone / 手機", d.cellPhone);
  addField_(body, "Alternate Telephone / 其他電話", d.alternatePhone);
  addField_(body, "Emergency Contact / 緊急聯絡人", d.emergencyContact);
  addField_(body, "Emergency Contact Telephone / 緊急聯絡電話", d.emergencyPhone);
  addField_(body, "Relationship / 與學生關係", d.emergencyRelation);

  if (d.signatureDataUrl && /^data:image\/png;base64,/.test(d.signatureDataUrl)) {
    body.appendParagraph("Parent / Guardian Signature / 家長或監護人簽名")
      .setHeading(DocumentApp.ParagraphHeading.HEADING2);
    const bytes = Utilities.base64Decode(d.signatureDataUrl.split(",")[1]);
    const image = body.appendImage(Utilities.newBlob(bytes, "image/png", "signature.png"));
    image.setWidth(300);
  }
  body.appendParagraph("Submitted at / 提交時間: " + (d.submittedAt || new Date().toISOString()));
  doc.saveAndClose();

  const docFile = DriveApp.getFileById(doc.getId());
  const pdfBlob = docFile.getAs(MimeType.PDF);
  docFile.setTrashed(true); // Keep the PDF only; remove the temporary Google Doc.
  return pdfBlob;
}

function addSection_(body, title) {
  body.appendParagraph(title).setHeading(DocumentApp.ParagraphHeading.HEADING2);
}
function addField_(body, label, value) {
  const table = body.appendTable([[label, value == null ? "" : String(value)]]);
  table.setBorderWidth(0.5);
  const labelCell = table.getCell(0, 0);
  const valueCell = table.getCell(0, 1);
  labelCell.setBackgroundColor("#eaf1f6");
  labelCell.setWidth(205);
  valueCell.setWidth(310);
  [labelCell, valueCell].forEach(cell => {
    cell.setPaddingTop(5).setPaddingBottom(5).setPaddingLeft(7).setPaddingRight(7);
  });
  labelCell.getChild(0).asParagraph().setBold(true).setFontSize(9).setForegroundColor("#123a5a");
  valueCell.getChild(0).asParagraph().setFontSize(10).setForegroundColor("#202b33");
}
function safeName_(s) {
  return String(s).trim().replace(/[\\\\/:*?"<>|#%{}~&]/g, "_").replace(/\s+/g, "_").substring(0, 80) || "Unknown";
}
function getOrCreateFolder_() {
  if (PDF_FOLDER_ID && PDF_FOLDER_ID.trim()) return DriveApp.getFolderById(PDF_FOLDER_ID.trim());
  const folders = DriveApp.getFoldersByName(PDF_FOLDER_NAME);
  return folders.hasNext() ? folders.next() : DriveApp.createFolder(PDF_FOLDER_NAME);
}
