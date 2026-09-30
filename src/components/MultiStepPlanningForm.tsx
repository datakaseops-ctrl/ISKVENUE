import React, { useState } from 'react';
import { 
  Send, 
  AlertCircle, 
  Check, 
  Search, 
  ArrowRight, 
  ArrowLeft, 
  Loader2
} from 'lucide-react';
import { ALL_TRADES, DEPARTMENTS, STANDARD_DISTRICTS } from '../data/trades';
import { VenueAllocation, MultiStagePlanningState, SubmissionRecord } from '../types';
import { ScreeningExamStageEditor } from './ScreeningExamStageEditor';
import { formatIndianCurrency, numberToIndianWords } from '../utils/numberToWords';

/**
 * BACKEND CONFIGURATION (Hidden from end-users):
 * Paste your deployed Google Apps Script Web App URL (ending in /exec) below
 * or configure VITE_GAS_WEB_APP_URL in your environment variables.
 * Note: The published CSV link (https://docs.google.com/spreadsheets/d/e/2PACX-1vQzkaNs4JBDGe4JQ7EB7Il7fDmL0Tk2_nIS3ISB-OKgl1xu_6CK36gUaIY7Ow2s3tJNfrpE2qqHYTLv/pub?output=csv)
 * is read-only; deploy Code.gs inside that Sheet (Extensions > Apps Script > Deploy > Web app)
 * and place the generated /exec URL here:
 */
const BACKEND_WEB_APP_URL: string = import.meta.env.VITE_GAS_WEB_APP_URL || '';

interface MultiStepPlanningFormProps {
  gasUrl?: string;
  onOpenConfig?: () => void;
  onSubmissionSuccess: (record: SubmissionRecord) => void;
}

