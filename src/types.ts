export interface VenueAllocation {
  id: string;
  stage: 'screening' | 'district' | 'zonal';
  stageLabel: string;
  districtOrZoneName?: string;
  skills: string[]; // 1 or more pooled skills
  questionPaper?: string;
  venueName: string;
  coordinatingOfficer: string;
  contactPhone: string;
  email: string;
  estimatedAmount: number | "";
  // Online Exam screening specific attributes:
  numberOfComputers?: number | "";
  connectivityDetails?: string;
}

export interface MultiStagePlanningState {
  department: "Directorate of Technical Education (DTE)" | "Industrial Training Department (ITD)" | "";
  selectedTrades: string[];
  screeningAllocations: VenueAllocation[];
  districtAllocations: VenueAllocation[];
  zonalAllocations: VenueAllocation[];
}

export interface SubmissionRecord {
  id: string;
  timestamp: string;
  department: string;
  selectedTradesCount: number;
  selectedTrades: string[];
  screeningVenuesCount: number;
  totalComputersAvailable: number;
  districtVenuesCount: number;
  zonalVenuesCount: number;
  totalEstimatedAmount: number;
  allocations: VenueAllocation[];
  syncedToGoogleSheet: boolean;
  sheetRowsAppended?: number;
}
