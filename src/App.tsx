/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Building2, FileText } from 'lucide-react';
import { MultiStepPlanningForm } from './components/MultiStepPlanningForm';
import { QuestionPaperPreparationModule } from './components/QuestionPaperPreparationModule';
import { SubmissionSuccessModal } from './components/SubmissionSuccessModal';
import { SubmissionRecord } from './types';

const STORAGE_KEY_SUBMISSIONS = 'dte_itd_multistage_submissions';

export default function App() {
  const [activeModule, setActiveModule] = useState<'exam_centres' | 'question_paper'>('exam_centres');
  const [submissions, setSubmissions] = useState<SubmissionRecord[]>([]);
  const [recentSubmission, setRecentSubmission] = useState<SubmissionRecord | null>(null);

  // Load persisted submissions on mount
  useEffect(() => {
    try {
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
    <div className="min-h-screen bg-white text-slate-900 flex flex-col selection:bg-[#0e5774] selection:text-white">
      
      {/* Brand Top Accent Strip */}
      <div className="h-1.5 bg-[#0e5774] w-full" />

      {/* Top Header with Logo & Indiaskills Kerala 2026-27 Title */}
      <header className="bg-white border-b border-[#0e5774]/20 sticky top-0 z-30 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src="/logo.png"
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.src.includes('drive.google.com')) {
                  target.src = 'https://drive.google.com/thumbnail?id=1V0NCRe_lrfeUDKwzM5rDITzXa11stHBt&sz=w1000';
                }
              }}
              alt="Official Logo"
              className="h-12 sm:h-14 w-auto object-contain shrink-0"
            />
            <div className="border-l border-slate-200 pl-4">
              <h1 className="text-2xl sm:text-3xl text-black tracking-tight leading-none flex flex-wrap items-baseline gap-x-2">
                <span className="inline-flex items-baseline tracking-[-0.03em]">
                  <span className="font-light text-black">India</span>
                  <span className="font-extrabold text-black">skills</span>
                </span>
                <span className="font-light text-black tracking-[-0.02em]">Kerala</span>
                <span className="font-bold text-black text-xl sm:text-2xl tracking-tight">
                  2026-27
                </span>
              </h1>
            </div>
          </div>

          {/* Module Selector Tabs */}
          <div className="inline-flex p-1 bg-[#f4f8fa] border border-[#0e5774]/20 rounded-xl text-xs self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setActiveModule('exam_centres')}
              className={`px-3.5 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                activeModule === 'exam_centres'
                  ? 'bg-[#0e5774] text-white font-semibold shadow-xs'
                  : 'text-[#0e5774] hover:bg-[#0e5774]/10'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>District Exam Centres</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveModule('question_paper')}
              className={`px-3.5 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                activeModule === 'question_paper'
                  ? 'bg-[#0e5774] text-white font-semibold shadow-xs'
                  : 'text-[#0e5774] hover:bg-[#0e5774]/10'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Question Paper Preparation</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main View Area */}
      <main className="flex-1 bg-[#f4f8fa]">
        {activeModule === 'exam_centres' ? (
          <MultiStepPlanningForm
            onSubmissionSuccess={handleSubmissionSuccess}
          />
        ) : (
          <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <QuestionPaperPreparationModule
              onSubmissionSuccess={handleSubmissionSuccess}
            />
          </div>
        )}
      </main>

      {/* Formal Acknowledgment Receipt Modal */}
      <SubmissionSuccessModal
        record={recentSubmission}
        onClose={() => setRecentSubmission(null)}
        onViewLedger={() => setRecentSubmission(null)}
      />

      {/* Institutional Footer */}
      <footer className="bg-[#0e5774] text-white py-5 text-center text-xs mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-1">
          <p className="font-semibold text-white">
            Indiaskills Kerala 2026-27 · Directorate of Technical Education (DTE) & Industrial Training Department (ITD)
          </p>
          <p className="text-[11px] text-white/80">
            District Online Exam Centres & Question Paper Preparation
          </p>
        </div>
      </footer>

    </div>
  );
}
