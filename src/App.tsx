/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { MultiStepPlanningForm } from './components/MultiStepPlanningForm';
import { SubmissionSuccessModal } from './components/SubmissionSuccessModal';
import { SubmissionRecord } from './types';

const STORAGE_KEY_GAS_URL = 'dte_itd_multistage_gas_url';
const STORAGE_KEY_SUBMISSIONS = 'dte_itd_multistage_submissions';

export default function App() {
  const [gasUrl, setGasUrl] = useState<string>('');
  const [submissions, setSubmissions] = useState<SubmissionRecord[]>([]);
  const [recentSubmission, setRecentSubmission] = useState<SubmissionRecord | null>(null);

  // Load persisted settings on mount
  useEffect(() => {
    try {
      const savedUrl = localStorage.getItem(STORAGE_KEY_GAS_URL);
      if (savedUrl) setGasUrl(savedUrl);

      const savedSubmissions = localStorage.getItem(STORAGE_KEY_SUBMISSIONS);
      if (savedSubmissions) {
        setSubmissions(JSON.parse(savedSubmissions));
      }
    } catch (e) {
      console.warn("Storage access notice:", e);
    }
  }, []);

  // Add new submission
  const handleSubmissionSuccess = (record: SubmissionRecord) => {
    const updated = [record, ...submissions];
    setSubmissions(updated);
    setRecentSubmission(record);
    try {
      localStorage.setItem(STORAGE_KEY_SUBMISSIONS, JSON.stringify(updated));
    } catch (e) {}
  };

  return (
    <div className="min-h-screen bg-stone-100/70 text-stone-900 flex flex-col selection:bg-stone-800 selection:text-amber-200">
      
      {/* Main View Area */}
      <main className="flex-1">
        <MultiStepPlanningForm
          gasUrl={gasUrl}
          onOpenConfig={() => {}}
          onSubmissionSuccess={handleSubmissionSuccess}
        />
      </main>

      {/* Formal Acknowledgment Receipt Modal */}
      <SubmissionSuccessModal
        record={recentSubmission}
        onClose={() => setRecentSubmission(null)}
        onViewLedger={() => setRecentSubmission(null)}
      />

      {/* Institutional Footer */}
      <footer className="bg-white border-t border-stone-200 py-5 text-center text-xs text-stone-500 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-1">
          <p className="font-semibold text-stone-700">
            Directorate of Technical Education (DTE) & Industrial Training Department (ITD)
          </p>
          <p className="text-[11px] text-stone-400">
            Institutional Competition Planning Portal • District Online Exam Centers • 63 Sanctioned Trades
          </p>
        </div>
      </footer>

    </div>
  );
}
