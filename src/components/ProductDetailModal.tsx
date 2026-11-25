import React, { useState } from 'react';
import {
  X,
  ExternalLink,
  Star,
  Tag,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Copy,
  Check,
  Package,
  Clock,
  ShieldCheck,
  Link2,
  TrendingUp,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts';
import { AutomotiveProduct, MarketplaceCode } from '../types/automotive';
import { formatMoney, getMpConfig, shortDomain } from '../utils/marketplace';

interface ProductDetailModalProps {
  product: AutomotiveProduct | null;
  marketplace?: MarketplaceCode;
  onClose: () => void;
  onToggleTrack: (asin: string) => void;
  onOpenCompetitorDetail?: (asin: string) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  marketplace,
  onClose,
  onToggleTrack,
  onOpenCompetitorDetail,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'pricing' | 'sales' | 'competitors' | 'opportunity'>('overview');
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedAsin, setCopiedAsin] = useState(false);

  if (!product) return null;

  const mp: MarketplaceCode = product.marketplace || marketplace || 'AU';
  const cfg = getMpConfig(mp);
  const currency = product.currency || cfg.currency;
  const domainShort = shortDomain(mp);

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(product.productUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 1800);
  };

  const handleCopyAsin = () => {
    navigator.clipboard.writeText(product.asin);
    setCopiedAsin(true);
    setTimeout(() => setCopiedAsin(false), 1500);
  };

  const formatTimestamp = (iso: string) => {
    try {
      const locale =
        mp === 'US' ? 'en-US' : mp === 'DE' ? 'de-DE' : mp === 'PL' ? 'pl-PL' : mp === 'PT' ? 'pt-PT' : 'en-AU';
      return new Date(iso).toLocaleString(locale, {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-purple-950/35 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-white border border-purple-200 rounded-xl shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 p-5 border-b border-purple-100 bg-purple-50/40">
          <div className="flex items-start gap-4 min-w-0">
            <div className="w-18 h-18 shrink-0 rounded-lg bg-white border border-purple-200 overflow-hidden p-1.5 flex items-center justify-center shadow-xs">
              <img
                src={product.imageUrl}
                alt={product.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 mb-1">
                <span className="font-bold text-purple-700">{product.brand}</span>
                <span className="text-purple-300">·</span>
                <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-200 font-mono font-bold">
                  {product.viscosity}
                </span>
                <span className="text-purple-300">·</span>
                <span className="font-mono text-slate-700 font-medium">{product.volumeLiters}L</span>
                <span className="text-purple-300">·</span>
                <button
                  onClick={handleCopyAsin}
                  className="inline-flex items-center gap-1 font-mono text-slate-700 hover:text-purple-700 transition-colors"
                  title="Copy ASIN"
                >
                  <span>ASIN: {product.asin}</span>
                  {copiedAsin ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                </button>
                <span className="text-purple-300">·</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                    !product.inStock
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : product.availability === 'Buying Options Only' ||
                        product.availability === 'Low Stock' ||
                        product.availability === 'Only 2 Left'
                      ? 'bg-purple-100 text-purple-800 border-purple-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}
                >
                  {product.stockQuantityLeft
                    ? `Only ${product.stockQuantityLeft} Left in Stock`
                    : product.availability}
                </span>
                {product.isPrime && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-600 text-white">
                    Prime {cfg.code}
                  </span>
                )}
              </div>
              <h2 className="text-base font-bold text-slate-900 leading-snug">
                {product.title}
              </h2>
              <div className="text-[11px] text-slate-600 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span>Manufacturer: <strong className="text-slate-900">{product.manufacturer}</strong></span>
                <span className="text-purple-300">·</span>
                <span>Segment: <strong className="text-slate-900">{product.categoryName}</strong></span>
                {product.soldBy && (
                  <>
                    <span className="text-purple-300">·</span>
                    <span>Sold by: <strong className="text-purple-800">{product.soldBy}</strong></span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-start">
            <a
              href={product.productUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
              title={`Open listing on Amazon ${cfg.countryName}`}
            >
              <span>{domainShort}</span>
              <ExternalLink size={13} />
            </a>
            <button
              onClick={() => onToggleTrack(product.asin)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                product.isTracked
                  ? 'bg-purple-100 text-purple-800 border border-purple-300'
                  : 'bg-white text-slate-700 hover:bg-purple-50 border border-purple-200'
              }`}
            >
              {product.isTracked ? 'Tracked' : '+ Track ASIN'}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-purple-700 hover:bg-purple-100/60 transition-colors"
              title="Close modal"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Direct Product URL Bar */}
        <div className="px-5 py-2.5 bg-purple-50/70 border-b border-purple-100 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <Link2 size={14} className="text-purple-600 shrink-0" />
            <span className="text-slate-600 shrink-0">Product Link:</span>
            <a
              href={product.productUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-purple-700 hover:text-purple-900 underline truncate"
            >
              {product.productUrl}
            </a>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopyUrl}
              className="px-2.5 py-1 rounded bg-white border border-purple-200 hover:bg-purple-100/60 text-purple-800 text-[11px] font-medium flex items-center gap-1.5 transition-colors"
            >
              {copiedUrl ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
              <span>{copiedUrl ? 'Link Copied!' : 'Copy Product Link'}</span>
            </button>
          </div>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex items-center gap-1 px-5 border-b border-purple-100 bg-white overflow-x-auto">
          {[
            { id: 'overview', label: 'All Details & Specs' },
            { id: 'pricing', label: 'Pricing, Promos & $/L History' },
            { id: 'sales', label: 'Sales, Litres & Rankings' },
            { id: 'competitors', label: `Competitor Oils (${product.competitors.length})` },
            { id: 'opportunity', label: `Opportunity Score (${product.opportunity.overallScore}/100)` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2.5 text-xs font-medium transition-colors border-b-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-purple-600 text-purple-700 font-semibold'
                  : 'border-transparent text-slate-600 hover:text-purple-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-[#faf8ff]/50">
          {/* TAB 1: OVERVIEW (ALL DETAILS) */}
          {activeTab === 'overview' && (
            <div className="space-y-5">
              {/* Key Engine Oil Metrics Strip */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-lg bg-white border border-purple-200/80 shadow-xs">
                  <div className="text-[11px] text-slate-500 font-medium">Current Buy Box</div>
                  {product.currentPriceAud > 0 ? (
                    <>
                      <div className="flex items-baseline gap-2 mt-0.5">
                        <span className="text-xl font-bold font-mono tabular-nums text-slate-900">
                          {formatMoney(product.currentPriceAud, currency, 2, true)}
                        </span>
                        {product.discountPct > 0 && (
                          <span className="text-[11px] font-mono text-emerald-700 font-bold">
                            -{product.discountPct.toFixed(1)}%
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-mono font-bold text-purple-700 mt-0.5">
                        {formatMoney(product.pricePerLiterAud, currency)} / Litre
                        {product.originalPriceAud > product.currentPriceAud && (
                          <span className="text-slate-400 font-normal line-through ml-2">
                            {formatMoney(product.originalPriceAud, currency)}
                          </span>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-base font-bold font-mono text-rose-700 mt-1">
                        {product.availability}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        No active {currency} Buy Box price shown on page
                      </div>
                    </>
                  )}
                </div>

                <div className="p-3.5 rounded-lg bg-white border border-purple-200/80 shadow-xs">
                  <div className="text-[11px] text-slate-500 font-medium">Viscosity & Base</div>
                  <div className="text-lg font-bold font-mono text-purple-700 mt-0.5">
                    {product.viscosity}
                  </div>
                  <div className="text-[11px] text-slate-600 mt-0.5">
                    {product.oilType} · {product.volumeLiters}L
                  </div>
                </div>

                <div className="p-3.5 rounded-lg bg-white border border-purple-200/80 shadow-xs">
                  <div className="text-[11px] text-slate-500 font-medium">Est. Monthly Turnover</div>
                  <div className="text-lg font-bold font-mono tabular-nums text-slate-900 mt-0.5">
                    {product.estMonthlySales.toLocaleString()} bottles
                  </div>
                  <div className="text-[11px] text-purple-700 mt-0.5 font-mono font-medium">
                    ~{(product.estMonthlySales * product.volumeLiters).toLocaleString()} L · {formatMoney(Math.round(product.estMonthlyRevenueAud), currency, 0, true)}
                  </div>
                </div>

                <div className="p-3.5 rounded-lg bg-white border border-purple-200/80 shadow-xs">
                  <div className="text-[11px] text-slate-500 font-medium">Rank & Customer Rating</div>
                  <div className="text-lg font-bold font-mono tabular-nums text-purple-700 mt-0.5 flex items-center gap-1.5">
                    <Star size={16} className="fill-purple-600 text-purple-600" />
                    <span>{product.rating.toFixed(2)}</span>
                    <span className="text-xs text-slate-500 font-normal">
                      ({product.reviewCount.toLocaleString()})
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
                    BSR #{product.bsr} · Cat #{product.categoryRank} · Sub #{product.subcategoryRank}
                  </div>
                </div>
              </div>

              {/* Full Product Description */}
              <div className="p-4 rounded-lg bg-white border border-purple-200/80 space-y-2 shadow-xs">
                <h3 className="text-xs font-semibold text-slate-900">Product Overview & Description</h3>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {product.description}
                </p>
              </div>

              {/* Oil Formulation, Promotions & Standards Badges */}
              <div className="p-4 rounded-lg bg-white border border-purple-200/80 space-y-3 shadow-xs">
                <h3 className="text-xs font-semibold text-slate-900">
                  Formulation, Engine Compatibility & Active Offers
                </h3>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="px-2.5 py-1 rounded bg-purple-50 border border-purple-200 text-slate-700 font-medium">
                    Engine: <strong className="text-purple-800">{product.engineCompatibility}</strong>
                  </span>
                  <span className="px-2.5 py-1 rounded bg-purple-50 border border-purple-200 text-slate-700 font-medium">
                    API: <strong className="text-slate-900">{product.apiStandard}</strong>
                  </span>
                  <span className="px-2.5 py-1 rounded bg-purple-50 border border-purple-200 text-slate-700 font-medium">
                    ACEA / ILSAC: <strong className="text-slate-900">{product.aceaStandard}</strong>
                  </span>
                  {product.zincContentPpm && (
                    <span className="px-2.5 py-1 rounded bg-purple-100 text-purple-800 border border-purple-200 font-mono">
                      Zinc (ZDDP): <strong>{product.zincContentPpm} ppm</strong>
                    </span>
                  )}
                  {product.subscribeAndSave && (
                    <span className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                      ✓ Subscribe & Save (10–15% Off)
                    </span>
                  )}
                  {product.hasCoupon && (
                    <span className="px-2.5 py-1 rounded bg-purple-100 text-purple-800 border border-purple-300 font-medium">
                      <Tag size={11} className="inline mr-1" />
                      {formatMoney(product.couponValueAud || 0, currency)} Coupon (Net {formatMoney(product.couponPriceAud || 0, currency, 2, true)})
                    </span>
                  )}
                  {product.dealBadge && (
                    <span className="px-2.5 py-1 rounded bg-purple-600 text-white font-semibold">
                      {product.dealBadge}
                    </span>
                  )}
                  {product.isLightningDeal && (
                    <span className="px-2.5 py-1 rounded bg-rose-50 text-rose-700 border border-rose-200 font-semibold">
                      ⚡ Lightning Deal Active
                    </span>
                  )}
                </div>
              </div>

              {/* Pack Variations & OEM Approvals */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-white border border-purple-200/80 space-y-2 shadow-xs">
                  <h3 className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-purple-600" />
                    <span>OEM Manufacturer Approvals</span>
                  </h3>
                  {product.oemApprovals && product.oemApprovals.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {product.oemApprovals.map((appr, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded text-[11px] font-mono bg-purple-50 border border-purple-200 text-purple-900"
                        >
                          {appr}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-500">Standard API / ACEA specification</span>
                  )}
                </div>

                <div className="p-4 rounded-lg bg-white border border-purple-200/80 space-y-2 shadow-xs">
                  <h3 className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                    <Package size={14} className="text-purple-600" />
                    <span>Available Pack Variations</span>
                  </h3>
                  {product.variations && product.variations.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {product.variations.map((v, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded text-[11px] font-mono bg-purple-100 border border-purple-200 text-purple-800"
                        >
                          {v}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-500">{product.volumeLiters} Litre Single Container</span>
                  )}
                </div>
              </div>

              {/* Stock Verification, Seller & Delivery Details */}
              <div className="p-4 rounded-lg bg-white border border-purple-200/80 space-y-3 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-xs font-semibold text-slate-900">
                    Page Stock Verification, Seller & Logistics ({cfg.code} Delivery Check)
                  </h3>
                  <span className="text-[11px] font-mono text-purple-700">
                    Checked for: {product.verifiedLocation || cfg.locationLabel}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-2.5 rounded bg-purple-50/50 border border-purple-100">
                    <span className="text-[10px] text-slate-500 block">Live Page Stock Status</span>
                    <span
                      className={`font-semibold mt-0.5 block ${
                        product.inStock ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      {product.availabilityDetail || product.availability}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
                      Add to Cart Button: {product.hasAddToCart === false ? 'Not Present' : 'Active'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded bg-purple-50/50 border border-purple-100">
                    <span className="text-[10px] text-slate-500 block">Seller & Fulfillment</span>
                    <span className="font-semibold text-slate-900 mt-0.5 block">
                      Sold by: {product.soldBy || `Amazon ${cfg.code} / Marketplace`}
                    </span>
                    <span className="text-[11px] text-slate-600 mt-0.5 block">
                      Ships from: {product.shipsFrom || product.soldBy || `Amazon ${cfg.code}`}
                    </span>
                  </div>
                  <div className="p-2.5 rounded bg-purple-50/50 border border-purple-100">
                    <span className="text-[10px] text-slate-500 block">Delivery & Returns</span>
                    <span className="font-medium text-slate-900 mt-0.5 block line-clamp-2">
                      {product.deliveryEstimate || (product.inStock ? `Standard ${cfg.code} Delivery` : 'Unavailable for delivery')}
                    </span>
                    {product.returnPolicy && (
                      <span className="text-[10px] text-slate-500 mt-0.5 block truncate" title={product.returnPolicy}>
                        {product.returnPolicy}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Technical Oil Specifications & Minor Details */}
              <div className="p-4 rounded-lg bg-white border border-purple-200/80 space-y-2 shadow-xs">
                <h3 className="text-xs font-semibold text-slate-900">
                  Technical Oil Specifications & Minor Product Details ({Object.keys(product.specifications).length} Fields)
                </h3>
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-xs">
                  {product.partNumber && (
                    <div className="flex justify-between gap-4 py-1 border-b border-purple-100">
                      <dt className="text-slate-500 shrink-0">Part / Model Number</dt>
                      <dd className="font-mono text-purple-800 font-semibold text-right">{product.partNumber}</dd>
                    </div>
                  )}
                  {product.gtin && (
                    <div className="flex justify-between gap-4 py-1 border-b border-purple-100">
                      <dt className="text-slate-500 shrink-0">GTIN / EAN</dt>
                      <dd className="font-mono text-slate-900 font-medium text-right">{product.gtin}</dd>
                    </div>
                  )}
                  {product.itemWeight && (
                    <div className="flex justify-between gap-4 py-1 border-b border-purple-100">
                      <dt className="text-slate-500 shrink-0">Item Weight</dt>
                      <dd className="font-mono text-slate-900 font-medium text-right">{product.itemWeight}</dd>
                    </div>
                  )}
                  {product.packageDimensions && (
                    <div className="flex justify-between gap-4 py-1 border-b border-purple-100">
                      <dt className="text-slate-500 shrink-0">Dimensions</dt>
                      <dd className="font-mono text-slate-900 font-medium text-right">{product.packageDimensions}</dd>
                    </div>
                  )}
                  {product.countryOfOrigin && (
                    <div className="flex justify-between gap-4 py-1 border-b border-purple-100">
                      <dt className="text-slate-500 shrink-0">Country of Origin</dt>
                      <dd className="font-mono text-slate-900 font-medium text-right">{product.countryOfOrigin}</dd>
                    </div>
                  )}
                  {product.dateFirstAvailable && (
                    <div className="flex justify-between gap-4 py-1 border-b border-purple-100">
                      <dt className="text-slate-500 shrink-0">Date First Available</dt>
                      <dd className="font-mono text-slate-900 font-medium text-right">{product.dateFirstAvailable}</dd>
                    </div>
                  )}
                  {Object.entries(product.specifications).map(([key, val]) => (
                    <div key={key} className="flex justify-between gap-4 py-1 border-b border-purple-100">
                      <dt className="text-slate-500 shrink-0">{key}</dt>
                      <dd className="font-mono text-slate-900 font-medium text-right">{val}</dd>
                    </div>
                  ))}
                  <div className="flex justify-between gap-4 py-1 border-b border-purple-100">
                    <dt className="text-slate-500 shrink-0">Demand Indicator</dt>
                    <dd className="font-mono text-emerald-700 font-semibold text-right">
                      {product.demandIndicator} (+{product.salesGrowthPct.toFixed(1)}% MoM)
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4 py-1 border-b border-purple-100">
                    <dt className="text-slate-500 shrink-0">Daily / Weekly Est. Velocity</dt>
                    <dd className="font-mono text-slate-900 font-medium text-right">
                      {product.estDailySales}/day · {product.estWeeklySales}/wk
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Rating Distribution */}
              <div className="p-4 rounded-lg bg-white border border-purple-200/80 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-slate-900">
                    Customer Rating Breakdown ({product.reviewCount.toLocaleString()} Total Reviews)
                  </h3>
                  <span className="text-xs text-purple-700 font-mono font-semibold">
                    +{product.reviewGrowth30d} reviews in last 30 days
                  </span>
                </div>
                <div className="space-y-1.5 text-xs">
                  {[
                    { label: '5 Star', pct: product.ratingDistribution.fiveStar },
                    { label: '4 Star', pct: product.ratingDistribution.fourStar },
                    { label: '3 Star', pct: product.ratingDistribution.threeStar },
                    { label: '2 Star', pct: product.ratingDistribution.twoStar },
                    { label: '1 Star', pct: product.ratingDistribution.oneStar },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center gap-3">
                      <span className="w-12 text-slate-600 text-right">{row.label}</span>
                      <div className="flex-1 h-2 rounded-full bg-purple-100 overflow-hidden">
                        <div
                          className="h-full bg-purple-600 rounded-full"
                          style={{ width: `${row.pct}%` }}
                        />
                      </div>
                      <span className="w-9 font-mono tabular-nums text-slate-600 text-right">
                        {row.pct}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Collection Timestamps Metadata */}
              <div className="p-3.5 rounded-lg bg-purple-50/70 border border-purple-200/80 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-600 font-mono">
                <div className="flex items-center gap-1.5">
                  <Clock size={12} className="text-purple-600" />
                  <span>First Tracked: {formatTimestamp(product.firstTrackedAt)}</span>
                </div>
                <div>Last Scraped: {formatTimestamp(product.lastScrapedAt)}</div>
                <div>Promo Events Logged: {product.promoHistoryCount}</div>
              </div>
            </div>
          )}

          {/* TAB 2: PRICING & PROMOTIONS */}
          {activeTab === 'pricing' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg bg-white border border-purple-200/80 shadow-xs">
                  <div className="text-[11px] text-slate-500">Current / Sale Price</div>
                  <div className="text-lg font-bold font-mono tabular-nums text-slate-900 mt-0.5">
                    {product.currentPriceAud > 0 ? formatMoney(product.currentPriceAud, currency, 2, true) : product.availability}
                  </div>
                  <div className="text-[10px] text-purple-700 font-mono font-semibold">
                    {product.pricePerLiterAud > 0
                      ? `${formatMoney(product.pricePerLiterAud, currency)}/L · List ${formatMoney(product.listPriceAud, currency)}`
                      : `No active ${currency} Buy Box offer`}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-white border border-purple-200/80 shadow-xs">
                  <div className="text-[11px] text-slate-500">Lowest Obs. Bottle Price</div>
                  <div className="text-lg font-bold font-mono tabular-nums text-emerald-700 mt-0.5">
                    {product.lowestPriceAud > 0 ? formatMoney(product.lowestPriceAud, currency, 2, true) : '—'}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    {product.lowestPriceAud > 0 ? `${formatMoney(product.lowestPriceAud / product.volumeLiters, currency)}/L` : 'Unavailable'}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-white border border-purple-200/80 shadow-xs">
                  <div className="text-[11px] text-slate-500">Average Historical Price</div>
                  <div className="text-lg font-bold font-mono tabular-nums text-slate-800 mt-0.5">
                    {product.avgPriceAud > 0 ? formatMoney(product.avgPriceAud, currency, 2, true) : '—'}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    {product.avgPriceAud > 0 ? `${formatMoney(product.avgPriceAud / product.volumeLiters, currency)}/L` : 'Unavailable'}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-white border border-purple-200/80 shadow-xs">
                  <div className="text-[11px] text-slate-500">Highest Obs. Price</div>
                  <div className="text-lg font-bold font-mono tabular-nums text-slate-800 mt-0.5">
                    {product.highestPriceAud > 0 ? formatMoney(product.highestPriceAud, currency, 2, true) : '—'}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    {product.highestPriceAud > 0 ? `${formatMoney(product.highestPriceAud / product.volumeLiters, currency)}/L` : 'Unavailable'}
                  </div>
                </div>
              </div>

              {/* Price Line Chart */}
              <div className="p-4 rounded-lg bg-white border border-purple-200/80 space-y-3 shadow-xs">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-900">Historical Price Trend ({currency})</span>
                  <span className="text-purple-700 font-mono">
                    {product.volumeLiters}L Buy Box Tracking · {product.promoHistoryCount} Promo Events
                  </span>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={product.priceHistory}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e9d5ff" opacity={0.8} />
                      <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11, fill: '#475569' }} />
                      <YAxis
                        stroke="#64748b"
                        domain={['auto', 'auto']}
                        tickFormatter={(val) =>
                          currency === 'PLN' ? `${val} zł` : `${cfg.currencySymbol}${val}`
                        }
                        tick={{ fontSize: 11, fill: '#475569' }}
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
                        formatter={(value: any) => [formatMoney(Number(value), currency, 2, true), 'Bottle Price']}
                      />
                      <Line
                        type="monotone"
                        dataKey="priceAud"
                        stroke="#7c3aed"
                        strokeWidth={2.5}
                        dot={{ r: 4, fill: '#7c3aed', strokeWidth: 0 }}
                        activeDot={{ r: 6, fill: '#6d28d9' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Detailed Price History Table */}
              <div className="rounded-lg border border-purple-200/80 bg-white overflow-hidden shadow-xs">
                <table className="w-full text-xs text-left">
                  <thead className="bg-purple-50/80 text-purple-900 border-b border-purple-200">
                    <tr>
                      <th className="py-2.5 px-3 font-semibold">Date</th>
                      <th className="py-2.5 px-3 text-right font-semibold">Observed Price ({currency})</th>
                      <th className="py-2.5 px-3 text-right font-semibold">{cfg.currencySymbol}/Litre ({currency})</th>
                      <th className="py-2.5 px-3 text-right font-semibold">Discount %</th>
                      <th className="py-2.5 px-3 font-semibold">Event Type</th>
                      <th className="py-2.5 px-3 text-right font-semibold">Coupon</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-100 bg-white">
                    {product.priceHistory.map((pt, idx) => (
                      <tr key={idx} className="hover:bg-purple-50/40">
                        <td className="py-2 px-3 font-mono text-slate-600">{pt.date}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                          {formatMoney(pt.priceAud, currency)}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-semibold text-purple-700">
                          {formatMoney(pt.priceAud / product.volumeLiters, currency)}/L
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-emerald-700 font-semibold">
                          {pt.discountPct ? `-${pt.discountPct.toFixed(1)}%` : '0%'}
                        </td>
                        <td className="py-2 px-3 capitalize text-slate-700">
                          {(pt.eventType || 'normal').replace('_', ' ')}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-purple-700 font-medium">
                          {pt.couponAud ? formatMoney(pt.couponAud, currency) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: SALES INTEL & RANKING */}
          {activeTab === 'sales' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-white border border-purple-200/80 shadow-xs">
                  <span className="text-slate-500">Est. Daily / Weekly Units</span>
                  <div className="text-base font-bold font-mono text-slate-900 mt-1">
                    {product.estDailySales}/day · {product.estWeeklySales}/wk
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-white border border-purple-200/80 shadow-xs">
                  <span className="text-slate-500">Monthly Litres Dispensed</span>
                  <div className="text-base font-bold font-mono text-purple-700 mt-1">
                    {(product.estMonthlySales * product.volumeLiters).toLocaleString()} Litres
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-white border border-purple-200/80 shadow-xs">
                  <span className="text-slate-500">Monthly Gross Revenue</span>
                  <div className="text-base font-bold font-mono text-slate-900 mt-1">
                    {formatMoney(Math.round(product.estMonthlyRevenueAud), currency, 0, true)}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-white border border-purple-200/80 shadow-xs">
                  <span className="text-slate-500">Rankings & 7d Momentum</span>
                  <div className="text-base font-bold font-mono text-emerald-700 mt-1 flex items-center gap-1">
                    <TrendingUp size={14} />
                    <span>
                      #{product.bsr} ({product.bsrChange7dPct < 0 ? `▲ ${Math.abs(product.bsrChange7dPct)}%` : `▼ ${product.bsrChange7dPct}%`})
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-white border border-purple-200/80 space-y-3 shadow-xs">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-900">Monthly Estimated Sales Units</span>
                  <span className="text-purple-700 font-mono">
                    Growth: +{product.salesGrowthPct.toFixed(1)}% · Demand: {product.demandIndicator}
                  </span>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={product.salesHistory}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e9d5ff" opacity={0.8} />
                      <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11, fill: '#475569' }} />
                      <YAxis stroke="#64748b" tick={{ fontSize: 11, fill: '#475569' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          borderColor: '#d8b4fe',
                          borderRadius: '8px',
                          fontSize: '12px',
                          color: '#0f172a',
                          boxShadow: '0 4px 12px rgba(109, 40, 217, 0.08)',
                        }}
                        formatter={(val: any) => [`${val.toLocaleString()} bottles`, 'Est. Units']}
                      />
                      <Bar dataKey="estMonthlyUnits" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Monthly Sales History Table */}
              {product.salesHistory.length > 0 && (
                <div className="rounded-lg border border-purple-200/80 bg-white overflow-hidden shadow-xs">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-purple-50/80 text-purple-900 border-b border-purple-200">
                      <tr>
                        <th className="py-2.5 px-3 font-semibold">Month</th>
                        <th className="py-2.5 px-3 text-right font-semibold">Est. Bottles Sold</th>
                        <th className="py-2.5 px-3 text-right font-semibold">Est. Litres Dispensed</th>
                        <th className="py-2.5 px-3 text-right font-semibold">Est. Monthly Revenue</th>
                        <th className="py-2.5 px-3 text-right font-semibold">BSR</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-purple-100 bg-white">
                      {product.salesHistory.map((sh, idx) => (
                        <tr key={idx} className="hover:bg-purple-50/40">
                          <td className="py-2 px-3 font-mono text-slate-600">{sh.date}</td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                            {sh.estMonthlyUnits.toLocaleString()}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-semibold text-purple-700">
                            {(sh.estMonthlyUnits * product.volumeLiters).toLocaleString()} L
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-semibold text-emerald-700">
                            {formatMoney(Math.round(sh.estMonthlyRevenueAud), currency, 0, true)}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-semibold text-purple-700">#{sh.bsr}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: COMPETITORS */}
          {activeTab === 'competitors' && (
            <div className="space-y-4">
              <div className="text-xs text-slate-600">
                Direct viscosity and specification competitor engine oils on Amazon {cfg.countryName} with direct product links.
              </div>

              <div className="rounded-lg border border-purple-200/80 bg-white overflow-x-auto shadow-xs">
                <table className="w-full text-xs text-left">
                  <thead className="bg-purple-50/80 text-purple-900 border-b border-purple-200">
                    <tr>
                      <th className="py-2.5 px-3 font-semibold">Competitor Oil / ASIN</th>
                      <th className="py-2.5 px-3 font-semibold">Brand</th>
                      <th className="py-2.5 px-3 font-semibold">Viscosity</th>
                      <th className="py-2.5 px-3 text-right font-semibold">Price ({currency})</th>
                      <th className="py-2.5 px-3 text-right font-semibold">{cfg.currencySymbol}/Litre</th>
                      <th className="py-2.5 px-3 text-right font-semibold">Price Gap</th>
                      <th className="py-2.5 px-3 text-right font-semibold">BSR / Rating</th>
                      <th className="py-2.5 px-3 text-right font-semibold">Est. Mo. Sales</th>
                      <th className="py-2.5 px-3 text-right font-semibold">Match</th>
                      <th className="py-2.5 px-3 text-center font-semibold">Amazon {cfg.code} Link</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-100 bg-white">
                    {product.competitors.map((comp) => {
                      const compUrl =
                        mp === 'PT'
                          ? `https://${cfg.domain}/-/pt/dp/${comp.competitorAsin}`
                          : `https://${cfg.domain}/dp/${comp.competitorAsin}`;
                      return (
                        <tr key={comp.competitorAsin} className="hover:bg-purple-50/40">
                          <td className="py-2.5 px-3 max-w-xs">
                            <div
                              onClick={() => onOpenCompetitorDetail && onOpenCompetitorDetail(comp.competitorAsin)}
                              className={`font-medium text-slate-900 truncate ${
                                onOpenCompetitorDetail ? 'hover:text-purple-700 cursor-pointer' : ''
                              }`}
                            >
                              {comp.title}
                            </div>
                            <div className="font-mono text-[11px] text-slate-500">
                              {comp.competitorAsin} · {comp.volumeLiters}L
                            </div>
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-purple-700">{comp.brand}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-purple-800">
                            {comp.viscosity}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                            {formatMoney(comp.priceAud, currency)}
                            {comp.discountPct > 0 && (
                              <span className="text-[10px] text-emerald-700 block">
                                -{comp.discountPct.toFixed(0)}%
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-purple-700">
                            {formatMoney(comp.pricePerLiterAud, currency)}/L
                          </td>
                          <td
                            className={`py-2.5 px-3 text-right font-mono font-semibold ${
                              comp.priceDifferencePct < 0 ? 'text-emerald-700' : 'text-rose-700'
                            }`}
                          >
                            {comp.priceDifferencePct > 0 ? '+' : ''}
                            {comp.priceDifferencePct.toFixed(1)}%
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                            <div>#{comp.bsr} BSR</div>
                            <div className="text-[10px] text-purple-700">
                              ★ {comp.rating.toFixed(1)} ({comp.reviewCount.toLocaleString()})
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-800">
                            <div>{comp.estMonthlySales.toLocaleString()}</div>
                            <div className="text-[10px] text-slate-500">
                              {formatMoney(Math.round(comp.estMonthlyRevenue), currency, 0)}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-semibold text-purple-700">
                            {comp.similarityScore}%
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <a
                              href={compUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-1 rounded bg-purple-50 border border-purple-200 hover:bg-purple-600 hover:text-white hover:border-purple-600 text-[11px] font-medium text-purple-700 transition-colors"
                            >
                              <span>Open</span>
                              <ExternalLink size={11} />
                            </a>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: OPPORTUNITY */}
          {activeTab === 'opportunity' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-gradient-to-br from-white via-purple-50/70 to-purple-100/70 border border-purple-200 flex items-center justify-between shadow-xs">
                <div>
                  <span className="text-xs text-purple-700 font-medium">Engine Oil Opportunity Score</span>
                  <div className="text-3xl font-extrabold font-mono text-purple-700 mt-1">
                    {product.opportunity.overallScore} / 100
                  </div>
                  <div className="text-xs font-semibold text-slate-900 mt-1">
                    {product.opportunity.keyVerdict}
                  </div>
                </div>
                <div className="p-3 rounded-full bg-purple-600 text-white shadow-sm">
                  <Sparkles size={28} />
                </div>
              </div>

              {/* 5-Factor Score Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
                {[
                  { label: 'Demand', score: product.opportunity.demandScore, max: 30 },
                  { label: 'Margin & $/L', score: product.opportunity.marginScore, max: 25 },
                  { label: 'Barrier', score: product.opportunity.competitionScore, max: 20 },
                  { label: 'Rating Gap', score: product.opportunity.ratingGapScore, max: 15 },
                  { label: 'Promo Lift', score: product.opportunity.promoElasticityScore, max: 10 },
                ].map((factor) => (
                  <div key={factor.label} className="p-3 rounded-lg bg-white border border-purple-200/80 space-y-1.5 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 font-medium">{factor.label}</span>
                      <span className="font-mono font-bold text-purple-700">
                        {factor.score}/{factor.max}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-purple-100 overflow-hidden">
                      <div
                        className="h-full bg-purple-600 rounded-full"
                        style={{ width: `${(factor.score / factor.max) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Strengths & Risks */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-white border border-purple-200/80 space-y-2 shadow-xs">
                  <div className="flex items-center gap-1.5 text-emerald-700 font-semibold text-xs">
                    <CheckCircle2 size={14} />
                    <span>Market Advantages</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-700">
                    {product.opportunity.strengths.map((s, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-emerald-600 font-bold">·</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-lg bg-white border border-purple-200/80 space-y-2 shadow-xs">
                  <div className="flex items-center gap-1.5 text-purple-700 font-semibold text-xs">
                    <AlertTriangle size={14} />
                    <span>Strategic Considerations & Logistics</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-700">
                    {product.opportunity.risks.map((r, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-purple-600 font-bold">·</span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
