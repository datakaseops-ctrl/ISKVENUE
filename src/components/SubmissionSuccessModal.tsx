import React from 'react';
import { 
  CheckCircle2, 
  Printer, 
  Copy, 
  Check
} from 'lucide-react';
import { SubmissionRecord } from '../types';
import { formatIndianCurrency, numberToIndianWords } from '../utils/numberToWords';

interface SubmissionSuccessModalProps {
  record: SubmissionRecord | null;
  onClose: () => void;
  onViewLedger: () => void;
}

export const SubmissionSuccessModal: React.FC<SubmissionSuccessModalProps> = ({
  record,
  onClose,
  onViewLedger
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!record) return null;

  const handleCopySummary = () => {
    const summary = `INSTITUTIONAL ONLINE EXAM CENTER SUBMISSION
Reference ID: ${record.id}
Timestamp: ${new Date(record.timestamp).toLocaleString('en-IN')}
Department: ${record.department}
Selected Trades (${record.selectedTradesCount}): ${record.selectedTrades.join(', ')}
District Exam Centers Allotted: ${record.screeningVenuesCount}
Total Computers Available: ${record.totalComputersAvailable} PCs
Total Estimated Budget: ${formatIndianCurrency(record.totalEstimatedAmount)}
Status: Officially Recorded (${record.allocations.length} venue allocation rows)`;

    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-stone-200 overflow-hidden my-8">
        
        {/* Receipt Header Banner */}
        <div className="bg-stone-900 text-white p-6 sm:p-7 relative border-b border-stone-800">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-emerald-950 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-800">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-400 block">
                Official Submission Acknowledgment
              </span>
              <h3 className="text-xl font-serif-inst font-semibold">
                District Online Exam Centers Recorded
              </h3>
            </div>
          </div>
          <p className="text-xs text-stone-300 mt-1">
            All {record.allocations.length} district exam center allocation(s) have been officially submitted and recorded.
          </p>
        </div>

        {/* Printable Formal Slip Content */}
        <div className="p-6 sm:p-7 space-y-5" id="printable-receipt">
          
          {/* Metadata Grid */}
          <div className="bg-stone-50 border border-stone-200 rounded-lg p-4 space-y-2 text-xs">
            <div className="flex justify-between items-center border-b border-stone-200 pb-2">
              <span className="text-stone-500 uppercase tracking-wider text-[10px] font-bold">Reference Number</span>
              <span className="font-mono-num font-bold text-stone-900">{record.id}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-stone-500">Department:</span>
              <span className="font-semibold text-stone-900">{record.department}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-stone-500">Trades Sanctioned:</span>
              <span className="font-mono-num font-semibold text-stone-900">{record.selectedTradesCount} Skills</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-stone-500">Exam Centers & Capacity:</span>
              <span className="font-medium text-stone-800">
                {record.screeningVenuesCount} Exam Venue(s) • {record.totalComputersAvailable} Working PCs
              </span>
            </div>
          </div>

          {/* Allocations Summary List */}
          <div className="border border-stone-200 rounded-lg overflow-hidden text-xs">
            <div className="p-3 bg-stone-100 font-semibold text-stone-900 border-b border-stone-200 flex justify-between items-center">
              <span>Allotted District Exam Centers ({record.allocations.length})</span>
              <span className="text-[11px] font-normal text-stone-500">Online Screening Infrastructure</span>
            </div>
            <div className="divide-y divide-stone-100 max-h-56 overflow-y-auto">
              {record.allocations.map((alloc, idx) => (
                <div key={idx} className="p-3 flex items-start justify-between gap-3 hover:bg-stone-50">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-stone-900">
                        District: {alloc.districtOrZoneName || '-'}
                      </span>
                      <span className="text-indigo-700 font-mono-num font-semibold">
                        ({alloc.numberOfComputers || 0} PCs)
                      </span>
                    </div>
                    <div className="text-stone-700 mt-0.5 font-medium">
                      {alloc.venueName} • <span className="text-stone-500 font-normal">{alloc.coordinatingOfficer}</span>
                    </div>
                    {alloc.connectivityDetails && (
                      <div className="text-[11px] text-stone-500 mt-0.5">
                        Connectivity: {alloc.connectivityDetails}
                      </div>
                    )}
                    <div className="text-[11px] text-stone-500 mt-0.5">
                      Skills: {alloc.skills.join(', ')}
                    </div>
                  </div>
                  <div className="text-right font-mono-num font-semibold text-stone-900 whitespace-nowrap">
                    {formatIndianCurrency(Number(alloc.estimatedAmount))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cumulative Financial Box */}
          <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-lg flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-900 block">
                Total Estimated Execution Budget
              </span>
              <span className="text-xs font-serif-inst italic text-emerald-800">
                {numberToIndianWords(record.totalEstimatedAmount)}
              </span>
            </div>
            <div className="text-right font-mono-num text-xl font-bold text-emerald-950">
              {formatIndianCurrency(record.totalEstimatedAmount)}
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-5 bg-stone-50 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleCopySummary}
              className="flex-1 sm:flex-initial px-3 py-2 border border-stone-300 hover:bg-white text-stone-700 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Summary'}</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="flex-1 sm:flex-initial px-3 py-2 border border-stone-300 hover:bg-white text-stone-700 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Slip</span>
            </button>
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-medium rounded-lg transition-colors text-center shadow-xs"
            >
              Submit Another Plan
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
