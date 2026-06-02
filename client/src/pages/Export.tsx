import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Link } from 'wouter';

export default function Export() {
  const { user } = useAuth();
  const [format, setFormat] = useState<'csv' | 'json'>('csv');
  const [dateRange, setDateRange] = useState<'all' | '30d' | '90d'>('all');
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    let query = supabase.from('reviews').select('*').eq('user_id', user!.id);
    if (dateRange !== 'all') {
      const days = dateRange === '30d' ? 30 : 90;
      const since = new Date(Date.now() - days * 86400000).toISOString();
      query = query.gte('created_at', since);
    }
    const { data } = await query.order('created_at', { ascending: false });
    
    if (!data || data.length === 0) {
      alert('No reviews to export');
      setExporting(false);
      return;
    }

    let content: string;
    let filename: string;
    let mimeType: string;

    if (format === 'csv') {
      const headers = ['Reviewer', 'Rating', 'Content', 'Platform', 'Sentiment', 'Response', 'Date'];
      const rows = data.map(r => [
        r.reviewer_name,
        r.rating,
        `"${(r.content || '').replace(/"/g, '""')}"`,
        r.platform,
        r.sentiment,
        `"${(r.response || '').replace(/"/g, '""')}"`,
        new Date(r.created_at).toLocaleDateString(),
      ]);
      content = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      filename = `eqence-reviews-${new Date().toISOString().split('T')[0]}.csv`;
      mimeType = 'text/csv';
    } else {
      content = JSON.stringify(data, null, 2);
      filename = `eqence-reviews-${new Date().toISOString().split('T')[0]}.json`;
      mimeType = 'application/json';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    setExporting(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <Link href="/dashboard" className="text-gray-500 hover:text-gray-700">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Export Report</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Export Reviews Data</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Format</label>
              <div className="flex gap-3">
                <button onClick={() => setFormat('csv')} className={`px-4 py-2 rounded-lg text-sm font-medium ${format === 'csv' ? 'bg-[#C41E3A] text-white' : 'bg-gray-100 text-gray-700'}`}>CSV</button>
                <button onClick={() => setFormat('json')} className={`px-4 py-2 rounded-lg text-sm font-medium ${format === 'json' ? 'bg-[#C41E3A] text-white' : 'bg-gray-100 text-gray-700'}`}>JSON</button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
              <div className="flex gap-3">
                <button onClick={() => setDateRange('30d')} className={`px-4 py-2 rounded-lg text-sm font-medium ${dateRange === '30d' ? 'bg-[#C41E3A] text-white' : 'bg-gray-100 text-gray-700'}`}>Last 30 Days</button>
                <button onClick={() => setDateRange('90d')} className={`px-4 py-2 rounded-lg text-sm font-medium ${dateRange === '90d' ? 'bg-[#C41E3A] text-white' : 'bg-gray-100 text-gray-700'}`}>Last 90 Days</button>
                <button onClick={() => setDateRange('all')} className={`px-4 py-2 rounded-lg text-sm font-medium ${dateRange === 'all' ? 'bg-[#C41E3A] text-white' : 'bg-gray-100 text-gray-700'}`}>All Time</button>
              </div>
            </div>

            <button onClick={handleExport} disabled={exporting} className="w-full py-3 bg-[#C41E3A] text-white rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50 mt-4">
              {exporting ? 'Exporting...' : `Export as ${format.toUpperCase()}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
