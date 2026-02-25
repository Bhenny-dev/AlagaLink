
import { MedicalService } from '../../types';

export const MOCK_MEDICAL: MedicalService[] = [
  { 
    id: 'm-1', 
    name: 'Prescription Medicine Subsidy', 
    overview: 'Financial assistance for the purchase of monthly maintenance medicines for low-income PWDs.', 
    organizers: 'MSWDO La Trinidad, Municipal Health Services Office',
    skillSet: ['Doctor\'s Prescription (Current)', 'Barangay Indigency', 'Medical Abstract'],
    benefits: 'Up to PHP 2,000 monthly subsidy for essential maintenance drugs.',
    eligibility: 'Recent Prescription (3 months)', 
    schedule: 'Weekly Distribution - Fridays', 
    category: 'Medicine', 
    isVisible: true,
    photoUrl: '/images/programs/prescription medicine subsidy.png',
    assistanceDetail: 'PHP 2,000 monthly subsidy',
    venue: 'Municipal Health Office Annex'
  },
  { 
    id: 'm-2', 
    name: 'Laboratory Test Subsidy', 
    overview: 'Provision of vouchers for blood work, X-rays, and specialized tests at municipal partner clinics.', 
    organizers: 'PDAO La Trinidad, Benguet General Hospital Partner Network',
    skillSet: ['Laboratory Request', 'Clinical Assessment', 'Valid PWD ID'],
    benefits: '100% discount on basic laboratory fees; 50% on specialized diagnostic imaging.',
    eligibility: 'Request from Physician', 
    schedule: 'By Appointment - Monday to Thursday', 
    category: 'Clinical', 
    isVisible: true,
    photoUrl: '/images/programs/laboratory medicine subsidy.webp',
    assistanceDetail: 'Diagnostic Vouchers',
    venue: 'Partner Diagnostic Centers'
  },
  { 
    id: 'm-3', 
    name: 'Nutritional Supplements', 
    overview: 'Distribution of fortified milk and micronutrient commodities specifically for Children with Special Needs.', 
    organizers: 'Municipal Nutrition Council, MSWDO',
    skillSet: ['Child Nutrition Record', 'Birth Certificate', 'Medical Diagnosis'],
    benefits: 'Consistent supply of age-appropriate fortified milk and vitamins.',
    eligibility: 'CWD Age 0-12', 
    schedule: 'Monthly - Every First Monday', 
    category: 'Commodities', 
    isVisible: true,
    photoUrl: '/images/programs/Nutritional Supplements.webp',
    assistanceDetail: '1 box of fortified milk per month',
    venue: 'MSWDO Distribution Point'
  },
];
