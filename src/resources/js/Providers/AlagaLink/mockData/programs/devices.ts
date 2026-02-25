
import { AssistiveDevice } from '../../types';

export const MOCK_DEVICES: AssistiveDevice[] = [
  { 
    id: 'd-1', 
    name: 'Standard Wheelchair', 
    overview: 'Manual wheelchair designed for individuals with orthopedic impairments to facilitate independent mobility.',
    organizers: 'PDAO La Trinidad, Department of Health (DOH) Regional Office',
    benefits: 'Improved mobility, community participation, and independence.',
    description: 'Manual wheelchair for mobility assistance.', 
    eligibility: 'La Trinidad Resident, PWD ID Holder', 
    schedule: 'M-W-F, 9AM-4PM', 
    modeOfReceiving: 'Pick up at PDAO', 
    category: 'Mobility',
    stockCount: 5,
    isVisible: true,
    photoUrl: '/images/programs/standard wheelchair.jpg',
    venue: 'PDAO Office, Municipal Hall'
  },
  { 
    id: 'd-2', 
    name: 'Digital Hearing Aid', 
    overview: 'High-quality digital hearing enhancement devices for members with hearing impairments or deafness.',
    organizers: 'Starkey Hearing Foundation Partnership, PDAO',
    benefits: 'Auditory clarity, improved social communication, and safety awareness.',
    description: 'Small digital hearing device for hearing impairment.', 
    eligibility: 'Audiometry result required', 
    schedule: 'Tue-Thu, 1PM-4PM', 
    modeOfReceiving: 'Pick up at PDAO', 
    category: 'Hearing',
    stockCount: 2,
    isVisible: true,
    photoUrl: '/images/programs/digital hearing aid.webp',
    venue: 'Audiology Clinic (Partner)'
  },
  { 
    id: 'd-3', 
    name: 'Folding Cane', 
    overview: 'Collapsible white canes for blind and visually impaired members to navigate environments safely.',
    organizers: 'RBI (Resources for the Blind, Inc.), La Trinidad LGU',
    benefits: 'Safe navigation, independence in travel, and tactile awareness.',
    description: 'Collapsible cane for visual impairment.', 
    eligibility: 'Registered Visual PWD', 
    schedule: 'Daily', 
    modeOfReceiving: 'Pick up or Delivery', 
    category: 'Visual',
    stockCount: 10,
    isVisible: true,
    photoUrl: '/images/programs/folding cane.jpg',
    venue: 'PDAO Office'
  },
  { 
    id: 'd-4', 
    name: 'Crutches (Pair)', 
    overview: 'Lightweight aluminum adjustable crutches for temporary or permanent walking assistance.',
    organizers: 'Benguet General Hospital Surplus Support, PDAO',
    benefits: 'Support for lower limb injuries or orthopedic conditions.',
    description: 'Adjustable aluminum crutches.', 
    eligibility: 'Post-injury or permanent mobility aid', 
    schedule: 'Daily', 
    modeOfReceiving: 'Pick up at PDAO', 
    category: 'Mobility',
    stockCount: 12,
    isVisible: true,
    photoUrl: '/images/programs/crutches.jpg',
    venue: 'Municipal Health Office'
  }
];
