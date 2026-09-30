import React, { useState } from 'react';
import { 
  Send, 
  AlertCircle, 
  ArrowRight, 
  ArrowLeft, 
  Loader2
} from 'lucide-react';
import { DEPARTMENTS, STANDARD_DISTRICTS, DISTRICT_TALUKS } from '../data/trades';
import { VenueAllocation, MultiStagePlanningState, SubmissionRecord } from '../types';
import { ScreeningExamStageEditor } from './ScreeningExamStageEditor';
import { formatIndianCurrency, numberToIndianWords } from '../utils/numberToWords';

/**
 * Predefined Backend Endpoint URL (Hidden from end-users)
 */
const BACKEND_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbxVz4IN8XGrZ3uxlTvIWsJ4U_NWm8oyS4zFSx42dntF4lsBmZgB-E5F9KYd3mrXP4wp9Q/exec';

interface MultiStepPlanningFormProps {
  gasUrl?: string;
  onOpenConfig?: () => void;
  onSubmissionSuccess: (record: SubmissionRecord) => void;
}

export const MultiStepPlanningForm: React.FC<MultiStepPlanningFormProps> = ({
  onSubmissionSuccess
}) => {
  // Wizard Step: 1 = Select Department, 2 = District & Taluk Online Exam Centers & Direct Submit
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  // Form State
  const [planState, setPlanState] = useState<MultiStagePlanningState>({
    department: '',
    selectedTrades: [],
    screeningAllocations: [],
    districtAllocations: [],
    zonalAllocations: []
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [stepValidationError, setStepValidationError] = useState<string | null>(null);

  // Helper to initialize initial screening exam center if empty and go to Step 2
  const proceedToExamCentersWithDept = (
    dept: "Directorate of Technical Education (DTE)" | "Industrial Training Department (ITD)"
  ) => {
    setStepValidationError(null);

    const defaultDistrict = STANDARD_DISTRICTS[0];
    const defaultTaluk = DISTRICT_TALUKS[defaultDistrict]?.[0] || '';

    setPlanState(prev => {
      const allocations =
        prev.screeningAllocations.length > 0
          ? prev.screeningAllocations
          : [
              {
                id: `screening-init-${Date.now()}`,
                stage: 'screening' as const,
                stageLabel: 'Screening Level (Online Exam)',
                districtOrZoneName: defaultDistrict,
                talukName: defaultTaluk,
                skills: [],
                venueName: '',
                coordinatingOfficer: '',
                contactPhone: '',
                email: '',
                estimatedAmount: '' as const,
                numberOfComputers: '' as const,
                connectivityDetails: ''
              }
            ];

      return {
        ...prev,
        department: dept,
        screeningAllocations: allocations
      };
    });

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
          "Please complete District, Taluk, Venue Name, Computers Available, Connectivity Details, Officer, Contact Mobile, Official Email, and Estimated Budget for all allotted District Exam Centers before submitting."
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
      moduleType: 'exam_centres',
      timestamp: new Date().toISOString(),
      department: planState.department,
      selectedTrades: [],
      allocations: allAllocations.map(a => ({
        stage: a.stage,
        stageLabel: a.stageLabel,
        skills: a.skills,
        districtOrZoneName: a.districtOrZoneName || "-",
        talukName: a.talukName || (a.districtOrZoneName ? DISTRICT_TALUKS[a.districtOrZoneName]?.[0] : "-") || "-",
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
      let sheetRowsAppended = allAllocations.length;

      try {
        const response = await fetch(BACKEND_WEB_APP_URL, {
          method: 'POST',
          mode: 'cors',
          redirect: 'follow',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8'
          },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          const textResult = await response.text();
          try {
            const gasResult = JSON.parse(textResult);
            if (gasResult.status === 'error') {
              throw new Error(gasResult.message || 'Server reported an error while recording submission.');
            }
            sheetRowsAppended = gasResult.rowsAppended || allAllocations.length;
          } catch (parseErr: any) {
            if (parseErr.message && parseErr.message.includes('Server reported')) {
              throw parseErr;
            }
          }
        } else {
          throw new Error(`HTTP ${response.status}`);
        }
      } catch (corsOrRedirectErr: any) {
        if (corsOrRedirectErr.message && corsOrRedirectErr.message.includes('Server reported')) {
          throw corsOrRedirectErr;
        }
        await fetch(BACKEND_WEB_APP_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8'
          },
          body: JSON.stringify(payload)
        });
      }

      const record: SubmissionRecord = {
        id: submissionId,
        moduleType: 'exam_centres',
        timestamp: new Date().toISOString(),
        department: planState.department,
        selectedTradesCount: 0,
        selectedTrades: [],
        screeningVenuesCount: planState.screeningAllocations.length,
        totalComputersAvailable,
        districtVenuesCount: 0,
        zonalVenuesCount: 0,
        totalEstimatedAmount: screeningTotal,
        allocations: allAllocations,
        syncedToGoogleSheet: true,
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

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      
      {/* 2-Step Stepper Navigation */}
      <div className="bg-white border border-[#0e5774]/20 rounded-xl p-4 shadow-xs">
        <div className="grid grid-cols-2 gap-3 text-xs">
          
          <button
            type="button"
            onClick={() => { setStepValidationError(null); setCurrentStep(1); }}
            className={`p-3 rounded-lg border text-left transition-colors ${
              currentStep === 1 
                ? 'border-[#0e5774] bg-[#0e5774] text-white font-semibold' 
                : 'border-[#0e5774]/20 bg-[#f4f8fa] text-[#0e5774] hover:bg-[#0e5774]/10'
            }`}
          >
            <span className="block text-[10px] uppercase opacity-75">Step 1</span>
            <span className="truncate block font-medium text-sm">1. Select Department</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (planState.department) {
                proceedToExamCentersWithDept(planState.department);
              }
            }}
            disabled={!planState.department}
            className={`p-3 rounded-lg border text-left transition-colors disabled:opacity-40 ${
              currentStep === 2 
                ? 'border-[#0e5774] bg-[#0e5774] text-white font-semibold' 
                : 'border-[#0e5774]/20 bg-[#f4f8fa] text-[#0e5774] hover:bg-[#0e5774]/10'
            }`}
          >
            <span className="block text-[10px] uppercase opacity-75">Step 2</span>
            <span className="truncate block font-medium text-sm">2. District & Taluk Exam Centers</span>
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
          STEP 1: SELECT DEPARTMENT -> IMMEDIATELY PROCEEDS TO DISTRICT & TALUK EXAM CENTERS
          ========================================================================= */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <section className="bg-white border border-[#0e5774]/20 rounded-xl p-6 sm:p-7 shadow-xs">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-6 h-6 rounded-md bg-[#0e5774] text-white text-xs font-mono font-bold flex items-center justify-center">
                1
              </span>
              <h2 className="text-base font-semibold text-[#0e5774]">
                Select Department <span className="text-rose-600">*</span>
              </h2>
            </div>
            <p className="text-xs text-slate-600 mb-5">
              Select the controlling administrative department to proceed directly to District & Taluk Online Exam Center allotment.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {DEPARTMENTS.map((dept) => {
                const isSelected = planState.department === dept.name;
                return (
                  <button
                    key={dept.id}
                    type="button"
                    onClick={() => proceedToExamCentersWithDept(dept.name as any)}
                    className={`p-5 rounded-xl border text-left transition-all flex items-start justify-between gap-3.5 group ${
                      isSelected 
                        ? 'border-[#0e5774] bg-[#0e5774] text-white shadow-xs' 
                        : 'border-[#0e5774]/25 bg-white hover:bg-[#f4f8fa] hover:border-[#0e5774] text-slate-900'
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      <div className={`w-4 h-4 rounded-full mt-0.5 border flex items-center justify-center shrink-0 ${
                        isSelected ? 'border-white bg-white' : 'border-[#0e5774] bg-white'
                      }`}>
                        {isSelected && <span className="w-2 h-2 rounded-full bg-[#0e5774]" />}
                      </div>
                      <div>
                        <div className="font-semibold text-sm">
                          {dept.name}
                        </div>
                        <div className={`text-xs mt-1 leading-relaxed ${isSelected ? 'text-white/85' : 'text-slate-500'}`}>
                          {dept.scope}
                        </div>
                      </div>
                    </div>
                    <ArrowRight className={`w-4 h-4 shrink-0 mt-0.5 transition-transform group-hover:translate-x-0.5 ${
                      isSelected ? 'text-white' : 'text-[#0e5774]'
                    }`} />
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      )}

      {/* =========================================================================
          STEP 2: DISTRICT & TALUK EXAM CENTERS & DIRECT SUBMISSION
          ========================================================================= */}
      {currentStep === 2 && (
        <div className="space-y-6">
          <ScreeningExamStageEditor
            selectedTrades={planState.selectedTrades}
            allocations={planState.screeningAllocations}
            onChangeAllocations={(allocs) => setPlanState(prev => ({ ...prev, screeningAllocations: allocs }))}
          />

          {/* Submission Bar */}
          <div className="bg-white border border-[#0e5774]/20 rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-[#0e5774]/15 pb-4 gap-3">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#0e5774] block">
                  Official Proposal Submission
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  Submit District & Taluk Exam Center Allocations
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {planState.department} · {planState.screeningAllocations.length} Exam Venue(s) ({totalComputersAvailable} PCs)
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Total Estimated Budget</span>
                <span className="font-mono-num text-lg font-bold text-[#0e5774]">
                  {formatIndianCurrency(screeningTotal)}
                </span>
                {screeningTotal > 0 && (
                  <span className="text-[11px] font-serif-inst italic text-slate-500 block">
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
                className="w-full sm:w-auto px-4 py-2.5 border border-[#0e5774]/30 hover:bg-[#f4f8fa] text-[#0e5774] text-xs font-medium rounded-lg flex items-center justify-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Department</span>
              </button>

              <button
                type="button"
                onClick={handleDirectSubmit}
                disabled={isSubmitting}
                className="w-full sm:w-auto px-8 py-3 bg-[#0e5774] hover:bg-[#0a4258] disabled:opacity-50 text-white font-semibold text-xs rounded-lg transition-all shadow-sm flex items-center justify-center gap-2"
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
