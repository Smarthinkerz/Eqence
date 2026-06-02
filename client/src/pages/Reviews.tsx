import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Link } from 'wouter';

interface Review {
  id: string;
  reviewer_name: string;
  rating: number;
  content: string;
  platform: string;
  sentiment: string;
  response: string | null;
  responded_at: string | null;
  created_at: string;
}

export default function Reviews() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'positive' | 'negative' | 'neutral' | 'unresponded'>('all');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newReview, setNewReview] = useState({ reviewer_name: '', rating: 5, content: '', platform: 'manual' });

  useEffect(() => {
    if (user) loadReviews();
  }, [user]);

  const loadReviews = async () => {
    const { data } = await supabase
      .from('reviews')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });
    setReviews(data || []);
    setLoading(false);
  };

  const addReview = async () => {
    const sentiment = newReview.rating >= 4 ? 'positive' : newReview.rating >= 3 ? 'neutral' : 'negative';
    const { error } = await supabase.from('reviews').insert({
      user_id: user!.id,
      reviewer_name: newReview.reviewer_name,
      rating: newReview.rating,
      content: newReview.content,
      platform: newReview.platform,
      sentiment,
    });
    if (!error) {
      setShowAddModal(false);
      setNewReview({ reviewer_name: '', rating: 5, content: '', platform: 'manual' });
      loadReviews();
    }
  };

  const deleteReview = async (id: string) => {
    await supabase.from('reviews').delete().eq('id', id);
    loadReviews();
  };

  const generateAIResponse = async (review: Review) => {
    setRespondingTo(review.id);
    setAiLoading(true);

    // Get OpenAI key from store settings
    const { data: settings } = await supabase
      .from('store_settings')
      .select('openai_api_key, auto_response_tone')
      .eq('user_id', user!.id)
      .single();

    const apiKey = settings?.openai_api_key || '';
    const tone = settings?.auto_response_tone || 'professional';

    if (!apiKey) {
      setResponseText('Please add your OpenAI API key in Settings → AI Settings to use AI responses.');
      setAiLoading(false);
      return;
    }

    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: `You are a ${tone} customer service representative for an online store. Generate a helpful response to the following customer review. Keep it concise (2-3 sentences), ${tone}, and address their specific feedback.` },
            { role: 'user', content: `Review by ${review.reviewer_name} (${review.rating}/5 stars): "${review.content}"` }
          ],
          max_tokens: 200,
        }),
      });
      const data = await res.json();
      setResponseText(data.choices?.[0]?.message?.content || 'Failed to generate response.');
    } catch {
      setResponseText('Error generating AI response. Check your API key.');
    }
    setAiLoading(false);
  };

  const submitResponse = async (reviewId: string) => {
    await supabase.from('reviews').update({
      response: responseText,
      responded_at: new Date().toISOString(),
    }).eq('id', reviewId);
    setRespondingTo(null);
    setResponseText('');
    loadReviews();
  };

  const filteredReviews = reviews.filter(r => {
    if (filter === 'unresponded') return !r.response;
    if (filter !== 'all') return r.sentiment === filter;
    return true;
  }).filter(r => platformFilter === 'all' || r.platform === platformFilter);

  const stats = {
    total: reviews.length,
    avgRating: reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : '0',
    positive: reviews.filter(r => r.sentiment === 'positive').length,
    negative: reviews.filter(r => r.sentiment === 'negative').length,
    unresponded: reviews.filter(r => !r.response).length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-[#C41E3A] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-gray-500 hover:text-gray-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-xl font-bold text-gray-900">Reviews</h1>
          </div>
          <button onClick={() => setShowAddModal(true)} className="px-4 py-2 bg-[#C41E3A] text-white rounded-lg text-sm font-medium hover:bg-red-700">
            + Add Review
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-6">
        {/* Stats */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl border border-gray-200 text-center">
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-xs text-gray-500">Total</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 text-center">
            <p className="text-2xl font-bold text-yellow-600">{stats.avgRating}★</p>
            <p className="text-xs text-gray-500">Avg Rating</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 text-center">
            <p className="text-2xl font-bold text-green-600">{stats.positive}</p>
            <p className="text-xs text-gray-500">Positive</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 text-center">
            <p className="text-2xl font-bold text-red-600">{stats.negative}</p>
            <p className="text-xs text-gray-500">Negative</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 text-center">
            <p className="text-2xl font-bold text-orange-600">{stats.unresponded}</p>
            <p className="text-xs text-gray-500">Unresponded</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {(['all', 'positive', 'negative', 'neutral', 'unresponded'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${filter === f ? 'bg-[#C41E3A] text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
          <select value={platformFilter} onChange={e => setPlatformFilter(e.target.value)} className="px-3 py-1.5 rounded-lg text-sm border border-gray-200 bg-white ml-auto">
            <option value="all">All Platforms</option>
            <option value="shopify">Shopify</option>
            <option value="google">Google</option>
            <option value="facebook">Facebook</option>
            <option value="instagram">Instagram</option>
            <option value="manual">Manual</option>
          </select>
        </div>

        {/* Reviews List */}
        <div className="space-y-3">
          {filteredReviews.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <p className="text-gray-500">No reviews found. Add your first review or connect a platform in Settings.</p>
            </div>
          ) : filteredReviews.map(review => (
            <div key={review.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-semibold text-gray-900">{review.reviewer_name}</span>
                    <span className="text-yellow-500">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${review.sentiment === 'positive' ? 'bg-green-100 text-green-700' : review.sentiment === 'negative' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                      {review.sentiment}
                    </span>
                    <span className="px-2 py-0.5 rounded text-xs bg-blue-50 text-blue-700">{review.platform}</span>
                  </div>
                  <p className="text-gray-700 text-sm mb-2">{review.content}</p>
                  <p className="text-xs text-gray-400">{new Date(review.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  {!review.response && (
                    <button onClick={() => generateAIResponse(review)} className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-xs font-medium hover:bg-purple-100">
                      AI Response
                    </button>
                  )}
                  <button onClick={() => deleteReview(review.id)} className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-medium hover:bg-red-100">
                    Delete
                  </button>
                </div>
              </div>

              {/* Response section */}
              {review.response && (
                <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-100">
                  <p className="text-xs font-medium text-green-700 mb-1">Your Response ({review.responded_at ? new Date(review.responded_at).toLocaleDateString() : ''})</p>
                  <p className="text-sm text-green-900">{review.response}</p>
                </div>
              )}

              {/* AI Response input */}
              {respondingTo === review.id && (
                <div className="mt-3 p-3 bg-purple-50 rounded-lg border border-purple-100">
                  {aiLoading ? (
                    <div className="flex items-center gap-2 text-sm text-purple-700">
                      <div className="animate-spin w-4 h-4 border-2 border-purple-700 border-t-transparent rounded-full" />
                      Generating AI response...
                    </div>
                  ) : (
                    <>
                      <textarea value={responseText} onChange={e => setResponseText(e.target.value)} rows={3} className="w-full px-3 py-2 border border-purple-200 rounded-lg text-sm focus:border-purple-500 outline-none mb-2" placeholder="Edit the AI response or write your own..." />
                      <div className="flex gap-2">
                        <button onClick={() => submitResponse(review.id)} className="px-3 py-1.5 bg-[#C41E3A] text-white rounded-lg text-xs font-medium">Submit Response</button>
                        <button onClick={() => { setRespondingTo(null); setResponseText(''); }} className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-xs font-medium">Cancel</button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Add Review Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Add Review Manually</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reviewer Name</label>
                <input type="text" value={newReview.reviewer_name} onChange={e => setNewReview({...newReview, reviewer_name: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#C41E3A] outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                <div className="flex gap-1">
                  {[1,2,3,4,5].map(r => (
                    <button key={r} onClick={() => setNewReview({...newReview, rating: r})} className={`text-2xl ${r <= newReview.rating ? 'text-yellow-500' : 'text-gray-300'}`}>★</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Review Content</label>
                <textarea value={newReview.content} onChange={e => setNewReview({...newReview, content: e.target.value})} rows={3} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#C41E3A] outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Platform</label>
                <select value={newReview.platform} onChange={e => setNewReview({...newReview, platform: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                  <option value="manual">Manual</option>
                  <option value="shopify">Shopify</option>
                  <option value="google">Google</option>
                  <option value="facebook">Facebook</option>
                  <option value="instagram">Instagram</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={addReview} className="flex-1 py-2 bg-[#C41E3A] text-white rounded-lg font-medium text-sm">Add Review</button>
              <button onClick={() => setShowAddModal(false)} className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
