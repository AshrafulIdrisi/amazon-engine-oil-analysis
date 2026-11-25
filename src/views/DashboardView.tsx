import React from 'react';
import {
  Droplet,
  TrendingDown,
  ShoppingBag,
  Layers,
  Award,
  Sparkles,
  ArrowUpRight,
  ChevronRight,
  Star,
  Tag,
  Gauge,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import {
  AutomotiveProduct,
  AutomotiveCategory,
  BrandIntelligence,
  MarketAnalyticsSummary,
  MarketplaceCode,
} from '../types/automotive';
import { formatMoney, getMpConfig, shortDomain } from '../utils/marketplace';

interface DashboardViewProps {
  products: AutomotiveProduct[];
  categories: AutomotiveCategory[];
  brands: BrandIntelligence[];
  summary: MarketAnalyticsSummary;
  marketplace?: MarketplaceCode;
  onSelectProduct: (product: AutomotiveProduct) => void;
  onNavigateTab: (tab: any) => void;
  onOpenMethodology: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  products,
  categories,
  brands,
  summary,
  marketplace = 'AU',
  onSelectProduct,
  onNavigateTab,
  onOpenMethodology,
}) => {
  const cfg = getMpConfig(marketplace);
  const domain = shortDomain(marketplace);
  // Price drops on oils
  const priceDrops = products
    .filter((p) => p.discountPct >= 16)
    .sort((a, b) => b.discountPct - a.discountPct)
    .slice(0, 4);

  // Top Opportunities
  const topOpportunities = [...products]
    .sort((a, b) => b.opportunity.overallScore - a.opportunity.overallScore)
    .slice(0, 4);

  // Viscosity / Category breakdown for chart
  const categoryChartData = categories.slice(0, 8).map((cat) => ({
    name: cat.name.split(' ')[0] + ' ' + (cat.name.split(' ')[1] || ''),
    revenue: Math.round(cat.estMonthlyRevenueAud / 1000), // in $k AUD
    units: Math.round(cat.estMonthlySalesUnits / 1000),
  }));

  return (
    <div className="space-y-6">
      {/* Engine Oil KPI Cards Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="p-3.5 rounded-xl bg-white border border-purple-200/80 shadow-xs">
          <div className="text-[11px] font-medium text-slate-500">Engine Oils Monitored</div>
          <div className="text-xl font-bold font-mono tabular-nums text-slate-900 mt-0.5">
            {summary.totalProductsTracked.toLocaleString()}
          </div>
          <div className="text-[10px] text-purple-700 font-medium mt-1">
            {summary.inStockCount ?? products.filter((p) => p.inStock).length} In Stock ·{' '}
            {summary.outOfStockCount ?? products.filter((p) => !p.inStock).length} Out
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-purple-200/80 shadow-xs">
          <div className="text-[11px] font-medium text-slate-500">{marketplace} Oil Brands</div>
          <div className="text-xl font-bold font-mono tabular-nums text-slate-900 mt-0.5">
            {summary.totalBrandsTracked.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-500 mt-1 truncate">
            {brands.slice(0, 3).map((b) => b.name).join(', ') || domain}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-purple-200/80 shadow-xs">
          <div className="text-[11px] font-medium text-slate-500">Avg Bottle Price</div>
          <div className="text-xl font-bold font-mono tabular-nums text-slate-900 mt-0.5">
            {formatMoney(summary.avgProductPriceAud, cfg.currency)}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">{cfg.currency} Live Scraped</div>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-purple-200/80 shadow-xs">
          <div className="text-[11px] font-medium text-slate-500">Avg Price / Litre</div>
          <div className="text-xl font-bold font-mono tabular-nums text-purple-700 mt-0.5">
            {formatMoney(summary.avgPricePerLiterAud, cfg.currency)}
          </div>
          <div className="text-[10px] text-purple-600 mt-1">{cfg.currency} / Litre Benchmark</div>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-purple-200/80 shadow-xs">
          <div className="text-[11px] font-medium text-slate-500">Est. Monthly Litres</div>
          <div className="text-xl font-bold font-mono tabular-nums text-purple-700 mt-0.5">
            {summary.estMonthlyLitersTotal >= 100000
              ? `${(summary.estMonthlyLitersTotal / 1000000).toFixed(2)}M L`
              : `${(summary.estMonthlyLitersTotal / 1000).toFixed(1)}k L`}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Est. Volume / Month</div>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-purple-200/80 shadow-xs">
          <div className="text-[11px] font-medium text-slate-500">Est. Monthly GMV</div>
          <div className="text-xl font-bold font-mono tabular-nums text-emerald-700 mt-0.5">
            {summary.estMonthlyRevenueTotalAud >= 1000000
              ? `${cfg.currencySymbol}${(summary.estMonthlyRevenueTotalAud / 1000000).toFixed(2)}M`
              : `${cfg.currencySymbol}${Math.round(summary.estMonthlyRevenueTotalAud / 1000).toLocaleString()}k`}
          </div>
          <div className="text-[10px] text-emerald-700 mt-1">{cfg.currency} Est. Turnover</div>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-purple-200/80 shadow-xs">
          <div className="text-[11px] font-medium text-slate-500">Promos & Coupons</div>
          <div className="text-xl font-bold font-mono tabular-nums text-purple-700 mt-0.5">
            {summary.productsWithPromotions.toLocaleString()}
          </div>
          <div className="text-[10px] text-purple-600 mt-1">Live Scraped Offers</div>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-purple-200/80 shadow-xs">
          <div className="text-[11px] font-medium text-slate-500">Trending Oils</div>
          <div className="text-xl font-bold font-mono tabular-nums text-emerald-700 mt-0.5">
            {summary.trendingProductsCount.toLocaleString()}
          </div>
          <div className="text-[10px] text-emerald-700 mt-1">Top BSR Movers</div>
        </div>
      </div>

      {/* Main Analytical Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Viscosity Revenue Bar Chart */}
        <div className="lg:col-span-7 p-5 rounded-xl bg-white border border-purple-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Droplet size={15} className="text-purple-600" />
                <span>Engine Oil Viscosity Revenue Breakdown ({cfg.currency})</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Market size estimates across 5W-30, 5W-40, 15W-40, and 0W-20 hybrid segments
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('category-analysis')}
              className="text-xs text-purple-700 hover:text-purple-900 font-semibold flex items-center gap-1 transition-colors"
            >
              <span>View All Viscosities</span>
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryChartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e9d5ff" opacity={0.8} />
                <XAxis
                  dataKey="name"
                  stroke="#64748b"
                  tick={{ fontSize: 11, fill: '#475569' }}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis
                  stroke="#64748b"
                  tick={{ fontSize: 11, fill: '#475569' }}
                  tickFormatter={(val) => `${cfg.currencySymbol}${val}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#d8b4fe',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#0f172a',
                    boxShadow: '0 4px 12px rgba(109, 40, 217, 0.08)',
                  }}
                  formatter={(val: any) => [`${cfg.currencySymbol}${val}k ${cfg.currency}`, 'Est. Monthly Revenue']}
                />
                <Bar dataKey="revenue" fill="#7c3aed" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Column: Top High-Potential Engine Oil Opportunities */}
        <div className="lg:col-span-5 p-5 rounded-xl bg-white border border-purple-200/80 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <Sparkles size={14} className="text-purple-600" />
                <h2 className="text-sm font-bold text-slate-900">Top Engine Oil Opportunities</h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                0-100 Score evaluating Litre Demand, $/L Margin, and Competition Moats
              </p>
            </div>
            <button
              onClick={onOpenMethodology}
              className="text-[11px] text-purple-700 hover:text-purple-900 underline font-medium transition-colors"
            >
              Methodology
            </button>
          </div>

          <div className="space-y-2.5">
            {topOpportunities.map((prod) => (
              <div
                key={prod.asin}
                onClick={() => onSelectProduct(prod)}
                className="p-3 rounded-lg bg-purple-50/40 border border-purple-200/70 hover:border-purple-400 hover:bg-purple-50 cursor-pointer transition-colors flex items-center justify-between gap-3 group"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-[11px] text-slate-600">
                    <span className="font-bold text-purple-700">{prod.brand}</span>
                    <span className="text-purple-300">·</span>
                    <span className="px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 border border-purple-200 font-mono font-bold">
                      {prod.viscosity}
                    </span>
                    <span className="text-purple-300">·</span>
                    <span className="font-mono text-slate-700 font-medium">
                      {prod.pricePerLiterAud > 0 ? `${formatMoney(prod.pricePerLiterAud, cfg.currency)}/L` : prod.availability}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-slate-900 truncate mt-0.5 group-hover:text-purple-700 transition-colors">
                    {prod.title}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 mt-1 font-mono">
                    <span>{prod.currentPriceAud > 0 ? formatMoney(prod.currentPriceAud, cfg.currency, 2, true) : prod.availability}</span>
                    <span>·</span>
                    <span>{prod.estMonthlySales.toLocaleString()} bottles/mo</span>
                    <span>·</span>
                    <a
                      href={prod.productUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-purple-700 hover:text-purple-900 underline inline-flex items-center gap-0.5"
                    >
                      <span>{domain}/dp/{prod.asin}</span>
                      <ArrowUpRight size={11} />
                    </a>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <div className="text-base font-extrabold font-mono text-purple-700">
                    {prod.opportunity.overallScore}
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium">/ 100 Score</div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => onNavigateTab('opportunities')}
            className="w-full py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-xs font-semibold text-white transition-colors flex items-center justify-center gap-1.5 shadow-xs"
          >
            <span>Explore All Scored Engine Oil Opportunities</span>
            <ArrowUpRight size={14} />
          </button>
        </div>
      </div>

      {/* Secondary Row: Active Oil Price Drops & Deal Alerts */}
      <div className="p-5 rounded-xl bg-white border border-purple-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <TrendingDown size={14} className="text-purple-600" />
              <h2 className="text-sm font-bold text-slate-900">
                Live Engine Oil Price Drops & Coupon Vouchers
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Motor oils discounted &gt;16% or with digital clip coupons on Amazon {cfg.countryName}
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('price-tracker')}
            className="text-xs text-purple-700 hover:text-purple-900 font-semibold flex items-center gap-1 transition-colors"
          >
            <span>View All Oil Deals</span>
            <ChevronRight size={14} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {priceDrops.map((prod) => (
            <div
              key={prod.asin}
              onClick={() => onSelectProduct(prod)}
              className="p-3.5 rounded-lg bg-purple-50/40 border border-purple-200/70 hover:border-purple-400 hover:bg-purple-50 cursor-pointer transition-colors flex flex-col justify-between space-y-3 group"
            >
              <div>
                <div className="flex items-center justify-between text-[11px] mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-purple-700">{prod.brand}</span>
                    <span className="font-mono text-[10px] text-purple-800 bg-purple-100 border border-purple-200 px-1 py-0.2 rounded font-bold">
                      {prod.viscosity}
                    </span>
                  </div>
                  <span className="font-mono text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                    -{prod.discountPct.toFixed(0)}% OFF
                  </span>
                </div>
                <h3 className="text-xs font-medium text-slate-900 line-clamp-2 group-hover:text-purple-700 transition-colors">
                  {prod.title}
                </h3>
                <a
                  href={prod.productUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-mono text-purple-700 hover:text-purple-900 underline"
                >
                  <span>{domain}/dp/{prod.asin}</span>
                  <ArrowUpRight size={10} />
                </a>
              </div>

              <div className="pt-2 border-t border-purple-200/60 flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold font-mono text-slate-900">
                    {formatMoney(prod.currentPriceAud, cfg.currency, 2, true)}
                  </div>
                  <div className="text-[10px] text-purple-700 font-mono font-semibold">
                    {formatMoney(prod.pricePerLiterAud, cfg.currency)} / Litre
                  </div>
                </div>
                {prod.hasCoupon && (
                  <span className="text-[10px] text-purple-800 bg-purple-100 border border-purple-300 px-1.5 py-0.5 rounded flex items-center gap-1 font-medium">
                    <Tag size={10} />
                    <span>{cfg.currencySymbol}{prod.couponValueAud} Voucher</span>
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
