import React, { useState } from 'react';
import { 
  Building2, 
  User, 
  Monitor, 
  Wifi, 
  Plus, 
  Trash2, 
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
      skills: [...selectedTrades],
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
      <div className="bg-white border border-[#0e5774]/20 rounded-xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#0e5774] mb-0.5">
              <span>Step 2 of 2</span>
              <span aria-hidden="true">•</span>
              <span>Online Examination Center Infrastructure</span>
            </div>
            <h2 className="text-xl font-serif-inst font-semibold text-slate-900">
              District & Taluk Online Exam Center Allotment
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Allot institutional exam centers against districts and taluks. Specify available computer terminals, network connectivity, and nodal officer details.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Total Computers</span>
              <span className="font-mono-num text-base font-bold text-[#0e5774]">
                {totalComputers} Systems
              </span>
            </div>
          </div>
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
              className="bg-white border border-[#0e5774]/20 rounded-xl p-5 sm:p-6 shadow-xs relative space-y-4"
            >
              {/* Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-[#0e5774]/10 pb-3 gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-md bg-[#0e5774] text-white text-xs font-mono font-bold flex items-center justify-center">
                    {index + 1}
                  </span>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-[#f4f8fa] text-[#0e5774] border border-[#0e5774]/25">
                        <MapPin className="w-3 h-3 mr-1 text-[#0e5774]" />
                        {currentDistrict} {currentTaluk ? `• ${currentTaluk} Taluk` : ''}
                      </span>
                      <span className="text-xs font-semibold text-slate-900">
                        {alloc.venueName || 'Online Exam Center (Venue TBD)'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Online Examination Center & Lab Infrastructure
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {allocations.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveAllocation(alloc.id)}
                      className="text-slate-400 hover:text-rose-600 p-1.5 rounded-md transition-colors"
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
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    District Jurisdiction <span className="text-rose-600">*</span>
                  </label>
                  <select
                    value={currentDistrict}
                    onChange={(e) => handleUpdateField(alloc.id, 'districtOrZoneName', e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg outline-none focus:border-[#0e5774]"
                  >
                    {STANDARD_DISTRICTS.map(dist => (
                      <option key={dist} value={dist}>{dist}</option>
                    ))}
                  </select>
                </div>

                {/* Taluk Selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Taluk <span className="text-rose-600">*</span>
                  </label>
                  <select
                    value={currentTaluk}
                    onChange={(e) => handleUpdateField(alloc.id, 'talukName', e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg outline-none focus:border-[#0e5774]"
                  >
                    {availableTaluks.map(taluk => (
                      <option key={taluk} value={taluk}>{taluk}</option>
                    ))}
                  </select>
                </div>

                {/* Host Institution / Exam Center Name */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Allotted Exam Center / Institution Name <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-[#0e5774]/60 absolute left-3 top-2.5 pointer-events-none" />
                    <input
                      type="text"
                      value={alloc.venueName}
                      onChange={(e) => handleUpdateField(alloc.id, 'venueName', e.target.value)}
                      placeholder="e.g. Government Engineering College, Computer Science & IT Block"
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg outline-none focus:border-[#0e5774]"
                    />
                  </div>
                </div>

                {/* NUMBER OF COMPUTERS AVAILABLE */}
                <div className="bg-[#f4f8fa] p-3 rounded-lg border border-[#0e5774]/20">
                  <label className="block text-xs font-semibold text-[#0e5774] mb-1">
                    Number of Computers Available <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative">
                    <Monitor className="w-4 h-4 text-[#0e5774] absolute left-3 top-2.5 pointer-events-none" />
                    <input
                      type="number"
                      min="1"
                      value={alloc.numberOfComputers || ''}
                      onChange={(e) => handleUpdateField(alloc.id, 'numberOfComputers', e.target.value ? Number(e.target.value) : '')}
                      placeholder="Enter number of working PCs"
                      className="w-full pl-9 pr-14 py-2 bg-white border border-[#0e5774]/30 rounded-lg outline-none font-mono-num focus:border-[#0e5774]"
                    />
                    <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-[11px] text-[#0e5774] font-semibold pointer-events-none">
                      PCs / Nodes
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-600 mt-1">
                    Total working online terminals available to seat candidates simultaneously.
                  </p>
                </div>

                {/* CONNECTIVITY & LAB INFRASTRUCTURE DETAILS */}
                <div className="bg-[#f4f8fa] p-3 rounded-lg border border-[#0e5774]/20">
                  <label className="block text-xs font-semibold text-[#0e5774] mb-1">
                    Network Connectivity & Power Backup Details <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative">
                    <Wifi className="w-4 h-4 text-[#0e5774] absolute left-3 top-2.5 pointer-events-none" />
                    <input
                      type="text"
                      value={alloc.connectivityDetails || ''}
                      onChange={(e) => handleUpdateField(alloc.id, 'connectivityDetails', e.target.value)}
                      placeholder="Enter bandwidth, LAN & UPS/Generator details"
                      className="w-full pl-9 pr-3 py-2 bg-white border border-[#0e5774]/30 rounded-lg outline-none text-xs focus:border-[#0e5774]"
                    />
                  </div>
                  <p className="text-[10px] text-slate-600 mt-1">
                    Bandwidth speed, LAN configuration, and power backup capability for the online exam.
                  </p>
                </div>

                {/* Coordinating Officer Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Center Superintendent / Nodal Officer Name <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-[#0e5774]/60 absolute left-3 top-2.5 pointer-events-none" />
                    <input
                      type="text"
                      value={alloc.coordinatingOfficer}
                      onChange={(e) => handleUpdateField(alloc.id, 'coordinatingOfficer', e.target.value)}
                      placeholder=""
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg outline-none focus:border-[#0e5774]"
                    />
                  </div>
                </div>

                {/* Contact Phone & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1">
                      Contact Mobile <span className="text-rose-600">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-500 font-medium text-[11px]">+91</span>
                      <input
                        type="tel"
                        maxLength={10}
                        value={alloc.contactPhone}
                        onChange={(e) => {
                          const clean = e.target.value.replace(/\D/g, '').slice(0, 10);
                          handleUpdateField(alloc.id, 'contactPhone', clean);
                        }}
                        placeholder="9876543210"
                        className="w-full pl-10 pr-2 py-2 bg-white border border-slate-300 rounded-lg outline-none font-mono-num focus:border-[#0e5774] text-xs"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1">
                      Official Email <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="email"
                      value={alloc.email}
                      onChange={(e) => handleUpdateField(alloc.id, 'email', e.target.value)}
                      placeholder="exam.superintendent@gec.ac.in"
                      className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-lg outline-none focus:border-[#0e5774] text-xs"
                    />
                  </div>
                </div>

              </div>
            </div>
          );
        })}
      </div>

      {/* Add Another Exam Venue Button */}
      <button
        type="button"
        onClick={() => {
          const lastAlloc = allocations[allocations.length - 1];
          const nextDistrict = lastAlloc?.districtOrZoneName || STANDARD_DISTRICTS[0];
          const nextTaluk = lastAlloc?.talukName || DISTRICT_TALUKS[nextDistrict]?.[0] || '';
          handleAddVenueForDistrict(nextDistrict, nextTaluk);
        }}
        className="w-full py-2.5 border-2 border-dashed border-[#0e5774]/35 hover:border-[#0e5774] bg-white hover:bg-[#f4f8fa] text-[#0e5774] text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
      >
        <Plus className="w-4 h-4" />
        <span>Allot Another Exam Venue</span>
      </button>

    </div>
  );
};
