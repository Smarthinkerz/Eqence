import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';

const plans = [
  { id: 'free', name: 'Free', price: 0, features: ['5 reviews/month', 'Manual entry only', 'Basic analytics'] },
  { id: 'starter', name: 'Starter', price: 29, features: ['50 reviews/month', 'Shopify import', 'AI responses'] },
  { id: 'basic', name: 'Basic', price: 59, features: ['200 reviews/month', 'All platforms', 'Auto-response'] },
  { id: 'advance', name: 'Advance', price: 99, features: ['Unlimited reviews', 'Custom AI tone', 'Priority support'] },
  { id: 'premium', name: 'Premium', price: 199, features: ['White-label', 'API access', 'Custom integrations'] },
  { id: 'enterprise', name: 'Enterprise', price: 499, features: ['SLA', 'On-premise', 'Dedicated manager'] },
];

export default function Register() {
  const { t } = useI18n();
  const { signUp } = useAuth();
  const [, navigate] = useLocation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [plan, setPlan] = useState('starter');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirm) { setError('Passwords do not match'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }

    setLoading(true);
    const { error: err } = await signUp(email, password, name, plan);
    if (err) { setError(err); setLoading(false); return; }
    setSuccess(true);
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-sm border border-gray-100">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Created!</h2>
          <p className="text-gray-500 mb-6">Check your email to verify your account, then sign in.</p>
          <Link href="/login" className="inline-block px-6 py-3 bg-[#C41E3A] text-white rounded-lg font-semibold hover:bg-red-700">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 gradient-navy items-center justify-center p-12">
        <div className="max-w-md text-white">
          <h1 className="text-4xl font-bold mb-4">Join Eqence</h1>
          <p className="text-lg opacity-90 leading-relaxed">
            Start protecting your store's reputation today. Set up in under 5 minutes 
            with our guided onboarding process.
          </p>
          <div className="mt-8 space-y-4">
            {['Real-time review monitoring', 'AI-powered auto-responses', 'Sentiment analytics dashboard'].map((item, i) => (
              <div key={i} className="flex items-center gap-3 opacity-90">
                <div className="w-6 h-6 rounded-full bg-[#C41E3A] flex items-center justify-center flex-shrink-0">
                  <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-gray-50 overflow-y-auto">
        <div className="w-full max-w-md">
          <div className="mb-6">
            <Link href="/" className="text-[#C41E3A] font-bold text-2xl">Eqence</Link>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('register.title')}</h2>
          <p className="text-gray-500 mb-6">{t('register.subtitle')}</p>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('register.name')}</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#C41E3A] focus:ring-2 focus:ring-[#C41E3A]/20 outline-none" required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('register.email')}</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#C41E3A] focus:ring-2 focus:ring-[#C41E3A]/20 outline-none" required />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('register.password')}</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#C41E3A] focus:ring-2 focus:ring-[#C41E3A]/20 outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('register.confirm')}</label>
                <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#C41E3A] focus:ring-2 focus:ring-[#C41E3A]/20 outline-none" required />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('register.plan')}</label>
              <select value={plan} onChange={(e) => setPlan(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#C41E3A] focus:ring-2 focus:ring-[#C41E3A]/20 outline-none">
                {plans.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.price > 0 ? `- $${p.price}/mo` : '- Free'}
                  </option>
                ))}
              </select>
            </div>

            <button type="submit" disabled={loading} className="w-full btn-primary disabled:opacity-60 disabled:cursor-not-allowed mt-2">
              {loading ? 'Creating account...' : t('register.submit')}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link href="/login" className="text-[#C41E3A] hover:underline font-medium">
              {t('register.login')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
