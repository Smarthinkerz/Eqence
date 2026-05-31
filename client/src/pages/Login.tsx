import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useI18n } from '../contexts/I18nContext';

export default function Login() {
  const { t } = useI18n();
  const [, navigate] = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Simulated auth - in production this calls the backend API
    try {
      await new Promise(r => setTimeout(r, 800));
      if (email && password.length >= 6) {
        localStorage.setItem('eqence_token', 'demo_token_' + Date.now());
        localStorage.setItem('eqence_user', JSON.stringify({ email, name: email.split('@')[0] }));
        navigate('/dashboard');
      } else {
        setError('Invalid email or password');
      }
    } catch {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-1/2 gradient-monza items-center justify-center p-12">
        <div className="max-w-md text-white">
          <h1 className="text-4xl font-bold mb-4">Eqence</h1>
          <p className="text-lg opacity-90 leading-relaxed">
            AI-powered reputation management that helps Shopify merchants monitor, analyze, 
            and respond to customer reviews across all platforms.
          </p>
          <div className="mt-8 flex items-center gap-3 opacity-80">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <span>Trusted by 2,000+ merchants worldwide</span>
          </div>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <Link href="/" className="text-[#C41E3A] font-bold text-2xl">Eqence</Link>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('login.title')}</h2>
          <p className="text-gray-500 mb-8">{t('login.subtitle')}</p>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('login.email')}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[#C41E3A] 
                           focus:ring-2 focus:ring-[#C41E3A]/20 outline-none transition-all duration-150"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('login.password')}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[#C41E3A] 
                           focus:ring-2 focus:ring-[#C41E3A]/20 outline-none transition-all duration-150"
                placeholder="••••••••"
                required
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input type="checkbox" className="rounded border-gray-300 text-[#C41E3A] focus:ring-[#C41E3A]" />
                Remember me
              </label>
              <Link href="/forgot-password" className="text-sm text-[#C41E3A] hover:underline font-medium">
                {t('login.forgot')}
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in...
                </span>
              ) : t('login.submit')}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            <Link href="/register" className="text-[#C41E3A] hover:underline font-medium">
              {t('login.register')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
