
import { LostReport } from '../types';
import { MOCK_USERS } from './users';

export const MOCK_REPORTS: LostReport[] = [
  {
    id: 'r-1',
    userId: MOCK_USERS[5].id,
    name: `${MOCK_USERS[5].firstName} ${MOCK_USERS[5].lastName}`,
    reporterId: MOCK_USERS[0].id,
    timeMissing: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
    lastSeen: 'Km. 5 Public Market',
    description: 'Wearing a traditional woven vest over a white shirt.',
    clothes: 'Woven vest, Denim jeans',
    height: '5\'4"',
    bodyType: 'Slim',
    dissemination: { radio: true, socialMedia: true, context: 'Last seen near the vegetable trading post.' },
    status: 'Missing',
    isPosted: true,
    photoUrl: MOCK_USERS[5].photoUrl
  },
  {
    id: 'r-2',
    userId: MOCK_USERS[12].id,
    name: `${MOCK_USERS[12].firstName} ${MOCK_USERS[12].lastName}`,
    reporterId: MOCK_USERS[1].id,
    timeMissing: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    lastSeen: 'Pico, La Trinidad',
    description: 'Carrying a small blue backpack.',
    clothes: 'Yellow t-shirt, Shorts',
    height: '4\'9"',
    bodyType: 'Average',
    dissemination: { radio: false, socialMedia: true, context: 'He might be heading towards the strawberry farm.' },
    status: 'Missing',
    isPosted: false,
    photoUrl: MOCK_USERS[12].photoUrl
  },
  {
    id: 'r-3',
    userId: MOCK_USERS[20].id,
    name: `${MOCK_USERS[20].firstName} ${MOCK_USERS[20].lastName}`,
    reporterId: MOCK_USERS[0].id,
    timeMissing: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
    lastSeen: 'Strawberry Farm',
    description: 'Wearing a red cap and oversized hoodie.',
    clothes: 'Red cap, Gray hoodie',
    height: '5\'2"',
    bodyType: 'Slim',
    dissemination: { radio: true, socialMedia: true, context: 'Recovered safely by neighbors.' },
    status: 'Found',
    isPosted: true,
    photoUrl: MOCK_USERS[20].photoUrl,
    missingNarrative: {
      what: "Daryl went missing while visiting the Strawberry Farm with family.",
      when: "October 20, 2023, at around 2:00 PM.",
      why: "Became separated from the group due to the high volume of tourists.",
      how: "He followed a similar-looking group toward the parking exit and lost sight of his family."
    },
    foundNarrative: {
      what: "Daryl was found unharmed at a local residence in Pico.",
      when: "October 21, 2023, at 9:00 AM.",
      why: "A concerned neighbor recognized him from the AlagaLink social media post.",
      how: "The neighbor invited him in for breakfast and immediately called the PDAO contact number provided in the system."
    }
  }
];
