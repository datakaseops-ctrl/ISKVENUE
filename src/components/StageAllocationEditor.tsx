import React, { useState } from 'react';
import { 
  Building2, 
  User, 
  Phone, 
  Mail, 
  Coins, 
  Plus, 
  Trash2, 
  Layers, 
  Check, 
  AlertCircle, 
  Copy,
  ChevronDown
} from 'lucide-react';
import { VenueAllocation } from '../types';
import { STANDARD_DISTRICTS, STANDARD_ZONES } from '../data/trades';
import { formatIndianCurrency, numberToIndianWords } from '../utils/numberToWords';

interface StageAllocationEditorProps {
  stage: 'screening' | 'district' | 'zonal';
  stageTitle: string;
  stageSubtitle: string;
  selectedTrades: string[];
  allocations: VenueAllocation[];
  onChangeAllocations: (allocations: VenueAllocation[]) => void;
  previousStageAllocations?: VenueAllocation[];
}

export const StageAllocationEditor: React.FC<StageAllocationEditorProps> = ({
  stage,
  stageTitle,
  stageSubtitle,
  selectedTrades,
  allocations,
  onChangeAllocations,
  previousStageAllocations
}) => {
  const [poolingMode, setPoolingMode] = useState<'individual' | 'single_pool' | 'custom_pools'>('individual');

  // Helper to generate a new empty allocation
  const createEmptyAllocation = (skills: string[], defaultName = ''): VenueAllocation => ({
    id: `${stage}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    stage,
    stageLabel: stage === 'screening' ? 'Screening Level' : stage === 'district' ? 'District Level' : 'Zonal Level',
    districtOrZoneName: stage === 'district' ? 'Central District / Metro Division' : stage === 'zonal' ? 'Central Zone' : undefined,
    skills,
    questionPaper: 'Standard Directorate Blueprint',
    venueName: '',
    coordinatingOfficer: '',
    contactPhone: '',
    email: '',
    estimatedAmount: ''
  });

  // Switch pooling mode and re-distribute skills
  const handleSetPoolingMode = (mode: 'individual' | 'single_pool' | 'custom_pools') => {
    setPoolingMode(mode);
    if (mode === 'single_pool') {
      // Single pool with all selected trades
      const pooled: VenueAllocation = {
        id: `${stage}-single-pool-${Date.now()}`,
        stage,
        stageLabel: stage === 'screening' ? 'Screening Level' : stage === 'district' ? 'District Level' : 'Zonal Level',
        districtOrZoneName: stage === 'district' ? STANDARD_DISTRICTS[0] : stage === 'zonal' ? STANDARD_ZONES[0] : undefined,
        skills: [...selectedTrades],
        questionPaper: 'Standard Directorate Blueprint',
        venueName: allocations[0]?.venueName || '',
        coordinatingOfficer: allocations[0]?.coordinatingOfficer || '',
        contactPhone: allocations[0]?.contactPhone || '',
        email: allocations[0]?.email || '',
        estimatedAmount: allocations[0]?.estimatedAmount || ''
      };
      onChangeAllocations([pooled]);
    } else if (mode === 'individual') {
      // Individual allocation per trade
      const individualList: VenueAllocation[] = selectedTrades.map((trade, idx) => ({
        id: `${stage}-ind-${idx}-${Date.now()}`,
        stage,
        stageLabel: stage === 'screening' ? 'Screening Level' : stage === 'district' ? 'District Level' : 'Zonal Level',
        districtOrZoneName: stage === 'district' ? STANDARD_DISTRICTS[idx % STANDARD_DISTRICTS.length] : stage === 'zonal' ? STANDARD_ZONES[0] : undefined,
        skills: [trade],
        questionPaper: 'Standard Directorate Blueprint',
        venueName: '',
        coordinatingOfficer: '',
        contactPhone: '',
        email: '',
        estimatedAmount: ''
      }));
      onChangeAllocations(individualList);
    }
  };

  // Update specific allocation field
  const handleUpdateField = (id: string, field: keyof VenueAllocation, value: any) => {
    const updated = allocations.map(a => {
      if (a.id === id) {
        return { ...a, [field]: value };
      }
      return a;
    });
    onChangeAllocations(updated);
  };

  // Toggle trade in custom pool
  const handleToggleTradeInAllocation = (allocId: string, trade: string) => {
    const updated = allocations.map(a => {
      if (a.id === allocId) {
        const hasTrade = a.skills.includes(trade);
        let newSkills = hasTrade 
          ? a.skills.filter(t => t !== trade) 
          : [...a.skills, trade];
        return { ...a, skills: newSkills };
      }
      return a;
    });
    onChangeAllocations(updated);
  };

  // Add a new custom venue pool
  const handleAddCustomPool = () => {
    // Find unassigned trades
    const assignedTrades = new Set(allocations.flatMap(a => a.skills));
    const unassigned = selectedTrades.filter(t => !assignedTrades.has(t));
    const newPool = createEmptyAllocation(unassigned.length > 0 ? [unassigned[0]] : [selectedTrades[0]]);
    onChangeAllocations([...allocations, newPool]);
  };

  // Remove a venue allocation
  const handleRemoveAllocation = (id: string) => {
    if (allocations.length <= 1) return;
    onChangeAllocations(allocations.filter(a => a.id !== id));
  };

  // Clone from previous stage
  const handleCloneFromPrevious = () => {
    if (!previousStageAllocations || previousStageAllocations.length === 0) return;
    const cloned = previousStageAllocations.map(prev => ({
      ...prev,
      id: `${stage}-cloned-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      stage,
      stageLabel: stage === 'district' ? 'District Level' : 'Zonal Level',
      districtOrZoneName: stage === 'district' ? STANDARD_DISTRICTS[0] : STANDARD_ZONES[0]
    }));
    onChangeAllocations(cloned);
  };

  // Total amount for this stage
  const stageTotalCost = allocations.reduce((sum, a) => sum + (Number(a.estimatedAmount) || 0), 0);

  return (
    <div className="space-y-6">
      
      {/* Stage Header & Pooling Strategy Bar */}
      <div className="bg-white border border-stone-200 rounded-xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-stone-200 pb-4 mb-4 gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-stone-500 mb-0.5">
              <span>Competition Tier</span>
              <span aria-hidden="true">•</span>
              <span>{stage === 'screening' ? 'Stage 1 of 3' : stage === 'district' ? 'Stage 2 of 3' : 'Stage 3 of 3'}</span>
            </div>
            <h2 className="text-xl font-serif-inst font-semibold text-stone-900">
              {stageTitle}
            </h2>
            <p className="text-xs text-stone-600 mt-0.5">
              {stageSubtitle}
            </p>
          </div>

          <div className="text-right">
            <span className="text-[11px] text-stone-500 uppercase tracking-wider block">Stage Allocation Total</span>
            <span className="font-mono-num text-base font-bold text-stone-900">
              {formatIndianCurrency(stageTotalCost)}
            </span>
          </div>
        </div>

        {/* Venue Pooling Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-stone-800">Venue Pooling Strategy:</span>
            <div className="inline-flex rounded-lg border border-stone-200 bg-stone-50 p-1 text-xs">
              <button
                type="button"
                onClick={() => handleSetPoolingMode('individual')}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  poolingMode === 'individual' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Individual per Skill ({selectedTrades.length})
              </button>
              <button
                type="button"
                onClick={() => handleSetPoolingMode('single_pool')}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  poolingMode === 'single_pool' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Single Pooled Venue (All Skills)
              </button>
              <button
                type="button"
                onClick={() => handleSetPoolingMode('custom_pools')}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  poolingMode === 'custom_pools' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Custom Clusters
              </button>
            </div>
          </div>

          {previousStageAllocations && previousStageAllocations.length > 0 && (
            <button
              type="button"
              onClick={handleCloneFromPrevious}
              className="text-xs text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 self-start sm:self-auto transition-colors"
            >
              <Copy className="w-3.5 h-3.5 text-stone-500" />
              <span>Copy venues from previous stage</span>
            </button>
          )}
        </div>
      </div>

      {/* Allocations List */}
      <div className="space-y-5">
        {allocations.map((alloc, index) => {
          const isPooled = alloc.skills.length > 1;

          return (
            <div 
              key={alloc.id}
              className="bg-white border border-stone-200 rounded-xl p-5 sm:p-6 shadow-xs relative space-y-4"
            >
              {/* Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-stone-100 pb-3 gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-md bg-stone-900 text-white text-xs font-mono font-bold flex items-center justify-center">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-stone-900">
                      {isPooled ? `Pooled Venue (${alloc.skills.length} Skills Catered)` : `Skill Venue: ${alloc.skills[0] || 'Unassigned'}`}
                    </h3>
                    <p className="text-[11px] text-stone-500">
                      {stage === 'district' ? 'District Level Jurisdiction' : stage === 'zonal' ? 'Zonal Level Jurisdiction' : 'Institutional Screening'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {allocations.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveAllocation(alloc.id)}
                      className="text-stone-400 hover:text-rose-600 p-1.5 rounded-md transition-colors"
                      title="Remove venue allocation"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Pooled Skills Selector (if multiple skills or custom pooling) */}
              {(poolingMode === 'custom_pools' || isPooled) && (
                <div className="bg-stone-50 border border-stone-200 rounded-lg p-3 text-xs space-y-2">
                  <span className="font-semibold text-stone-800 block text-[11px] uppercase tracking-wider">
                    Skills Catered in this Venue (Select to Pool):
                  </span>
                  <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                    {selectedTrades.map((trade) => {
                      const isIncluded = alloc.skills.includes(trade);
                      return (
                        <button
                          key={trade}
                          type="button"
                          onClick={() => handleToggleTradeInAllocation(alloc.id, trade)}
                          className={`px-2 py-1 rounded text-xs transition-colors flex items-center gap-1 ${
                            isIncluded 
                              ? 'bg-stone-900 text-white font-medium' 
                              : 'bg-white border border-stone-300 text-stone-600 hover:border-stone-400'
                          }`}
                        >
                          {isIncluded && <Check className="w-3 h-3 text-emerald-400" />}
                          <span>{trade}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Form Input Fields Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                
                {/* District or Zone Selection (Only for District / Zonal stages) */}
                {stage === 'district' && (
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-stone-800 mb-1">
                      Assigned District <span className="text-rose-600">*</span>
                    </label>
                    <select
                      value={alloc.districtOrZoneName || STANDARD_DISTRICTS[0]}
                      onChange={(e) => handleUpdateField(alloc.id, 'districtOrZoneName', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg outline-none focus:border-stone-900"
                    >
                      {STANDARD_DISTRICTS.map(dist => (
                        <option key={dist} value={dist}>{dist}</option>
                      ))}
                    </select>
                  </div>
                )}

                {stage === 'zonal' && (
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-stone-800 mb-1">
                      Assigned Zone <span className="text-rose-600">*</span>
                    </label>
                    <select
                      value={alloc.districtOrZoneName || STANDARD_ZONES[0]}
                      onChange={(e) => handleUpdateField(alloc.id, 'districtOrZoneName', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg outline-none focus:border-stone-900"
                    >
                      {STANDARD_ZONES.map(zone => (
                        <option key={zone} value={zone}>{zone}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Proposed Venue / Institution Name */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-stone-800 mb-1">
                    Proposed Host Institution / Venue Name <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-stone-400 absolute left-3 top-2.5 pointer-events-none" />
                    <input
                      type="text"
                      value={alloc.venueName}
                      onChange={(e) => handleUpdateField(alloc.id, 'venueName', e.target.value)}
                      placeholder="e.g. Government Polytechnic College, Central Workshops Campus"
                      className="w-full pl-9 pr-3 py-2 bg-white border border-stone-300 rounded-lg outline-none focus:border-stone-900"
                    />
                  </div>
                </div>

                {/* Coordinating Officer Name */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-stone-800 mb-1">
                    Nodal / Coordinating Officer Name <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-stone-400 absolute left-3 top-2.5 pointer-events-none" />
                    <input
                      type="text"
                      value={alloc.coordinatingOfficer}
                      onChange={(e) => handleUpdateField(alloc.id, 'coordinatingOfficer', e.target.value)}
                      placeholder="e.g. Dr. Rajesh K. Sharma, Principal / Head of Section"
                      className="w-full pl-9 pr-3 py-2 bg-white border border-stone-300 rounded-lg outline-none focus:border-stone-900"
                    />
                  </div>
                </div>

                {/* Contact Phone (10 digits) */}
                <div>
                  <label className="block text-xs font-semibold text-stone-800 mb-1">
                    Contact Phone / Mobile <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-stone-500 font-medium">+91</span>
                    <input
                      type="tel"
                      maxLength={10}
                      value={alloc.contactPhone}
                      onChange={(e) => {
                        const clean = e.target.value.replace(/\D/g, '').slice(0, 10);
                        handleUpdateField(alloc.id, 'contactPhone', clean);
                      }}
                      placeholder="9876543210"
                      className="w-full pl-12 pr-3 py-2 bg-white border border-stone-300 rounded-lg outline-none font-mono-num focus:border-stone-900"
                    />
                  </div>
                </div>

                {/* Official Email */}
                <div>
                  <label className="block text-xs font-semibold text-stone-800 mb-1">
                    Official Email <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-2.5 pointer-events-none" />
                    <input
                      type="email"
                      value={alloc.email}
                      onChange={(e) => handleUpdateField(alloc.id, 'email', e.target.value)}
                      placeholder="officer.nodal@polytechnic.gov.in"
                      className="w-full pl-9 pr-3 py-2 bg-white border border-stone-300 rounded-lg outline-none focus:border-stone-900"
                    />
                  </div>
                </div>

                {/* Estimated Amount / Cost */}
                <div className="md:col-span-2 bg-stone-50/70 p-3.5 rounded-lg border border-stone-200">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-stone-800">
                      Estimated Execution Budget <span className="text-rose-600">*</span>
                    </label>
                    <span className="font-mono-num font-semibold text-stone-900 text-xs">
                      {alloc.estimatedAmount ? formatIndianCurrency(Number(alloc.estimatedAmount)) : '₹0'}
                    </span>
                  </div>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center font-semibold text-stone-600">₹</span>
                    <input
                      type="number"
                      min="0"
                      step="500"
                      value={alloc.estimatedAmount}
                      onChange={(e) => handleUpdateField(alloc.id, 'estimatedAmount', e.target.value ? Number(e.target.value) : '')}
                      placeholder="180000"
                      className="w-full pl-7 pr-16 py-2 bg-white border border-stone-300 rounded-lg outline-none font-mono-num focus:border-stone-900"
                    />
                    <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-stone-400 text-xs pointer-events-none">
                      INR
                    </span>
                  </div>
                  {alloc.estimatedAmount && Number(alloc.estimatedAmount) > 0 && (
                    <div className="mt-1.5 text-[11px] font-serif-inst italic text-stone-600">
                      Amount in Words: <span className="font-semibold text-stone-800 not-italic">{numberToIndianWords(Number(alloc.estimatedAmount))}</span>
                    </div>
                  )}
                </div>

              </div>
            </div>
          );
        })}
      </div>

      {/* Add Custom Pool Button */}
      {poolingMode === 'custom_pools' && (
        <button
          type="button"
          onClick={handleAddCustomPool}
          className="w-full py-2.5 border-2 border-dashed border-stone-300 hover:border-stone-400 bg-stone-50 hover:bg-stone-100 text-stone-700 text-xs font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Another Pooled Venue</span>
        </button>
      )}

    </div>
  );
};
