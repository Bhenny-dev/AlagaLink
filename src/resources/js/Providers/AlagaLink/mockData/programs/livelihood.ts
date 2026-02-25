
import { LivelihoodProgram } from '../../types';

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
    photoUrl: 'https://images.unsplash.com/photo-1504215680853-026ed2a45def?auto=format&fit=crop&q=100&w=1200',
    photoAlt: 'Cordilleran backstrap weaver demonstrating traditional weaving techniques'
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
    photoUrl: 'https://images.unsplash.com/photo-1491841573634-28140fc7ced7?auto=format&fit=crop&q=100&w=1200',
    photoAlt: 'Hands preparing strawberries for jam and value-added processing'
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
    photoUrl: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&q=100&w=1200',
    photoAlt: 'Community digital literacy workshop with learners using laptops'
  }
];
