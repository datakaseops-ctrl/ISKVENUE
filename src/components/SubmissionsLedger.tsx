import React, { useState } from 'react';
import { 
  Search, 
  Download, 
  Trash2, 
  FileSpreadsheet, 
  CheckCircle2, 
  Building2, 
  Phone, 
  Mail, 
  FileCheck2,
  ChevronDown,
  ChevronUp,
  Layers
} from 'lucide-react';
import { SubmissionRecord } from '../types';
import { formatIndianCurrency } from '../utils/numberToWords';

interface SubmissionsLedgerProps {
  submissions: SubmissionRecord[];
  onClearSubmissions: () => void;
  onNavigateToForm: () => void;
  gasUrl: string;
}

export const SubmissionsLedger: React.FC<SubmissionsLedgerProps> = ({
  submissions,
  onClearSubmissions,
  onNavigateToForm,
  gasUrl
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState<'all' | 'DTE' | 'ITD'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  // Filter submissions
  const filteredSubmissions = submissions.filter(item => {
    const matchesSearch = 
      (item.department && item.department.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.selectedTrades && item.selectedTrades.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))) ||
      (item.allocations && item.allocations.some(a => 
        (a.venueName && a.venueName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (a.coordinatingOfficer && a.coordinatingOfficer.toLowerCase().includes(searchTerm.toLowerCase()))
      ));

    const matchesDept = 
      deptFilter === 'all' || 
      (deptFilter === 'DTE' && item.department.includes('DTE')) ||
      (deptFilter === 'ITD' && item.department.includes('ITD'));

    return matchesSearch && matchesDept;
  });

  // Calculate totals
  const totalCumulativeBudget = filteredSubmissions.reduce(
    (acc, curr) => acc + (curr.totalEstimatedAmount || 0), 
    0
  );

  // CSV Export for all tiers
  const handleExportCSV = () => {
    if (submissions.length === 0) return;

    const headers = [
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
      "Estimated Amount",
      "Google Sheet Synced"
    ];

    const rows: string[][] = [];
    submissions.forEach(sub => {
      const timeStr = `"${new Date(sub.timestamp).toISOString()}"`;
      const deptStr = `"${(sub.department || '').replace(/"/g, '""')}"`;
      const syncStr = sub.syncedToGoogleSheet ? "Yes" : "No";

      if (sub.allocations && sub.allocations.length > 0) {
        sub.allocations.forEach(a => {
          rows.push([
            timeStr,
            deptStr,
            `"${a.stageLabel || a.stage}"`,
            `"${(a.skills || []).join(', ').replace(/"/g, '""')}"`,
            `"${(a.districtOrZoneName || '-').replace(/"/g, '""')}"`,
            `"${(a.questionPaper || '-').replace(/"/g, '""')}"`,
            `"${(a.venueName || '').replace(/"/g, '""')}"`,
            `"${(a.coordinatingOfficer || '').replace(/"/g, '""')}"`,
            `"'${a.contactPhone || ''}"`,
            `"${a.email || ''}"`,
            String(a.estimatedAmount || 0),
            syncStr
          ]);
        });
      }
    });

    const csvContent = "data:text/csv;charset=utf-8," + [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `DTE_ITD_MultiStage_Planning_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      
      {/* Overview Metric Banner */}
      <div className="bg-white border border-stone-200 rounded-xl p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-stone-200 pb-5 mb-5 gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1">
              <span>Audit Ledger</span>
              <span aria-hidden="true">•</span>
              <span>Multi-Stage Submissions Log</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-serif-inst font-semibold text-stone-900">
              Institutional Planning Ledger
            </h2>
            <p className="text-xs text-stone-600 mt-1">
              Consolidated registry of multi-stage trade allocations across Screening, District, and Zonal tiers.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={handleExportCSV}
              disabled={submissions.length === 0}
              className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 disabled:opacity-40 text-stone-800 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Full CSV</span>
            </button>
            <button
              type="button"
              onClick={onNavigateToForm}
              className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-medium rounded-lg transition-colors shadow-xs"
            >
              + New Multi-Stage Plan
            </button>
          </div>
        </div>

        {/* Aggregate Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-3.5 bg-stone-50 rounded-lg border border-stone-200">
            <span className="text-stone-500 block text-[11px]">Total Plans Recorded</span>
            <span className="font-mono-num text-lg font-bold text-stone-900 mt-0.5 block">
              {submissions.length}
            </span>
          </div>
          <div className="p-3.5 bg-stone-50 rounded-lg border border-stone-200">
            <span className="text-stone-500 block text-[11px]">Grand Cumulative Budget</span>
            <span className="font-mono-num text-lg font-bold text-emerald-800 mt-0.5 block">
              {formatIndianCurrency(totalCumulativeBudget)}
            </span>
          </div>
          <div className="p-3.5 bg-stone-50 rounded-lg border border-stone-200">
            <span className="text-stone-500 block text-[11px]">DTE Plans</span>
            <span className="font-mono-num text-lg font-bold text-stone-900 mt-0.5 block">
              {submissions.filter(s => s.department.includes('DTE')).length}
            </span>
          </div>
          <div className="p-3.5 bg-stone-50 rounded-lg border border-stone-200">
            <span className="text-stone-500 block text-[11px]">ITD Plans</span>
            <span className="font-mono-num text-lg font-bold text-stone-900 mt-0.5 block">
              {submissions.filter(s => s.department.includes('ITD')).length}
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search department, trade, or venue..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-stone-300 rounded-lg outline-none focus:border-stone-900"
          />
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-end">
          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-lg text-xs">
            <button
              onClick={() => setDeptFilter('all')}
              className={`px-3 py-1 rounded font-medium transition-colors ${
                deptFilter === 'all' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setDeptFilter('DTE')}
              className={`px-3 py-1 rounded font-medium transition-colors ${
                deptFilter === 'DTE' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              DTE
            </button>
            <button
              onClick={() => setDeptFilter('ITD')}
              className={`px-3 py-1 rounded font-medium transition-colors ${
                deptFilter === 'ITD' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              ITD
            </button>
          </div>

          {submissions.length > 0 && (
            confirmClear ? (
              <div className="flex items-center gap-1 text-xs">
                <button
                  onClick={() => {
                    onClearSubmissions();
                    setConfirmClear(false);
                  }}
                  className="px-2 py-1 bg-rose-600 text-white rounded font-medium"
                >
                  Confirm Clear
                </button>
                <button
                  onClick={() => setConfirmClear(false)}
                  className="px-2 py-1 bg-stone-200 text-stone-700 rounded"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmClear(true)}
                title="Clear Local Ledger"
                className="p-2 text-stone-400 hover:text-rose-600 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )
          )}
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-xs">
        {filteredSubmissions.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
              <FileCheck2 className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-stone-800">No multi-stage proposals found</h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              Complete the multi-step planning form to configure Screening, District, and Zonal allocations.
            </p>
            <button
              onClick={onNavigateToForm}
              className="mt-2 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-medium rounded-lg inline-block"
            >
              Open Planning Form
            </button>
          </div>
        ) : (
          <div className="divide-y divide-stone-200 text-xs">
            {filteredSubmissions.map((sub) => {
              const isExpanded = expandedId === sub.id;
              return (
                <div key={sub.id} className="p-4 sm:p-5 hover:bg-stone-50/50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono-num font-bold text-stone-900 text-xs">
                          {sub.id}
                        </span>
                        <span className="text-stone-300">•</span>
                        <span className="font-semibold text-stone-800">
                          {sub.department}
                        </span>
                        <span className="text-stone-300">•</span>
                        <span className="text-stone-500 font-mono-num text-[11px]">
                          {new Date(sub.timestamp).toLocaleDateString('en-IN', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>

                      <div className="text-stone-600 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                        <span>Trades: <strong className="font-mono-num text-stone-900">{sub.selectedTradesCount} Skills</strong></span>
                        <span>Screening: <strong className="font-mono-num text-stone-900">{sub.screeningVenuesCount} Venues</strong></span>
                        <span>District: <strong className="font-mono-num text-stone-900">{sub.districtVenuesCount} Venues</strong></span>
                        <span>Zonal: <strong className="font-mono-num text-stone-900">{sub.zonalVenuesCount} Venues</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 self-end sm:self-auto">
                      <div className="text-right">
                        <span className="font-mono-num font-bold text-base text-stone-900 block">
                          {formatIndianCurrency(sub.totalEstimatedAmount)}
                        </span>
                        <span className="text-[10px] text-stone-500 uppercase tracking-wider">
                          Combined Budget
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setExpandedId(isExpanded ? null : sub.id)}
                        className="px-2.5 py-1.5 border border-stone-200 hover:bg-white text-stone-700 text-xs font-medium rounded-lg flex items-center gap-1 transition-colors"
                      >
                        <span>{isExpanded ? 'Hide' : 'Details'}</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                  </div>

                  {/* Expanded Allocation Rows */}
                  {isExpanded && sub.allocations && (
                    <div className="mt-4 pt-4 border-t border-stone-200 space-y-2">
                      <span className="font-semibold text-stone-800 text-[11px] uppercase tracking-wider block">
                        Venue Allocation Breakdown Across 3 Tiers:
                      </span>
                      <div className="border border-stone-200 rounded-lg overflow-hidden bg-white">
                        <table className="w-full text-left text-[11px]">
                          <thead className="bg-stone-100 text-stone-700 font-semibold border-b border-stone-200">
                            <tr>
                              <th className="p-2.5">Tier / Jurisdiction</th>
                              <th className="p-2.5">Skills Catered</th>
                              <th className="p-2.5">Venue & Officer</th>
                              <th className="p-2.5">Contact</th>
                              <th className="p-2.5 text-right">Budget</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-stone-100 text-stone-700">
                            {sub.allocations.map((a, i) => (
                              <tr key={i} className="hover:bg-stone-50">
                                <td className="p-2.5 align-top">
                                  <span className="font-semibold text-stone-900 block">{a.stageLabel}</span>
                                  {a.districtOrZoneName && a.districtOrZoneName !== '-' && (
                                    <span className="text-stone-500 block">{a.districtOrZoneName}</span>
                                  )}
                                </td>
                                <td className="p-2.5 align-top max-w-xs truncate">
                                  {a.skills.join(', ')}
                                </td>
                                <td className="p-2.5 align-top">
                                  <div className="font-medium text-stone-900">{a.venueName}</div>
                                  <div className="text-stone-500 text-[10px]">{a.coordinatingOfficer}</div>
                                </td>
                                <td className="p-2.5 align-top font-mono-num text-[10px]">
                                  +91 {a.contactPhone}
                                </td>
                                <td className="p-2.5 align-top text-right font-mono-num font-semibold text-stone-900">
                                  {formatIndianCurrency(Number(a.estimatedAmount))}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
