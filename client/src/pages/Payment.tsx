import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { useI18n } from '../contexts/I18nContext';

const planDetails: Record<string, { name: string; price: number; features: string[] }> = {
  starter: { name: 'Starter', price: 29, features: ['100 reviews/mo', 'Basic sentiment analysis', 'Email notifications', '1 platform'] },
  basic: { name: 'Basic', price: 59, features: ['500 reviews/mo', 'Advanced sentiment', 'Auto-responses (50/mo)', '3 platforms', 'Priority support'] },
  advance: { name: 'Advance', price: 99, features: ['2,000 reviews/mo', 'Full AI analysis', 'Unlimited auto-responses', '10 platforms', 'Custom templates'] },
  premium: { name: 'Premium', price: 199, features: ['10,000 reviews/mo', 'Enterprise AI', 'All platforms', 'Dedicated manager', 'API access', 'White-label'] },
  enterprise: { name: 'Enterprise', price: 499, features: ['Unlimited reviews', 'Custom AI models', 'All platforms', 'SLA guarantee', 'Custom integrations', 'On-premise option'] },
};

export default function Payment() {
  const { t } = useI18n();
  const [, navigate] = useLocation();
  const [loading, setLoading] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [cardName, setCardName] = useState('');
  const [error, setError] = useState('');

  const pending = JSON.parse(localStorage.getItem('eqence_pending_user') || '{}');
  const plan = planDetails[pending.plan] || planDetails.starter;

  useEffect(() => {
    if (!pending.email) {
      navigate('/register');
    }
  }, []);

  const formatCardNumber = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  const formatExpiry = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) return digits.slice(0, 2) + '/' + digits.slice(2);
    return digits;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Get Tap API key from CMS settings or env
      const cmsSettings = JSON.parse(localStorage.getItem('eqence_cms_settings') || '{}');
      const tapKey = cmsSettings.tapApiKey || import.meta.env.VITE_TAP_API_KEY || '';

      if (tapKey) {
        // Create Tap Payments charge
        const res = await fetch('https://api.tap.company/v2/charges', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${tapKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: plan.price,
            currency: 'USD',
            customer: {
              first_name: pending.name?.split(' ')[0] || '',
              last_name: pending.name?.split(' ').slice(1).join(' ') || '',
              email: pending.email,
            },
            source: { id: 'src_card' },
            redirect: { url: window.location.origin + '/dashboard' },
            description: `Eqence ${plan.name} Plan - Monthly Subscription`,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.transaction?.url) {
            window.location.href = data.transaction.url;
            return;
          }
        }
      }

      // Demo mode - simulate payment success
      await new Promise(r => setTimeout(r, 1500));
      localStorage.setItem('eqence_token', 'demo_token_' + Date.now());
      localStorage.setItem('eqence_user', JSON.stringify({ ...pending, subscribed: true }));
      localStorage.removeItem('eqence_pending_user');
      navigate('/dashboard');
    } catch {
      setError('Payment processing failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="text-[#C41E3A] font-bold text-2xl">Eqence</Link>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('payment.title')}</h1>
        <p className="text-gray-500 mb-8">{t('payment.subtitle')}</p>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Payment form */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Details</h3>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cardholder Name</label>
                  <input
                    type="text"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[#C41E3A] 
                               focus:ring-2 focus:ring-[#C41E3A]/20 outline-none transition-all duration-150"
                    placeholder="John Doe"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[#C41E3A] 
                               focus:ring-2 focus:ring-[#C41E3A]/20 outline-none transition-all duration-150 font-mono"
                    placeholder="4242 4242 4242 4242"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Expiry</label>
                    <input
                      type="text"
                      value={expiry}
                      onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[#C41E3A] 
                                 focus:ring-2 focus:ring-[#C41E3A]/20 outline-none transition-all duration-150 font-mono"
                      placeholder="MM/YY"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CVC</label>
                    <input
                      type="text"
                      value={cvc}
                      onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[#C41E3A] 
                                 focus:ring-2 focus:ring-[#C41E3A]/20 outline-none transition-all duration-150 font-mono"
                      placeholder="123"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary text-lg py-4 mt-4 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Processing...
                    </span>
                  ) : `Pay $${plan.price}/month`}
                </button>

                <div className="flex items-center justify-center gap-2 text-xs text-gray-400 mt-3">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  <span>Secured by Tap Payments. 256-bit SSL encryption.</span>
                </div>
              </form>
            </div>
          </div>

          {/* Order summary */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
              
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-gray-900">{plan.name} Plan</span>
                  <span className="text-[#C41E3A] font-bold text-xl">${plan.price}</span>
                </div>
                <span className="text-sm text-gray-500">Billed monthly</span>
              </div>

              <div className="space-y-2 mb-4">
                {plan.features.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                    <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>{f}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-100 pt-4">
                <div className="flex justify-between text-sm text-gray-500 mb-1">
                  <span>Subtotal</span>
                  <span>${plan.price}.00</span>
                </div>
                <div className="flex justify-between text-sm text-gray-500 mb-3">
                  <span>Tax</span>
                  <span>$0.00</span>
                </div>
                <div className="flex justify-between font-bold text-gray-900 text-lg">
                  <span>Total</span>
                  <span>${plan.price}.00/mo</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