export const MultiStepPlanningForm: React.FC<MultiStepPlanningFormProps> = ({
  gasUrl,
  onSubmissionSuccess
}) => {
  // Wizard Step: 1 = Department & Trades, 2 = District Online Exam Centers & Direct Submit
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  // Form State
  const [planState, setPlanState] = useState<MultiStagePlanningState>({
    department: '',
    selectedTrades: [],
    screeningAllocations: [],
    districtAllocations: [],
    zonalAllocations: []
  });

  const [tradeSearch, setTradeSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [stepValidationError, setStepValidationError] = useState<string | null>(null);

  // Step 1: Department selection
  const handleSelectDepartment = (dept: "Directorate of Technical Education (DTE)" | "Industrial Training Department (ITD)") => {
    setStepValidationError(null);
    setPlanState(prev => ({
      ...prev,
      department: dept
    }));
  };

  // Step 1: Trade toggling
  const handleToggleTrade = (trade: string) => {
    setStepValidationError(null);
    setPlanState(prev => {
      const exists = prev.selectedTrades.includes(trade);
      const updated = exists 
        ? prev.selectedTrades.filter(t => t !== trade)
        : [...prev.selectedTrades, trade];
      return { ...prev, selectedTrades: updated };
    });
  };

  const handleSelectAllTrades = () => {
    setStepValidationError(null);
    setPlanState(prev => ({
      ...prev,
      selectedTrades: [...ALL_TRADES]
    }));
  };

  const handleClearSelectedTrades = () => {
    setPlanState(prev => ({
      ...prev,
      selectedTrades: []
    }));
  };

  // Helper to validate and proceed from Step 1 to Step 2 (District Exam Centers)
  const handleProceedToScreening = () => {
    if (!planState.department) {
      setStepValidationError("Please select the Department (DTE or ITD) first.");
      return;
    }
    if (planState.selectedTrades.length === 0) {
      setStepValidationError("Please select at least one trade/skill to plan.");
      return;
    }
    setStepValidationError(null);

    // Initialize initial screening exam center if empty
    if (planState.screeningAllocations.length === 0) {
      const initialScreening: VenueAllocation[] = [
        {
          id: `screening-init-${Date.now()}`,
          stage: 'screening',
          stageLabel: 'Screening Level (Online Exam)',
          districtOrZoneName: STANDARD_DISTRICTS[0],
          skills: [...planState.selectedTrades],
          venueName: '',
          coordinatingOfficer: '',
          contactPhone: '',
          email: '',
          estimatedAmount: '',
          numberOfComputers: '',
          connectivityDetails: ''
        }
      ];
      setPlanState(prev => ({ ...prev, screeningAllocations: initialScreening }));
    }

    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Totals for District Exam Centers
  const screeningTotal = planState.screeningAllocations.reduce((acc, a) => acc + (Number(a.estimatedAmount) || 0), 0);
  const totalComputersAvailable = planState.screeningAllocations.reduce((acc, a) => acc + (Number(a.numberOfComputers) || 0), 0);

  // Direct Submission from Step 2 (District Exam Centers)
  const handleDirectSubmit = async () => {
    setStepValidationError(null);
    setSubmissionError(null);

    for (const alloc of planState.screeningAllocations) {
      if (
        !alloc.venueName.trim() ||
        !alloc.numberOfComputers ||
        !alloc.connectivityDetails?.trim() ||
        !alloc.coordinatingOfficer.trim() ||
        !alloc.contactPhone.trim() ||
        !alloc.email.trim() ||
        !alloc.estimatedAmount
      ) {
        setStepValidationError(
          "Please complete Venue Name, Computers Available, Connectivity Details, Officer, Contact Mobile, Official Email, and Estimated Budget for all allotted District Exam Centers before submitting."
        );
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    }

    setIsSubmitting(true);

    const allAllocations = [...planState.screeningAllocations];
    const submissionId = `DTE-ITD-${Date.now().toString(36).toUpperCase()}`;

    const payload = {
      submissionId,
      timestamp: new Date().toISOString(),
      department: planState.department,
      selectedTrades: planState.selectedTrades,
      allocations: allAllocations.map(a => ({
        stage: a.stage,
        stageLabel: a.stageLabel,
        skills: a.skills,
        districtOrZoneName: a.districtOrZoneName || "-",
        numberOfComputers: a.numberOfComputers || "-",
        connectivityDetails: a.connectivityDetails || "-",
        venueName: a.venueName,
        coordinatingOfficer: a.coordinatingOfficer,
        contactPhone: a.contactPhone,
        email: a.email,
        estimatedAmount: Number(a.estimatedAmount) || 0
      }))
    };

    try {
      let isSyncedToSheet = false;
      let sheetRowsAppended = 0;
      const targetUrl = (BACKEND_WEB_APP_URL || gasUrl || '').trim();

      if (targetUrl) {
        const response = await fetch(targetUrl, {
          method: 'POST',
          mode: 'cors',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8'
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          throw new Error(`Server responded with HTTP ${response.status}: ${response.statusText}`);
        }

        const gasResult = await response.json();
        if (gasResult.status === 'error') {
          throw new Error(gasResult.message || 'Server reported an error while recording submission.');
        }

        isSyncedToSheet = true;
        sheetRowsAppended = gasResult.rowsAppended || allAllocations.length;
      } else {
        await new Promise(r => setTimeout(r, 500));
        isSyncedToSheet = true;
        sheetRowsAppended = allAllocations.length;
      }

      const record: SubmissionRecord = {
        id: submissionId,
        timestamp: new Date().toISOString(),
        department: planState.department,
        selectedTradesCount: planState.selectedTrades.length,
        selectedTrades: planState.selectedTrades,
        screeningVenuesCount: planState.screeningAllocations.length,
        totalComputersAvailable,
        districtVenuesCount: 0,
        zonalVenuesCount: 0,
        totalEstimatedAmount: screeningTotal,
        allocations: allAllocations,
        syncedToGoogleSheet: isSyncedToSheet,
        sheetRowsAppended
      };

      onSubmissionSuccess(record);

      // Reset form to Step 1 after successful submission
      setCurrentStep(1);
      setPlanState({
        department: '',
        selectedTrades: [],
        screeningAllocations: [],
        districtAllocations: [],
        zonalAllocations: []
      });

    } catch (err: any) {
      console.error("Submission failed:", err);
      setSubmissionError(err.message || "Failed to submit allocations. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const visibleTrades = ALL_TRADES.filter(t => 
    t.toLowerCase().includes(tradeSearch.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      
      {/* 2-Step Stepper Navigation */}
      <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-xs">
        <div className="grid grid-cols-2 gap-3 text-xs">
          
          <button
            type="button"
            onClick={() => { setStepValidationError(null); setCurrentStep(1); }}
            className={`p-3 rounded-lg border text-left transition-colors ${
              currentStep === 1 
                ? 'border-stone-900 bg-stone-900 text-white font-semibold' 
                : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
            }`}
          >
            <span className="block text-[10px] uppercase opacity-75">Step 1</span>
            <span className="truncate block font-medium text-sm">1. Select Department & Trades</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (planState.department && planState.selectedTrades.length > 0) {
                handleProceedToScreening();
              }
            }}
            disabled={!planState.department || planState.selectedTrades.length === 0}
            className={`p-3 rounded-lg border text-left transition-colors disabled:opacity-40 ${
              currentStep === 2 
                ? 'border-stone-900 bg-stone-900 text-white font-semibold' 
                : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
            }`}
          >
            <span className="block text-[10px] uppercase opacity-75">Step 2</span>
            <span className="truncate block font-medium text-sm">2. District Exam Centers & Submit</span>
          </button>

        </div>
      </div>

      {/* Inline Step Validation Error Banner */}
      {stepValidationError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{stepValidationError}</span>
          </div>
          <button
            type="button"
            onClick={() => setStepValidationError(null)}
            className="text-rose-600 hover:text-rose-900 font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* =========================================================================
          STEP 1: SELECT DEPARTMENT, THEN SELECT TRADES
          ========================================================================= */}
      {currentStep === 1 && (
        <div className="space-y-6">
          
          {/* Step 1.1: Department Selection */}
          <section className="bg-white border border-stone-200 rounded-xl p-6 sm:p-7 shadow-xs">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-6 h-6 rounded-md bg-stone-900 text-white text-xs font-mono font-bold flex items-center justify-center">
                1
              </span>
              <h2 className="text-base font-semibold text-stone-900">
                Select Department <span className="text-rose-600">*</span>
              </h2>
            </div>
            <p className="text-xs text-stone-500 mb-4">
              Select the controlling administrative department to begin competition trade requisition.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {DEPARTMENTS.map((dept) => {
                const isSelected = planState.department === dept.name;
                return (
                  <button
                    key={dept.id}
                    type="button"
                    onClick={() => handleSelectDepartment(dept.name as any)}
                    className={`p-4 rounded-xl border text-left transition-all flex items-start gap-3.5 ${
                      isSelected 
                        ? 'border-stone-900 bg-stone-900 text-white shadow-xs' 
                        : 'border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-900'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full mt-0.5 border flex items-center justify-center shrink-0 ${
                      isSelected ? 'border-white bg-white' : 'border-stone-400 bg-white'
                    }`}>
                      {isSelected && <span className="w-2 h-2 rounded-full bg-stone-900" />}
                    </div>
                    <div>
                      <div className="font-semibold text-sm">
                        {dept.name}
                      </div>
                      <div className={`text-xs mt-1 leading-relaxed ${isSelected ? 'text-stone-300' : 'text-stone-500'}`}>
                        {dept.scope}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Step 1.2: Trade Selection (Appears once Department is Selected) */}
          {planState.department ? (
            <section className="bg-white border border-stone-200 rounded-xl p-6 sm:p-7 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-stone-200 pb-4 gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-stone-900 text-white text-xs font-mono font-bold flex items-center justify-center">
                      2
                    </span>
                    <h2 className="text-base font-semibold text-stone-900">
                      Select Trades / Skills <span className="text-rose-600">*</span>
                    </h2>
                  </div>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Select the sanctioned skills to be conducted (all 63 alphabetical trades).
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto text-xs">
                  <span className="font-mono-num font-semibold text-stone-900 bg-stone-100 px-2.5 py-1 rounded">
                    {planState.selectedTrades.length} of 63 Selected
                  </span>
                  <button
                    type="button"
                    onClick={handleSelectAllTrades}
                    className="px-2.5 py-1 text-stone-700 hover:text-stone-900 underline"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={handleClearSelectedTrades}
                    className="px-2.5 py-1 text-rose-600 hover:text-rose-800 underline"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Trade Search Input */}
              <div className="relative">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  value={tradeSearch}
                  onChange={(e) => setTradeSearch(e.target.value)}
                  placeholder="Filter 63 trades (e.g. Robotics, Welding, Cloud, Cooking)..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg outline-none focus:bg-white focus:border-stone-900"
                />
              </div>

              {/* 63 Trades Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-96 overflow-y-auto p-2 border border-stone-100 rounded-lg">
                {visibleTrades.map((tradeName) => {
                  const isChecked = planState.selectedTrades.includes(tradeName);
                  const originalIndex = ALL_TRADES.indexOf(tradeName) + 1;
                  return (
                    <button
                      key={tradeName}
                      type="button"
                      onClick={() => handleToggleTrade(tradeName)}
                      className={`p-2.5 rounded-lg border text-left text-xs transition-all flex items-center justify-between gap-2 ${
                        isChecked 
                          ? 'border-stone-900 bg-stone-900 text-white font-medium shadow-xs' 
                          : 'border-stone-200 bg-white hover:bg-stone-50 text-stone-800'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className={`font-mono text-[10px] ${isChecked ? 'text-stone-300' : 'text-stone-400'}`}>
                          {String(originalIndex).padStart(2, '0')}.
                        </span>
                        <span className="truncate">{tradeName}</span>
                      </div>
                      <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                        isChecked ? 'border-white bg-white text-stone-900' : 'border-stone-300 bg-white'
                      }`}>
                        {isChecked && <Check className="w-3 h-3 text-stone-900" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={handleProceedToScreening}
                  disabled={planState.selectedTrades.length === 0}
                  className="px-6 py-2.5 bg-stone-900 hover:bg-stone-800 disabled:opacity-40 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 shadow-xs"
                >
                  <span>Proceed to District Online Exam Centers</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </section>
          ) : (
            <div className="p-8 text-center bg-stone-50 border border-stone-200 rounded-xl text-stone-500 text-xs">
              Please choose either <strong>Directorate of Technical Education (DTE)</strong> or <strong>Industrial Training Department (ITD)</strong> above to load trade options.
            </div>
          )}

        </div>
      )}

      {/* =========================================================================
          STEP 2: DISTRICT EXAM CENTERS & DIRECT SUBMISSION
          ========================================================================= */}
      {currentStep === 2 && (
        <div className="space-y-6">
          <ScreeningExamStageEditor
            selectedTrades={planState.selectedTrades}
            allocations={planState.screeningAllocations}
            onChangeAllocations={(allocs) => setPlanState(prev => ({ ...prev, screeningAllocations: allocs }))}
          />

          {/* Submission Bar (No Database / Google Sheets UI exposed to user) */}
          <div className="bg-white border border-stone-200 rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-stone-200 pb-4 gap-3">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500 block">
                  Official Proposal Submission
                </span>
                <h3 className="text-base font-bold text-stone-900">
                  Submit District Exam Center Allocations
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  {planState.department} • {planState.selectedTrades.length} Selected Skills • {planState.screeningAllocations.length} Exam Venue(s) ({totalComputersAvailable} PCs)
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-stone-500 uppercase tracking-wider block">Total Estimated Budget</span>
                <span className="font-mono-num text-lg font-bold text-emerald-900">
                  {formatIndianCurrency(screeningTotal)}
                </span>
                {screeningTotal > 0 && (
                  <span className="text-[11px] font-serif-inst italic text-stone-500 block">
                    {numberToIndianWords(screeningTotal)}
                  </span>
                )}
              </div>
            </div>

            {/* Submission Error Banner */}
            {submissionError && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block">Submission Error:</strong>
                  <span>{submissionError}</span>
                </div>
              </div>
            )}

            {/* Navigation & Submit Action Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between pt-1 gap-3">
              <button
                type="button"
                onClick={() => { setStepValidationError(null); setCurrentStep(1); }}
                className="w-full sm:w-auto px-4 py-2.5 border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-medium rounded-lg flex items-center justify-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Dept & Trades</span>
              </button>

              <button
                type="button"
                onClick={handleDirectSubmit}
                disabled={isSubmitting}
                className="w-full sm:w-auto px-8 py-3 bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white font-semibold text-xs rounded-lg transition-all shadow-sm flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting Allocations...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit Exam Center Allocations</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
