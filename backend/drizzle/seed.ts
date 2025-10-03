import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

// Sample seed data for testing
const sampleCafes = [
  {
    name: 'Matcha Cafe',
    slug: 'matcha-cafe',
    link: 'https://gmaps.com/m2lk3',
    latitude: 43.6532,
    longitude: -79.3825,
    city: 'toronto',
    score: 8.5,
    ambianceScore: 9.0,
    otherDrinksScore: 7.5,
    price: 7.0,
    chargeForAltMilk: true,
    gramsUsed: 5,
    quickNote: 'Cozy spot with exceptional ceremonial grade matcha',
    review: 'One of the best matcha experiences in Toronto. They source directly from Uji and you can taste the difference.',
    hours: JSON.stringify({ mon: '8-8', tue: '8-8', wed: '8-8', thu: '8-8', fri: '8-8', sat: '9-7', sun: '9-6' }),
    instagram: '@matchahaven',
    instagramPostLink: 'https://instagram.com/p/example1',
    tiktokPostLink: 'https://tiktok.com/@matchahaven/video/1',
    images: 'https://example.com/matcha-cafe.jpg',
  },
  {
    name: 'Green Leaf Cafe',
    slug: 'green-leaf-cafe',
    link: 'https://gmaps.com/grnlf',
    latitude: 43.6590,
    longitude: -79.3977,
    city: 'toronto',
    score: 7.8,
    ambianceScore: 7.0,
    otherDrinksScore: 8.0,
    price: 5.5,
    chargeForAltMilk: true,
    gramsUsed: 4,
    quickNote: 'Budget-friendly with solid quality',
    review: 'Great for students and daily matcha drinkers. Not the fanciest, but consistent quality.',
    hours: JSON.stringify({ mon: '7-7', tue: '7-7', wed: '7-7', thu: '7-7', fri: '7-7', sat: '8-6', sun: '9-5' }),
    instagram: '@greenleafto',
    instagramPostLink: 'https://instagram.com/p/example2',
    tiktokPostLink: 'https://tiktok.com/@greenleafto/video/1',
    images: 'https://example.com/green-leaf.jpg',
  },
];

const sampleDrinks = [
  {
    cafeId: 1,
    type: 'matcha_latte',
    name: 'Ceremonial Matcha Latte',
    priceAmount: 650,
    priceCurrency: 'CAD',
    gramsUsed: 3,
    isDefault: true,
    notes: 'Made with Uji ceremonial grade',
  },
  {
    cafeId: 1,
    type: 'matcha_latte',
    name: 'Iced Matcha Latte',
    priceAmount: 700,
    priceCurrency: 'CAD',
    gramsUsed: 3,
    isDefault: false,
  },
  {
    cafeId: 2,
    type: 'matcha_latte',
    name: 'House Matcha Latte',
    priceAmount: 550,
    priceCurrency: 'CAD',
    gramsUsed: 2,
    isDefault: true,
  },
];

const sampleFeedItems = [
  {
    type: 'new_location',
    title: 'New Matcha Spot: Matcha Haven Opens in Queen West',
    preview: 'Exciting news for matcha lovers! A new spot specializing in ceremonial grade matcha just opened.',
    content: 'Full review coming soon. Initial impressions are very positive - they\'re sourcing directly from Uji.',
    cafeId: 1,
    cafeName: 'Matcha Haven',
    neighborhood: 'Queen West',
    score: 8.5,
    published: true,
    date: new Date().toISOString(),
    author: 'MatchaMap Team',
    tags: JSON.stringify(['new', 'downtown']),
  },
];

const sampleEvents = [
  {
    title: 'Matcha Tasting Workshop',
    date: '2025-10-15',
    time: '2:00 PM',
    venue: 'Matcha Haven',
    location: '123 Queen St W',
    cafeId: 1,
    description: 'Learn about different grades of matcha and proper whisking technique. Limited to 12 participants.',
    price: '$45',
    featured: true,
    published: true,
  },
];

async function seed() {
  console.log('🌱 Starting database seed...');

  // Note: This script is meant to be run with wrangler or a similar setup
  // For now, it serves as documentation of the seed data structure
  console.log('Sample cafes:', sampleCafes.length);
  console.log('Sample drinks:', sampleDrinks.length);
  console.log('Sample feed items:', sampleFeedItems.length);
  console.log('Sample events:', sampleEvents.length);

  console.log('\n⚠️  To seed the database, use the admin UI to add cafes manually.');
  console.log('   Or create a seed SQL file based on the sample data above.');
}

seed().catch(console.error);

// Export for use in actual seeding
export {
  sampleCafes,
  sampleDrinks,
  sampleFeedItems,
  sampleEvents,
};
