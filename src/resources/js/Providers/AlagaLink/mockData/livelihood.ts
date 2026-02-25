
import { LivelihoodProgram } from '../types';

// Fix: Updated to match LivelihoodProgram interface in types.ts
export const MOCK_LIVELIHOODS: LivelihoodProgram[] = [
  {
    id: 'live-1',
    title: 'Ethnic Weaving Workshop',
    overview: 'Mastering the traditional Cordilleran backstrap weaving techniques for commercial production.',
    skillSet: ['Traditional Weaving', 'Pattern Design', 'Fabric Selection'],
    schedule: 'Mon-Wed-Fri, 1:00 PM - 5:00 PM',
    venue: 'Municipal Livelihood Center, Km. 5',
    organizers: 'Master Weaver Marites Sagayo, DTI-CAR, Benguet LGU',
    benefits: 'Sustainable income (approx 2,500 PHP per shawl), Cultural preservation',
    category: 'Handicrafts',
    isVisible: true,
    photoUrl: '/images/programs/Ethnic Weaving Workshop.webp'
  },
  {
    id: 'live-2',
    title: 'Strawberry Value-Add Processing',
    overview: 'Processing fresh strawberries into jams, wines, and pastries for local tourism markets.',
    skillSet: ['Food Safety', 'Jam Preservation', 'Packaging'],
    schedule: 'Tuesdays and Thursdays, 8:00 AM - 12:00 PM',
    venue: 'MSWDO Food Lab',
    organizers: 'BSU Food Processing Dept, DOST-CAR, Municipality of La Trinidad',
    benefits: 'Profit sharing from local tourism kiosks, Food processing certification',
    category: 'Food Processing',
    isVisible: true,
    photoUrl: '/images/programs/Strawberry Value-Add Processing.jpg'
  },
  {
    id: 'live-3',
    title: 'Digital Literacy for PWDs',
    overview: 'Basic computer skills and remote work training to enable online livelihood opportunities.',
    skillSet: ['Data Entry', 'Online Communication', 'Remote Workflow'],
    schedule: 'Saturdays, 9:00 AM - 3:00 PM',
    venue: 'ICT Hall, Municipal Building',
    organizers: 'AlagaLink Dev Team, DICT, PDAO',
    benefits: 'Freelance job placement, Digital confidence',
    category: 'Information Technology',
    isVisible: true,
    photoUrl: '/images/programs/Digital Literacy for PWDs.jpg'
  }
];
