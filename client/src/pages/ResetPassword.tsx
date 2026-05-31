import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useI18n } from '../contexts/I18nContext';

export default function ResetPassword() {
  const { t } = useI18n();
  const [, navigate] = useLocation();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      // In production, this calls the backend API with the token from URL
      await new Promise(r => setTimeout(r, 800));
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch {
      setError('Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Password Reset Successfully</h2>
          <p className="text-gray-500">Redirecting you to login...</p>
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

        <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('reset.title')}</h2>
        <p className="text-gray-500 mb-8">Enter your new password below.</p>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('reset.password')}</label>
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('reset.confirm')}</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[#C41E3A] 
                         focus:ring-2 focus:ring-[#C41E3A]/20 outline-none transition-all duration-150"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Resetting...' : t('reset.submit')}
          </button>
        </form>

        <p className="mt-6 text-center">
          <Link href="/login" className="text-sm text-[#C41E3A] hover:underline font-medium">
            Back to Login
          </Link>
        </p>
      </div>
    </div>
  );
}
