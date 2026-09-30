import React, { useState } from 'react';
import { 
  FileCode, 
  Copy, 
  Check, 
  Download, 
  Table 
} from 'lucide-react';

interface CodeViewerModalProps {
  onConfigureClick: () => void;
}

export const CodeViewerModal: React.FC<CodeViewerModalProps> = ({
  onConfigureClick
}) => {
  const [activeCodeTab, setActiveCodeTab] = useState<'codegs' | 'guide'>('codegs');
  const [copiedScript, setCopiedScript] = useState(false);

  // Exact Multi-Stage Google Apps Script Code
  const gasCode = `/**
 * Google Apps Script (GAS) Backend
 * Multi-Stage Institutional Competition Planning Portal - DTE & ITD
 * Supports:
 * - Stage 1: Screening Level (Per Skill or Pooled Venues)
 * - Stage 2: District Level (Per Skill or Pooled Venues)
 * - Stage 3: Zonal Level (Per Skill or Pooled Venues)
 * Target Sheet Columns:
 * [Timestamp, Department, Competition Stage, Skill(s) Catered, District/Zone, Question Paper, Venue/Institution, Coordinating Officer, Contact Phone, Email, Estimated Amount]
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000); // 30s timeout for atomic writes under concurrency
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
      return createJsonResponse({
        status: "error",
        message: "No data payload received in request."
      });
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getActiveSheet();

    // Auto-create standard header row if sheet is fresh/empty
    if (sheet.getLastRow() === 0) {
      var headers = [
        "Timestamp",
        "Department",
        "Competition Stage",
        "Skill(s) Catered",
        "District/Zone",
        "Question Paper",
        "Venue/Institution",
        "Coordinating Officer",
        "Contact Phone",
        "Email",
        "Estimated Amount"
      ];
      sheet.appendRow(headers);
      var headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setFontWeight("bold");
      headerRange.setBackground("#1e293b"); // Slate 800
      headerRange.setFontColor("#ffffff");
      sheet.setFrozenRows(1);
    }

    var timestamp = new Date();
    var formattedTimestamp = Utilities.formatDate(
      timestamp, 
      ss.getSpreadsheetTimeZone() || "GMT+5:30", 
      "yyyy-MM-dd HH:mm:ss"
    );

    var rowsToAppend = [];
    var department = data.department || "";

    // Multi-stage allocation array handler
    if (data.allocations && Array.isArray(data.allocations) && data.allocations.length > 0) {
      for (var i = 0; i < data.allocations.length; i++) {
        var alloc = data.allocations[i];
        var skillsCatered = Array.isArray(alloc.skills) ? alloc.skills.join(", ") : (alloc.skills || "");
        var stageName = alloc.stageLabel || alloc.stage || "Screening Level";
        var districtOrZone = alloc.districtOrZoneName || alloc.districtOrZone || "-";
        var qp = alloc.questionPaper || data.defaultQuestionPaper || "-";
        var venue = alloc.venueName || alloc.venue || "";
        var officer = alloc.coordinatingOfficer || alloc.officer || "";
        var phone = alloc.contactPhone || alloc.phone || "";
        var email = alloc.email || "";
        var amount = Number(alloc.estimatedAmount) || 0;

        rowsToAppend.push([
          formattedTimestamp,
          department,
          stageName,
          skillsCatered,
          districtOrZone,
          qp,
          venue,
          officer,
          "'" + phone, // Apostrophe prevents dropping leading zeros
          email,
          amount
        ]);
      }
    } else {
      // Fallback single row handler
      var singleQp = data.questionPaper || data["Question Paper"] || "";
      var singleTrade = data.trade || data.tradeSelected || data["Trade Selected"] || "";
      var singleVenue = data.venue || data.institutionName || data["Venue/Institution"] || "";
      var singleOfficer = data.coordinatingOfficer || data.nodalOfficer || data["Coordinating Officer"] || "";
      var singlePhone = data.contactPhone || data.phone || data["Contact Phone"] || "";
      var singleEmail = data.email || data.officialEmail || data["Email"] || "";
      var singleAmount = Number(data.estimatedAmount || data.cost || 0);

      rowsToAppend.push([
        formattedTimestamp,
        department,
        "Screening Level",
        singleTrade,
        "-",
        singleQp,
        singleVenue,
        singleOfficer,
        "'" + singlePhone,
        singleEmail,
        singleAmount
      ]);
    }

    if (rowsToAppend.length === 0) {
      return createJsonResponse({
        status: "error",
        message: "No valid venue allocations found to append."
      });
    }

    // Append rows
    for (var r = 0; r < rowsToAppend.length; r++) {
      sheet.appendRow(rowsToAppend[r]);
      var currLastRow = sheet.getLastRow();
      sheet.getRange(currLastRow, 11).setNumberFormat("#,##0.00");
    }

    lock.releaseLock();

    return createJsonResponse({
      status: "success",
      message: rowsToAppend.length + " allocation rows successfully appended to Google Sheet.",
      rowsAppended: rowsToAppend.length,
      lastRow: sheet.getLastRow(),
      timestamp: formattedTimestamp
    });
  } catch (error) {
    if (lock) {
      try { lock.releaseLock(); } catch (e) {}
    }
    return createJsonResponse({
      status: "error",
      message: error.toString() || "Unexpected error while appending data."
    });
  }
}

function doGet(e) {
  return createJsonResponse({
    status: "active",
    service: "DTE & ITD Multi-Stage Institutional Planning Backend",
    timestamp: new Date().toISOString(),
    sheetName: SpreadsheetApp.getActiveSpreadsheet().getName(),
    columns: [
      "Timestamp",
      "Department",
      "Competition Stage",
      "Skill(s) Catered",
      "District/Zone",
      "Question Paper",
      "Venue/Institution",
      "Coordinating Officer",
      "Contact Phone",
      "Email",
      "Estimated Amount"
    ]
  });
}

function createJsonResponse(dataObject) {
  return ContentService.createTextOutput(JSON.stringify(dataObject))
    .setMimeType(ContentService.MimeType.JSON);
}`;

  const handleCopyScript = () => {
    navigator.clipboard.writeText(gasCode);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  const handleDownloadScript = () => {
    const blob = new Blob([gasCode], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Code.gs';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      
      {/* Title Card */}
      <div className="bg-white border border-stone-200 rounded-xl p-6 sm:p-7 shadow-xs mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1">
              <span>Google Apps Script Infrastructure</span>
              <span aria-hidden="true">•</span>
              <span>Multi-Stage Backend & Sync</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-serif-inst font-semibold text-stone-900">
              Multi-Stage Deliverables & Google Sheets Integration
            </h2>
            <p className="text-xs text-stone-600 mt-1 max-w-2xl">
              Copy-paste-ready <code className="font-mono-num text-stone-800 bg-stone-100 px-1 py-0.5 rounded">Code.gs</code> backend supporting Screening, District, and Zonal venue allocations with multi-skill pooling.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyScript}
              className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-2 shadow-xs"
            >
              {copiedScript ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Code.gs Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Code.gs</span>
                </>
              )}
            </button>
            <button
              onClick={handleDownloadScript}
              className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-2 mt-6 border-b border-stone-200 pb-2">
          <button
            onClick={() => setActiveCodeTab('codegs')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeCodeTab === 'codegs'
                ? 'bg-stone-900 text-white'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            Code.gs (Backend)
          </button>
          <button
            onClick={() => setActiveCodeTab('guide')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeCodeTab === 'guide'
                ? 'bg-stone-900 text-white'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            Setup Guide & Sheet Columns (12 Columns)
          </button>
        </div>
      </div>

      {/* Tab: Code.gs */}
      {activeCodeTab === 'codegs' && (
        <div className="bg-stone-900 text-stone-100 rounded-xl overflow-hidden border border-stone-800 shadow-md">
          <div className="flex items-center justify-between px-4 py-2.5 bg-stone-950 border-b border-stone-800 text-xs text-stone-400">
            <span className="font-mono-num flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              Code.gs
            </span>
            <div className="flex items-center gap-3">
              <span>Google Apps Script (V8 Runtime)</span>
              <button
                onClick={handleCopyScript}
                className="text-stone-300 hover:text-white flex items-center gap-1 text-[11px] underline"
              >
                {copiedScript ? 'Copied!' : 'Copy Code'}
              </button>
            </div>
          </div>
          <pre className="p-4 sm:p-6 text-xs font-mono-num leading-relaxed overflow-x-auto max-h-[560px] text-stone-200">
            {gasCode}
          </pre>
        </div>
      )}

      {/* Tab: Step by Step Deployment Guide */}
      {activeCodeTab === 'guide' && (
        <div className="space-y-6">
          
          {/* Target Sheet Columns Specification */}
          <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-xs">
            <div className="flex items-center gap-2 text-stone-900 font-semibold text-sm mb-3">
              <Table className="w-4 h-4 text-indigo-600" />
              <span>Target Google Sheet Columns (12 Standard Fields)</span>
            </div>
            <p className="text-xs text-stone-600 mb-4">
              When the Google Apps Script receives the multi-stage submission, it automatically appends rows for each stage and venue with these 12 standardized columns:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-stone-200 rounded-lg overflow-hidden">
                <thead className="bg-stone-800 text-white font-medium">
                  <tr>
                    <th className="p-2 border-r border-stone-700">1. Timestamp</th>
                    <th className="p-2 border-r border-stone-700">2. Department</th>
                    <th className="p-2 border-r border-stone-700">3. Competition Stage</th>
                    <th className="p-2 border-r border-stone-700">4. District/Zone</th>
                    <th className="p-2 border-r border-stone-700">5. Venue/Institution</th>
                    <th className="p-2 border-r border-stone-700">6. Computers Available</th>
                    <th className="p-2 border-r border-stone-700">7. Connectivity Details</th>
                    <th className="p-2 border-r border-stone-700">8. Skill(s) Catered</th>
                    <th className="p-2 border-r border-stone-700">9. Coordinating Officer</th>
                    <th className="p-2 border-r border-stone-700">10. Contact Phone</th>
                    <th className="p-2 border-r border-stone-700">11. Email</th>
                    <th className="p-2">12. Estimated Amount</th>
                  </tr>
                </thead>
                <tbody className="bg-white text-stone-800 divide-y divide-stone-200">
                  <tr className="font-semibold bg-stone-50 text-[11px]">
                    <td className="p-2 border-r border-stone-200 font-mono-num">2026-09-30 10:15</td>
                    <td className="p-2 border-r border-stone-200">DTE</td>
                    <td className="p-2 border-r border-stone-200">Screening Level (Online Exam)</td>
                    <td className="p-2 border-r border-stone-200">Thiruvananthapuram</td>
                    <td className="p-2 border-r border-stone-200">Govt Engineering College</td>
                    <td className="p-2 border-r border-stone-200 font-mono-num">120 PCs</td>
                    <td className="p-2 border-r border-stone-200">100 Mbps NKN, UPS & DG</td>
                    <td className="p-2 border-r border-stone-200">Robotics, Mechatronics</td>
                    <td className="p-2 border-r border-stone-200">Dr. Suresh V. Nair</td>
                    <td className="p-2 border-r border-stone-200">'9845012345</td>
                    <td className="p-2 border-r border-stone-200">principal@gptc.ac.in</td>
                    <td className="p-2 font-mono-num">260,000.00</td>
                  </tr>
                  <tr className="font-semibold bg-white text-[11px]">
                    <td className="p-2 border-r border-stone-200 font-mono-num">2026-09-30 10:15</td>
                    <td className="p-2 border-r border-stone-200">DTE</td>
                    <td className="p-2 border-r border-stone-200">District Level</td>
                    <td className="p-2 border-r border-stone-200">Ernakulam</td>
                    <td className="p-2 border-r border-stone-200">Maharajas Tech Inst</td>
                    <td className="p-2 border-r border-stone-200">-</td>
                    <td className="p-2 border-r border-stone-200">-</td>
                    <td className="p-2 border-r border-stone-200">Robotics, Mechatronics</td>
                    <td className="p-2 border-r border-stone-200">Prof. K. R. Namboodiri</td>
                    <td className="p-2 border-r border-stone-200">'9447123456</td>
                    <td className="p-2 border-r border-stone-200">hod.mech@mti.edu.in</td>
                    <td className="p-2 font-mono-num">240,000.00</td>
                  </tr>
                  <tr className="font-semibold bg-stone-50 text-[11px]">
                    <td className="p-2 border-r border-stone-200 font-mono-num">2026-09-30 10:15</td>
                    <td className="p-2 border-r border-stone-200">DTE</td>
                    <td className="p-2 border-r border-stone-200">Zonal Level</td>
                    <td className="p-2 border-r border-stone-200">Central Zone</td>
                    <td className="p-2 border-r border-stone-200">Apex Technical Centre</td>
                    <td className="p-2 border-r border-stone-200">-</td>
                    <td className="p-2 border-r border-stone-200">-</td>
                    <td className="p-2 border-r border-stone-200">Robotics, Mechatronics</td>
                    <td className="p-2 border-r border-stone-200">Er. Mathew Jacob</td>
                    <td className="p-2 border-r border-stone-200">'9895112233</td>
                    <td className="p-2 border-r border-stone-200">jd.exams@dte.gov.in</td>
                    <td className="p-2 font-mono-num">280,000.00</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Setup Checklist */}
          <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-stone-900">
              Deployment Checklist:
            </h3>
            <ol className="space-y-2 text-xs text-stone-600 list-decimal list-inside leading-relaxed">
              <li>Open your Google Sheet and click <strong>Extensions &gt; Apps Script</strong>.</li>
              <li>Replace existing code with the complete <strong>Code.gs</strong> script above and click <strong>Save</strong>.</li>
              <li>Click <strong>Deploy &gt; New deployment</strong>, select <strong>Web app</strong>.</li>
              <li>Set <em>Execute as:</em> <strong>Me</strong> and <em>Who has access:</em> <strong>Anyone</strong>.</li>
              <li>Copy the Web App URL and click <strong>Configure Endpoint Now</strong> below to paste it.</li>
            </ol>
            <div className="pt-2">
              <button
                onClick={onConfigureClick}
                className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-lg"
              >
                Configure Endpoint URL
              </button>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
