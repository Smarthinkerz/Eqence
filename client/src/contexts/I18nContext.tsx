import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

type Language = string;

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isLoading: boolean;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

// Hand-crafted translations for EN, JA, AR
const translations: Record<string, Record<string, string>> = {
  en: {
    'nav.home': 'Home',
    'nav.features': 'Features',
    'nav.pricing': 'Pricing',
    'nav.login': 'Login',
    'nav.register': 'Get Started',
    'hero.title': 'Protect & Grow Your Shopify Store Reputation',
    'hero.subtitle': 'AI-powered reputation management that monitors, analyzes, and responds to customer reviews across all platforms — automatically.',
    'hero.cta': 'Start Free Trial',
    'hero.cta2': 'Watch Demo',
    'features.title': 'Everything You Need to Manage Your Reputation',
    'features.subtitle': 'Powerful tools designed specifically for Shopify merchants',
    'features.monitoring': 'Review Monitoring',
    'features.monitoring.desc': 'Track reviews across Google, Shopify, Facebook, and 50+ platforms in real-time.',
    'features.sentiment': 'Sentiment Analysis',
    'features.sentiment.desc': 'AI-powered sentiment detection identifies trends and flags critical reviews instantly.',
    'features.autoresponse': 'Auto-Response Engine',
    'features.autoresponse.desc': 'Generate personalized, brand-aligned responses to reviews automatically using AI.',
    'features.analytics': 'Advanced Analytics',
    'features.analytics.desc': 'Track reputation score trends, response rates, and customer satisfaction over time.',
    'features.notifications': 'Smart Notifications',
    'features.notifications.desc': 'Get instant alerts for negative reviews, rating drops, and competitor activity.',
    'features.integrations': 'Shopify Integration',
    'features.integrations.desc': 'One-click Shopify app installation with automatic review sync and order matching.',
    'pricing.title': 'Simple, Transparent Pricing',
    'pricing.subtitle': 'Start free, scale as you grow. No hidden fees.',
    'pricing.free': 'Free',
    'pricing.starter': 'Starter',
    'pricing.basic': 'Basic',
    'pricing.advance': 'Advance',
    'pricing.premium': 'Premium',
    'pricing.enterprise': 'Enterprise',
    'pricing.mo': '/mo',
    'pricing.cta': 'Get Started',
    'pricing.current': 'Current Plan',
    'pricing.contact': 'Contact Sales',
    'howit.title': 'How It Works',
    'howit.subtitle': 'Get started in minutes, not days',
    'howit.step1': 'Connect Your Store',
    'howit.step1.desc': 'Install our Shopify app and connect your review platforms in one click.',
    'howit.step2': 'Monitor & Analyze',
    'howit.step2.desc': 'Our AI monitors all reviews and provides real-time sentiment analysis.',
    'howit.step3': 'Respond & Grow',
    'howit.step3.desc': 'Auto-respond to reviews and watch your reputation score climb.',
    'testimonials.title': 'Trusted by 2,000+ Shopify Merchants',
    'trust.title': 'Enterprise-Grade Security',
    'trust.subtitle': 'Your data is protected with bank-level encryption and compliance standards.',
    'footer.product': 'Product',
    'footer.company': 'Company',
    'footer.support': 'Support',
    'footer.legal': 'Legal',
    'footer.admin': 'Admin Login',
    'login.title': 'Welcome Back',
    'login.subtitle': 'Sign in to your Eqence dashboard',
    'login.email': 'Email Address',
    'login.password': 'Password',
    'login.forgot': 'Forgot Password?',
    'login.submit': 'Sign In',
    'login.register': "Don't have an account? Sign up",
    'register.title': 'Create Your Account',
    'register.subtitle': 'Start managing your reputation today',
    'register.name': 'Full Name',
    'register.store': 'Shopify Store URL',
    'register.email': 'Email Address',
    'register.password': 'Password',
    'register.confirm': 'Confirm Password',
    'register.plan': 'Select Plan',
    'register.submit': 'Create Account',
    'register.login': 'Already have an account? Sign in',
    'dashboard.title': 'Dashboard',
    'dashboard.reputation': 'Reputation Score',
    'dashboard.reviews': 'Total Reviews',
    'dashboard.response': 'Response Rate',
    'dashboard.sentiment': 'Positive Sentiment',
    'forgot.title': 'Reset Your Password',
    'forgot.subtitle': 'Enter your email and we\'ll send you a reset link',
    'forgot.email': 'Email Address',
    'forgot.submit': 'Send Reset Link',
    'forgot.back': 'Back to Login',
    'reset.title': 'Set New Password',
    'reset.password': 'New Password',
    'reset.confirm': 'Confirm New Password',
    'reset.submit': 'Reset Password',
    'payment.title': 'Complete Your Payment',
    'payment.subtitle': 'Secure payment powered by Tap Payments',
  },
  ja: {
    'nav.home': 'ホーム',
    'nav.features': '機能',
    'nav.pricing': '料金',
    'nav.login': 'ログイン',
    'nav.register': '始める',
    'hero.title': 'Shopifyストアの評判を守り、成長させる',
    'hero.subtitle': 'AIを活用したレピュテーション管理が、すべてのプラットフォームで顧客レビューを自動的に監視、分析、対応します。',
    'hero.cta': '無料トライアル開始',
    'hero.cta2': 'デモを見る',
    'features.title': '評判管理に必要なすべて',
    'features.subtitle': 'Shopifyマーチャント向けに設計された強力なツール',
    'features.monitoring': 'レビュー監視',
    'features.monitoring.desc': 'Google、Shopify、Facebook、50以上のプラットフォームでリアルタイムにレビューを追跡。',
    'features.sentiment': '感情分析',
    'features.sentiment.desc': 'AI搭載の感情検出がトレンドを特定し、重要なレビューを即座にフラグ。',
    'features.autoresponse': '自動応答エンジン',
    'features.autoresponse.desc': 'AIを使用して、パーソナライズされたブランドに沿った応答を自動生成。',
    'features.analytics': '高度な分析',
    'features.analytics.desc': '評判スコアのトレンド、応答率、顧客満足度を時系列で追跡。',
    'features.notifications': 'スマート通知',
    'features.notifications.desc': 'ネガティブレビュー、評価低下、競合活動の即時アラート。',
    'features.integrations': 'Shopify統合',
    'features.integrations.desc': 'ワンクリックでShopifyアプリをインストール、自動レビュー同期と注文マッチング。',
    'pricing.title': 'シンプルで透明な料金',
    'pricing.subtitle': '無料で始めて、成長に合わせてスケール。隠れた料金なし。',
    'pricing.free': '無料',
    'pricing.starter': 'スターター',
    'pricing.basic': 'ベーシック',
    'pricing.advance': 'アドバンス',
    'pricing.premium': 'プレミアム',
    'pricing.enterprise': 'エンタープライズ',
    'pricing.mo': '/月',
    'pricing.cta': '始める',
    'pricing.current': '現在のプラン',
    'pricing.contact': '営業に連絡',
    'howit.title': '使い方',
    'howit.subtitle': '数日ではなく、数分で開始',
    'howit.step1': 'ストアを接続',
    'howit.step1.desc': 'Shopifyアプリをインストールし、ワンクリックでレビュープラットフォームを接続。',
    'howit.step2': '監視と分析',
    'howit.step2.desc': 'AIがすべてのレビューを監視し、リアルタイムの感情分析を提供。',
    'howit.step3': '応答と成長',
    'howit.step3.desc': 'レビューに自動応答し、評判スコアの上昇を確認。',
    'testimonials.title': '2,000以上のShopifyマーチャントに信頼されています',
    'trust.title': 'エンタープライズグレードのセキュリティ',
    'trust.subtitle': 'データは銀行レベルの暗号化とコンプライアンス基準で保護されています。',
    'footer.product': '製品',
    'footer.company': '会社',
    'footer.support': 'サポート',
    'footer.legal': '法的情報',
    'footer.admin': '管理者ログイン',
    'login.title': 'おかえりなさい',
    'login.subtitle': 'Eqenceダッシュボードにサインイン',
    'login.email': 'メールアドレス',
    'login.password': 'パスワード',
    'login.forgot': 'パスワードをお忘れですか？',
    'login.submit': 'サインイン',
    'login.register': 'アカウントをお持ちでない方はこちら',
    'register.title': 'アカウント作成',
    'register.subtitle': '今日からレピュテーション管理を始めましょう',
    'register.name': '氏名',
    'register.store': 'ShopifyストアURL',
    'register.email': 'メールアドレス',
    'register.password': 'パスワード',
    'register.confirm': 'パスワード確認',
    'register.plan': 'プラン選択',
    'register.submit': 'アカウント作成',
    'register.login': 'すでにアカウントをお持ちの方',
    'dashboard.title': 'ダッシュボード',
    'dashboard.reputation': '評判スコア',
    'dashboard.reviews': '総レビュー数',
    'dashboard.response': '応答率',
    'dashboard.sentiment': 'ポジティブ感情',
    'forgot.title': 'パスワードリセット',
    'forgot.subtitle': 'メールアドレスを入力してリセットリンクを受け取る',
    'forgot.email': 'メールアドレス',
    'forgot.submit': 'リセットリンク送信',
    'forgot.back': 'ログインに戻る',
    'reset.title': '新しいパスワード設定',
    'reset.password': '新しいパスワード',
    'reset.confirm': 'パスワード確認',
    'reset.submit': 'パスワードリセット',
    'payment.title': 'お支払い完了',
    'payment.subtitle': 'Tap Paymentsによる安全な決済',
  },
  ar: {
    'nav.home': 'الرئيسية',
    'nav.features': 'المميزات',
    'nav.pricing': 'الأسعار',
    'nav.login': 'تسجيل الدخول',
    'nav.register': 'ابدأ الآن',
    'hero.title': 'احمِ وطوّر سمعة متجرك على Shopify',
    'hero.subtitle': 'إدارة السمعة المدعومة بالذكاء الاصطناعي تراقب وتحلل وترد على مراجعات العملاء عبر جميع المنصات - تلقائياً.',
    'hero.cta': 'ابدأ التجربة المجانية',
    'hero.cta2': 'شاهد العرض',
    'features.title': 'كل ما تحتاجه لإدارة سمعتك',
    'features.subtitle': 'أدوات قوية مصممة خصيصاً لتجار Shopify',
    'pricing.title': 'أسعار بسيطة وشفافة',
    'pricing.subtitle': 'ابدأ مجاناً، وتوسع مع نموك. بدون رسوم مخفية.',
    'pricing.mo': '/شهر',
    'pricing.cta': 'ابدأ الآن',
    'pricing.contact': 'تواصل مع المبيعات',
    'login.title': 'مرحباً بعودتك',
    'login.subtitle': 'سجل دخولك إلى لوحة تحكم Eqence',
    'login.email': 'البريد الإلكتروني',
    'login.password': 'كلمة المرور',
    'login.forgot': 'نسيت كلمة المرور؟',
    'login.submit': 'تسجيل الدخول',
    'footer.admin': 'دخول المسؤول',
    'dashboard.title': 'لوحة التحكم',
    'forgot.title': 'إعادة تعيين كلمة المرور',
    'forgot.submit': 'إرسال رابط إعادة التعيين',
    'payment.title': 'إتمام الدفع',
  },
};

