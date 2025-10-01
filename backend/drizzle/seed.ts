import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

// Sample seed data for testing
const sampleNeighborhoods = [
  { name: 'Downtown', city: 'toronto' },
  { name: 'Annex', city: 'toronto' },
  { name: 'Queen West', city: 'toronto' },
  { name: 'Leslieville', city: 'toronto' },
];

const sampleCafes = [
  {
    name: 'Matcha Haven',
    slug: 'matcha-haven',
    lat: 43.6532,
    lng: -79.3832,
    address: '123 Queen St W, Toronto, ON',
    city: 'toronto',
    score: 8.5,
    valueScore: 8.0,
    ambianceScore: 9.0,
    otherDrinksScore: 7.5,
    priceRange: '$$',
    chargeForAltMilk: false,
    quickNote: 'Cozy spot with exceptional ceremonial grade matcha',
    review: 'One of the best matcha experiences in Toronto. They source directly from Uji and you can taste the difference.',
    hours: JSON.stringify({ mon: '8-6', tue: '8-6', wed: '8-6', thu: '8-6', fri: '8-6', sat: '9-5', sun: 'closed' }),
    instagram: '@matchahaven',
    emoji: '🍵',
    color: '#7cb342',
  },
  {
    name: 'Green Leaf Cafe',
    slug: 'green-leaf-cafe',
    lat: 43.6590,
    lng: -79.3977,
    address: '456 Bloor St W, Toronto, ON',
    city: 'toronto',
    score: 7.8,
    valueScore: 8.5,
    ambianceScore: 7.0,
    otherDrinksScore: 8.0,
    priceRange: '$',
    chargeForAltMilk: true,
    quickNote: 'Budget-friendly with solid quality',
    review: 'Great for students and daily matcha drinkers. Not the fanciest, but consistent quality.',
    hours: JSON.stringify({ mon: '7-7', tue: '7-7', wed: '7-7', thu: '7-7', fri: '7-7', sat: '8-6', sun: '9-5' }),
    instagram: '@greenleafto',
    tiktok: '@greenleafcafe',
    emoji: '🌿',
    color: '#8bc34a',
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
  console.log('Sample neighborhoods:', sampleNeighborhoods.length);
  console.log('Sample cafes:', sampleCafes.length);
  console.log('Sample drinks:', sampleDrinks.length);
  console.log('Sample feed items:', sampleFeedItems.length);
  console.log('Sample events:', sampleEvents.length);

  console.log('\n⚠️  To seed the database, run:');
  console.log('   wrangler d1 execute matchamap-db --local --file=./drizzle/migrations/seed.sql');
  console.log('\n   Or use the admin UI to add cafes manually.');
}

seed().catch(console.error);

// Export for use in actual seeding
export {
  sampleNeighborhoods,
  sampleCafes,
  sampleDrinks,
  sampleFeedItems,
  sampleEvents,
};
