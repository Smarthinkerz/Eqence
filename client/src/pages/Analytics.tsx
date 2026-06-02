import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Link } from 'wouter';

export default function Analytics() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  useEffect(() => {
    if (user) loadData();
  }, [user, timeRange]);

  const loadData = async () => {
    let query = supabase.from('reviews').select('*').eq('user_id', user!.id);
    if (timeRange !== 'all') {
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const since = new Date(Date.now() - days * 86400000).toISOString();
      query = query.gte('created_at', since);
    }
    const { data } = await query.order('created_at', { ascending: true });
    setReviews(data || []);
    setLoading(false);
  };

  const totalReviews = reviews.length;
  const avgRating = totalReviews ? (reviews.reduce((s, r) => s + r.rating, 0) / totalReviews).toFixed(1) : '0.0';
  const positiveCount = reviews.filter(r => r.sentiment === 'positive').length;
  const negativeCount = reviews.filter(r => r.sentiment === 'negative').length;
  const neutralCount = reviews.filter(r => r.sentiment === 'neutral').length;
  const respondedCount = reviews.filter(r => r.response).length;
  const responseRate = totalReviews ? Math.round((respondedCount / totalReviews) * 100) : 0;

  const platformBreakdown = reviews.reduce((acc: Record<string, number>, r) => {
    acc[r.platform] = (acc[r.platform] || 0) + 1;
    return acc;
  }, {});

  const ratingDistribution = [1, 2, 3, 4, 5].map(r => ({
    rating: r,
    count: reviews.filter(rev => rev.rating === r).length,
  }));

  // Group reviews by week for trend
  const weeklyData: { week: string; count: number; avgRating: number }[] = [];
  const grouped: Record<string, any[]> = {};
  reviews.forEach(r => {
    const d = new Date(r.created_at);
    const weekStart = new Date(d.setDate(d.getDate() - d.getDay()));
    const key = weekStart.toISOString().split('T')[0];
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(r);
  });
  Object.entries(grouped).forEach(([week, revs]) => {
    weeklyData.push({
      week,
      count: revs.length,
      avgRating: revs.reduce((s, r) => s + r.rating, 0) / revs.length,
    });
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-[#C41E3A] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-gray-500 hover:text-gray-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-xl font-bold text-gray-900">Analytics</h1>
          </div>
          <div className="flex gap-2">
            {(['7d', '30d', '90d', 'all'] as const).map(t => (
              <button key={t} onClick={() => setTimeRange(t)} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${timeRange === t ? 'bg-[#C41E3A] text-white' : 'bg-white text-gray-600 border border-gray-200'}`}>
                {t === 'all' ? 'All Time' : t}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-5 rounded-xl border border-gray-200">
            <p className="text-sm text-gray-500 mb-1">Total Reviews</p>
            <p className="text-3xl font-bold text-gray-900">{totalReviews}</p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-200">
            <p className="text-sm text-gray-500 mb-1">Average Rating</p>
            <p className="text-3xl font-bold text-yellow-600">{avgRating} ★</p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-200">
            <p className="text-sm text-gray-500 mb-1">Response Rate</p>
            <p className="text-3xl font-bold text-green-600">{responseRate}%</p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-200">
            <p className="text-sm text-gray-500 mb-1">Reputation Score</p>
            <p className="text-3xl font-bold text-[#C41E3A]">{totalReviews ? Math.round((positiveCount / totalReviews) * 100) : 0}</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Sentiment Breakdown */}
          <div className="bg-white p-5 rounded-xl border border-gray-200">
            <h3 className="font-bold text-gray-900 mb-4">Sentiment Breakdown</h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-green-700">Positive</span>
                  <span className="font-medium">{positiveCount} ({totalReviews ? Math.round((positiveCount/totalReviews)*100) : 0}%)</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full" style={{ width: `${totalReviews ? (positiveCount/totalReviews)*100 : 0}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">Neutral</span>
                  <span className="font-medium">{neutralCount} ({totalReviews ? Math.round((neutralCount/totalReviews)*100) : 0}%)</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gray-400 rounded-full" style={{ width: `${totalReviews ? (neutralCount/totalReviews)*100 : 0}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-red-700">Negative</span>
                  <span className="font-medium">{negativeCount} ({totalReviews ? Math.round((negativeCount/totalReviews)*100) : 0}%)</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-red-500 rounded-full" style={{ width: `${totalReviews ? (negativeCount/totalReviews)*100 : 0}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Rating Distribution */}
          <div className="bg-white p-5 rounded-xl border border-gray-200">
            <h3 className="font-bold text-gray-900 mb-4">Rating Distribution</h3>
            <div className="space-y-2">
              {ratingDistribution.reverse().map(({ rating, count }) => (
                <div key={rating} className="flex items-center gap-3">
                  <span className="text-sm font-medium w-8">{rating}★</span>
                  <div className="flex-1 h-6 bg-gray-100 rounded overflow-hidden">
                    <div className="h-full bg-yellow-400 rounded" style={{ width: `${totalReviews ? (count/totalReviews)*100 : 0}%` }} />
                  </div>
                  <span className="text-sm text-gray-500 w-8 text-right">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Platform Breakdown */}
          <div className="bg-white p-5 rounded-xl border border-gray-200">
            <h3 className="font-bold text-gray-900 mb-4">Reviews by Platform</h3>
            {Object.keys(platformBreakdown).length === 0 ? (
              <p className="text-gray-500 text-sm">No reviews yet</p>
            ) : (
              <div className="space-y-2">
                {Object.entries(platformBreakdown).map(([platform, count]) => (
                  <div key={platform} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700 capitalize">{platform}</span>
                    <span className="text-sm font-bold text-gray-900">{count as number}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Weekly Trend */}
          <div className="bg-white p-5 rounded-xl border border-gray-200">
            <h3 className="font-bold text-gray-900 mb-4">Weekly Trend</h3>
            {weeklyData.length === 0 ? (
              <p className="text-gray-500 text-sm">Not enough data for trends</p>
            ) : (
              <div className="space-y-2">
                {weeklyData.slice(-8).map(({ week, count, avgRating }) => (
                  <div key={week} className="flex items-center justify-between p-2 border-b border-gray-100 last:border-0">
                    <span className="text-xs text-gray-500">{new Date(week).toLocaleDateString()}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">{count} reviews</span>
                      <span className="text-sm text-yellow-600">{avgRating.toFixed(1)}★</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
