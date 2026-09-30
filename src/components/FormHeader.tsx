import React from 'react';
import { 
  FileSpreadsheet, 
  FileCode, 
  ListOrdered, 
  Settings2, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

interface FormHeaderProps {
  activeTab: 'form' | 'ledger' | 'script';
  setActiveTab: (tab: 'form' | 'ledger' | 'script') => void;
  gasUrl: string;
  onOpenConfig: () => void;
  submissionsCount: number;
}

export const FormHeader: React.FC<FormHeaderProps> = ({
  activeTab,
  setActiveTab,
  gasUrl,
  onOpenConfig,
  submissionsCount
}) => {
  return (
    <header className="bg-white border-b border-stone-200 sticky top-0 z-40">
      {/* Institutional Top Bar (Single Row, 3 Zones) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Zone 1: Wordmark / Institutional Identity */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-stone-900 text-amber-400 flex items-center justify-center font-serif-inst text-base font-bold shadow-sm">
              <svg className="w-5 h-5 text-amber-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <div>
              <span className="text-base font-bold text-stone-900 tracking-tight block">
                DTE & ITD Institutional Planning
              </span>
              <span className="text-[11px] text-stone-500 block -mt-0.5">
                Technical Education & Vocational Training Authorities
              </span>
            </div>
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => setActiveTab('form')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeTab === 'form' 
                  ? 'bg-stone-100 text-stone-900 font-semibold' 
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
              }`}
            >
              Planning Form
            </button>

            <button
              onClick={() => setActiveTab('ledger')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                activeTab === 'ledger' 
                  ? 'bg-stone-100 text-stone-900 font-semibold' 
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
              }`}
            >
              <span>Submission Ledger</span>
              {submissionsCount > 0 && (
                <span className="text-[10px] bg-stone-200 text-stone-800 px-1.5 py-0.2 rounded font-mono-num">
                  {submissionsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('script')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                activeTab === 'script' 
                  ? 'bg-stone-100 text-stone-900 font-semibold' 
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
              }`}
            >
              <FileCode className="w-3.5 h-3.5 text-stone-500" />
              <span>Google Apps Script</span>
            </button>
          </nav>

          {/* Zone 3: Primary Action / Endpoint Status */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onOpenConfig}
              className={`px-3 py-1.5 text-xs rounded-lg border transition-colors flex items-center gap-2 ${
                gasUrl 
                  ? 'border-emerald-200 bg-emerald-50/60 text-emerald-800 hover:bg-emerald-100/60'
                  : 'border-stone-300 bg-stone-50 text-stone-700 hover:bg-stone-100'
              }`}
            >
              {gasUrl ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="font-medium hidden sm:inline">Google Sheet Connected</span>
                  <span className="font-medium sm:hidden">GAS Active</span>
                </>
              ) : (
                <>
                  <Settings2 className="w-3.5 h-3.5 text-stone-500" />
                  <span className="font-medium hidden sm:inline">Configure Web App URL</span>
                  <span className="font-medium sm:hidden">Setup GAS</span>
                </>
              )}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Secondary Navigation Row */}
      <div className="md:hidden border-t border-stone-100 px-4 py-2 flex items-center justify-around bg-stone-50/50">
        <button
          onClick={() => setActiveTab('form')}
          className={`text-xs py-1 px-2.5 rounded ${activeTab === 'form' ? 'font-bold text-stone-900 bg-white shadow-xs' : 'text-stone-600'}`}
        >
          Form
        </button>
        <button
          onClick={() => setActiveTab('ledger')}
          className={`text-xs py-1 px-2.5 rounded flex items-center gap-1 ${activeTab === 'ledger' ? 'font-bold text-stone-900 bg-white shadow-xs' : 'text-stone-600'}`}
        >
          <span>Ledger ({submissionsCount})</span>
        </button>
        <button
          onClick={() => setActiveTab('script')}
          className={`text-xs py-1 px-2.5 rounded ${activeTab === 'script' ? 'font-bold text-stone-900 bg-white shadow-xs' : 'text-stone-600'}`}
        >
          Code.gs
        </button>
      </div>
    </header>
  );
};
