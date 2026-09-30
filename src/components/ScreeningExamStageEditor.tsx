import React, { useState } from 'react';
import { 
  Building2, 
  User, 
  Monitor, 
  Wifi, 
  Plus, 
  Trash2, 
  Check, 
  MapPin
} from 'lucide-react';
import { VenueAllocation } from '../types';
import { STANDARD_DISTRICTS, DISTRICT_TALUKS } from '../data/trades';
import { formatIndianCurrency, numberToIndianWords } from '../utils/numberToWords';

interface ScreeningExamStageEditorProps {
  selectedTrades: string[];
  allocations: VenueAllocation[];
  onChangeAllocations: (allocations: VenueAllocation[]) => void;
}

export const ScreeningExamStageEditor: React.FC<ScreeningExamStageEditorProps> = ({
  selectedTrades,
  allocations,
  onChangeAllocations
}) => {
  const [activeDistrictFilter, setActiveDistrictFilter] = useState<string>('all');
  const [selectedDistrictToAdd, setSelectedDistrictToAdd] = useState<string>(STANDARD_DISTRICTS[0]);
  const [selectedTalukToAdd, setSelectedTalukToAdd] = useState<string>(
    DISTRICT_TALUKS[STANDARD_DISTRICTS[0]]?.[0] || ''
  );

  const handleDistrictToAddChange = (districtName: string) => {
    setSelectedDistrictToAdd(districtName);
    const taluks = DISTRICT_TALUKS[districtName] || [];
    setSelectedTalukToAdd(taluks[0] || '');
  };

  // Create an empty exam center allocation for a specific district & taluk
  const handleAddVenueForDistrict = (districtName: string, talukName?: string) => {
    const defaultTaluk = talukName || DISTRICT_TALUKS[districtName]?.[0] || '';
    const newAlloc: VenueAllocation = {
      id: `screening-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      stage: 'screening',
      stageLabel: 'Screening Level (Online Exam)',
      districtOrZoneName: districtName,
      talukName: defaultTaluk,
      skills: [...selectedTrades], // Default to catering all selected skills in this exam center
      venueName: '',
      coordinatingOfficer: '',
      contactPhone: '',
      email: '',
      estimatedAmount: '',
      numberOfComputers: '',
      connectivityDetails: ''
    };
    onChangeAllocations([...allocations, newAlloc]);
  };

  // Update allocation field
  const handleUpdateField = (id: string, field: keyof VenueAllocation, value: any) => {
    const updated = allocations.map(a => {
      if (a.id === id) {
        if (field === 'districtOrZoneName') {
          const defaultTaluk = DISTRICT_TALUKS[value]?.[0] || '';
          return { ...a, districtOrZoneName: value, talukName: defaultTaluk };
        }
        return { ...a, [field]: value };
      }
      return a;
    });
    onChangeAllocations(updated);
  };

  // Toggle trade in exam center
  const handleToggleTrade = (allocId: string, trade: string) => {
    const updated = allocations.map(a => {
      if (a.id === allocId) {
        const has = a.skills.includes(trade);
        const newSkills = has ? a.skills.filter(t => t !== trade) : [...a.skills, trade];
        return { ...a, skills: newSkills };
      }
      return a;
    });
    onChangeAllocations(updated);
  };

  // Select all trades for an exam center
  const handlePoolAllTrades = (allocId: string) => {
    const updated = allocations.map(a => {
      if (a.id === allocId) {
        return { ...a, skills: [...selectedTrades] };
      }
      return a;
    });
    onChangeAllocations(updated);
  };

  // Remove exam center
  const handleRemoveAllocation = (id: string) => {
    if (allocations.length <= 1) return;
    onChangeAllocations(allocations.filter(a => a.id !== id));
  };

  // Group allocations by district
  const distinctDistricts: string[] = Array.from(
    new Set(allocations.map(a => a.districtOrZoneName || STANDARD_DISTRICTS[0]))
  );

  // Aggregate stats
  const totalComputers = allocations.reduce((sum, a) => sum + (Number(a.numberOfComputers) || 0), 0);
  const totalScreeningBudget = allocations.reduce((sum, a) => sum + (Number(a.estimatedAmount) || 0), 0);

  // Filtered view
  const visibleAllocations = activeDistrictFilter === 'all' 
    ? allocations 
    : allocations.filter(a => a.districtOrZoneName === activeDistrictFilter);

  const addBarTaluks = DISTRICT_TALUKS[selectedDistrictToAdd] || [];

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white border border-stone-200 rounded-xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-stone-200 pb-4 mb-4 gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-stone-500 mb-0.5">
              <span>Step 2 of 2</span>
              <span aria-hidden="true">•</span>
              <span>Online Examination Center Infrastructure</span>
            </div>
            <h2 className="text-xl font-serif-inst font-semibold text-stone-900">
              District & Taluk Online Exam Center Allotment
            </h2>
            <p className="text-xs text-stone-600 mt-0.5">
              Allot institutional exam centers against districts and taluks. Specify available computer terminals, network connectivity, and nodal officer details.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] text-stone-500 uppercase tracking-wider block">Total Computers</span>
              <span className="font-mono-num text-base font-bold text-indigo-900">
                {totalComputers} Systems
              </span>
            </div>
            <div className="text-right border-l border-stone-200 pl-3">
              <span className="text-[10px] text-stone-500 uppercase tracking-wider block">Total Budget</span>
              <span className="font-mono-num text-base font-bold text-stone-900">
                {formatIndianCurrency(totalScreeningBudget)}
              </span>
            </div>
          </div>
        </div>

        {/* Add District & Taluk Control Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-stone-50 p-3 rounded-lg border border-stone-200 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <MapPin className="w-4 h-4 text-stone-600 shrink-0" />
            <span className="font-semibold text-stone-800">Allot Venue in:</span>
            <select
              value={selectedDistrictToAdd}
              onChange={(e) => handleDistrictToAddChange(e.target.value)}
              aria-label="Select District"
              className="px-2.5 py-1.5 bg-white border border-stone-300 rounded-md font-medium text-xs text-stone-800 outline-none focus:border-stone-900"
            >
              {STANDARD_DISTRICTS.map(dist => (
                <option key={dist} value={dist}>{dist}</option>
              ))}
            </select>
            <select
              value={selectedTalukToAdd}
              onChange={(e) => setSelectedTalukToAdd(e.target.value)}
              aria-label="Select Taluk"
              className="px-2.5 py-1.5 bg-white border border-stone-300 rounded-md font-medium text-xs text-stone-800 outline-none focus:border-stone-900"
            >
              {addBarTaluks.map(taluk => (
                <option key={taluk} value={taluk}>{taluk} Taluk</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => handleAddVenueForDistrict(selectedDistrictToAdd, selectedTalukToAdd)}
              className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-md font-medium text-xs flex items-center gap-1 shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Allot Exam Venue</span>
            </button>
          </div>

          {/* Filter by district pill bar */}
          {distinctDistricts.length > 1 && (
            <div className="flex items-center gap-1 overflow-x-auto max-w-full">
              <span className="text-stone-500 text-[11px] whitespace-nowrap">Filter:</span>
              <button
                type="button"
                onClick={() => setActiveDistrictFilter('all')}
                className={`px-2 py-0.5 rounded text-[11px] whitespace-nowrap font-medium ${
                  activeDistrictFilter === 'all' ? 'bg-stone-900 text-white' : 'bg-white text-stone-700 border border-stone-300'
                }`}
              >
                All ({allocations.length})
              </button>
              {distinctDistricts.map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setActiveDistrictFilter(d)}
                  className={`px-2 py-0.5 rounded text-[11px] whitespace-nowrap font-medium ${
                    activeDistrictFilter === d ? 'bg-stone-900 text-white' : 'bg-white text-stone-700 border border-stone-300'
                  }`}
                >
                  {d} ({allocations.filter(a => a.districtOrZoneName === d).length})
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Venues List per District & Taluk */}
      <div className="space-y-5">
        {visibleAllocations.map((alloc, index) => {
          const currentDistrict = alloc.districtOrZoneName || STANDARD_DISTRICTS[0];
          const availableTaluks = DISTRICT_TALUKS[currentDistrict] || [];
          const currentTaluk = alloc.talukName || availableTaluks[0] || '';

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
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-indigo-50 text-indigo-900 border border-indigo-200">
                        <MapPin className="w-3 h-3 mr-1 text-indigo-600" />
                        {currentDistrict} {currentTaluk ? `• ${currentTaluk} Taluk` : ''}
                      </span>
                      <span className="text-xs font-semibold text-stone-900">
                        {alloc.venueName || 'Online Exam Center (Venue TBD)'}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      Online Examination Center & Lab Infrastructure
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {allocations.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveAllocation(alloc.id)}
                      className="text-stone-400 hover:text-rose-600 p-1.5 rounded-md transition-colors"
                      title="Remove exam center"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Form Input Fields Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                
                {/* District Selector */}
                <div>
                  <label className="block text-xs font-semibold text-stone-800 mb-1">
                    District Jurisdiction <span className="text-rose-600">*</span>
                  </label>
                  <select
                    value={currentDistrict}
                    onChange={(e) => handleUpdateField(alloc.id, 'districtOrZoneName', e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg outline-none focus:border-stone-900"
                  >
                    {STANDARD_DISTRICTS.map(dist => (
                      <option key={dist} value={dist}>{dist}</option>
                    ))}
                  </select>
                </div>

                {/* Taluk Selector */}
                <div>
                  <label className="block text-xs font-semibold text-stone-800 mb-1">
                    Taluk <span className="text-rose-600">*</span>
                  </label>
                  <select
                    value={currentTaluk}
                    onChange={(e) => handleUpdateField(alloc.id, 'talukName', e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg outline-none focus:border-stone-900"
                  >
                    {availableTaluks.map(taluk => (
                      <option key={taluk} value={taluk}>{taluk}</option>
                    ))}
                  </select>
                </div>

                {/* Host Institution / Exam Center Name */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-stone-800 mb-1">
                    Allotted Exam Center / Institution Name <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-stone-400 absolute left-3 top-2.5 pointer-events-none" />
                    <input
                      type="text"
                      value={alloc.venueName}
                      onChange={(e) => handleUpdateField(alloc.id, 'venueName', e.target.value)}
                      placeholder="e.g. Government Engineering College, Computer Science & IT Block"
                      className="w-full pl-9 pr-3 py-2 bg-white border border-stone-300 rounded-lg outline-none focus:border-stone-900"
                    />
                  </div>
                </div>

                {/* NUMBER OF COMPUTERS AVAILABLE */}
                <div className="bg-indigo-50/50 p-3 rounded-lg border border-indigo-100">
                  <label className="block text-xs font-semibold text-indigo-950 mb-1">
                    Number of Computers Available <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative">
                    <Monitor className="w-4 h-4 text-indigo-500 absolute left-3 top-2.5 pointer-events-none" />
                    <input
                      type="number"
                      min="1"
                      value={alloc.numberOfComputers || ''}
                      onChange={(e) => handleUpdateField(alloc.id, 'numberOfComputers', e.target.value ? Number(e.target.value) : '')}
                      placeholder="Enter number of working PCs"
                      className="w-full pl-9 pr-14 py-2 bg-white border border-indigo-200 rounded-lg outline-none font-mono-num focus:border-indigo-600"
                    />
                    <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-[11px] text-indigo-600 font-semibold pointer-events-none">
                      PCs / Nodes
                    </span>
                  </div>
                  <p className="text-[10px] text-indigo-700 mt-1">
                    Total working online terminals available to seat candidates simultaneously.
                  </p>
                </div>

                {/* CONNECTIVITY & LAB INFRASTRUCTURE DETAILS */}
                <div className="bg-amber-50/50 p-3 rounded-lg border border-amber-100">
                  <label className="block text-xs font-semibold text-amber-950 mb-1">
                    Network Connectivity & Power Backup Details <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative">
                    <Wifi className="w-4 h-4 text-amber-600 absolute left-3 top-2.5 pointer-events-none" />
                    <input
                      type="text"
                      value={alloc.connectivityDetails || ''}
                      onChange={(e) => handleUpdateField(alloc.id, 'connectivityDetails', e.target.value)}
                      placeholder="Enter bandwidth, LAN & UPS/Generator details"
                      className="w-full pl-9 pr-3 py-2 bg-white border border-amber-200 rounded-lg outline-none text-xs focus:border-amber-600"
                    />
                  </div>
                  <p className="text-[10px] text-amber-700 mt-1">
                    Bandwidth speed, LAN configuration, and power backup capability for the online exam.
                  </p>
                </div>

                {/* Coordinating Officer Name */}
                <div>
                  <label className="block text-xs font-semibold text-stone-800 mb-1">
                    Center Superintendent / Nodal Officer Name <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-stone-400 absolute left-3 top-2.5 pointer-events-none" />
                    <input
                      type="text"
                      value={alloc.coordinatingOfficer}
                      onChange={(e) => handleUpdateField(alloc.id, 'coordinatingOfficer', e.target.value)}
                      placeholder="e.g. Prof. Anand V. Menon, Chief Superintendent"
                      className="w-full pl-9 pr-3 py-2 bg-white border border-stone-300 rounded-lg outline-none focus:border-stone-900"
                    />
                  </div>
                </div>

                {/* Contact Phone & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-stone-800 mb-1">
                      Contact Mobile <span className="text-rose-600">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-stone-500 font-medium text-[11px]">+91</span>
                      <input
                        type="tel"
                        maxLength={10}
                        value={alloc.contactPhone}
                        onChange={(e) => {
                          const clean = e.target.value.replace(/\D/g, '').slice(0, 10);
                          handleUpdateField(alloc.id, 'contactPhone', clean);
                        }}
                        placeholder="9876543210"
                        className="w-full pl-10 pr-2 py-2 bg-white border border-stone-300 rounded-lg outline-none font-mono-num focus:border-stone-900 text-xs"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-800 mb-1">
                      Official Email <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="email"
                      value={alloc.email}
                      onChange={(e) => handleUpdateField(alloc.id, 'email', e.target.value)}
                      placeholder="exam.superintendent@gec.ac.in"
                      className="w-full px-2.5 py-2 bg-white border border-stone-300 rounded-lg outline-none focus:border-stone-900 text-xs"
                    />
                  </div>
                </div>

                {/* Estimated Screening Execution Budget */}
                <div className="md:col-span-2 bg-stone-50 p-3 rounded-lg border border-stone-200">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-stone-800">
                      Estimated Exam Center Budget (Invigilation, Lab Power, Network Server Setup) <span className="text-rose-600">*</span>
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
                      placeholder="75000"
                      className="w-full pl-7 pr-14 py-2 bg-white border border-stone-300 rounded-lg outline-none font-mono-num focus:border-stone-900"
                    />
                    <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-stone-400 text-xs pointer-events-none">
                      INR
                    </span>
                  </div>
                  {alloc.estimatedAmount && Number(alloc.estimatedAmount) > 0 && (
                    <div className="mt-1 text-[11px] font-serif-inst italic text-stone-600">
                      Amount in Words: <span className="font-semibold text-stone-800 not-italic">{numberToIndianWords(Number(alloc.estimatedAmount))}</span>
                    </div>
                  )}
                </div>

                {/* Skills Pooled / Catered in this Exam Center */}
                <div className="md:col-span-2 pt-2 border-t border-stone-200">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold text-stone-800 text-[11px] uppercase tracking-wider">
                      Skills Pooled in this Online Exam Center:
                    </span>
                    <button
                      type="button"
                      onClick={() => handlePoolAllTrades(alloc.id)}
                      className="text-[11px] text-stone-700 hover:text-stone-900 underline font-medium"
                    >
                      Pool All Selected Skills ({selectedTrades.length})
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                    {selectedTrades.map((trade) => {
                      const isIncluded = alloc.skills.includes(trade);
                      return (
                        <button
                          key={trade}
                          type="button"
                          onClick={() => handleToggleTrade(alloc.id, trade)}
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

              </div>
            </div>
          );
        })}
      </div>

      {/* Add Another Exam Venue in District Button */}
      <button
        type="button"
        onClick={() => handleAddVenueForDistrict(selectedDistrictToAdd, selectedTalukToAdd)}
        className="w-full py-2.5 border-2 border-dashed border-stone-300 hover:border-stone-400 bg-stone-50 hover:bg-stone-100 text-stone-700 text-xs font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
      >
        <Plus className="w-4 h-4" />
        <span>Allot Another Exam Venue in {selectedDistrictToAdd} ({selectedTalukToAdd} Taluk)</span>
      </button>

    </div>
  );
};
