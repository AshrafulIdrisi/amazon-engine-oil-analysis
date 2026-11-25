import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { ProductDetailModal } from './components/ProductDetailModal';
import { TrackAsinModal } from './components/TrackAsinModal';
import { ExportModal } from './components/ExportModal';
import { OpportunityMethodologyModal } from './components/OpportunityMethodologyModal';

// Views
import { DashboardView } from './views/DashboardView';
import { DiscoveryView } from './views/DiscoveryView';
import { DatabaseView } from './views/DatabaseView';
import { PriceTrackerView } from './views/PriceTrackerView';
import { SalesIntelligenceView } from './views/SalesIntelligenceView';
import { PromotionsView } from './views/PromotionsView';
import { CompetitorAnalysisView } from './views/CompetitorAnalysisView';
import { BrandAnalysisView } from './views/BrandAnalysisView';
import { CategoryAnalysisView } from './views/CategoryAnalysisView';
import { ProductOpportunitiesView } from './views/ProductOpportunitiesView';
import { MonthlyArchiveView } from './views/MonthlyArchiveView';
import { DataJobsView } from './views/DataJobsView';
import { SettingsView } from './views/SettingsView';

import {
  ActiveTab,
  AutomotiveProduct,
  AutomotiveCategory,
  BrandIntelligence,
  CollectionJob,
  MarketAnalyticsSummary,
  MarketplaceCode,
  MonthlySnapshot,
} from './types/automotive';
import { getMpConfig, MarketplaceStatusInfo, shortDomain } from './utils/marketplace';

