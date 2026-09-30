/**
 * Google Apps Script (Code.gs) Backend
 * DTE & ITD Institutional Competition Planning Portal (District & Taluk Online Exam Centers)
 *
 * HOW TO DEPLOY THIS SCRIPT IN YOUR GOOGLE SHEET:
 * 1. Open your editable Google Sheet in Google Drive.
 * 2. Click Extensions > Apps Script.
 * 3. Replace all code in Code.gs with this script and click Save.
 * 4. Click Deploy > New deployment > Select type: "Web app".
 *    - Execute as: "Me"
 *    - Who has access: "Anyone"
 * 5. Copy the Web App URL (ending in /exec) and set it as VITE_GAS_WEB_APP_URL in Vercel
 *    (or paste it into BACKEND_WEB_APP_URL in src/components/MultiStepPlanningForm.tsx).
 *
 * Target Sheet Columns (14 Columns):
 * [Submission ID, Timestamp, Department, Competition Stage, District, Taluk, Venue / Institution Name, Computers Available, Connectivity & Power Backup Details, Skill(s) Catered, Coordinating Officer, Contact Phone, Official Email, Estimated Amount (INR)]
 */

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
    var sheet = ss.getActiveSheet();

    // Auto-initialize header row if the sheet is empty
    if (sheet.getLastRow() === 0) {
      var headers = [
        "Submission ID",
        "Timestamp",
        "Department",
        "Competition Stage",
        "District",
        "Taluk",
        "Venue / Institution Name",
        "Computers Available",
        "Connectivity & Power Backup Details",
        "Skill(s) Catered",
        "Coordinating Officer",
        "Contact Phone",
        "Official Email",
        "Estimated Amount (INR)"
      ];
      sheet.appendRow(headers);
      var headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setFontWeight("bold");
      headerRange.setBackground("#1c1917"); // Stone 900
      headerRange.setFontColor("#ffffff");
      sheet.setFrozenRows(1);
    }

    var timestamp = new Date();
    var formattedTimestamp = Utilities.formatDate(
      timestamp,
      ss.getSpreadsheetTimeZone() || "GMT+5:30",
      "yyyy-MM-dd HH:mm:ss"
    );

    var submissionId = data.submissionId || ("DTE-ITD-" + new Date().getTime());
    var department = data.department || "";
    var rowsToAppend = [];

    if (data.allocations && Array.isArray(data.allocations) && data.allocations.length > 0) {
      for (var i = 0; i < data.allocations.length; i++) {
        var alloc = data.allocations[i];
        var skillsCatered = Array.isArray(alloc.skills)
          ? alloc.skills.join(", ")
          : (alloc.skills || (Array.isArray(data.selectedTrades) ? data.selectedTrades.join(", ") : ""));
        var stageName = alloc.stageLabel || "Screening Level (Online Exam)";
        var district = alloc.districtOrZoneName || alloc.district || "-";
        var taluk = alloc.talukName || alloc.taluk || "-";
        var venue = alloc.venueName || alloc.venue || "";
        var computers = Number(alloc.numberOfComputers) || alloc.numberOfComputers || 0;
        var connectivity = alloc.connectivityDetails || "-";
        var officer = alloc.coordinatingOfficer || alloc.officer || "";
        var phone = alloc.contactPhone || alloc.phone || "";
        var email = alloc.email || "";
        var amount = Number(alloc.estimatedAmount) || 0;

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
          "'" + phone, // Apostrophe preserves 10-digit phone formatting
          email,
          amount
        ]);
      }
    }

    if (rowsToAppend.length === 0) {
      lock.releaseLock();
      return createJsonResponse({
        status: "error",
        message: "No valid district exam center allocations found in payload."
      });
    }

    for (var r = 0; r < rowsToAppend.length; r++) {
      sheet.appendRow(rowsToAppend[r]);
      var currLastRow = sheet.getLastRow();
      sheet.getRange(currLastRow, 14).setNumberFormat("#,##0.00");
    }

    lock.releaseLock();

    return createJsonResponse({
      status: "success",
      message: rowsToAppend.length + " row(s) recorded.",
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
    service: "DTE & ITD Institutional Planning Backend",
    timestamp: new Date().toISOString()
  });
}

function createJsonResponse(dataObject) {
  return ContentService.createTextOutput(JSON.stringify(dataObject))
    .setMimeType(ContentService.MimeType.JSON);
}
