/**
 * Google Apps Script (Code.gs) Backend
 * Indiaskills Kerala 2026-27 — DTE & ITD Institutional Portal
 *
 * - Question Paper Preparation -> Populates "Sheet2" with separate Screening, District, Zonal, State (Yes/No) columns
 *   and mandatory Coordinating Officer, Contact Phone, Official Email (NO Computers Available / Connectivity columns).
 * - District Exam Centres -> Populates "Sheet1" (or active first sheet).
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
  } catch (lockError) {
    return createJsonResponse({
      status: "error",
      message: "Server is currently busy handling concurrent submissions. Please try again."
    });
  }

  try {
    var data = {};
    if (e && e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (parseError) {
        data = e.parameter || {};
      }
    } else if (e && e.parameter) {
      data = e.parameter;
    } else {
      lock.releaseLock();
      return createJsonResponse({
        status: "error",
        message: "No data payload received in request."
      });
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var timestamp = new Date();
    var formattedTimestamp = Utilities.formatDate(
      timestamp,
      ss.getSpreadsheetTimeZone() || "GMT+5:30",
      "yyyy-MM-dd HH:mm:ss"
    );

    var submissionId = data.submissionId || ("ISK-" + new Date().getTime());
    var department = data.department || "";
    var isQuestionPaper =
      data.moduleType === "question_paper_preparation" ||
      data.moduleType === "question_paper" ||
      (data.questionPaperRows && Array.isArray(data.questionPaperRows));

    // =========================================================================
    // 1. QUESTION PAPER PREPARATION -> POPULATES "Sheet2"
    // Columns: [Submission ID, Timestamp, Department, Skill / Trade, Screening, District, Zonal, State, Coordinating Officer, Contact Phone, Official Email]
    // =========================================================================
    if (isQuestionPaper) {
      var qpSheetName = "Sheet2";
      var qpSheet = ss.getSheetByName(qpSheetName);
      if (!qpSheet) {
        qpSheet = ss.insertSheet(qpSheetName);
      }

      var qpHeaders = [
        "Submission ID",
        "Timestamp",
        "Department",
        "Skill / Trade",
        "Screening",
        "District",
        "Zonal",
        "State",
        "Coordinating Officer",
        "Contact Phone",
        "Official Email"
      ];

      // Auto-initialize or update header row if Sheet2 is empty or had the old exam center headers
      if (qpSheet.getLastRow() === 0) {
        qpSheet.appendRow(qpHeaders);
        var qpHeaderRange = qpSheet.getRange(1, 1, 1, qpHeaders.length);
        qpHeaderRange.setFontWeight("bold");
        qpHeaderRange.setBackground("#0e5774");
        qpHeaderRange.setFontColor("#ffffff");
        qpSheet.setFrozenRows(1);
      } else {
        var existingCol5 = String(qpSheet.getRange(1, 5).getValue() || "").trim();
        if (existingCol5 !== "Screening") {
          qpSheet.clear();
          qpSheet.appendRow(qpHeaders);
          var newHeaderRange = qpSheet.getRange(1, 1, 1, qpHeaders.length);
          newHeaderRange.setFontWeight("bold");
          newHeaderRange.setBackground("#0e5774");
          newHeaderRange.setFontColor("#ffffff");
          qpSheet.setFrozenRows(1);
        }
      }

      var qpRowsToAppend = [];
      var sourceRows = data.questionPaperRows || data.allocations || [];

      for (var i = 0; i < sourceRows.length; i++) {
        var item = sourceRows[i];
        var skillName =
          item.skill ||
          (Array.isArray(item.skills) ? item.skills.join(", ") : item.skills) ||
          "-";

        // Determine Yes / No for each of the 4 competition levels
        var levelsText = String(item.districtOrZoneName || item.stageLabel || "");
        var screeningVal = item.screening || (levelsText.indexOf("Screening") !== -1 ? "Yes" : "No");
        var districtVal = item.district || (levelsText.indexOf("District") !== -1 ? "Yes" : "No");
        var zonalVal = item.zonal || (levelsText.indexOf("Zonal") !== -1 ? "Yes" : "No");
        var stateVal = item.state || (levelsText.indexOf("State") !== -1 ? "Yes" : "No");

        var officer = item.coordinatingOfficer || data.coordinatingOfficer || "-";
        var phone = item.contactPhone || data.contactPhone || "-";
        var email = item.email || data.email || "-";

        qpRowsToAppend.push([
          submissionId,
          formattedTimestamp,
          department,
          skillName,
          screeningVal,
          districtVal,
          zonalVal,
          stateVal,
          officer,
          phone !== "-" ? "'" + phone : "-",
          email
        ]);
      }

      if (qpRowsToAppend.length > 0) {
        qpSheet
          .getRange(qpSheet.getLastRow() + 1, 1, qpRowsToAppend.length, qpHeaders.length)
          .setValues(qpRowsToAppend);
      }

      lock.releaseLock();
      return createJsonResponse({
        status: "success",
        sheetName: qpSheetName,
        rowsAppended: qpRowsToAppend.length,
        submissionId: submissionId,
        timestamp: formattedTimestamp
      });
    }

    // =========================================================================
    // 2. DISTRICT & TALUK ONLINE EXAM CENTRES -> POPULATES "Sheet1" (or targetSheet)
    // =========================================================================
    var examSheetName = data.sheetName || data.targetSheet || "Sheet1";
    var examSheet = ss.getSheetByName(examSheetName) || ss.getSheets()[0];

    if (examSheet.getLastRow() === 0) {
      var examHeaders = [
        "Submission ID",
        "Timestamp",
        "Department",
        "District",
        "Taluk",
        "Venue / Institution Name",
        "Computers Available",
        "Connectivity & Power Backup Details",
        "Coordinating Officer",
        "Contact Phone",
        "Official Email"
      ];
      examSheet.appendRow(examHeaders);
      var examHeaderRange = examSheet.getRange(1, 1, 1, examHeaders.length);
      examHeaderRange.setFontWeight("bold");
      examHeaderRange.setBackground("#0e5774");
      examHeaderRange.setFontColor("#ffffff");
      examSheet.setFrozenRows(1);
    }

    var examRowsToAppend = [];
    if (data.allocations && Array.isArray(data.allocations)) {
      for (var j = 0; j < data.allocations.length; j++) {
        var alloc = data.allocations[j];
        var dist = alloc.districtOrZoneName || alloc.district || "-";
        var tlk = alloc.talukName || alloc.taluk || "-";
        var venue = alloc.venueName || alloc.venue || "-";
        var pcs = Number(alloc.numberOfComputers) || alloc.numberOfComputers || 0;
        var conn = alloc.connectivityDetails || "-";
        var off = alloc.coordinatingOfficer || alloc.officer || "-";
        var ph = alloc.contactPhone || alloc.phone || "-";
        var em = alloc.email || "-";

        examRowsToAppend.push([
          submissionId,
          formattedTimestamp,
          department,
          dist,
          tlk,
          venue,
          pcs,
          conn,
          off,
          ph !== "-" ? "'" + ph : "-",
          em
        ]);
      }
    }

    for (var r = 0; r < examRowsToAppend.length; r++) {
      examSheet.appendRow(examRowsToAppend[r]);
    }

    lock.releaseLock();
    return createJsonResponse({
      status: "success",
      sheetName: examSheet.getName(),
      rowsAppended: examRowsToAppend.length,
      submissionId: submissionId,
      timestamp: formattedTimestamp
    });
  } catch (error) {
    if (lock) {
      try {
        lock.releaseLock();
      } catch (e) {}
    }
    return createJsonResponse({
      status: "error",
      message: error.toString() || "Unexpected error while recording submission."
    });
  }
}

function doGet(e) {
  return createJsonResponse({
    status: "active",
    service: "Indiaskills Kerala 2026-27 Backend",
    timestamp: new Date().toISOString()
  });
}

function createJsonResponse(dataObject) {
  return ContentService.createTextOutput(JSON.stringify(dataObject)).setMimeType(
    ContentService.MimeType.JSON
  );
}