const EMPTY_SUMMARY: MarketAnalyticsSummary = {
  totalProductsTracked: 0,
  totalBrandsTracked: 0,
  avgProductPriceAud: 0,
  avgPricePerLiterAud: 0,
  avgDiscountPct: 0,
  productsWithPromotions: 0,
  estMonthlySalesTotal: 0,
  estMonthlyLitersTotal: 0,
  estMonthlyRevenueTotalAud: 0,
  productsWithPriceDrops: 0,
  trendingProductsCount: 0,
  topViscosityGrade: '—',
  hottestPriceDropAsin: '',
};

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [marketplace, setMarketplace] = useState<MarketplaceCode>('AU');

  // Live Scraped & Monthly Archived State (Zero mockData)
  const [products, setProducts] = useState<AutomotiveProduct[]>([]);
  const [categories, setCategories] = useState<AutomotiveCategory[]>([]);
  const [brands, setBrands] = useState<BrandIntelligence[]>([]);
  const [jobs, setJobs] = useState<CollectionJob[]>([]);
  const [summary, setSummary] = useState<MarketAnalyticsSummary>(EMPTY_SUMMARY);
  const [marketplacesInfo, setMarketplacesInfo] = useState<MarketplaceStatusInfo[]>([]);
  const [monthlySnapshots, setMonthlySnapshots] = useState<MonthlySnapshot[]>([]);
  const [currentMonthKey, setCurrentMonthKey] = useState<string>('2026-11');
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Modals
  const [selectedProduct, setSelectedProduct] = useState<AutomotiveProduct | null>(null);
  const [isTrackModalOpen, setIsTrackModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isMethodologyModalOpen, setIsMethodologyModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const mpCfg = getMpConfig(marketplace);
  const mpDomain = shortDomain(marketplace);

  const fetchAllLiveState = useCallback(async () => {
    try {
      setLoadError(null);
      const q = `marketplace=${marketplace}`;
      const [prodRes, analyticsRes, brandsRes, catsRes, jobsRes, mpRes, snapRes] = await Promise.all([
        fetch(`/api/automotive/products?${q}`),
        fetch(`/api/analytics/automotive?${q}`),
        fetch(`/api/analytics/brands?${q}`),
        fetch(`/api/analytics/categories?${q}`),
        fetch(`/api/jobs?${q}`),
        fetch('/api/marketplaces'),
        fetch('/api/monthly-snapshots'),
      ]);

      if (prodRes.ok) {
        const prodData = await prodRes.json();
        setProducts(Array.isArray(prodData.products) ? prodData.products : []);
      }
      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json();
        if (analyticsData.summary) setSummary(analyticsData.summary);
      }
      if (brandsRes.ok) {
        const brandsData = await brandsRes.json();
        if (Array.isArray(brandsData.brands)) setBrands(brandsData.brands);
      }
      if (catsRes.ok) {
        const catsData = await catsRes.json();
        if (Array.isArray(catsData.categories)) setCategories(catsData.categories);
      }
      if (jobsRes.ok) {
        const jobsData = await jobsRes.json();
        if (Array.isArray(jobsData.jobs)) setJobs(jobsData.jobs);
      }
      if (mpRes.ok) {
        const mpData = await mpRes.json();
        if (Array.isArray(mpData.marketplaces)) setMarketplacesInfo(mpData.marketplaces);
        if (mpData.currentMonthKey) setCurrentMonthKey(mpData.currentMonthKey);
      }
      if (snapRes.ok) {
        const snapData = await snapRes.json();
        if (Array.isArray(snapData.snapshots)) setMonthlySnapshots(snapData.snapshots);
        if (snapData.currentMonthKey) setCurrentMonthKey(snapData.currentMonthKey);
      }
    } catch (err: any) {
      setLoadError(err?.message || `Failed to connect to live Amazon ${mpCfg.countryName} scraper API.`);
    } finally {
      setIsInitialLoading(false);
    }
  }, [marketplace, mpCfg.countryName]);

  useEffect(() => {
    setSelectedProduct(null);
    fetchAllLiveState();
  }, [fetchAllLiveState]);

  const handleChangeMarketplace = (nextMp: MarketplaceCode) => {
    if (nextMp !== marketplace) {
      setIsInitialLoading(true);
      setMarketplace(nextMp);
    }
  };

  const handleToggleTrack = async (asin: string) => {
    const res = await fetch(`/api/automotive/track?marketplace=${marketplace}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ asin, marketplace }),
    });
    if (res.ok) {
      const data = await res.json();
      setProducts((prev) =>
        prev.map((p) => (p.asin === asin ? { ...p, isTracked: data.isTracked } : p))
      );
      if (selectedProduct && selectedProduct.asin === asin) {
        setSelectedProduct((prev) => (prev ? { ...prev, isTracked: data.isTracked } : null));
      }
    }
  };

  const handleTrackNewAsin = async (asin: string): Promise<{ ok: boolean; error?: string }> => {
    try {
      const res = await fetch(`/api/automotive/track?marketplace=${marketplace}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ asin, isTracked: true, marketplace }),
      });
      const data = await res.json();
      if (res.ok && data.product) {
        await fetchAllLiveState();
        return { ok: true };
      }
      return { ok: false, error: data.error || `Failed to scrape ASIN from ${mpDomain}` };
    } catch (err: any) {
      return { ok: false, error: err.message || 'Network error while scraping ASIN' };
    }
  };

  const handleRefreshData = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch(`/api/automotive/refresh?marketplace=${marketplace}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ marketplace }),
      });
      if (res.ok) {
        await fetchAllLiveState();
      }
    } catch (err) {
      console.error('Live refresh failed:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleTriggerJob = async (
    provider: string,
    category: string,
    query?: string
  ): Promise<boolean> => {
    try {
      const res = await fetch(`/api/jobs/run?marketplace=${marketplace}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, category, query, marketplace }),
      });
      if (res.ok) {
        await fetchAllLiveState();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const handleCaptureMonthlySnapshot = async (
    monthKey?: string
  ): Promise<{ ok: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/monthly-snapshots/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ marketplace, monthKey }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await fetchAllLiveState();
        return { ok: true };
      }
      return { ok: false, error: data.error || 'Capture failed' };
    } catch (err: any) {
      return { ok: false, error: err.message || 'Network error' };
    }
  };

  const handleDeleteSnapshot = async (id: string) => {
    const res = await fetch(`/api/monthly-snapshots/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      await fetchAllLiveState();
    }
  };

  const handleQuickSearch = (query: string) => {
    if (query.trim() && activeTab !== 'discovery') {
      setActiveTab('discovery');
    }
  };

  const activeMpInfo = marketplacesInfo.find((m) => m.code === marketplace);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#faf8ff] text-slate-900 font-sans">
      <Sidebar
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        productsCount={products.length}
        trackedCount={products.filter((p) => p.isTracked).length}
        snapshotsCount={monthlySnapshots.length}
        marketplace={marketplace}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar
          activeTab={activeTab}
          marketplace={marketplace}
          onChangeMarketplace={handleChangeMarketplace}
          marketplacesInfo={marketplacesInfo}
          onOpenTrackModal={() => setIsTrackModalOpen(true)}
          onOpenExportModal={() => setIsExportModalOpen(true)}
          onRefreshData={handleRefreshData}
          isRefreshing={isRefreshing}
          onQuickSearch={handleQuickSearch}
          totalTracked={products.length}
        />

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-[1440px] mx-auto">
            {isInitialLoading && (
              <div className="p-8 rounded-xl bg-white border border-purple-200 shadow-xs text-center space-y-2 mb-6">
                <div className="text-sm font-bold text-purple-700">
                  Loading Live Engine Oil Intelligence for {mpCfg.countryName} ({mpDomain})...
                </div>
                <p className="text-xs text-slate-600">
                  Collecting live {mpCfg.currency} prices, ASIN links, technical specs, ratings, and BSR rankings.
                </p>
              </div>
            )}

            {!isInitialLoading &&
              !mpCfg.directHtmlSupported &&
              products.length === 0 &&
              activeTab !== 'settings' &&
              activeTab !== 'monthly-archive' &&
              activeTab !== 'jobs' && (
                <div className="p-5 rounded-xl bg-white border border-purple-200 shadow-xs mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="space-y-1">
                    <div className="text-sm font-bold text-slate-900">
                      {mpCfg.countryName} ({mpDomain}) Direct Scraping Hits Amazon CAPTCHA
                    </div>
                    <p className="text-xs text-slate-600 max-w-2xl">
                      Direct unauthenticated HTTP requests to <code className="text-purple-700">{mpDomain}</code> are
                      gated by Amazon&apos;s EU CAPTCHA check (unlike Australia <code className="text-purple-700">AU</code> and
                      USA <code className="text-purple-700">US</code>, which crawl live HTML directly).{' '}
                      {activeMpInfo?.rainforestConfigured
                        ? 'Your Rainforest API key is configured — click Refresh or Launch Scrape to populate DE/PL!'
                        : 'Add a Rainforest API key in Settings to crawl live EU data without bypassing CAPTCHA, or switch back to AU / US.'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setActiveTab('settings')}
                      className="px-3.5 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold transition-colors"
                    >
                      Configure API Key in Settings
                    </button>
                    <button
                      onClick={() => setActiveTab('jobs')}
                      className="px-3.5 py-2 rounded-lg border border-purple-200 bg-purple-50/50 hover:bg-purple-100 text-purple-800 text-xs font-semibold transition-colors"
                    >
                      Open Scraper Jobs
                    </button>
                  </div>
                </div>
              )}

            {loadError && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs mb-6 flex items-center justify-between">
                <span>{loadError}</span>
                <button
                  onClick={fetchAllLiveState}
                  className="px-3 py-1 rounded bg-rose-100 hover:bg-rose-200 text-rose-800 font-semibold transition-colors"
                >
                  Retry
                </button>
              </div>
            )}

            {!isInitialLoading && activeTab === 'dashboard' && (
              <DashboardView
                products={products}
                categories={categories}
                brands={brands}
                summary={summary}
                marketplace={marketplace}
                onSelectProduct={(p) => setSelectedProduct(p)}
                onNavigateTab={(tab) => setActiveTab(tab)}
                onOpenMethodology={() => setIsMethodologyModalOpen(true)}
              />
            )}

            {!isInitialLoading && activeTab === 'discovery' && (
              <DiscoveryView
                products={products}
                categories={categories}
                marketplace={marketplace}
                onSelectProduct={(p) => setSelectedProduct(p)}
                onToggleTrack={handleToggleTrack}
              />
            )}

            {!isInitialLoading && activeTab === 'database' && (
              <DatabaseView
                products={products}
                marketplace={marketplace}
                onSelectProduct={(p) => setSelectedProduct(p)}
                onToggleTrack={handleToggleTrack}
                onOpenExportModal={() => setIsExportModalOpen(true)}
              />
            )}

            {!isInitialLoading && activeTab === 'price-tracker' && (
              <PriceTrackerView
                products={products}
                marketplace={marketplace}
                onSelectProduct={(p) => setSelectedProduct(p)}
              />
            )}

            {!isInitialLoading && activeTab === 'sales-intel' && (
              <SalesIntelligenceView
                products={products}
                marketplace={marketplace}
                onSelectProduct={(p) => setSelectedProduct(p)}
              />
            )}

            {!isInitialLoading && activeTab === 'promotions' && (
              <PromotionsView
                products={products}
                marketplace={marketplace}
                onSelectProduct={(p) => setSelectedProduct(p)}
              />
            )}

            {!isInitialLoading && activeTab === 'competitor-analysis' && (
              <CompetitorAnalysisView
                products={products}
                marketplace={marketplace}
                onSelectProduct={(p) => setSelectedProduct(p)}
              />
            )}

            {!isInitialLoading && activeTab === 'brand-analysis' && (
              <BrandAnalysisView brands={brands} marketplace={marketplace} />
            )}

            {!isInitialLoading && activeTab === 'category-analysis' && (
              <CategoryAnalysisView
                categories={categories}
                marketplace={marketplace}
                onSelectCategory={() => setActiveTab('discovery')}
              />
            )}

            {!isInitialLoading && activeTab === 'opportunities' && (
              <ProductOpportunitiesView
                products={products}
                marketplace={marketplace}
                onSelectProduct={(p) => setSelectedProduct(p)}
                onOpenMethodology={() => setIsMethodologyModalOpen(true)}
              />
            )}

            {!isInitialLoading && activeTab === 'monthly-archive' && (
              <MonthlyArchiveView
                marketplace={marketplace}
                products={products}
                snapshots={monthlySnapshots}
                currentMonthKey={currentMonthKey}
                onCaptureSnapshot={handleCaptureMonthlySnapshot}
                onDeleteSnapshot={handleDeleteSnapshot}
                onSelectProduct={(p) => setSelectedProduct(p)}
              />
            )}

            {!isInitialLoading && activeTab === 'jobs' && (
              <DataJobsView
                jobs={jobs}
                marketplace={marketplace}
                onTriggerJob={handleTriggerJob}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsView
                marketplace={marketplace}
                onSettingsSaved={fetchAllLiveState}
              />
            )}
          </div>
        </main>
      </div>

      <ProductDetailModal
        product={selectedProduct}
        marketplace={marketplace}
        onClose={() => setSelectedProduct(null)}
        onToggleTrack={handleToggleTrack}
        onOpenCompetitorDetail={(asin) => {
          const found = products.find((p) => p.asin === asin);
          if (found) setSelectedProduct(found);
        }}
      />

      <TrackAsinModal
        isOpen={isTrackModalOpen}
        onClose={() => setIsTrackModalOpen(false)}
        onTrackAsin={handleTrackNewAsin}
        marketplace={marketplace}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        productsCount={products.length}
        marketplace={marketplace}
      />

      <OpportunityMethodologyModal
        isOpen={isMethodologyModalOpen}
        onClose={() => setIsMethodologyModalOpen(false)}
      />
    </div>
  );
}
