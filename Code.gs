/**
 * Google Apps Script (Code.gs) Backend
 * Indiaskills Kerala 2026-27 — DTE & ITD Institutional Portal
 * Populates submissions directly into "Sheet2"
 *
 * HOW TO UPDATE YOUR EXISTING DEPLOYMENT (KEEPS THE SAME URL):
 * 1. Open your Google Sheet -> Extensions > Apps Script.
 * 2. Replace all code in Code.gs with this script and click Save (Ctrl+S).
 * 3. Click Deploy > Manage deployments.
 * 4. Click the Pencil (Edit) icon -> Under "Version", select "New version" -> Click Deploy.
 */

var TARGET_SHEET_NAME = "Sheet2";

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000); // 30s atomic write lock for concurrent submissions
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
    var sheetName = data.sheetName || data.targetSheet || TARGET_SHEET_NAME;
    var sheet = ss.getSheetByName(sheetName);

    // Automatically create "Sheet2" if it does not exist yet
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }

    // Auto-initialize header row on Sheet2 if it is empty
    if (sheet.getLastRow() === 0) {
      var headers = [
        "Submission ID",
        "Timestamp",
        "Department",
        "Module / Stage",
        "District / Levels",
        "Taluk",
        "Venue / Institution Name",
        "Computers Available",
        "Connectivity & Power Backup Details",
        "Skill(s) Catered",
        "Coordinating Officer",
        "Contact Phone",
        "Official Email"
      ];
      sheet.appendRow(headers);
      var headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setFontWeight("bold");
      headerRange.setBackground("#0e5774");
      headerRange.setFontColor("#ffffff");
      sheet.setFrozenRows(1);
    }

    var timestamp = new Date();
    var formattedTimestamp = Utilities.formatDate(
      timestamp,
      ss.getSpreadsheetTimeZone() || "GMT+5:30",
      "yyyy-MM-dd HH:mm:ss"
    );

    var submissionId = data.submissionId || ("ISK-" + new Date().getTime());
    var department = data.department || "";
    var rowsToAppend = [];

    if (data.allocations && Array.isArray(data.allocations) && data.allocations.length > 0) {
      for (var i = 0; i < data.allocations.length; i++) {
        var alloc = data.allocations[i];
        var skillsCatered = Array.isArray(alloc.skills)
          ? alloc.skills.join(", ")
          : (alloc.skills || (Array.isArray(data.selectedTrades) ? data.selectedTrades.join(", ") : "-"));
        var stageName = alloc.stageLabel || "Screening Level (Online Exam)";
        var district = alloc.districtOrZoneName || alloc.district || "-";
        var taluk = alloc.talukName || alloc.taluk || "-";
        var venue = alloc.venueName || alloc.venue || "-";
        var computers = Number(alloc.numberOfComputers) || alloc.numberOfComputers || 0;
        var connectivity = alloc.connectivityDetails || "-";
        var officer = alloc.coordinatingOfficer || alloc.officer || "-";
        var phone = alloc.contactPhone || alloc.phone || "-";
        var email = alloc.email || "-";

        rowsToAppend.push([
          submissionId,
          formattedTimestamp,
          department,
          stageName,
          district,
          taluk,
          venue,
          computers,
          connectivity,
          skillsCatered,
          officer,
          phone !== "-" ? ("'" + phone) : "-",
          email
        ]);
      }
    }

    if (rowsToAppend.length === 0) {
      lock.releaseLock();
      return createJsonResponse({
        status: "error",
        message: "No valid allocation rows found in payload."
      });
    }

    for (var r = 0; r < rowsToAppend.length; r++) {
      sheet.appendRow(rowsToAppend[r]);
    }

    lock.releaseLock();

    return createJsonResponse({
      status: "success",
      sheetName: sheetName,
      message: rowsToAppend.length + " row(s) recorded to " + sheetName + ".",
      submissionId: submissionId,
      rowsAppended: rowsToAppend.length,
      timestamp: formattedTimestamp
    });
  } catch (error) {
    if (lock) {
      try { lock.releaseLock(); } catch (e) {}
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
    targetSheet: TARGET_SHEET_NAME,
    service: "Indiaskills Kerala 2026-27 Backend",
    timestamp: new Date().toISOString()
  });
}

function createJsonResponse(dataObject) {
  return ContentService.createTextOutput(JSON.stringify(dataObject))
    .setMimeType(ContentService.MimeType.JSON);
}
