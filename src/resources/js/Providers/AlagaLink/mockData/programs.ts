
import { ProgramAvailment } from '../types';

// Removed MOCK_LIVELIHOODS from this file to resolve a naming collision 
// during re-export in index.ts. The definitive source for livelihood 
// data is now mockData/livelihood.ts.

export const MOCK_PROGRAM_HISTORY: ProgramAvailment[] = [
  // Fix: Add missing userId property to both mock entries
  { id: 'h-1', userId: 'LT-PWD-1000', programType: 'ID', title: 'PWD ID Renewal', status: 'Completed', dateApplied: '2023-05-20' },
  { id: 'h-2', userId: 'LT-PWD-1000', programType: 'Device', title: 'Wheelchair Provision', status: 'Approved', dateApplied: '2023-08-12' }
];
