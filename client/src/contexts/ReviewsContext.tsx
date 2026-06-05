import { createContext, useContext, useState, ReactNode } from 'react';
import { supabase, Review } from '../lib/supabase';
import { useAuth } from './AuthContext';

type ReviewStats = {
  totalReviews: number;
  averageRating: number;
  reputationScore: number;
  responseRate: number;
  positiveCount: number;
  neutralCount: number;
  negativeCount: number;
  ratingDistribution: { rating: number; count: number }[];
  platformBreakdown: { platform: string; count: number; avgRating: number }[];
  monthlyTrend: { month: string; count: number }[];
};

type ReviewsContextType = {
  reviews: Review[];
  stats: ReviewStats | null;
  loading: boolean;
  fetchReviews: (filters?: { platform?: string; sentiment?: string }) => Promise<void>;
  fetchStats: () => Promise<void>;
  addReview: (review: Omit<Review, 'id' | 'user_id' | 'created_at'>) => Promise<{ error: string | null }>;
  deleteReview: (id: string) => Promise<{ error: string | null }>;
  respondToReview: (id: string, response: string) => Promise<{ error: string | null }>;
  generateAIResponse: (reviewContent: string, tone: string) => Promise<{ response: string | null; error: string | null }>;
  importFromShopify: () => Promise<{ count: number; error: string | null }>;
  exportReport: (format: 'csv' | 'json') => Promise<Blob | null>;
};

const ReviewsContext = createContext<ReviewsContextType | undefined>(undefined);

