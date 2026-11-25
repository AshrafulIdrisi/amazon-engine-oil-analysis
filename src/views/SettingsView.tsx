import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  KeyRound,
  Save,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { MarketplaceCode } from '../types/automotive';
import { getMpConfig } from '../utils/marketplace';

interface SettingsViewProps {
  marketplace?: MarketplaceCode;
  onSettingsSaved?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  marketplace = 'AU',
  onSettingsSaved,
}) => {
  const cfg = getMpConfig(marketplace);
  const [includeTax, setIncludeTax] = useState(true);
  const [fbaFeeModel, setFbaFeeModel] = useState('standard-au');
  const [pollFrequency, setPollFrequency] = useState<'hourly' | 'daily' | 'monthly' | 'manual'>('monthly');
  const [autoMonthlyCapture, setAutoMonthlyCapture] = useState(true);
  const [spApiClientId, setSpApiClientId] = useState('');
  const [rainforestApiKey, setRainforestApiKey] = useState('');
  const [keepaApiKey, setKeepaApiKey] = useState('');
  const [hasRainforest, setHasRainforest] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return;
        setIncludeTax(Boolean(data.includeTax));
        if (data.fbaFeeModel) setFbaFeeModel(data.fbaFeeModel);
        if (data.pollFrequency) setPollFrequency(data.pollFrequency);
        setAutoMonthlyCapture(data.autoMonthlyCapture !== false);
        setSpApiClientId(data.spApiClientId || '');
        setRainforestApiKey(data.rainforestApiKeyMasked || '');
        setKeepaApiKey(data.keepaApiKeyMasked || '');
        setHasRainforest(Boolean(data.hasRainforestApiKey));
      })
      .catch(() => {});
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          includeTax,
          fbaFeeModel,
          pollFrequency,
          autoMonthlyCapture,
          spApiClientId,
          rainforestApiKey,
          keepaApiKey,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setHasRainforest(Boolean(data.hasRainforestApiKey));
        if (data.rainforestApiKeyMasked) setRainforestApiKey(data.rainforestApiKeyMasked);
        if (data.keepaApiKeyMasked) setKeepaApiKey(data.keepaApiKeyMasked);
        setSaved(true);
        onSettingsSaved?.();
        setTimeout(() => setSaved(false), 2500);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <form onSubmit={handleSave} className="space-y-6">
        {/* Marketplace Localization Settings */}
        <div className="p-5 rounded-xl bg-white border border-purple-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-purple-600" />
            <h2 className="text-sm font-bold text-slate-900">
              Marketplace Localization &amp; Monthly Archiving ({cfg.countryName})
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-600 font-medium mb-1">Active Marketplace</label>
              <input
                type="text"
                disabled
                value={`Amazon ${cfg.countryName} (https://${cfg.domain})`}
                className="w-full px-3 py-2 bg-purple-50/50 border border-purple-200 rounded-lg text-slate-600 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-medium mb-1">Settlement Currency</label>
              <input
                type="text"
                disabled
                value={`${cfg.currency} (${cfg.currencySymbol}) · Delivery ZIP ${cfg.zipCode}`}
                className="w-full px-3 py-2 bg-purple-50/50 border border-purple-200 rounded-lg text-slate-600 font-mono"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-purple-50/40 border border-purple-200">
              <div>
                <span className="font-semibold text-slate-900 block">
                  Auto-Store Monthly Catalog Snapshots
                </span>
                <span className="text-[11px] text-slate-500">
                  Automatically archives <code className="text-purple-700">YYYY-MM</code> snapshots on
                  every scrape &amp; month rollover
                </span>
              </div>
              <input
                type="checkbox"
                checked={autoMonthlyCapture}
                onChange={(e) => setAutoMonthlyCapture(e.target.checked)}
                className="rounded border-purple-300 accent-purple-600 w-4 h-4 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-purple-50/40 border border-purple-200">
              <div>
                <span className="font-semibold text-slate-900 block">Include VAT / GST in Retail</span>
                <span className="text-[11px] text-slate-500">
                  Tax-inclusive shelf prices (10% GST AU, 19% MwSt DE, 23% VAT PL)
                </span>
              </div>
              <input
                type="checkbox"
                checked={includeTax}
                onChange={(e) => setIncludeTax(e.target.checked)}
                className="rounded border-purple-300 accent-purple-600 w-4 h-4 cursor-pointer"
              />
            </div>

            <div className="p-3 rounded-lg bg-purple-50/40 border border-purple-200 md:col-span-2">
              <label className="font-semibold text-slate-900 block mb-1">
                FBA Fulfillment Cost Matrix
              </label>
              <select
                value={fbaFeeModel}
                onChange={(e) => setFbaFeeModel(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-purple-200 rounded text-slate-900 focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-500/15"
              >
                <option value="standard-au" className="bg-white text-slate-900">Standard Parcel FBA Rate Card (1L - 5L Packs)</option>
                <option value="heavy-bulky" className="bg-white text-slate-900">Heavy / Bulky FBA (6L - 20L Oil Containers)</option>
                <option value="fbm" className="bg-white text-slate-900">Seller Fulfilled Merchant (FBM)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Multi-Country Scraper & Authorized APIs */}
        <div className="p-5 rounded-xl bg-white border border-purple-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <KeyRound size={18} className="text-purple-600" />
              <h2 className="text-sm font-bold text-slate-900">
                Multi-Marketplace Access &amp; Authorized APIs (AU / US / DE / PL / PT)
              </h2>
            </div>
            <span
              className={`text-[10px] px-2 py-0.5 rounded font-semibold border ${
                hasRainforest
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-purple-50 text-purple-700 border-purple-200'
              }`}
            >
              {hasRainforest ? 'Rainforest API Configured' : 'AU, US & PT Direct HTML Live'}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-purple-50/60 border border-purple-200 text-xs text-slate-700 space-y-1">
            <div className="font-semibold text-purple-900 flex items-center gap-1.5">
              <Calendar size={14} className="text-purple-600" />
              <span>Regional Scraping Support Matrix</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              • <strong>Australia (amazon.com.au), USA (amazon.com) &amp; Portugal (amazon.es/-/pt):</strong> Live direct HTML crawling works out-of-the-box.<br />
              • <strong>Germany (amazon.de) &amp; Poland (amazon.pl):</strong> Direct server requests receive Amazon&apos;s CAPTCHA gate. Enter an authorized <strong>Rainforest API Key</strong> below to query DE &amp; PL cleanly without bypassing CAPTCHA, or import CSV/JSON via the API.
            </p>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-600 font-medium mb-1">
                Rainforest API Key (Enables Live Germany .de &amp; Poland .pl Collection)
              </label>
              <input
                type="password"
                placeholder="Enter your Rainforest API key..."
                value={rainforestApiKey}
                onChange={(e) => setRainforestApiKey(e.target.value)}
                className="w-full px-3 py-2 bg-purple-50/40 border border-purple-200 rounded-lg text-slate-900 font-mono focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-500/15"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-medium mb-1">
                Keepa API Token (Optional)
              </label>
              <input
                type="password"
                placeholder="Optional Keepa API key..."
                value={keepaApiKey}
                onChange={(e) => setKeepaApiKey(e.target.value)}
                className="w-full px-3 py-2 bg-purple-50/40 border border-purple-200 rounded-lg text-slate-900 font-mono focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-500/15"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-medium mb-1">
                Amazon SP-API LWA Client ID (Optional)
              </label>
              <input
                type="text"
                placeholder="amzn1.application-oa2-client..."
                value={spApiClientId}
                onChange={(e) => setSpApiClientId(e.target.value)}
                className="w-full px-3 py-2 bg-purple-50/40 border border-purple-200 rounded-lg text-slate-900 font-mono focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-500/15"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-medium mb-1">
                Scheduled Scraping &amp; Snapshot Cadence
              </label>
              <select
                value={pollFrequency}
                onChange={(e) => setPollFrequency(e.target.value as any)}
                className="w-full px-3 py-2 bg-purple-50/40 border border-purple-200 rounded-lg text-slate-900 focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-500/15"
              >
                <option value="monthly" className="bg-white text-slate-900">Monthly Catalog Snapshot Sync (Auto-Archives YYYY-MM)</option>
                <option value="daily" className="bg-white text-slate-900">Nightly Comprehensive Engine Oil BSR Sync</option>
                <option value="hourly" className="bg-white text-slate-900">Hourly Deal &amp; Price Drop Polling</option>
                <option value="manual" className="bg-white text-slate-900">Manual On-Demand Only</option>
              </select>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-between pt-2">
          {saved ? (
            <span className="text-xs text-emerald-700 flex items-center gap-1.5 font-medium">
              <CheckCircle2 size={16} />
              <span>Settings saved to disk (data/platform_settings.json)!</span>
            </span>
          ) : (
            <span className="text-xs text-slate-500">
              Settings persist across restarts and apply immediately to scrapes &amp; monthly archiving.
            </span>
          )}

          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50"
          >
            <Save size={14} />
            <span>{saving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
