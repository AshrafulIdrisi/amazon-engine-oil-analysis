import React, { useState } from 'react';
import {
  Cpu,
  Play,
  RotateCw,
  CheckCircle2,
  AlertTriangle,
  FileText,
} from 'lucide-react';
import { CollectionJob, MarketplaceCode } from '../types/automotive';
import { getMpConfig, shortDomain } from '../utils/marketplace';

interface DataJobsViewProps {
  jobs: CollectionJob[];
  onTriggerJob: (provider: string, category: string, query?: string) => Promise<boolean>;
  marketplace?: MarketplaceCode;
}

export const DataJobsView: React.FC<DataJobsViewProps> = ({
  jobs,
  onTriggerJob,
  marketplace = 'AU',
}) => {
  const cfg = getMpConfig(marketplace);
  const domain = shortDomain(marketplace);

  const [selectedProvider, setSelectedProvider] = useState(`${domain} Live Scraper`);
  const [selectedCategory, setSelectedCategory] = useState('all-engine-oils');
  const [customQuery, setCustomQuery] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [activeLogJob, setActiveLogJob] = useState<CollectionJob | null>(jobs[0] || null);

  React.useEffect(() => {
    setSelectedProvider(`${domain} Live Scraper`);
  }, [domain]);

  React.useEffect(() => {
    if (jobs.length > 0 && (!activeLogJob || !jobs.some((j) => j.id === activeLogJob.id))) {
      setActiveLogJob(jobs[0]);
    } else if (jobs.length === 0) {
      setActiveLogJob(null);
    }
  }, [jobs, activeLogJob]);

  const handleRunJob = async () => {
    setIsRunning(true);
    try {
      await onTriggerJob(selectedProvider, selectedCategory, customQuery.trim() || undefined);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {!cfg.directHtmlSupported && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
          <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold">
              {cfg.countryName} ({domain}) requires a Rainforest API Key or CSV/JSON Import
            </div>
            <p className="text-amber-800 mt-0.5">
              Unauthenticated direct HTML requests from this cloud server to <code>{domain}</code> are
              gated by Amazon&apos;s CAPTCHA check. Enter an authorized Rainforest API key in Settings
              to crawl live {cfg.currency} data without bypassing CAPTCHA, or import a CSV/JSON file.
            </p>
          </div>
        </div>
      )}

      {/* Provider Abstraction Strip */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-white border border-purple-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-900">
            <span>{domain} Direct Scraper</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded font-mono border ${
                cfg.directHtmlSupported
                  ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                  : 'text-amber-700 bg-amber-50 border-amber-200'
              }`}
            >
              {cfg.directHtmlSupported ? 'Live HTML OK' : 'CAPTCHA Gated'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            Oils browse node ({cfg.bestsellersNode}) &amp; /dp/&lt;ASIN&gt; ({cfg.zipCode})
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-purple-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-900">
            <span>Licensed Rainforest API</span>
            <span className="text-[10px] text-purple-700 bg-purple-100 border border-purple-200 px-1.5 py-0.5 rounded font-mono">
              AU/US/DE/PL/PT
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            Authorized partner API supporting {domain} when key is set in Settings
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-purple-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-900">
            <span>Amazon SP-API</span>
            <span className="text-[10px] text-purple-700 bg-purple-100 border border-purple-200 px-1.5 py-0.5 rounded font-mono">
              {cfg.marketplaceId}
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            Authorized Seller Catalog Items &amp; Competitive Pricing v0 endpoint
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-purple-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-900">
            <span>Monthly Snapshot Store</span>
            <span className="text-[10px] text-purple-800 bg-purple-100 border border-purple-200 px-1.5 py-0.5 rounded font-mono">
              YYYY-MM Saved
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            Auto-archives monthly {cfg.currency} price &amp; stock snapshots on every run
          </p>
        </div>
      </div>

      {/* Trigger New Job Card */}
      <div className="p-5 rounded-xl bg-white border border-purple-200/80 shadow-xs space-y-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Cpu size={16} className="text-purple-600" />
            <span>Launch Live {domain} Engine Oil Scrape</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Fetches live engine oil listings, {cfg.currency} prices, ratings, specs, BSR ranks, and product URLs from Amazon {cfg.countryName}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Data Collection Source
            </label>
            <select
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value)}
              className="w-full px-3 py-2 bg-purple-50/40 border border-purple-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-500/15"
            >
              <option value={`${domain} Live Scraper`} className="bg-white text-slate-900">
                {domain} Live Scraper ({cfg.currency})
              </option>
              <option value="Licensed Partner API" className="bg-white text-slate-900">
                Licensed Partner API (Rainforest / Keepa)
              </option>
              <option value="Amazon SP-API" className="bg-white text-slate-900">
                Amazon SP-API ({cfg.marketplaceId})
              </option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Target Viscosity &amp; Segment</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 bg-purple-50/40 border border-purple-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-500/15"
            >
              <option value="all-engine-oils" className="bg-white text-slate-900">
                Full Catalog &amp; Bestsellers ({cfg.bestsellersNode})
              </option>
              <option value="5w30-full-synthetic" className="bg-white text-slate-900">5W-30 Synthetic Engine Oil</option>
              <option value="5w40-full-synthetic" className="bg-white text-slate-900">5W-40 Engine Oil</option>
              <option value="0w20-advanced-synthetic" className="bg-white text-slate-900">0W-20 Synthetic Motor Oil</option>
              <option value="15w40-heavy-duty-diesel" className="bg-white text-slate-900">15W-40 Diesel Engine Oil</option>
              <option value="10w40-semi-synthetic" className="bg-white text-slate-900">10W-40 Engine Oil</option>
              <option value="pao-ester-racing" className="bg-white text-slate-900">Liqui Moly Engine Oil</option>
              <option value="classic-high-zinc" className="bg-white text-slate-900">20W-50 Engine Oil</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Custom Search Keyword (Optional)
            </label>
            <input
              type="text"
              placeholder={
                marketplace === 'DE'
                  ? 'e.g. Castrol Edge 5W-30 5L Motorenöl'
                  : marketplace === 'PL'
                  ? 'e.g. Motul 8100 5W-30 olej silnikowy'
                  : marketplace === 'PT'
                  ? 'e.g. Castrol Edge 5W-30 5L óleo de motor'
                  : 'e.g. Mobil 1 5W-30 or Castrol Edge 5L'
              }
              value={customQuery}
              onChange={(e) => setCustomQuery(e.target.value)}
              className="w-full px-3 py-2 bg-purple-50/40 border border-purple-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-500/15"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleRunJob}
              disabled={isRunning}
              className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-xs"
            >
              <Play size={14} className={isRunning ? 'animate-spin' : ''} />
              <span>{isRunning ? `Scraping ${domain}...` : `Run ${marketplace} Scrape`}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Jobs History Table & Log Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 rounded-xl border border-purple-200/80 bg-white overflow-hidden shadow-xs">
          <div className="p-4 border-b border-purple-100">
            <h3 className="text-sm font-bold text-slate-900">
              Collection Job Audit Log ({cfg.countryName})
            </h3>
          </div>
          <table className="w-full text-xs text-left">
            <thead className="bg-purple-50/80 text-purple-900 border-b border-purple-200">
              <tr>
                <th className="py-2.5 px-3 font-semibold">Job ID</th>
                <th className="py-2.5 px-3 font-semibold">Provider</th>
                <th className="py-2.5 px-3 font-semibold">Status</th>
                <th className="py-2.5 px-3 text-right font-semibold">Items</th>
                <th className="py-2.5 px-3 text-right font-semibold">Duration</th>
                <th className="py-2.5 px-3 text-center font-semibold">Logs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-100 bg-white">
              {jobs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No scrape jobs recorded yet for Amazon {cfg.countryName} ({marketplace}).
                  </td>
                </tr>
              ) : (
                jobs.map((job) => (
                  <tr
                    key={job.id}
                    onClick={() => setActiveLogJob(job)}
                    className={`hover:bg-purple-50/50 cursor-pointer transition-colors ${
                      activeLogJob?.id === job.id ? 'bg-purple-50' : ''
                    }`}
                  >
                    <td className="py-2.5 px-3 font-mono text-slate-700">{job.id}</td>
                    <td className="py-2.5 px-3 text-slate-900 font-medium">{job.provider}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium ${
                          job.status === 'completed'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : job.status === 'running'
                            ? 'bg-purple-100 text-purple-800 border border-purple-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {job.status === 'completed' && <CheckCircle2 size={10} />}
                        {job.status === 'running' && <RotateCw size={10} className="animate-spin" />}
                        <span className="capitalize">{job.status}</span>
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900">
                      {job.itemsUpdated}/{job.itemsProcessed}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                      {(job.durationMs / 1000).toFixed(1)}s
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <FileText size={14} className="mx-auto text-purple-500 hover:text-purple-700" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Right Column: Execution Log Viewer */}
        <div className="lg:col-span-5 p-4 rounded-xl border border-purple-200/80 bg-purple-50/50 shadow-xs font-mono text-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-purple-200 text-slate-700">
              <span className="font-semibold text-purple-900">
                Job Logs: {activeLogJob?.id || 'Select a job'}
              </span>
              <span className="text-[11px] text-purple-700">{activeLogJob?.provider || marketplace}</span>
            </div>
            <div className="mt-3 space-y-2 text-[11px] text-slate-700 max-h-80 overflow-y-auto">
              {activeLogJob?.logs.map((line, idx) => (
                <div key={idx} className="leading-relaxed">
                  <span className="text-purple-500 mr-2">&gt;</span>
                  <span
                    className={
                      line.includes('Committed')
                        ? 'text-emerald-700 font-semibold'
                        : line.includes('CAPTCHA')
                        ? 'text-amber-800 font-semibold'
                        : ''
                    }
                  >
                    {line}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-purple-200 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Marketplace: Amazon {cfg.countryName} ({cfg.marketplaceId})</span>
            <span>Delivery: {cfg.zipCode}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