// Google Translate free endpoint for auto-translation
async function translateText(text: string, targetLang: string): Promise<string> {
  try {
    const res = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`
    );
    const data = await res.json();
    return data[0]?.map((item: any[]) => item[0]).join('') || text;
  } catch {
    return text;
  }
}

// Detect user's country via IP
async function detectCountry(): Promise<string> {
  try {
    const res = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(3000) });
    const data = await res.json();
    return data.country_code || 'US';
  } catch {
    return 'US';
  }
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    return localStorage.getItem('eqence_lang') || 'en';
  });
  const [autoTranslations, setAutoTranslations] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  // IP-based language detection on first visit
  useEffect(() => {
    const hasManualChoice = localStorage.getItem('eqence_lang_manual');
    if (hasManualChoice) return;

    detectCountry().then((country) => {
      if (country === 'JP') {
        setLanguageState('ja');
        localStorage.setItem('eqence_lang', 'ja');
      } else {
        setLanguageState('en');
        localStorage.setItem('eqence_lang', 'en');
      }
    });
  }, []);

  // Auto-translate when language changes to non-supported language
  useEffect(() => {
    if (['en', 'ja', 'ar'].includes(language)) {
      setAutoTranslations({});
      return;
    }

    setIsLoading(true);
    const enKeys = Object.entries(translations.en);
    
    Promise.all(
      enKeys.map(async ([key, value]) => {
        const translated = await translateText(value, language);
        return [key, translated] as [string, string];
      })
    ).then((results) => {
      const map: Record<string, string> = {};
      results.forEach(([key, val]) => { map[key] = val; });
      setAutoTranslations(map);
      setIsLoading(false);
    });
  }, [language]);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('eqence_lang', lang);
    localStorage.setItem('eqence_lang_manual', 'true');
  }, []);

  const t = useCallback((key: string): string => {
    // Check hand-crafted translations first
    if (translations[language]?.[key]) {
      return translations[language][key];
    }
    // Check auto-translations
    if (autoTranslations[key]) {
      return autoTranslations[key];
    }
    // Fallback to English
    return translations.en[key] || key;
  }, [language, autoTranslations]);

  return (
    <I18nContext.Provider value={{ language, setLanguage, t, isLoading }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useI18n must be used within I18nProvider');
  return context;
}
