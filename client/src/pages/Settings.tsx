import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Link } from 'wouter';

interface StoreSettings {
  shopify_store_url: string;
  shopify_access_token: string;
  google_business_url: string;
  facebook_page_url: string;
  instagram_url: string;
  openai_api_key: string;
  tap_api_key: string;
  auto_response_enabled: boolean;
  auto_response_tone: string;
  notification_email: boolean;
  notification_push: boolean;
}

export default function Settings() {
  const { user, profile } = useAuth();
  const [settings, setSettings] = useState<StoreSettings>({
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'integrations' | 'ai' | 'notifications' | 'account'>('integrations');

  useEffect(() => {
    if (user) loadSettings();
  }, [user]);

  const loadSettings = async () => {
    const { data } = await supabase
      .from('store_settings')
      .select('*')
      .eq('user_id', user!.id)
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
    setLoading(false);
  };

  const saveSettings = async () => {
    setSaving(true);
    setSaved(false);
    const { error } = await supabase
      .from('store_settings')
      .upsert({
        user_id: user!.id,
        ...settings,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
    if (!error) setSaved(true);
    setSaving(false);
    setTimeout(() => setSaved(false), 3000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-[#C41E3A] border-t-transparent rounded-full" />
      </div>
    );
  }

  const tabs = [
    { id: 'integrations' as const, label: 'Integrations', icon: '🔗' },
    { id: 'ai' as const, label: 'AI Settings', icon: '🤖' },
    { id: 'notifications' as const, label: 'Notifications', icon: '🔔' },
    { id: 'account' as const, label: 'Account', icon: '👤' },
  ];

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
            <h1 className="text-xl font-bold text-gray-900">Settings</h1>
          </div>
          <button onClick={saveSettings} disabled={saving} className="px-5 py-2 bg-[#C41E3A] text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 flex items-center gap-2">
            {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save Changes'}
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-6">
        <div className="flex gap-6">
          {/* Sidebar tabs */}
          <div className="w-56 flex-shrink-0">
            <nav className="space-y-1">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.id ? 'bg-[#C41E3A]/10 text-[#C41E3A]' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <span className="mr-2">{tab.icon}</span>{tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 bg-white rounded-xl border border-gray-200 p-6">
            {activeTab === 'integrations' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 mb-1">Store Integrations</h2>
                  <p className="text-sm text-gray-500">Connect your platforms to import and manage reviews.</p>
                </div>

                <div className="space-y-4">
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center text-green-700 font-bold text-sm">S</div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Shopify</h3>
                        <p className="text-xs text-gray-500">Import product reviews from your Shopify store</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Store URL</label>
                        <input type="text" value={settings.shopify_store_url} onChange={e => setSettings({...settings, shopify_store_url: e.target.value})} placeholder="mystore.myshopify.com" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#C41E3A] focus:ring-1 focus:ring-[#C41E3A]/20 outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Access Token</label>
                        <input type="password" value={settings.shopify_access_token} onChange={e => setSettings({...settings, shopify_access_token: e.target.value})} placeholder="shpat_xxxxx" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#C41E3A] focus:ring-1 focus:ring-[#C41E3A]/20 outline-none" />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-700 font-bold text-sm">G</div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Google Business</h3>
                        <p className="text-xs text-gray-500">Monitor Google Business reviews</p>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Google Business Profile URL</label>
                      <input type="url" value={settings.google_business_url} onChange={e => setSettings({...settings, google_business_url: e.target.value})} placeholder="https://www.google.com/maps/place/..." className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#C41E3A] focus:ring-1 focus:ring-[#C41E3A]/20 outline-none" />
                    </div>
                  </div>

                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-700 font-bold text-sm">F</div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Facebook</h3>
                        <p className="text-xs text-gray-500">Track Facebook page reviews</p>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Facebook Page URL</label>
                      <input type="url" value={settings.facebook_page_url} onChange={e => setSettings({...settings, facebook_page_url: e.target.value})} placeholder="https://facebook.com/yourpage" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#C41E3A] focus:ring-1 focus:ring-[#C41E3A]/20 outline-none" />
                    </div>
                  </div>

                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center text-pink-700 font-bold text-sm">I</div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Instagram</h3>
                        <p className="text-xs text-gray-500">Monitor Instagram mentions and comments</p>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Instagram Profile URL</label>
                      <input type="url" value={settings.instagram_url} onChange={e => setSettings({...settings, instagram_url: e.target.value})} placeholder="https://instagram.com/yourstore" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#C41E3A] focus:ring-1 focus:ring-[#C41E3A]/20 outline-none" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'ai' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 mb-1">AI Auto-Response</h2>
                  <p className="text-sm text-gray-500">Configure AI-powered automatic responses to reviews.</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h3 className="font-semibold text-gray-900">Enable Auto-Response</h3>
                      <p className="text-sm text-gray-500">Automatically respond to new reviews using AI</p>
                    </div>
                    <button
                      onClick={() => setSettings({...settings, auto_response_enabled: !settings.auto_response_enabled})}
                      className={`w-12 h-6 rounded-full transition-colors ${settings.auto_response_enabled ? 'bg-[#C41E3A]' : 'bg-gray-300'}`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${settings.auto_response_enabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Response Tone</label>
                    <select value={settings.auto_response_tone} onChange={e => setSettings({...settings, auto_response_tone: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#C41E3A] outline-none">
                      <option value="professional">Professional</option>
                      <option value="friendly">Friendly</option>
                      <option value="casual">Casual</option>
                      <option value="formal">Formal</option>
                      <option value="empathetic">Empathetic</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">OpenAI API Key</label>
                    <input type="password" value={settings.openai_api_key} onChange={e => setSettings({...settings, openai_api_key: e.target.value})} placeholder="sk-..." className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#C41E3A] focus:ring-1 focus:ring-[#C41E3A]/20 outline-none" />
                    <p className="text-xs text-gray-400 mt-1">Required for AI auto-response. Get one at platform.openai.com</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 mb-1">Notification Preferences</h2>
                  <p className="text-sm text-gray-500">Choose how you want to be notified about new reviews.</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h3 className="font-semibold text-gray-900">Email Notifications</h3>
                      <p className="text-sm text-gray-500">Receive email alerts for new reviews</p>
                    </div>
                    <button
                      onClick={() => setSettings({...settings, notification_email: !settings.notification_email})}
                      className={`w-12 h-6 rounded-full transition-colors ${settings.notification_email ? 'bg-[#C41E3A]' : 'bg-gray-300'}`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${settings.notification_email ? 'translate-x-6' : 'translate-x-0.5'}`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h3 className="font-semibold text-gray-900">Push Notifications</h3>
                      <p className="text-sm text-gray-500">Browser push notifications for urgent reviews</p>
                    </div>
                    <button
                      onClick={() => setSettings({...settings, notification_push: !settings.notification_push})}
                      className={`w-12 h-6 rounded-full transition-colors ${settings.notification_push ? 'bg-[#C41E3A]' : 'bg-gray-300'}`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${settings.notification_push ? 'translate-x-6' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'account' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 mb-1">Account Information</h2>
                  <p className="text-sm text-gray-500">Manage your account details and subscription.</p>
                </div>

                <div className="space-y-4">
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-gray-500">Email</label>
                        <p className="font-medium text-gray-900">{user?.email}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500">Name</label>
                        <p className="font-medium text-gray-900">{profile?.full_name || 'Not set'}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500">Plan</label>
                        <p className="font-medium text-gray-900 capitalize">{profile?.tier || 'free'}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500">Member Since</label>
                        <p className="font-medium text-gray-900">{profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tap Payments API Key</label>
                    <input type="password" value={settings.tap_api_key} onChange={e => setSettings({...settings, tap_api_key: e.target.value})} placeholder="sk_live_..." className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#C41E3A] focus:ring-1 focus:ring-[#C41E3A]/20 outline-none" />
                    <p className="text-xs text-gray-400 mt-1">For payment processing. Get from dashboard.tap.company</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
