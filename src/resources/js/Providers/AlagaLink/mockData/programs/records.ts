
import { ProgramAvailment } from '../../types';

export const MOCK_PROGRAM_RECORDS: ProgramAvailment[] = [
  // PWD ID Applications
  { id: 'req-id-1', userId: 'LT-PWD-1001', programType: 'ID', title: 'PWD ID Issuance', status: 'Pending', dateApplied: '2023-10-25', paymentStatus: 'Unpaid' },
  { id: 'req-id-2', userId: 'LT-PWD-1002', programType: 'ID', title: 'PWD ID Renewal', status: 'Approved', dateApplied: '2023-10-24' },
  { id: 'req-id-3', userId: 'LT-PWD-1010', programType: 'ID', title: 'PWD ID Issuance', status: 'Pending', dateApplied: '2023-10-27' },

  // Assistive Device Requesters - UPDATED & DISTRIBUTED
  { id: 'req-dev-p1', userId: 'LT-PWD-1025', programType: 'Device', title: 'Standard Wheelchair', status: 'Pending', dateApplied: '2023-10-28', requestedItemId: 'd-1' },
  { id: 'req-dev-p2', userId: 'LT-PWD-1026', programType: 'Device', title: 'Digital Hearing Aid', status: 'Pending', dateApplied: '2023-10-29', requestedItemId: 'd-2' },
  { id: 'req-dev-a1', userId: 'LT-PWD-1027', programType: 'Device', title: 'Standard Wheelchair', status: 'Approved', dateApplied: '2023-10-20', requestedItemId: 'd-1' },
  { id: 'req-dev-a2', userId: 'LT-PWD-1028', programType: 'Device', title: 'Folding Cane', status: 'Approved', dateApplied: '2023-10-21', requestedItemId: 'd-3' },
  { id: 'req-dev-a3', userId: 'LT-PWD-1029', programType: 'Device', title: 'Crutches (Pair)', status: 'Approved', dateApplied: '2023-10-22', requestedItemId: 'd-4' },
  { id: 'req-dev-a4', userId: 'LT-PWD-1030', programType: 'Device', title: 'Standard Wheelchair', status: 'Approved', dateApplied: '2023-10-23', requestedItemId: 'd-1' },

  // Medical Assistance Requesters
  { id: 'req-med-p1', userId: 'LT-PWD-1015', programType: 'Medical', title: 'Prescription Medicine Subsidy', status: 'Pending', dateApplied: '2023-10-28', requestedItemId: 'm-1' },
  { id: 'req-med-p2', userId: 'LT-PWD-1016', programType: 'Medical', title: 'Laboratory Test Subsidy', status: 'Pending', dateApplied: '2023-10-29', requestedItemId: 'm-2' },
  { id: 'req-med-a1', userId: 'LT-PWD-1017', programType: 'Medical', title: 'Nutritional Supplements', status: 'Approved', dateApplied: '2023-10-20', requestedItemId: 'm-3' },
  { id: 'req-med-a2', userId: 'LT-PWD-1018', programType: 'Medical', title: 'Prescription Medicine Subsidy', status: 'Approved', dateApplied: '2023-10-21', requestedItemId: 'm-1' },
  { id: 'req-med-a3', userId: 'LT-PWD-1019', programType: 'Medical', title: 'Laboratory Test Subsidy', status: 'Approved', dateApplied: '2023-10-22', requestedItemId: 'm-2' },
  
  // PhilHealth Sponsored Enrollment Requesters
  { id: 'req-ph-1', userId: 'LT-PWD-1004', programType: 'PhilHealth', title: 'PWD Sponsored Enrollment', status: 'Pending', dateApplied: '2023-10-24', philhealthConsent: true },
  
  // Livelihood Workshop Requesters
  { id: 'req-live-1', userId: 'LT-PWD-1006', programType: 'Livelihood', title: 'Ethnic Weaving Workshop', status: 'Approved', dateApplied: '2023-10-23', requestedItemId: 'live-1' },
  { id: 'req-live-2', userId: 'LT-PWD-1008', programType: 'Livelihood', title: 'Ethnic Weaving Workshop', status: 'Approved', dateApplied: '2023-10-24', requestedItemId: 'live-1' },
  { id: 'req-live-3', userId: 'LT-PWD-1009', programType: 'Livelihood', title: 'Strawberry Value-Add Processing', status: 'Pending', dateApplied: '2023-10-25', requestedItemId: 'live-2' },
  { id: 'req-live-4', userId: 'LT-PWD-1011', programType: 'Livelihood', title: 'Digital Literacy for PWDs', status: 'Approved', dateApplied: '2023-10-26', requestedItemId: 'live-3' },

  // Historical Records
  { id: 'h-1', userId: 'LT-PWD-1000', programType: 'ID', title: 'PWD ID Renewal', status: 'Completed', dateApplied: '2023-05-20' },
];
