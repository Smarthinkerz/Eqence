import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '../contexts/AuthContext';
import { useReviews } from '../contexts/ReviewsContext';
import { supabase, StoreSettings } from '../lib/supabase';

type Tab = 'overview' | 'reviews' | 'analytics' | 'auto-response' | 'settings';

export default function Dashboard() {
  const { user, profile, signOut, loading: authLoading } = useAuth();
  const { reviews, stats, loading, fetchReviews, fetchStats, addReview, deleteReview, respondToReview, generateAIResponse, importFromShopify, exportReport } = useReviews();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [responseText, setResponseText] = useState('');
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [filterPlatform, setFilterPlatform] = useState('all');
  const [filterSentiment, setFilterSentiment] = useState('all');
  const [importLoading, setImportLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showAddReview, setShowAddReview] = useState(false);
  const [newReview, setNewReview] = useState({ reviewer_name: '', rating: 5, content: '', platform: 'manual' as const, sentiment: 'positive' as const, response: null as string | null, responded_at: null as string | null });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (user) {
      fetchReviews();
      fetchStats();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchReviews({ platform: filterPlatform, sentiment: filterSentiment });
    }
  }, [filterPlatform, filterSentiment]);

  const showNotif = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleRespond = async (reviewId: string) => {
    if (!responseText.trim()) return;
    const { error } = await respondToReview(reviewId, responseText);
    if (error) showNotif('error', error);
    else {
      showNotif('success', 'Response saved');
      setRespondingTo(null);
      setResponseText('');
    }
  };

  const handleAIGenerate = async (content: string) => {
    setAiLoading(true);
    const { response, error } = await generateAIResponse(content, 'professional');
    if (error) showNotif('error', error);
    else if (response) setResponseText(response);
    setAiLoading(false);
  };

  const handleImport = async () => {
    setImportLoading(true);
    const { count, error } = await importFromShopify();
    if (error) showNotif('error', error);
    else showNotif('success', `Imported ${count} reviews`);
    setImportLoading(false);
  };

  const handleExport = async (format: 'csv' | 'json') => {
    const blob = await exportReport(format);
    if (blob) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `eqence-report-${new Date().toISOString().slice(0, 10)}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
      showNotif('success', `Report exported as ${format.toUpperCase()}`);
    } else {
      showNotif('error', 'No data to export');
    }
  };

  const handleAddReview = async () => {
    if (!newReview.reviewer_name || !newReview.content) {
      showNotif('error', 'Name and content required');
      return;
    }
    const { error } = await addReview(newReview);
    if (error) showNotif('error', error);
    else {
      showNotif('success', 'Review added');
      setShowAddReview(false);
      setNewReview({ reviewer_name: '', rating: 5, content: '', platform: 'manual', sentiment: 'positive', response: null, responded_at: null });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this review?')) return;
    const { error } = await deleteReview(id);
    if (error) showNotif('error', error);
    else showNotif('success', 'Review deleted');
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-[#C41E3A] border-t-transparent rounded-full" /></div>;
  if (!user) return null;

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'reviews', label: 'Reviews', icon: '⭐' },
    { id: 'analytics', label: 'Analytics', icon: '📈' },
    { id: 'auto-response', label: 'AI Response', icon: '🤖' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg text-white font-medium ${notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {notification.message}
        </div>
      )}

      {/* Sidebar */}
      <aside className="w-64 bg-[#1a1a2e] text-white flex-shrink-0 hidden lg:flex flex-col">
        <div className="p-6 border-b border-white/10">
          <Link href="/" className="text-2xl font-bold text-white">Eqence</Link>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {tabs.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors ${activeTab === item.id ? 'bg-[#C41E3A] text-white font-medium' : 'text-white/70 hover:text-white hover:bg-white/5'}`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-[#C41E3A] flex items-center justify-center text-sm font-bold">
              {profile?.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="text-sm">
              <div className="font-medium text-white">{profile?.full_name || 'User'}</div>
              <div className="text-white/50 text-xs capitalize">{profile?.tier || 'free'} plan</div>
            </div>
          </div>
          <button onClick={() => signOut().then(() => navigate('/'))} className="w-full text-left text-sm text-white/60 hover:text-white transition-colors px-2">
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-500">Welcome back, {profile?.full_name || user.email}</p>
          </div>
          <div className="flex items-center gap-2 lg:hidden">
            {tabs.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)} className={`p-2 rounded-lg text-sm ${activeTab === t.id ? 'bg-[#C41E3A] text-white' : 'bg-gray-100'}`}>
                {t.icon}
              </button>
            ))}
          </div>
        </header>

        <div className="p-6">
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Reputation Score" value={`${stats?.reputationScore || 0}%`} color="text-[#C41E3A]" />
                <StatCard title="Total Reviews" value={String(stats?.totalReviews || 0)} color="text-blue-600" />
                <StatCard title="Avg Rating" value={(stats?.averageRating || 0).toFixed(1)} color="text-yellow-600" />
                <StatCard title="Response Rate" value={`${(stats?.responseRate || 0).toFixed(0)}%`} color="text-green-600" />
              </div>

              <div className="bg-white rounded-xl p-6 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  <ActionBtn label="Add Review" icon="➕" onClick={() => { setActiveTab('reviews'); setShowAddReview(true); }} />
                  <ActionBtn label="View Analytics" icon="📈" onClick={() => setActiveTab('analytics')} />
                  <ActionBtn label="AI Response" icon="🤖" onClick={() => setActiveTab('auto-response')} />
                  <ActionBtn label="Import Shopify" icon="🛒" onClick={handleImport} loading={importLoading} />
                  <ActionBtn label="Export CSV" icon="📄" onClick={() => handleExport('csv')} />
                  <ActionBtn label="Settings" icon="⚙️" onClick={() => setActiveTab('settings')} />
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Reviews</h3>
                  <button onClick={() => setActiveTab('reviews')} className="text-sm text-[#C41E3A] hover:underline">View All →</button>
                </div>
                {loading ? (
                  <p className="text-center py-8 text-gray-500">Loading...</p>
                ) : reviews.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">No reviews yet. Add manually or import from Shopify.</p>
                    <button onClick={() => { setActiveTab('reviews'); setShowAddReview(true); }} className="px-4 py-2 bg-[#C41E3A] text-white rounded-lg text-sm font-medium">Add First Review</button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {reviews.slice(0, 5).map(r => (
                      <div key={r.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900 text-sm">{r.reviewer_name}</span>
                            <span className="text-yellow-500 text-xs">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${r.sentiment === 'positive' ? 'bg-green-100 text-green-700' : r.sentiment === 'negative' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{r.sentiment}</span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-1">{r.content}</p>
                        </div>
                        {r.response && <span className="text-green-500 text-xs whitespace-nowrap">✓ Responded</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {stats && stats.totalReviews > 0 && (
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-green-50 rounded-xl p-5 border border-green-100">
                    <div className="text-2xl font-bold text-green-700">{stats.positiveCount}</div>
                    <div className="text-sm text-green-600">Positive</div>
                  </div>
                  <div className="bg-yellow-50 rounded-xl p-5 border border-yellow-100">
                    <div className="text-2xl font-bold text-yellow-700">{stats.neutralCount}</div>
                    <div className="text-sm text-yellow-600">Neutral</div>
                  </div>
                  <div className="bg-red-50 rounded-xl p-5 border border-red-100">
                    <div className="text-2xl font-bold text-red-700">{stats.negativeCount}</div>
                    <div className="text-sm text-red-600">Negative</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* REVIEWS TAB */}
          {activeTab === 'reviews' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl p-4 border border-gray-100 flex flex-wrap items-center gap-3">
                <select value={filterPlatform} onChange={e => setFilterPlatform(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
                  <option value="all">All Platforms</option>
                  <option value="shopify">Shopify</option>
                  <option value="google">Google</option>
                  <option value="facebook">Facebook</option>
                  <option value="instagram">Instagram</option>
                  <option value="manual">Manual</option>
                </select>
                <select value={filterSentiment} onChange={e => setFilterSentiment(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
                  <option value="all">All Sentiments</option>
                  <option value="positive">Positive</option>
                  <option value="neutral">Neutral</option>
                  <option value="negative">Negative</option>
                </select>
                <div className="ml-auto flex gap-2">
                  <button onClick={() => setShowAddReview(true)} className="px-4 py-2 bg-[#C41E3A] text-white rounded-lg text-sm font-medium">+ Add Review</button>
                  <button onClick={handleImport} disabled={importLoading} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">
                    {importLoading ? 'Importing...' : '🛒 Import'}
                  </button>
                </div>
              </div>

              {showAddReview && (
                <div className="bg-white rounded-xl p-6 border border-gray-100">
                  <h3 className="text-lg font-semibold mb-4">Add Review</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <input placeholder="Reviewer Name" value={newReview.reviewer_name} onChange={e => setNewReview({ ...newReview, reviewer_name: e.target.value })} className="px-3 py-2 border border-gray-200 rounded-lg" />
                    <select value={newReview.platform} onChange={e => setNewReview({ ...newReview, platform: e.target.value as any })} className="px-3 py-2 border border-gray-200 rounded-lg">
                      <option value="manual">Manual</option>
                      <option value="shopify">Shopify</option>
                      <option value="google">Google</option>
                      <option value="facebook">Facebook</option>
                      <option value="instagram">Instagram</option>
                    </select>
                    <select value={newReview.rating} onChange={e => setNewReview({ ...newReview, rating: Number(e.target.value) })} className="px-3 py-2 border border-gray-200 rounded-lg">
                      {[5, 4, 3, 2, 1].map(r => <option key={r} value={r}>{r} Star{r > 1 ? 's' : ''}</option>)}
                    </select>
                    <select value={newReview.sentiment} onChange={e => setNewReview({ ...newReview, sentiment: e.target.value as any })} className="px-3 py-2 border border-gray-200 rounded-lg">
                      <option value="positive">Positive</option>
                      <option value="neutral">Neutral</option>
                      <option value="negative">Negative</option>
                    </select>
                  </div>
                  <textarea placeholder="Review content..." value={newReview.content} onChange={e => setNewReview({ ...newReview, content: e.target.value })} className="w-full mt-4 px-3 py-2 border border-gray-200 rounded-lg h-24 resize-none" />
                  <div className="flex gap-3 mt-4">
                    <button onClick={handleAddReview} className="px-4 py-2 bg-[#C41E3A] text-white rounded-lg text-sm font-medium">Save</button>
                    <button onClick={() => setShowAddReview(false)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium">Cancel</button>
                  </div>
                </div>
              )}

              {loading ? (
                <p className="text-center py-12 text-gray-500">Loading...</p>
              ) : reviews.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
                  <p className="text-gray-500 text-lg">No reviews found</p>
                  <p className="text-gray-400 text-sm mt-2">Add reviews manually or import from Shopify</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map(review => (
                    <div key={review.id} className="bg-white rounded-xl p-5 border border-gray-100">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-semibold text-gray-900">{review.reviewer_name}</span>
                            <span className="text-yellow-500">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${review.sentiment === 'positive' ? 'bg-green-100 text-green-700' : review.sentiment === 'negative' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{review.sentiment}</span>
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">{review.platform}</span>
                          </div>
                          <p className="text-gray-700 mb-3">{review.content}</p>
                          {review.response && (
                            <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                              <p className="text-sm text-blue-800"><strong>Response:</strong> {review.response}</p>
                              <p className="text-xs text-blue-500 mt-1">{new Date(review.responded_at!).toLocaleDateString()}</p>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 ml-4">
                          {!review.response && (
                            <button onClick={() => setRespondingTo(review.id)} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium">Respond</button>
                          )}
                          <button onClick={() => handleDelete(review.id)} className="px-3 py-1.5 bg-red-100 text-red-600 rounded-lg text-xs font-medium">Delete</button>
                        </div>
                      </div>
                      {respondingTo === review.id && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <textarea value={responseText} onChange={e => setResponseText(e.target.value)} placeholder="Write your response..." className="w-full px-3 py-2 border border-gray-200 rounded-lg h-20 resize-none text-sm" />
                          <div className="flex gap-2 mt-2">
                            <button onClick={() => handleRespond(review.id)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium">Send</button>
                            <button onClick={() => handleAIGenerate(review.content)} disabled={aiLoading} className="px-4 py-2 bg-purple-600 text-white rounded-lg text-xs font-medium disabled:opacity-50">
                              {aiLoading ? 'Generating...' : '🤖 AI Generate'}
                            </button>
                            <button onClick={() => { setRespondingTo(null); setResponseText(''); }} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-xs font-medium">Cancel</button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ANALYTICS TAB */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              {stats && stats.totalReviews > 0 ? (
                <>
                  <div className="bg-white rounded-xl p-6 border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Rating Distribution</h3>
                    <div className="space-y-3">
                      {stats.ratingDistribution.map(item => (
                        <div key={item.rating} className="flex items-center gap-3">
                          <span className="text-sm font-medium text-gray-600 w-12">{item.rating} ★</span>
                          <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${stats.totalReviews > 0 ? (item.count / stats.totalReviews) * 100 : 0}%` }} />
                          </div>
                          <span className="text-sm text-gray-500 w-8">{item.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-6 border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Platform Breakdown</h3>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {stats.platformBreakdown.map(p => (
                        <div key={p.platform} className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                          <span className="font-medium text-gray-900 capitalize">{p.platform}</span>
                          <div className="text-2xl font-bold text-gray-900 mt-1">{p.count}</div>
                          <div className="text-sm text-gray-500">Avg: {p.avgRating.toFixed(1)} ★</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-6 border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Trend</h3>
                    <div className="flex items-end gap-2 h-48">
                      {stats.monthlyTrend.map((m, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
                          <div className="text-xs text-gray-500 mb-1">{m.count}</div>
                          <div className="w-full bg-[#C41E3A] rounded-t-lg" style={{ height: `${Math.max((m.count / Math.max(...stats.monthlyTrend.map(x => x.count), 1)) * 100, 5)}%` }} />
                          <div className="text-xs text-gray-500 mt-2">{m.month}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-6 border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Report</h3>
                    <div className="flex gap-3">
                      <button onClick={() => handleExport('csv')} className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium">📄 CSV</button>
                      <button onClick={() => handleExport('json')} className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium">📋 JSON</button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
                  <p className="text-gray-500 text-lg">No analytics data</p>
                  <p className="text-gray-400 text-sm mt-2">Add reviews to see analytics</p>
                </div>
              )}
            </div>
          )}

          {/* AI AUTO-RESPONSE TAB */}
          {activeTab === 'auto-response' && <AIResponseTab />}

          {/* SETTINGS TAB */}
          {activeTab === 'settings' && <SettingsTab />}
        </div>
      </main>
    </div>
  );
}

function AIResponseTab() {
  const { user } = useAuth();
  const { reviews, generateAIResponse, respondToReview, fetchReviews, fetchStats } = useReviews();
  const [aiLoading, setAiLoading] = useState(false);
  const [testInput, setTestInput] = useState('');
  const [testOutput, setTestOutput] = useState('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const unrespondedReviews = reviews.filter(r => !r.response);

  const handleTestGenerate = async () => {
    if (!testInput.trim()) return;
    setAiLoading(true);
    const { response, error } = await generateAIResponse(testInput, 'professional');
    if (error) setNotification({ type: 'error', message: error });
    else setTestOutput(response || '');
    setAiLoading(false);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleAutoRespond = async (reviewId: string, content: string) => {
    setAiLoading(true);
    const { response, error } = await generateAIResponse(content, 'professional');
    if (error) {
      setNotification({ type: 'error', message: error });
    } else if (response) {
      await respondToReview(reviewId, response);
      setNotification({ type: 'success', message: 'AI response sent!' });
      await fetchReviews();
      await fetchStats();
    }
    setAiLoading(false);
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="space-y-6">
      {notification && (
        <div className={`px-4 py-3 rounded-lg ${notification.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {notification.message}
        </div>
      )}

      <div className="bg-white rounded-xl p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Response Generator</h3>
        <p className="text-gray-500 text-sm mb-4">Test AI-generated responses. Requires OpenAI API key in Settings.</p>
        <textarea value={testInput} onChange={e => setTestInput(e.target.value)} placeholder="Paste a sample review here..." className="w-full px-3 py-2 border border-gray-200 rounded-lg h-24 resize-none" />
        <button onClick={handleTestGenerate} disabled={aiLoading} className="mt-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">
          {aiLoading ? 'Generating...' : '🤖 Generate Response'}
        </button>
        {testOutput && (
          <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-100">
            <p className="text-sm text-purple-800">{testOutput}</p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Reviews Awaiting Response ({unrespondedReviews.length})</h3>
        {unrespondedReviews.length === 0 ? (
          <p className="text-gray-500 text-center py-8">All reviews have been responded to!</p>
        ) : (
          <div className="space-y-3">
            {unrespondedReviews.slice(0, 10).map(review => (
              <div key={review.id} className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-gray-900">{review.reviewer_name}</span>
                  <span className="text-yellow-500 text-sm">{'★'.repeat(review.rating)}</span>
                </div>
                <p className="text-sm text-gray-700 mb-2">{review.content}</p>
                <button onClick={() => handleAutoRespond(review.id, review.content)} disabled={aiLoading} className="px-3 py-1.5 bg-purple-600 text-white rounded text-xs font-medium disabled:opacity-50">
                  🤖 Auto-Respond
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SettingsTab() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<Partial<StoreSettings>>({
    shopify_store_url: '',
    shopify_access_token: '',
    google_business_url: '',
    facebook_page_url: '',
    instagram_url: '',
    openai_api_key: '',
    tap_api_key: '',
    auto_response_enabled: false,
    auto_response_tone: 'professional',
    notification_email: true,
    notification_push: true,
  });
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (user) loadSettings();
  }, [user]);

  const loadSettings = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('store_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (data) {
      setSettings({
        shopify_store_url: data.shopify_store_url || '',
        shopify_access_token: data.shopify_access_token || '',
        google_business_url: data.google_business_url || '',
        facebook_page_url: data.facebook_page_url || '',
        instagram_url: data.instagram_url || '',
        openai_api_key: data.openai_api_key || '',
        tap_api_key: data.tap_api_key || '',
        auto_response_enabled: data.auto_response_enabled || false,
        auto_response_tone: data.auto_response_tone || 'professional',
        notification_email: data.notification_email ?? true,
        notification_push: data.notification_push ?? true,
      });
    }
    setLoaded(true);
  };

  const saveSettings = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from('store_settings')
      .upsert({
        user_id: user.id,
        ...settings,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (error) setNotification({ type: 'error', message: error.message });
    else setNotification({ type: 'success', message: 'Settings saved!' });
    setSaving(false);
    setTimeout(() => setNotification(null), 3000);
  };

  if (!loaded) return <p className="text-center py-8 text-gray-500">Loading settings...</p>;

  return (
    <div className="space-y-6">
      {notification && (
        <div className={`px-4 py-3 rounded-lg ${notification.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {notification.message}
        </div>
      )}

      <div className="bg-white rounded-xl p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🛒 Store Connections</h3>
        <div className="space-y-4">
          <Field label="Shopify Store URL" value={settings.shopify_store_url || ''} onChange={v => setSettings({ ...settings, shopify_store_url: v })} placeholder="https://your-store.myshopify.com" />
          <Field label="Shopify Access Token" value={settings.shopify_access_token || ''} onChange={v => setSettings({ ...settings, shopify_access_token: v })} placeholder="shpat_xxxxxxxxxxxxx" type="password" hint="Get from Shopify Admin → Apps → Develop apps" />
          <Field label="Google Business URL" value={settings.google_business_url || ''} onChange={v => setSettings({ ...settings, google_business_url: v })} placeholder="https://www.google.com/maps/place/your-business" />
          <Field label="Facebook Page URL" value={settings.facebook_page_url || ''} onChange={v => setSettings({ ...settings, facebook_page_url: v })} placeholder="https://facebook.com/your-page" />
          <Field label="Instagram URL" value={settings.instagram_url || ''} onChange={v => setSettings({ ...settings, instagram_url: v })} placeholder="https://instagram.com/your-account" />
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🔑 API Keys</h3>
        <div className="space-y-4">
          <Field label="OpenAI API Key" value={settings.openai_api_key || ''} onChange={v => setSettings({ ...settings, openai_api_key: v })} placeholder="sk-xxxxxxxxxxxxx" type="password" hint="Required for AI auto-response" />
          <Field label="Tap Payments API Key" value={settings.tap_api_key || ''} onChange={v => setSettings({ ...settings, tap_api_key: v })} placeholder="sk_live_xxxxxxxxxxxxx" type="password" hint="For payment processing" />
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🤖 Auto-Response</h3>
        <div className="space-y-4">
          <label className="flex items-center gap-3">
            <input type="checkbox" checked={settings.auto_response_enabled || false} onChange={e => setSettings({ ...settings, auto_response_enabled: e.target.checked })} className="w-4 h-4 rounded border-gray-300 text-[#C41E3A]" />
            <span className="text-sm text-gray-700">Enable automatic AI responses to new reviews</span>
          </label>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Response Tone</label>
            <select value={settings.auto_response_tone || 'professional'} onChange={e => setSettings({ ...settings, auto_response_tone: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg">
              <option value="professional">Professional</option>
              <option value="friendly">Friendly</option>
              <option value="empathetic">Empathetic</option>
              <option value="formal">Formal</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🔔 Notifications</h3>
        <div className="space-y-3">
          <label className="flex items-center gap-3">
            <input type="checkbox" checked={settings.notification_email ?? true} onChange={e => setSettings({ ...settings, notification_email: e.target.checked })} className="w-4 h-4 rounded border-gray-300" />
            <span className="text-sm text-gray-700">Email notifications for new reviews</span>
          </label>
          <label className="flex items-center gap-3">
            <input type="checkbox" checked={settings.notification_push ?? true} onChange={e => setSettings({ ...settings, notification_push: e.target.checked })} className="w-4 h-4 rounded border-gray-300" />
            <span className="text-sm text-gray-700">Push notifications</span>
          </label>
        </div>
      </div>

      <button onClick={saveSettings} disabled={saving} className="w-full py-3 bg-[#C41E3A] text-white rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50">
        {saving ? 'Saving...' : 'Save All Settings'}
      </button>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = 'text', hint }: { label: string; value: string; onChange: (v: string) => void; placeholder: string; type?: string; hint?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
      {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
    </div>
  );
}

function StatCard({ title, value, color }: { title: string; value: string; color: string }) {
  return (
    <div className="bg-white rounded-xl p-5 border border-gray-100">
      <p className="text-sm text-gray-500 mb-1">{title}</p>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

function ActionBtn({ label, icon, onClick, loading }: { label: string; icon: string; onClick: () => void; loading?: boolean }) {
  return (
    <button onClick={onClick} disabled={loading} className="flex flex-col items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 border border-gray-100 disabled:opacity-50">
      <span className="text-xl">{icon}</span>
      <span className="text-xs font-medium text-gray-700 text-center">{label}</span>
    </button>
  );
}
