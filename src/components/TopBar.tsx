import React from 'react';
import {
  Download,
  PlusCircle,
  RefreshCw,
  Search,
  Globe2,
} from 'lucide-react';
import { ActiveTab, MarketplaceCode } from '../types/automotive';
import { getMpConfig, MarketplaceStatusInfo } from '../utils/marketplace';

interface TopBarProps {
  activeTab: ActiveTab;
  marketplace: MarketplaceCode;
  onChangeMarketplace: (mp: MarketplaceCode) => void;
  marketplacesInfo?: MarketplaceStatusInfo[];
  onOpenTrackModal: () => void;
  onOpenExportModal: () => void;
  onRefreshData: () => void;
  isRefreshing: boolean;
  onQuickSearch: (query: string) => void;
  totalTracked: number;
}

const ALL_MPS: MarketplaceCode[] = ['AU', 'US', 'DE', 'PL', 'PT'];

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  marketplace,
  onChangeMarketplace,
  marketplacesInfo = [],
  onOpenTrackModal,
  onOpenExportModal,
  onRefreshData,
  isRefreshing,
  onQuickSearch,
}) => {
  const cfg = getMpConfig(marketplace);

  const tabTitles: Record<ActiveTab, string> = {
    dashboard: `Amazon ${cfg.countryName} Engine Oil Intelligence`,
    discovery: 'Viscosity & Engine Oil Discovery',
    database: 'Engine Oil Master Database',
    'price-tracker': 'Motor Oil Price & $/Litre Tracker',
    'sales-intel': 'Litre Volume & Sales Intelligence',
    promotions: 'Subscribe & Save & Oil Deals',
    'competitor-analysis': 'Engine Oil Benchmark Matrix',
    'brand-analysis': `${cfg.countryName} Oil Brand Market Share`,
    'category-analysis': 'Viscosity & Specification Performance',
    opportunities: 'Engine Oil Opportunity Radar (0-100)',
    'monthly-archive': 'Monthly Catalog Archive (YYYY-MM)',
    jobs: 'Oil Catalog Ingestion Pipeline',
    settings: 'Marketplace & Oil Settings',
  };

  return (
    <header className="h-16 px-4 lg:px-6 border-b border-purple-200/80 bg-white/95 backdrop-blur flex items-center justify-between gap-3 shrink-0 z-10">
      {/* Zone 1: Brand & View Context + Marketplace Switcher */}
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-sm lg:text-base font-bold tracking-tight text-slate-900 truncate">
          {tabTitles[activeTab]}
        </span>

        {/* Marketplace Switcher */}
        <div
          className="flex items-center bg-purple-50/70 border border-purple-200 rounded-lg p-0.5 shrink-0"
          title="Switch Amazon Engine Oil Marketplace"
        >
          <Globe2 size={12} className="text-purple-600 ml-1.5 mr-1 hidden sm:inline" />
          {ALL_MPS.map((code) => {
            const active = marketplace === code;
            const info = marketplacesInfo.find((m) => m.code === code);
            const mpCfg = getMpConfig(code);
            return (
              <button
                key={code}
                onClick={() => onChangeMarketplace(code)}
                className={`px-2 py-1 rounded-md text-[11px] font-bold transition-colors flex items-center gap-1 ${
                  active
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-purple-900 hover:bg-purple-100/70'
                }`}
                title={`${mpCfg.countryName} (${mpCfg.currency})${
                  info?.productCount ? ` · ${info.productCount} SKUs` : ''
                }`}
              >
                <span>{code}</span>
                <span
                  className={`hidden xl:inline text-[9px] font-mono ${
                    active ? 'text-purple-100' : 'text-slate-400'
                  }`}
                >
                  {mpCfg.currency}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Zone 2: Search Input / Filter Bar */}
      <div className="hidden md:flex items-center flex-1 max-w-sm">
        <div className="relative w-full">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400"
          />
          <input
            type="text"
            placeholder={`Search ${marketplace} (${cfg.currency}) Viscosity, Brand, ASIN...`}
            onChange={(e) => onQuickSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-purple-50/40 border border-purple-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-purple-600 focus:bg-white transition-colors"
          />
        </div>
      </div>

      {/* Zone 3: Primary Action Suite */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onRefreshData}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-purple-200 bg-white hover:bg-purple-50 text-xs font-medium text-slate-700 hover:text-purple-900 transition-colors disabled:opacity-50"
          title={`Trigger live price & BSR crawl on ${cfg.domain}`}
        >
          <RefreshCw
            size={13}
            className={`${isRefreshing ? 'animate-spin text-purple-600' : 'text-purple-500'}`}
          />
          <span className="hidden sm:inline">{isRefreshing ? 'Scraping...' : 'Refresh'}</span>
        </button>

        <button
          onClick={onOpenExportModal}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-purple-200 bg-white hover:bg-purple-50 text-xs font-medium text-slate-700 hover:text-purple-900 transition-colors"
          title={`Export ${marketplace} Engine Oil data in CSV, Excel, JSON or PDF`}
        >
          <Download size={13} className="text-purple-500" />
          <span className="hidden sm:inline">Export</span>
        </button>

        <button
          onClick={onOpenTrackModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs transition-colors shadow-sm"
          title={`Add new ${marketplace} Engine Oil ASIN to track`}
        >
          <PlusCircle size={14} />
          <span className="hidden sm:inline">Track ASIN</span>
        </button>
      </div>
    </header>
  );
};
