import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://lvodtuvfaaitfxndbxbz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2b2R0dXZmYWFpdGZ4bmRieGJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyNDE1ODEsImV4cCI6MjA5NTgxNzU4MX0.K79WwToB1Jr9Uri21YH_V82yrJGtEhegz1LnqJgWEXI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const sampleReviews = [
  {
    reviewer_name: 'Sarah Johnson',
    rating: 5,
    content: 'Amazing frankincense candy! The quality is exceptional and the glass packaging is beautiful. Will definitely order again.',
    platform: 'shopify',
    sentiment: 'positive',
  },
  {
    reviewer_name: 'Ahmed Al-Mansouri',
    rating: 5,
    content: 'Perfect! This is authentic Omani frankincense candy. The taste is exactly what I was looking for. Highly recommend!',
    platform: 'shopify',
    sentiment: 'positive',
  },
  {
    reviewer_name: 'Emily Chen',
    rating: 4,
    content: 'Good quality product, but shipping took longer than expected. The candy itself is delicious though.',
    platform: 'shopify',
    sentiment: 'positive',
  },
  {
    reviewer_name: 'Michael Rodriguez',
    rating: 3,
    content: 'It\'s okay. The flavor is nice but I expected it to be stronger. Price is a bit high for the quantity.',
    platform: 'shopify',
    sentiment: 'neutral',
  },
  {
    reviewer_name: 'Fatima Hassan',
    rating: 5,
    content: 'Excellent! This brings back memories of home. The Pearl flavor is my favorite. Great customer service too!',
    platform: 'shopify',
    sentiment: 'positive',
  },
  {
    reviewer_name: 'David Thompson',
    rating: 2,
    content: 'Disappointed with this purchase. The candy arrived partially melted and some pieces were broken.',
    platform: 'shopify',
    sentiment: 'negative',
  },
  {
    reviewer_name: 'Layla Al-Rashid',
    rating: 5,
    content: 'Outstanding quality! I\'ve ordered from many places but this is the best frankincense candy I\'ve found.',
    platform: 'shopify',
    sentiment: 'positive',
  },
  {
    reviewer_name: 'James Wilson',
    rating: 1,
    content: 'Not worth the money. Tastes artificial and doesn\'t compare to real frankincense.',
    platform: 'shopify',
    sentiment: 'negative',
  },
];

async function insertSampleReviews() {
  try {
    // Get the first user from profiles
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    if (profileError || !profiles || profiles.length === 0) {
      console.error('Error fetching user profile:', profileError);
      process.exit(1);
    }

    const userId = profiles[0].id;
    console.log(`Using user ID: ${userId}`);

    // Insert sample reviews
    const reviewsToInsert = sampleReviews.map((review, index) => ({
      ...review,
      user_id: userId,
      created_at: new Date(Date.now() - (8 - index) * 24 * 60 * 60 * 1000).toISOString(),
    }));

    const { data, error } = await supabase
      .from('reviews')
      .insert(reviewsToInsert);

    if (error) {
      console.error('Error inserting reviews:', error);
      process.exit(1);
    }

    console.log(`✓ Successfully inserted ${reviewsToInsert.length} sample reviews`);
    console.log('Reviews are ready for testing in the Eqence Dashboard!');
  } catch (err) {
    console.error('Unexpected error:', err);
    process.exit(1);
  }
}

insertSampleReviews();
