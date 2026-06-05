import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://lvodtuvfaaitfxndbxbz.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2b2R0dXZmYWFpdGZ4bmRieGJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyNDE1ODEsImV4cCI6MjA5NTgxNzU4MX0.K79WwToB1Jr9Uri21YH_V82yrJGtEhegz1LnqJgWEXI';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

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

async function setupTestData() {
  try {
    console.log('Setting up test data for Eqence...\n');

    // Check if test user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    let testUserId = existingUsers?.users?.find(u => u.email === 'test@eqence.com')?.id;

    if (!testUserId) {
      console.log('Creating test user...');
      const { data: newUser, error: userError } = await supabase.auth.admin.createUser({
        email: 'test@eqence.com',
        password: 'Test@12345',
        email_confirm: true,
      });

      if (userError) {
        console.error('Error creating user:', userError);
        process.exit(1);
      }

      testUserId = newUser.user.id;
      console.log(`✓ Created test user: test@eqence.com (ID: ${testUserId})`);
    } else {
      console.log(`✓ Using existing test user: test@eqence.com (ID: ${testUserId})`);
    }

    // Create profile for the user
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: testUserId,
        email: 'test@eqence.com',
        full_name: 'Test User',
        role: 'admin',
        tier: 'enterprise',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (profileError) {
      console.error('Error creating profile:', profileError);
      process.exit(1);
    }
    console.log('✓ Created/updated profile');

    // Create store settings
    const { error: settingsError } = await supabase
      .from('store_settings')
      .upsert({
        user_id: testUserId,
        shopify_store_url: 'wacandy.myshopify.com',
        shopify_access_token: 'test_token_for_demo',
        auto_response_enabled: true,
        auto_response_tone: 'professional',
        notification_email: true,
        notification_push: true,
        updated_at: new Date().toISOString(),
      });

    if (settingsError) {
      console.error('Error creating store settings:', settingsError);
      process.exit(1);
    }
    console.log('✓ Created store settings');

    // Insert sample reviews
    const reviewsToInsert = sampleReviews.map((review, index) => ({
      ...review,
      user_id: testUserId,
      created_at: new Date(Date.now() - (8 - index) * 24 * 60 * 60 * 1000).toISOString(),
    }));

    const { error: reviewsError } = await supabase
      .from('reviews')
      .insert(reviewsToInsert);

    if (reviewsError) {
      console.error('Error inserting reviews:', reviewsError);
      process.exit(1);
    }

    console.log(`✓ Inserted ${reviewsToInsert.length} sample reviews`);

    console.log('\n✅ Test data setup complete!');
    console.log('\nYou can now login with:');
    console.log('  Email: test@eqence.com');
    console.log('  Password: Test@12345');
    console.log('\nThe Dashboard will show:');
    console.log('  - 8 sample reviews with mixed ratings (1-5 stars)');
    console.log('  - Reputation score calculated from reviews');
    console.log('  - Sentiment breakdown (positive, neutral, negative)');
    console.log('  - Analytics with monthly trends');
  } catch (err) {
    console.error('Unexpected error:', err);
    process.exit(1);
  }
}

setupTestData();
