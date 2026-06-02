import { useState } from 'react';
import { Link } from 'wouter';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';

export default function ForgotPassword() {
  const { t } = useI18n();
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { setError('Email required'); return; }
    setLoading(true);
    setError('');
    const { error: err } = await resetPassword(email);
    if (err) { setError(err); setLoading(false); return; }
    setSent(true);
    setLoading(false);
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Check Your Email</h2>
          <p className="text-gray-500 mb-6">
            We've sent a password reset link to <strong>{email}</strong>. 
            Please check your inbox and follow the instructions.
          </p>
          <Link href="/login" className="text-[#C41E3A] hover:underline font-medium">
            {t('forgot.back')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <Link href="/" className="text-[#C41E3A] font-bold text-2xl">Eqence</Link>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('forgot.title')}</h2>
        <p className="text-gray-500 mb-8">{t('forgot.subtitle')}</p>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('forgot.email')}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[#C41E3A] focus:ring-2 focus:ring-[#C41E3A]/20 outline-none transition-all duration-150"
              placeholder="you@example.com"
              required
            />
          </div>

          <button type="submit" disabled={loading} className="w-full btn-primary disabled:opacity-60 disabled:cursor-not-allowed">
            {loading ? 'Sending...' : t('forgot.submit')}
          </button>
        </form>

        <p className="mt-6 text-center">
          <Link href="/login" className="text-sm text-[#C41E3A] hover:underline font-medium">
            {t('forgot.back')}
          </Link>
        </p>
      </div>
    </div>
  );
}