export function ReviewsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchReviews = async (filters?: { platform?: string; sentiment?: string }) => {
    if (!user) return;
    setLoading(true);
    let query = supabase
      .from('reviews')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (filters?.platform && filters.platform !== 'all') {
      query = query.eq('platform', filters.platform);
    }
    if (filters?.sentiment && filters.sentiment !== 'all') {
      query = query.eq('sentiment', filters.sentiment);
    }

    const { data, error } = await query;
    if (!error && data) {
      setReviews(data as Review[]);
    }
    setLoading(false);
  };

  const fetchStats = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('reviews')
      .select('*')
      .eq('user_id', user.id);

    if (!data || data.length === 0) {
      setStats({
        totalReviews: 0,
        averageRating: 0,
        reputationScore: 0,
        responseRate: 0,
        positiveCount: 0,
        neutralCount: 0,
        negativeCount: 0,
        ratingDistribution: [5, 4, 3, 2, 1].map(r => ({ rating: r, count: 0 })),
        platformBreakdown: [],
        monthlyTrend: [],
      });
      return;
    }

    const totalReviews = data.length;
    const averageRating = data.reduce((sum, r) => sum + r.rating, 0) / totalReviews;
    const respondedCount = data.filter(r => r.response).length;
    const responseRate = (respondedCount / totalReviews) * 100;
    const positiveCount = data.filter(r => r.sentiment === 'positive').length;
    const neutralCount = data.filter(r => r.sentiment === 'neutral').length;
    const negativeCount = data.filter(r => r.sentiment === 'negative').length;
    const reputationScore = Math.round(((averageRating / 5) * 60) + ((positiveCount / totalReviews) * 30) + ((responseRate / 100) * 10));

    // Rating distribution
    const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
      rating,
      count: data.filter(r => r.rating === rating).length,
    }));

    // Platform breakdown
    const platforms = Array.from(new Set(data.map(r => r.platform)));
    const platformBreakdown = platforms.map(platform => {
      const platformReviews = data.filter(r => r.platform === platform);
      return {
        platform,
        count: platformReviews.length,
        avgRating: platformReviews.reduce((sum, r) => sum + r.rating, 0) / platformReviews.length,
      };
    });

    // Monthly trend (last 6 months)
    const monthlyTrend: { month: string; count: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStr = date.toLocaleString('default', { month: 'short' });
      const monthNum = date.getMonth();
      const year = date.getFullYear();
      const count = data.filter(r => {
        const d = new Date(r.created_at);
        return d.getMonth() === monthNum && d.getFullYear() === year;
      }).length;
      monthlyTrend.push({ month: monthStr, count });
    }

    setStats({
      totalReviews,
      averageRating,
      reputationScore,
      responseRate,
      positiveCount,
      neutralCount,
      negativeCount,
      ratingDistribution,
      platformBreakdown,
      monthlyTrend,
    });
  };

  const addReview = async (review: Omit<Review, 'id' | 'user_id' | 'created_at'>) => {
    if (!user) return { error: 'Not authenticated' };
    const { error } = await supabase.from('reviews').insert({
      ...review,
      user_id: user.id,
    });
    if (error) return { error: error.message };
    await fetchReviews();
    await fetchStats();
    return { error: null };
  };

  const deleteReview = async (id: string) => {
    const { error } = await supabase.from('reviews').delete().eq('id', id);
    if (error) return { error: error.message };
    await fetchReviews();
    await fetchStats();
    return { error: null };
  };

  const respondToReview = async (id: string, response: string) => {
    const { error } = await supabase
      .from('reviews')
      .update({ response, responded_at: new Date().toISOString() })
      .eq('id', id);
    if (error) return { error: error.message };
    await fetchReviews();
    await fetchStats();
    return { error: null };
  };

  const generateAIResponse = async (reviewContent: string, tone: string) => {
    // Get user's OpenAI key from settings
    if (!user) return { response: null, error: 'Not authenticated' };

    const { data: settings } = await supabase
      .from('store_settings')
      .select('openai_api_key')
      .eq('user_id', user.id)
      .single();

    const apiKey = settings?.openai_api_key || import.meta.env.VITE_OPENAI_API_KEY || '';
    if (!apiKey) return { response: null, error: 'OpenAI API key not configured. Add it in Settings.' };

    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You are a customer service AI for an e-commerce store. Generate a ${tone} response to the following customer review. Keep it concise (2-3 sentences), helpful, and genuine. If the review is negative, acknowledge the issue and offer to help. If positive, thank them sincerely.`,
            },
            { role: 'user', content: reviewContent },
          ],
          max_tokens: 200,
          temperature: 0.7,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        return { response: null, error: err.error?.message || 'OpenAI API error' };
      }

      const data = await res.json();
      return { response: data.choices[0]?.message?.content || '', error: null };
    } catch (err: any) {
      return { response: null, error: err.message || 'Failed to generate response' };
    }
  };

  const importFromShopify = async () => {
    if (!user) return { count: 0, error: 'Not authenticated' };

    // Get Shopify credentials from settings
    const { data: settings } = await supabase
      .from('store_settings')
      .select('shopify_store_url, shopify_access_token')
      .eq('user_id', user.id)
      .single();

    if (!settings?.shopify_store_url || !settings?.shopify_access_token) {
      return { count: 0, error: 'Shopify store URL and access token required. Configure in Settings → Store Connections.' };
    }

    try {
      let storeUrl = settings.shopify_store_url.replace(/\/$/, '').replace(/\/en$/, '').replace(/\/.*$/, '');
      
      // If it's a custom domain (e.g., store.wacandy.com), extract the shop name and convert to myshopify.com
      if (!storeUrl.includes('myshopify.com')) {
        // Extract shop name from custom domain or URL
        const parts = storeUrl.split('/');
        const domain = parts[parts.length - 1] || parts[parts.length - 2];
        const shopName = domain.split('.')[0]; // Get first part before .com or .wacandy.com
        storeUrl = `https://${shopName}.myshopify.com`;
      } else if (!storeUrl.startsWith('http')) {
        storeUrl = `https://${storeUrl}`;
      }

      console.log('Using Shopify store URL:', storeUrl);
      console.log('Token format:', settings.shopify_access_token.substring(0, 10) + '...');

      // Fetch products from Shopify Admin API
      const productsRes = await fetch(
        `${storeUrl}/admin/api/2024-01/products.json?limit=50&fields=id,title`,
        {
          headers: {
            'X-Shopify-Access-Token': settings.shopify_access_token,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!productsRes.ok) {
        const errorText = await productsRes.text();
        console.error('Shopify API error response:', errorText);
        return { 
          count: 0, 
          error: `Shopify API error: ${productsRes.status}. Make sure you're using your myshopify.com domain (e.g., wacandy.myshopify.com) and a valid Admin API token.` 
        };
      }

      const productsData = await productsRes.json();
      const products = productsData.products || [];

      if (products.length === 0) {
        return { count: 0, error: 'No products found in your Shopify store.' };
      }

      // Fetch product metafields for reviews (Judge.me, Loox, etc. store reviews in metafields)
      let importedCount = 0;
      for (const product of products.slice(0, 10)) {
        try {
          const metaRes = await fetch(
            `${storeUrl}/admin/api/2024-01/products/${product.id}/metafields.json`,
            {
              headers: {
                'X-Shopify-Access-Token': settings.shopify_access_token,
                'Content-Type': 'application/json',
              },
            }
          );

          if (metaRes.ok) {
            const metaData = await metaRes.json();
            const reviewMetafields = (metaData.metafields || []).filter(
              (m: any) => m.namespace === 'reviews' || m.namespace === 'judgeme' || m.namespace === 'loox'
            );

            for (const meta of reviewMetafields) {
              try {
                const reviewData = typeof meta.value === 'string' ? JSON.parse(meta.value) : meta.value;
                if (Array.isArray(reviewData)) {
                  for (const rev of reviewData) {
                    const sentiment = (rev.rating || 5) >= 4 ? 'positive' : (rev.rating || 5) >= 3 ? 'neutral' : 'negative';
                    await supabase.from('reviews').insert({
                      user_id: user.id,
                      reviewer_name: rev.author || rev.reviewer || 'Shopify Customer',
                      rating: rev.rating || 5,
                      content: rev.body || rev.content || rev.text || 'No content',
                      platform: 'shopify',
                      sentiment,
                    });
                    importedCount++;
                  }
                }
              } catch { /* skip malformed metafield */ }
            }
          }
        } catch { /* skip failed product */ }
      }

      if (importedCount === 0) {
        return { count: 0, error: 'No reviews found in product metafields. If you use Judge.me or another reviews app, make sure it stores reviews in product metafields. You can also add reviews manually.' };
      }

      await fetchReviews();
      await fetchStats();
      return { count: importedCount, error: null };
    } catch (err: any) {
      console.error('Shopify import error:', err);
      return { count: 0, error: err.message || 'Failed to connect to Shopify' };
    }
  };

  const exportReport = async (format: 'csv' | 'json'): Promise<Blob | null> => {
    if (!user) return null;

    const { data } = await supabase
      .from('reviews')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!data || data.length === 0) return null;

    if (format === 'json') {
      return new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    }

    // CSV
    const headers = ['Reviewer', 'Rating', 'Content', 'Platform', 'Sentiment', 'Response', 'Date'];
    const rows = data.map(r => [
      r.reviewer_name,
      r.rating,
      `"${(r.content || '').replace(/"/g, '""')}"`,
      r.platform,
      r.sentiment,
      `"${(r.response || '').replace(/"/g, '""')}"`,
      r.created_at,
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    return new Blob([csv], { type: 'text/csv' });
  };

  return (
    <ReviewsContext.Provider value={{
      reviews, stats, loading,
      fetchReviews, fetchStats, addReview, deleteReview, respondToReview,
      generateAIResponse, importFromShopify, exportReport,
    }}>
      {children}
    </ReviewsContext.Provider>
  );
}

export function useReviews() {
  const context = useContext(ReviewsContext);
  if (!context) throw new Error('useReviews must be used within ReviewsProvider');
  return context;
}
