import { Prisma, HeadlineType, HeadlineLocation, Phase } from '@prisma/client';
import { PrismaService } from '@server/prisma/prisma.service';

export async function generateHeadlines(
  prisma: PrismaService,
  phase: Phase,
  count: number,
): Promise<Prisma.HeadlineCreateManyInput[]> {
  const headlines: Prisma.HeadlineCreateManyInput[] = [];

  // Fetch existing sectorIds and companyIds from the database
  const sectors = await getSectors(prisma, phase.gameId);
  //   const companyIds = await getCompanyIds(prisma);

  for (let i = 0; i < count; i++) {
    const headlineType = chooseHeadlineType(phase);
    const description = generateHeadlineDescription(headlineType);
    const cost = generateHeadlineCost(prisma, headlineType);
    const timestamp = new Date().toISOString();
    const location = HeadlineLocation.FOR_SALE;

    const sector = headlineType.includes('SECTOR')
      ? getRandomItem(sectors)
      : null;
    const title = generateHeadlineTitle(sector?.name || '', headlineType);
    // const companyId = headlineType.includes('COMPANY')
    //   ? getRandomItem(companyIds)
    //   : null;

    const headline: Prisma.HeadlineCreateManyInput = {
      type: headlineType,
      title,
      description,
      gameId: phase.gameId, // Assuming 'phase' has a 'gameId' property
      cost,
      timestamp,
      location,
      sectorId: sector?.id,
      //   companyId,
      saleSlot: null, // Set to null or appropriate value
    };

    headlines.push(headline);
  }

  return headlines;
}

// Helper function to choose a headline type based on the phase
function chooseHeadlineType(phase: Phase): HeadlineType {
  // Implement your logic to choose a headline type based on the phase
  const types = [
    HeadlineType.SECTOR_NEGATIVE_1,
    HeadlineType.SECTOR_NEGATIVE_2,
    HeadlineType.SECTOR_POSITIVE_1,
    HeadlineType.SECTOR_POSITIVE_2,
  ];
  const randomIndex = Math.floor(Math.random() * types.length);
  return types[randomIndex];
}

// Positive sentiment arrays
const positiveAdjectives = [
  'Amazing',
  'Outstanding',
  'Incredible',
  'Fantastic',
  'Remarkable',
  'Extraordinary',
  'Unbelievable',
  'Marvelous',
  'Spectacular',
  'Impressive',
  'Phenomenal',
  'Exceptional',
  'Brilliant',
  'Tremendous',
  'Fabulous',
  'Miraculous',
  'Sensational',
  'Astonishing',
  'Glorious',
  'Delightful',
];

const positiveActions = [
  'Surges',
  'Achieves new heights',
  'Breaks records',
  'Excels',
  'Leads the market',
  'Gains momentum',
  'Wins big',
  'Celebrates success',
  'Shines brightly',
  'Impresses investors',
  'Thrills customers',
  'Innovates',
  'Expands rapidly',
  'Delivers results',
  'Outperforms expectations',
  'Makes breakthrough',
  'Sets new standard',
  'Soars high',
  'Dominates industry',
  'Surpasses goals',
];

const positiveNouns = [
  'Profits',
  'Growth',
  'Success',
  'Market Share',
  'Innovation',
  'Revenue',
  'Customer Satisfaction',
  'Sales',
  'Productivity',
  'Performance',
  'Stock Price',
  'Efficiency',
  'Reputation',
  'Quality',
  'Popularity',
  'Expansion',
  'Demand',
  'Leadership',
  'Collaboration',
  'Opportunities',
];

// Negative sentiment arrays
const negativeAdjectives = [
  'Disastrous',
  'Alarming',
  'Troubling',
  'Dismal',
  'Plummeting',
  'Declining',
  'Worrisome',
  'Catastrophic',
  'Unfortunate',
  'Grim',
  'Concerning',
  'Disappointing',
  'Unsettling',
  'Struggling',
  'Bleak',
  'Dire',
  'Weak',
  'Faltering',
  'Sluggish',
  'Tumbling',
];

const negativeActions = [
  'Suffers Loss',
  'Faces Setback',
  'Drops Sharply',
  'Misses Targets',
  'Reports Decline',
  'Cuts Workforce',
  'Halts Production',
  'Loses Ground',
  'Warns Investors',
  'Slashes Outlook',
  'Experiences Downturn',
  'Struggles',
  'Fails to Deliver',
  'Hits Obstacle',
  'Encounters Issues',
  'Sees Decrease',
  'Falls Short',
  'Underperforms',
  'Deals with Crisis',
  'Reports Losses',
];

const negativeNouns = [
  'Earnings',
  'Sales',
  'Revenue',
  'Market Share',
  'Profit Margins',
  'Stock Price',
  'Demand',
  'Production',
  'Customer Trust',
  'Investor Confidence',
  'Growth',
  'Performance',
  'Operations',
  'Stability',
  'Prospects',
  'Cash Flow',
  'Outlook',
  'Value',
  'Supply Chain',
  'Ratings',
];

// Helper function to generate a headline title based on the type
// Helper function to generate a headline title based on the type
function generateHeadlineTitle(
  name: string,
  headlineType: HeadlineType,
): string {
  // Determine if the headline is positive or negative
  const isPositive = headlineType.includes('POSITIVE');

  // Select the appropriate arrays
  const adjectives = isPositive ? positiveAdjectives : negativeAdjectives;
  const actions = isPositive ? positiveActions : negativeActions;
  const nouns = isPositive ? positiveNouns : negativeNouns;

  // Randomly select one item from each array
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const action = actions[Math.floor(Math.random() * actions.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];

  // Combine the parts to form the title, including the name
  const title = `${adjective} ${name} ${action} in ${noun}`;

  return title;
}

// Helper function to generate a headline description based on the type
function generateHeadlineDescription(headlineType: HeadlineType): string {
  // Implement your logic to generate a description
  return `Detailed description for ${headlineType}`;
}

// Helper function to generate the cost based on the headline type
function generateHeadlineCost(
  prisma: PrismaService,
  headlineType: HeadlineType,
): number {
  // Implement your logic to determine cost
  if (headlineType.endsWith('_1')) return 30;
  if (headlineType.endsWith('_2')) return 50;
  if (headlineType.endsWith('_3')) return 80;
  return 0;
}

// Helper function to fetch all sector IDs
async function getSectors(
  prisma: PrismaService,
  gameId: string,
): Promise<{ id: string; name: string }[]> {
  const sectors = await prisma.sector.findMany({
    where: {
      gameId,
    },
    select: { id: true, name: true },
  });
  return sectors.map((sector) => sector);
}

// Helper function to fetch all company IDs
async function getCompanyIds(prisma: PrismaService): Promise<string[]> {
  const companies = await prisma.company.findMany({ select: { id: true } });
  return companies.map((company) => company.id);
}

// Helper function to get a random item from an array
function getRandomItem<T>(array: T[]): T {
  const randomIndex = Math.floor(Math.random() * array.length);
  return array[randomIndex];
}
