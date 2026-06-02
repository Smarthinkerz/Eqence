import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://lvodtuvfaaitfxndbxbz.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2b2R0dXZmYWFpdGZ4bmRieGJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyNDE1ODEsImV4cCI6MjA5NTgxNzU4MX0.K79WwToB1Jr9Uri21YH_V82yrJGtEhegz1LnqJgWEXI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  email: string;
  full_name: string;
  tier: string;
  role: 'user' | 'admin';
  created_at: string;
  updated_at: string;
};

export type Review = {
  id: string;
  user_id: string;
  reviewer_name: string;
  rating: number;
  content: string;
  platform: 'shopify' | 'google' | 'facebook' | 'instagram' | 'manual';
  sentiment: 'positive' | 'neutral' | 'negative';
  response: string | null;
  responded_at: string | null;
  created_at: string;
};

export type StoreSettings = {
  id: string;
  user_id: string;
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
  created_at: string;
  updated_at: string;
};
