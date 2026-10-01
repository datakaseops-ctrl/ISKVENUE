import React, { useState, useMemo } from 'react';
import {
  Search,
  Check,
  AlertCircle,
  Send,
  Loader2,
  FileText,
  CheckSquare,
  CircleDot,
  RotateCcw
} from 'lucide-react';
import { ALL_TRADES, DEPARTMENTS } from '../data/trades';
import {
  CompetitionLevel,
  QuestionPaperSkillSelection,
  SubmissionRecord,
  VenueAllocation
} from '../types';

const BACKEND_WEB_APP_URL =
  'https://script.google.com/macros/s/AKfycbwcdF2_35vNOv1g7kzwqyV2grdYG2j5Ucv-oeqLwRAIuur4qkM3VwJXEQn2Yma2iczhYA/exec';

const COMPETITION_LEVELS: CompetitionLevel[] = [
  'Screening',
  'District',
  'Zonal',
  'State'
];

interface QuestionPaperPreparationModuleProps {
  onSubmissionSuccess: (record: SubmissionRecord) => void;
}

export const QuestionPaperPreparationModule: React.FC<QuestionPaperPreparationModuleProps> = ({
  onSubmissionSuccess
}) => {
  const [department, setDepartment] = useState<
    'Directorate of Technical Education (DTE)' | 'Industrial Training Department (ITD)' | ''
  >('');
  const [inputMode, setInputMode] = useState<'checkbox' | 'radio'>('checkbox');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewFilter, setViewFilter] = useState<'all' | 'selected' | 'unselected'>('all');

  // Optional coordinating officer / institution details
  const [institutionName, setInstitutionName] = useState('');
  const [coordinatingOfficer, setCoordinatingOfficer] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [officialEmail, setOfficialEmail] = useState('');

  // Map of skill -> array of selected CompetitionLevels
  const [skillSelections, setSkillSelections] = useState<Record<string, CompetitionLevel[]>>(() => {
    const initial: Record<string, CompetitionLevel[]> = {};
    ALL_TRADES.forEach((trade) => {
      initial[trade] = [];
    });
    return initial;
  });

  // Validation & Submission states
  const [validationError, setValidationError] = useState<string | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [isValidationModalOpen, setIsValidationModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Toggle a level for a specific skill
  const handleToggleLevel = (skill: string, level: CompetitionLevel) => {
    setValidationError(null);
    setSkillSelections((prev) => {
      const current = prev[skill] || [];
      if (inputMode === 'radio') {
        // In radio mode, clicking an already selected level deselects it, otherwise selects only this level
        const isAlreadySelected = current.length === 1 && current[0] === level;
        return {
          ...prev,
          [skill]: isAlreadySelected ? [] : [level]
        };
      } else {
        // In checkbox (tick box) mode, toggle the level in the array ordered by COMPETITION_LEVELS
        const exists = current.includes(level);
        const updated = exists
          ? current.filter((l) => l !== level)
          : COMPETITION_LEVELS.filter((l) => current.includes(l) || l === level);
        return {
          ...prev,
          [skill]: updated
        };
      }
    });
  };

  // Toggle all 4 levels for a single skill row
  const handleToggleAllLevelsForSkill = (skill: string) => {
    setValidationError(null);
    setSkillSelections((prev) => {
      const current = prev[skill] || [];
      const hasAllFour = current.length === COMPETITION_LEVELS.length;
      return {
        ...prev,
        [skill]: hasAllFour ? [] : [...COMPETITION_LEVELS]
      };
    });
  };

  // Toggle an entire column (Screening / District / Zonal / State) across visible skills
  const handleToggleColumn = (level: CompetitionLevel, targetSkills: readonly string[]) => {
    setValidationError(null);
    setSkillSelections((prev) => {
      const next = { ...prev };
      const allHaveLevel = targetSkills.every((s) => (next[s] || []).includes(level));

      targetSkills.forEach((s) => {
        const current = next[s] || [];
        if (inputMode === 'radio') {
          next[s] = allHaveLevel ? [] : [level];
        } else {
          if (allHaveLevel) {
            next[s] = current.filter((l) => l !== level);
          } else if (!current.includes(level)) {
            next[s] = COMPETITION_LEVELS.filter((l) => current.includes(l) || l === level);
          }
        }
      });
      return next;
    });
  };

  // Clear all selections
  const handleClearAll = () => {
    setValidationError(null);
    const cleared: Record<string, CompetitionLevel[]> = {};
    ALL_TRADES.forEach((t) => {
      cleared[t] = [];
    });
    setSkillSelections(cleared);
  };

  // Select all 4 levels for all 63 skills (in checkbox mode)
  const handleSelectAllSkillsAndLevels = () => {
    setValidationError(null);
    setInputMode('checkbox');
    const filled: Record<string, CompetitionLevel[]> = {};
    ALL_TRADES.forEach((t) => {
      filled[t] = [...COMPETITION_LEVELS];
    });
    setSkillSelections(filled);
  };

  // Computed statistics for validation and display
  const {
    selectedSkillEntries,
    unselectedSkills,
    partiallySelectedSkills,
    fullySelectedSkillsCount
  } = useMemo(() => {
    const selectedEntries: QuestionPaperSkillSelection[] = [];
    const unselected: string[] = [];
    const partial: { skill: string; selected: CompetitionLevel[]; missing: CompetitionLevel[] }[] = [];
    let fullCount = 0;

    ALL_TRADES.forEach((skill) => {
      const levels = skillSelections[skill] || [];
      if (levels.length === 0) {
        unselected.push(skill);
      } else {
        selectedEntries.push({ skill, levels });
        if (levels.length === COMPETITION_LEVELS.length) {
          fullCount++;
        } else {
          const missing = COMPETITION_LEVELS.filter((l) => !levels.includes(l));
          partial.push({ skill, selected: levels, missing });
        }
      }
    });

    return {
      selectedSkillEntries: selectedEntries,
      unselectedSkills: unselected,
      partiallySelectedSkills: partial,
      fullySelectedSkillsCount: fullCount
    };
  }, [skillSelections]);

  // Filtered skills for the vertical list
  const visibleSkills = useMemo(() => {
    return ALL_TRADES.filter((skill) => {
      const matchesSearch = skill.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      const levels = skillSelections[skill] || [];
      if (viewFilter === 'selected') return levels.length > 0;
      if (viewFilter === 'unselected') return levels.length === 0 || (inputMode === 'checkbox' && levels.length < 4);
      return true;
    });
  }, [searchQuery, viewFilter, skillSelections, inputMode]);

  // Step 1 of submission: Trigger pre-submission validation check
  const handleInitiateSubmit = () => {
    setValidationError(null);
    setSubmissionError(null);

    if (!department) {
      setValidationError('Please select the controlling Department (DTE or ITD) before submitting.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (selectedSkillEntries.length === 0) {
      setValidationError(
        'No skills or competition levels have been selected. Please select at least one skill and competition level (Screening, District, Zonal, or State).'
      );
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Check if any skill is unselected or has unselected competition level options
    const hasUnselectedSkills = unselectedSkills.length > 0;
    const hasUnselectedLevelOptions = inputMode === 'checkbox' && partiallySelectedSkills.length > 0;

    if (hasUnselectedSkills || hasUnselectedLevelOptions) {
      setIsValidationModalOpen(true);
      return;
    }

    // If all 63 skills and all 4 levels are selected, submit directly
    handleConfirmAndFinalizeSubmit();
  };

  // Finalize & Submit after user confirms in the validation prompt
  const handleConfirmAndFinalizeSubmit = async () => {
    setIsValidationModalOpen(false);
    setIsSubmitting(true);
    setSubmissionError(null);

    const submissionId = `QP-${Date.now().toString(36).toUpperCase()}`;
    const timestamp = new Date().toISOString();

    // Format each selected skill as an allocation row so the existing backend records every skill & its levels seamlessly
    const formattedAllocations: VenueAllocation[] = selectedSkillEntries.map((entry, idx) => ({
      id: `qp-${idx}-${Date.now()}`,
      stage: 'screening',
      stageLabel: `Question Paper Prep (${entry.levels.join(', ')})`,
      districtOrZoneName: entry.levels.join(', '),
      talukName: '-',
      skills: [entry.skill],
      questionPaper: entry.levels.join(', '),
      venueName: institutionName.trim() || 'Question Paper Preparation Committee',
      coordinatingOfficer: coordinatingOfficer.trim() || '-',
      contactPhone: contactPhone.trim() || '-',
      email: officialEmail.trim() || '-',
      estimatedAmount: 0,
      numberOfComputers: entry.levels.length,
      connectivityDetails: `Question Paper Levels: ${entry.levels.join(', ')}`
    }));

    const payload = {
      submissionId,
      sheetName: 'Sheet2',
      targetSheet: 'Sheet2',
      timestamp,
      moduleType: 'question_paper_preparation',
      department,
      selectedTrades: selectedSkillEntries.map((e) => e.skill),
      questionPaperSelections: selectedSkillEntries,
      unselectedSkillsCount: unselectedSkills.length,
      allocations: formattedAllocations.map((a) => ({
        stage: 'question_paper_preparation',
        stageLabel: a.stageLabel,
        skills: a.skills,
        districtOrZoneName: a.districtOrZoneName,
        talukName: a.talukName,
        numberOfComputers: a.numberOfComputers,
        connectivityDetails: a.connectivityDetails,
        venueName: a.venueName,
        coordinatingOfficer: a.coordinatingOfficer,
        contactPhone: a.contactPhone,
        email: a.email,
        estimatedAmount: 0
      }))
    };

    try {
      let sheetRowsAppended = formattedAllocations.length;

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
            sheetRowsAppended = gasResult.rowsAppended || formattedAllocations.length;
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
        timestamp,
        moduleType: 'question_paper',
        department,
        selectedTradesCount: selectedSkillEntries.length,
        selectedTrades: selectedSkillEntries.map((e) => e.skill),
        screeningVenuesCount: formattedAllocations.length,
        totalComputersAvailable: 0,
        districtVenuesCount: 0,
        zonalVenuesCount: 0,
        totalEstimatedAmount: 0,
        allocations: formattedAllocations,
        questionPaperSelections: selectedSkillEntries,
        syncedToGoogleSheet: true,
        sheetRowsAppended
      };

      onSubmissionSuccess(record);
      handleClearAll();
    } catch (err: any) {
      console.error('Question paper submission error:', err);
      setSubmissionError(err.message || 'Failed to submit Question Paper Preparation matrix. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Validation Error Banner */}
      {validationError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{validationError}</span>
          </div>
          <button
            type="button"
            onClick={() => setValidationError(null)}
            className="text-rose-700 hover:text-rose-950 font-semibold shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Step 1: Select Controlling Department & Optional Officer Info */}
      <section className="bg-white border border-stone-200 rounded-xl p-6 sm:p-7 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-stone-200 pb-4 gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-stone-500 mb-0.5">
              <span>Standalone Module</span>
              <span aria-hidden="true">·</span>
              <span>4 Competition Tiers</span>
            </div>
            <h2 className="text-xl font-serif-inst font-semibold text-stone-900">
              Question Paper Preparation Matrix
            </h2>
            <p className="text-xs text-stone-600 mt-0.5">
              Configure question paper preparation requirements across Screening, District, Zonal, and State competition levels for each sanctioned skill.
            </p>
          </div>

          <div className="text-right text-xs text-stone-600 space-y-0.5">
            <div>
              Configured Skills:{' '}
              <strong className="font-mono-num text-stone-900 font-bold">
                {selectedSkillEntries.length} / {ALL_TRADES.length}
              </strong>
            </div>
            <div className="text-[11px] text-stone-500">
              Unselected Skills: <span className="font-mono-num">{unselectedSkills.length}</span>
            </div>
          </div>
        </div>

        {/* Department Selection */}
        <div>
          <label className="block text-xs font-semibold text-stone-800 mb-2">
            1. Select Controlling Department <span className="text-rose-600">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {DEPARTMENTS.map((dept) => {
              const isSelected = department === dept.name;
              return (
                <button
                  key={dept.id}
                  type="button"
                  onClick={() => {
                    setValidationError(null);
                    setDepartment(dept.name as any);
                  }}
                  className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 ${
                    isSelected
                      ? 'border-[#0e5774] bg-[#0e5774] text-white shadow-xs'
                      : 'border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-900'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full mt-0.5 border flex items-center justify-center shrink-0 ${
                      isSelected ? 'border-white bg-white' : 'border-stone-400 bg-white'
                    }`}
                  >
                    {isSelected && <span className="w-2 h-2 rounded-full bg-[#0e5774]" />}
                  </div>
                  <div>
                    <div className="font-semibold text-xs sm:text-sm">{dept.name}</div>
                    <div className={`text-[11px] mt-0.5 ${isSelected ? 'text-stone-300' : 'text-stone-500'}`}>
                      {dept.scope}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Coordinating Officer Metadata */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-stone-100 text-xs">
          <div>
            <label className="block font-semibold text-stone-700 mb-1">
              Coordinating Officer
            </label>
            <input
              type="text"
              value={coordinatingOfficer}
              onChange={(e) => setCoordinatingOfficer(e.target.value)}
              placeholder="Officer Name"
              className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg outline-none focus:border-[#0e5774]"
            />
          </div>
          <div>
            <label className="block font-semibold text-stone-700 mb-1">
              Contact Mobile
            </label>
            <input
              type="tel"
              maxLength={10}
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="10-digit mobile"
              className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg font-mono-num outline-none focus:border-[#0e5774]"
            />
          </div>
          <div>
            <label className="block font-semibold text-stone-700 mb-1">
              Official Email
            </label>
            <input
              type="email"
              value={officialEmail}
              onChange={(e) => setOfficialEmail(e.target.value)}
              placeholder="committee@dte.gov.in"
              className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg outline-none focus:border-[#0e5774]"
            />
          </div>
        </div>
      </section>

      {/* Step 2: Vertical Skills List (Left) & 4 Competition Levels (Right) */}
      <section className="bg-white border border-stone-200 rounded-xl shadow-xs overflow-hidden">
        {/* Toolbar: Search, Input Mode Switcher, and Quick Filters */}
        <div className="p-4 sm:p-5 border-b border-stone-200 bg-stone-50/70 space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            {/* Search Box */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search 63 skills vertically (e.g. Welding, Robotics, CAD)..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-stone-300 rounded-lg outline-none focus:border-[#0e5774]"
              />
            </div>

            {/* Right Controls: Selection Mode (Tick Boxes vs Radio Buttons) & Bulk Actions */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <div className="inline-flex items-center p-1 bg-stone-200/80 rounded-lg">
                <button
                  type="button"
                  onClick={() => setInputMode('checkbox')}
                  className={`px-2.5 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
                    inputMode === 'checkbox'
                      ? 'bg-white text-stone-900 shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>Tick Boxes (Multi-Level)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    // When switching to single-choice radio mode, keep the first selected level per skill
                    setInputMode('radio');
                    setSkillSelections((prev) => {
                      const next: Record<string, CompetitionLevel[]> = {};
                      Object.keys(prev).forEach((k) => {
                        next[k] = prev[k].length > 0 ? [prev[k][0]] : [];
                      });
                      return next;
                    });
                  }}
                  className={`px-2.5 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
                    inputMode === 'radio'
                      ? 'bg-white text-stone-900 shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <CircleDot className="w-3.5 h-3.5" />
                  <span>Radio Buttons (Single Level)</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleSelectAllSkillsAndLevels}
                className="px-3 py-1.5 bg-white border border-stone-300 hover:bg-stone-100 text-stone-800 rounded-lg font-medium transition-colors"
              >
                Select All 4 Levels
              </button>

              <button
                type="button"
                onClick={handleClearAll}
                className="px-3 py-1.5 bg-white border border-stone-300 hover:bg-rose-50 text-rose-700 rounded-lg font-medium transition-colors flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
            <div className="inline-flex items-center gap-1 bg-stone-200/70 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setViewFilter('all')}
                className={`px-3 py-1 rounded-md font-medium transition-colors ${
                  viewFilter === 'all'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                All Skills ({ALL_TRADES.length})
              </button>
              <button
                type="button"
                onClick={() => setViewFilter('selected')}
                className={`px-3 py-1 rounded-md font-medium transition-colors ${
                  viewFilter === 'selected'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Selected ({selectedSkillEntries.length})
              </button>
              <button
                type="button"
                onClick={() => setViewFilter('unselected')}
                className={`px-3 py-1 rounded-md font-medium transition-colors ${
                  viewFilter === 'unselected'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Unselected / Incomplete (
                {unselectedSkills.length + (inputMode === 'checkbox' ? partiallySelectedSkills.length : 0)})
              </button>
            </div>

            <div className="text-[11px] text-stone-500">
              Skills listed vertically on the left · Competition levels (Screening, District, Zonal, State) on the right
            </div>
          </div>
        </div>

        {/* Sticky Column Header Row */}
        <div className="grid grid-cols-12 items-center bg-[#0e5774] text-white text-xs font-semibold px-4 sm:px-6 py-3 sticky top-0 z-10">
          <div className="col-span-12 sm:col-span-5 flex items-center justify-between pr-2">
            <span>Skill / Trade Name (Vertical List)</span>
          </div>

          <div className="col-span-12 sm:col-span-7 grid grid-cols-4 sm:grid-cols-5 gap-2 mt-2 sm:mt-0 text-center">
            {COMPETITION_LEVELS.map((level) => {
              const allVisibleHaveLevel =
                visibleSkills.length > 0 &&
                visibleSkills.every((s) => (skillSelections[s] || []).includes(level));
              return (
                <button
                  key={level}
                  type="button"
                  onClick={() => handleToggleColumn(level, visibleSkills)}
                  title={`Toggle ${level} level for all visible skills`}
                  className="flex flex-col items-center justify-center py-1 px-1 rounded hover:bg-[#0a4258] transition-colors cursor-pointer"
                >
                  <span className="text-[11px] sm:text-xs font-semibold tracking-wide">{level}</span>
                  <span className="text-[10px] text-stone-400 font-normal">
                    {allVisibleHaveLevel ? 'Clear Col' : 'Select Col'}
                  </span>
                </button>
              );
            })}

            {inputMode === 'checkbox' && (
              <div className="hidden sm:flex flex-col items-center justify-center text-[11px] text-amber-300">
                <span>All 4</span>
                <span className="text-[10px] text-stone-400 font-normal">Row Toggle</span>
              </div>
            )}
          </div>
        </div>

        {/* Vertical Skills List */}
        <div className="relative divide-y divide-stone-200 max-h-[640px] overflow-y-auto">
          {visibleSkills.length === 0 ? (
            <div className="p-10 text-center text-xs text-stone-500">
              No skills match the current filter.
            </div>
          ) : (
            visibleSkills.map((skill) => {
              const originalIndex = ALL_TRADES.indexOf(skill) + 1;
              const selectedLevels = skillSelections[skill] || [];
              const hasAnySelection = selectedLevels.length > 0;
              const hasAllFour = selectedLevels.length === COMPETITION_LEVELS.length;

              return (
                <div
                  key={skill}
                  className={`grid grid-cols-12 items-center px-4 sm:px-6 py-3 text-xs transition-colors ${
                    hasAnySelection ? 'bg-stone-50/90 hover:bg-stone-100/70' : 'bg-white hover:bg-stone-50/50'
                  }`}
                >
                  {/* Left Side: Skill Name Vertically Listed */}
                  <div className="col-span-12 sm:col-span-5 flex items-center justify-between pr-3 mb-2 sm:mb-0">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="font-mono-num text-[11px] text-stone-400 w-6 shrink-0">
                        {String(originalIndex).padStart(2, '0')}.
                      </span>
                      <div className="min-w-0">
                        <span
                          className={`block truncate ${
                            hasAnySelection ? 'font-semibold text-stone-900' : 'font-medium text-stone-700'
                          }`}
                        >
                          {skill}
                        </span>
                        <span className="text-[11px] text-stone-500">
                          {selectedLevels.length === 0
                            ? 'No level selected'
                            : `${selectedLevels.join(' · ')}`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Radio Buttons or Tick Boxes for Screening, District, Zonal, State */}
                  <div className="col-span-12 sm:col-span-7 grid grid-cols-4 sm:grid-cols-5 gap-2 items-center">
                    {COMPETITION_LEVELS.map((level) => {
                      const isChecked = selectedLevels.includes(level);
                      return (
                        <button
                          key={level}
                          type="button"
                          onClick={() => handleToggleLevel(skill, level)}
                          className={`relative min-h-[40px] px-2 py-1.5 rounded-lg border flex items-center justify-center gap-1.5 cursor-pointer select-none transition-all ${
                            isChecked
                              ? 'border-[#0e5774] bg-[#0e5774] text-white font-semibold shadow-xs'
                              : 'border-stone-200 bg-white hover:border-stone-400 text-stone-700'
                          }`}
                        >
                          {inputMode === 'radio' ? (
                            <span
                              className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                                isChecked ? 'border-white bg-white' : 'border-stone-400 bg-white'
                              }`}
                            >
                              {isChecked && <span className="w-1.5 h-1.5 rounded-full bg-[#0e5774]" />}
                            </span>
                          ) : (
                            <span
                              className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                                isChecked ? 'border-white bg-white text-stone-900' : 'border-stone-300 bg-white'
                              }`}
                            >
                              {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                            </span>
                          )}
                          <span className="text-[11px] truncate">{level}</span>
                        </button>
                      );
                    })}

                    {/* Quick Row Toggle for All 4 Levels */}
                    {inputMode === 'checkbox' && (
                      <button
                        type="button"
                        onClick={() => handleToggleAllLevelsForSkill(skill)}
                        className={`hidden sm:flex min-h-[40px] px-2 py-1.5 rounded-lg border text-[11px] font-medium items-center justify-center transition-colors ${
                          hasAllFour
                            ? 'border-emerald-700 bg-emerald-50 text-emerald-900 font-semibold'
                            : 'border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-600'
                        }`}
                      >
                        {hasAllFour ? 'All 4 ✓' : 'All 4'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Submit Bar */}
        <div className="p-5 sm:p-6 bg-stone-50 border-t border-stone-200 space-y-4">
          {submissionError && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block">Submission Error:</strong>
                <span>{submissionError}</span>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="text-xs text-stone-600 space-y-0.5">
              <div className="font-semibold text-stone-900">
                Summary: {selectedSkillEntries.length} of {ALL_TRADES.length} Skills Configured
              </div>
              <div>
                Fully Configured (All 4 Levels): <strong className="font-mono-num">{fullySelectedSkillsCount}</strong>
                <span aria-hidden="true"> · </span>
                Partially Configured: <strong className="font-mono-num">{partiallySelectedSkills.length}</strong>
                <span aria-hidden="true"> · </span>
                Unselected Skills: <strong className="font-mono-num">{unselectedSkills.length}</strong>
              </div>
            </div>

            <button
              type="button"
              onClick={handleInitiateSubmit}
              disabled={isSubmitting}
              className="w-full sm:w-auto px-8 py-3 bg-[#0e5774] hover:bg-[#0a4258] disabled:opacity-50 text-white font-semibold text-xs rounded-lg transition-all shadow-sm flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting Question Paper Matrix...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Submit Question Paper Preparation</span>
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* =====================================================================
          VALIDATION PROMPT MODAL FOR UNSELECTED SKILLS OR LEVEL OPTIONS
          ===================================================================== */}
      {isValidationModalOpen && (
        <div className="fixed inset-0 bg-[#0e5774]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-stone-200 overflow-hidden my-8">
            {/* Modal Header */}
            <div className="bg-[#0e5774] text-white p-5 sm:p-6 border-b border-stone-800">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0 border border-amber-400/30 mt-0.5">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-300 block">
                    Pre-Submission Verification Prompt
                  </span>
                  <h3 className="text-lg font-serif-inst font-semibold mt-0.5">
                    Review Unselected Skills & Competition Level Options
                  </h3>
                  <p className="text-xs text-stone-300 mt-1 leading-relaxed">
                    Some skills or competition level options (Screening, District, Zonal, State) are currently unselected. Please confirm whether they were <strong>intentionally skipped</strong> or <strong>accidentally missed</strong> before finalizing your submission.
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 space-y-4 max-h-[60vh] overflow-y-auto text-xs">
              {/* Status Overview Row */}
              <div className="grid grid-cols-3 gap-3 p-3.5 bg-stone-50 rounded-lg border border-stone-200 text-center">
                <div>
                  <span className="text-stone-500 block text-[11px]">Selected Skills</span>
                  <span className="font-mono-num text-base font-bold text-emerald-800">
                    {selectedSkillEntries.length}
                  </span>
                </div>
                <div>
                  <span className="text-stone-500 block text-[11px]">Partially Selected</span>
                  <span className="font-mono-num text-base font-bold text-amber-700">
                    {partiallySelectedSkills.length}
                  </span>
                </div>
                <div>
                  <span className="text-stone-500 block text-[11px]">Unselected Skills</span>
                  <span className="font-mono-num text-base font-bold text-rose-700">
                    {unselectedSkills.length}
                  </span>
                </div>
              </div>

              {/* 1. Partially Configured Skills (Some Levels Unselected) */}
              {inputMode === 'checkbox' && partiallySelectedSkills.length > 0 && (
                <div className="border border-amber-200 bg-amber-50/50 rounded-lg p-4 space-y-2.5">
                  <div className="font-semibold text-amber-950 flex items-center justify-between">
                    <span>
                      Skills with Unselected Level Options ({partiallySelectedSkills.length})
                    </span>
                    <span className="text-[11px] font-normal text-amber-800">
                      Missing Screening, District, Zonal, or State
                    </span>
                  </div>
                  <div className="divide-y divide-amber-200/60 max-h-40 overflow-y-auto pr-1">
                    {partiallySelectedSkills.map((item) => (
                      <div
                        key={item.skill}
                        className="py-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                      >
                        <div>
                          <div className="font-semibold text-stone-900">{item.skill}</div>
                          <div className="text-[11px] text-stone-600">
                            Selected: <strong className="text-emerald-800">{item.selected.join(', ')}</strong>
                            <span aria-hidden="true"> · </span>
                            Unselected: <strong className="text-rose-700">{item.missing.join(', ')}</strong>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggleAllLevelsForSkill(item.skill)}
                          className="self-start sm:self-auto px-2.5 py-1 bg-white border border-amber-300 hover:bg-amber-100 text-amber-950 rounded text-[11px] font-medium shrink-0"
                        >
                          + Select All 4 Levels
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. Completely Unselected Skills */}
              {unselectedSkills.length > 0 && (
                <div className="border border-stone-200 bg-stone-50 rounded-lg p-4 space-y-2">
                  <div className="font-semibold text-stone-900 flex items-center justify-between">
                    <span>Completely Unselected Skills ({unselectedSkills.length} of 63)</span>
                    <span className="text-[11px] font-normal text-stone-500">
                      0 competition levels selected
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-600 leading-relaxed max-h-32 overflow-y-auto">
                    {unselectedSkills.join(' · ')}
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 sm:p-5 bg-stone-50 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsValidationModalOpen(false);
                  setViewFilter('unselected');
                }}
                className="w-full sm:w-auto px-4 py-2.5 border border-stone-300 bg-white hover:bg-stone-100 text-stone-800 text-xs font-semibold rounded-lg transition-colors"
              >
                Accidentally Missed — Go Back & Review
              </button>

              <button
                type="button"
                onClick={handleConfirmAndFinalizeSubmit}
                className="w-full sm:w-auto px-6 py-2.5 bg-[#0e5774] hover:bg-[#0a4258] text-white text-xs font-semibold rounded-lg transition-colors shadow-xs flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Intentionally Skipped — Finalize & Submit</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
