import React, { useState } from 'react';
import { 
  X, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  FileSpreadsheet, 
  KeyRound, 
  HelpCircle 
} from 'lucide-react';

interface GasConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  gasUrl: string;
  onSaveUrl: (url: string) => void;
}

export const GasConfigModal: React.FC<GasConfigModalProps> = ({
  isOpen,
  onClose,
  gasUrl,
  onSaveUrl
}) => {
  const [urlInput, setUrlInput] = useState(gasUrl);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    status: 'success' | 'error' | 'idle';
    message?: string;
    details?: any;
  }>({ status: 'idle' });

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveUrl(urlInput.trim());
    onClose();
  };

  const handleTestConnection = async () => {
    if (!urlInput.trim()) {
      setTestResult({
        status: 'error',
        message: 'Please provide a valid Google Apps Script Web App URL first.'
      });
      return;
    }

    setIsTesting(true);
    setTestResult({ status: 'idle' });

    try {
      // Send GET request to GAS endpoint
      const response = await fetch(urlInput.trim(), {
        method: 'GET',
        mode: 'cors'
      });

      if (!response.ok) {
        throw new Error(`Endpoint returned HTTP ${response.status}: ${response.statusText}`);
      }

      const json = await response.json();
      if (json.status === 'active' || json.service) {
        setTestResult({
          status: 'success',
          message: `Connection successful! Connected to Google Sheet "${json.sheetName || 'Active Sheet'}".`
        });
      } else {
        setTestResult({
          status: 'success',
          message: 'Endpoint is responding, but unexpected response format received.'
        });
      }
    } catch (err: any) {
      console.warn("Test connection warning:", err);
      // Frequently Google Apps Script redirects or CORS restricts direct GET test in sandbox, but POST text/plain works:
      setTestResult({
        status: 'error',
        message: `Endpoint verification note: ${err.message || 'CORS or Network error'}. Note: If your Web App is deployed with 'Who has access: Anyone', form POST submissions will still function via direct payload transmission.`
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-xl w-full border border-stone-200 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-stone-200 bg-stone-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900">
                Google Apps Script Web App Endpoint
              </h3>
              <p className="text-[11px] text-stone-500">
                Direct Google Sheet Synchronization
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 p-1 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-800 mb-1">
              Google Apps Script Web App Deployment URL
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => {
                  setUrlInput(e.target.value);
                  setTestResult({ status: 'idle' });
                }}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="flex-1 px-3 py-2 text-xs font-mono-num bg-white border border-stone-300 rounded-lg outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900"
              />
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting || !urlInput.trim()}
                className="px-3 py-2 bg-stone-100 hover:bg-stone-200 disabled:opacity-50 text-stone-800 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
              >
                {isTesting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <span>Test URL</span>
                )}
              </button>
            </div>
          </div>

          {/* Test Status Banner */}
          {testResult.status === 'success' && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{testResult.message}</span>
            </div>
          )}

          {testResult.status === 'error' && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>{testResult.message}</span>
            </div>
          )}

          {/* Quick Setup Checklist */}
          <div className="p-3.5 bg-stone-50 rounded-lg border border-stone-200 text-xs space-y-2 text-stone-600">
            <span className="font-semibold text-stone-900 block text-[11px] uppercase tracking-wider">
              Deployment Prerequisites:
            </span>
            <ul className="space-y-1 text-[11px] list-disc list-inside">
              <li>Deploy as <strong className="text-stone-800">Web App</strong> from Google Apps Script.</li>
              <li>Set <em>Execute as</em> to <strong className="text-stone-800">"Me"</strong> (your account).</li>
              <li>Set <em>Who has access</em> to <strong className="text-stone-800">"Anyone"</strong> (so forms can submit directly without Google login popups).</li>
              <li>Use the URL ending in <code className="bg-stone-200/80 px-1 py-0.5 rounded text-stone-900 font-mono-num">/exec</code> (not <code className="bg-stone-200/80 px-1 py-0.5 rounded text-stone-900 font-mono-num">/dev</code>).</li>
            </ul>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              setUrlInput('');
              onSaveUrl('');
              setTestResult({ status: 'idle' });
            }}
            className="text-xs text-rose-600 hover:text-rose-800 font-medium"
          >
            Clear / Revert to Simulation
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-medium rounded-lg transition-colors shadow-xs"
            >
              Save Configuration
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
