import React, { useState } from 'react';
import { X, CheckCircle2, AlertCircle } from 'lucide-react';
import { MarketplaceCode } from '../types/automotive';
import { getMpConfig, shortDomain } from '../utils/marketplace';

interface TrackAsinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTrackAsin: (asin: string) => Promise<{ ok: boolean; error?: string }>;
  marketplace?: MarketplaceCode;
}

export const TrackAsinModal: React.FC<TrackAsinModalProps> = ({
  isOpen,
  onClose,
  onTrackAsin,
  marketplace = 'AU',
}) => {
  const [inputVal, setInputVal] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const cfg = getMpConfig(marketplace);
  const domain = shortDomain(marketplace);

  const extractAsin = (val: string): string | null => {
    const trimmed = val.trim();
    const directMatch = trimmed.match(/^[A-Z0-9]{10}$/i);
    if (directMatch) return directMatch[0].toUpperCase();

    const urlMatch = trimmed.match(/(?:dp|gp\/product)\/([A-Z0-9]{10})/i);
    if (urlMatch) return urlMatch[1].toUpperCase();

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const asin = extractAsin(inputVal);
    if (!asin) {
      setError(`Please enter a valid 10-character Amazon ASIN or full ${domain} URL.`);
      return;
    }

    setIsLoading(true);
    try {
      const result = await onTrackAsin(asin);
      if (result.ok) {
        setSuccess(true);
        setTimeout(() => {
          setIsLoading(false);
          setInputVal('');
          onClose();
        }, 1200);
      } else {
        setError(result.error || `Failed to scrape ASIN from ${domain}.`);
        setIsLoading(false);
      }
    } catch (err: any) {
      setError(err.message || 'Error scraping ASIN');
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-purple-950/35 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-white border border-purple-200 rounded-xl shadow-2xl p-6">
        <div className="flex items-center justify-between pb-4 border-b border-purple-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Track New Amazon {marketplace} ASIN
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Targeting marketplace: <code className="text-purple-700 font-mono">{domain}</code> ({cfg.currency})
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-purple-700 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Amazon {cfg.countryName} ASIN or Listing URL
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder={`e.g. B083G3J2P7 or https://${cfg.domain}/dp/...`}
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                disabled={isLoading || success}
                className="w-full px-3 py-2 bg-purple-50/40 border border-purple-200 rounded-lg text-xs font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:border-purple-600 focus:bg-white transition-colors"
                autoFocus
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Supports standard 10-character ASINs and direct {cfg.countryName} product links.
            </p>
          </div>

          {error && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle size={14} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
              <CheckCircle2 size={14} className="shrink-0" />
              <span>Product successfully ingested into continuous tracking!</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-purple-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || success || !inputVal.trim()}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
            >
              {isLoading ? 'Ingesting...' : 'Start Tracking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
