import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  SlidersHorizontal,
  ArrowUpDown,
  Tag,
  Star,
  ExternalLink,
  PlusCircle,
  CheckCircle2,
  Grid,
  List,
  Sparkles,
  Droplet,
} from 'lucide-react';
import { AutomotiveProduct, AutomotiveCategory, MarketplaceCode } from '../types/automotive';
import { formatMoney, getMpConfig, shortDomain } from '../utils/marketplace';

interface DiscoveryViewProps {
  products: AutomotiveProduct[];
  categories: AutomotiveCategory[];
  marketplace?: MarketplaceCode;
  onSelectProduct: (product: AutomotiveProduct) => void;
  onToggleTrack: (asin: string) => void;
}

export const DiscoveryView: React.FC<DiscoveryViewProps> = ({
  products,
  categories,
  marketplace = 'AU',
  onSelectProduct,
  onToggleTrack,
}) => {
  const cfg = getMpConfig(marketplace);
  const domain = shortDomain(marketplace);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedViscosity, setSelectedViscosity] = useState<string>('all');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [selectedOilType, setSelectedOilType] = useState<string>('all');
  const [selectedEngine, setSelectedEngine] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'in-stock' | 'out-of-stock'>('all');
  const [maxPricePerL, setMaxPricePerL] = useState<string>('');
  const [minDiscount, setMinDiscount] = useState<number>(0);
  const [onlyCoupons, setOnlyCoupons] = useState<boolean>(false);
  const [onlySubscribeSave, setOnlySubscribeSave] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<string>('sales-desc');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Unique lists
  const brandsList = useMemo(() => {
    return Array.from(new Set(products.map((p) => p.brand))).sort();
  }, [products]);

  const viscosityList = useMemo(() => {
    return Array.from(new Set(products.map((p) => p.viscosity))).sort();
  }, [products]);

  // Filtered & Sorted Engine Oils
  const filteredProducts = useMemo(() => {
    let result = products.filter((p) => {
      if (selectedViscosity !== 'all' && p.viscosity !== selectedViscosity) {
        return false;
      }
      if (selectedBrand !== 'all' && p.brand !== selectedBrand) {
        return false;
      }
      if (selectedOilType !== 'all' && p.oilType !== selectedOilType) {
        return false;
      }
      if (selectedEngine !== 'all' && p.engineCompatibility !== selectedEngine) {
        return false;
      }
      if (stockFilter === 'in-stock' && !p.inStock) {
        return false;
      }
      if (stockFilter === 'out-of-stock' && p.inStock) {
        return false;
      }
      if (searchTerm) {
        const q = searchTerm.toLowerCase().trim();
        const matches =
          p.title.toLowerCase().includes(q) ||
          p.asin.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.viscosity.toLowerCase().includes(q) ||
          p.apiStandard.toLowerCase().includes(q) ||
          (p.partNumber || '').toLowerCase().includes(q) ||
          (p.soldBy || '').toLowerCase().includes(q) ||
          p.categoryName.toLowerCase().includes(q);
        if (!matches) return false;
      }
      if (maxPricePerL && (p.pricePerLiterAud <= 0 || p.pricePerLiterAud > parseFloat(maxPricePerL))) return false;
      if (minDiscount > 0 && p.discountPct < minDiscount) return false;
      if (onlyCoupons && !p.hasCoupon) return false;
      if (onlySubscribeSave && !p.subscribeAndSave) return false;
      return true;
    });

    result.sort((a, b) => {
      switch (sortBy) {
        case 'sales-desc':
          return b.estMonthlySales - a.estMonthlySales;
        case 'revenue-desc':
          return b.estMonthlyRevenueAud - a.estMonthlyRevenueAud;
        case 'pricePerLiter-asc':
          return (a.pricePerLiterAud || 9999) - (b.pricePerLiterAud || 9999);
        case 'pricePerLiter-desc':
          return b.pricePerLiterAud - a.pricePerLiterAud;
        case 'price-asc':
          return (a.currentPriceAud || 9999) - (b.currentPriceAud || 9999);
        case 'price-desc':
          return b.currentPriceAud - a.currentPriceAud;
        case 'discount-desc':
          return b.discountPct - a.discountPct;
        case 'bsr-asc':
          return a.bsr - b.bsr;
        case 'rating-desc':
          return b.rating - a.rating;
        case 'opportunity-desc':
          return b.opportunity.overallScore - a.opportunity.overallScore;
        default:
          return b.estMonthlySales - a.estMonthlySales;
      }
    });

    return result;
  }, [
    products,
    selectedViscosity,
    selectedBrand,
    selectedOilType,
    selectedEngine,
    stockFilter,
    searchTerm,
    maxPricePerL,
    minDiscount,
    onlyCoupons,
    onlySubscribeSave,
    sortBy,
  ]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedViscosity('all');
    setSelectedBrand('all');
    setSelectedOilType('all');
    setSelectedEngine('all');
    setStockFilter('all');
    setMaxPricePerL('');
    setMinDiscount(0);
    setOnlyCoupons(false);
    setOnlySubscribeSave(false);
    setSortBy('sales-desc');
  };

  return (
    <div className="space-y-5">
      {/* Search & Filter Header Control Card */}
      <div className="p-4 rounded-xl bg-white border border-purple-200/80 shadow-xs space-y-4">
        {/* Top Search Bar */}
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-500"
            />
            <input
              type="text"
              placeholder="Search by Viscosity (5W-30, 0W-20), Brand (Penrite, Castrol, Mobil 1), ASIN, or API Spec..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-purple-50/40 border border-purple-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-purple-600 focus:bg-white transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
            {/* View Mode Toggle */}
            <div className="flex items-center p-0.5 rounded-lg bg-purple-50 border border-purple-200">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded text-xs transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-purple-600 text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:text-purple-800'
                }`}
                title="Grid Cards View"
              >
                <Grid size={15} />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded text-xs transition-colors ${
                  viewMode === 'table'
                    ? 'bg-purple-600 text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:text-purple-800'
                }`}
                title="High-Density Table View"
              >
                <List size={15} />
              </button>
            </div>

            {/* Sort Selector */}
            <div className="flex items-center gap-1.5 bg-purple-50/50 border border-purple-200 px-3 py-1.5 rounded-lg text-xs">
              <ArrowUpDown size={13} className="text-purple-600 shrink-0" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent text-slate-900 focus:outline-none text-xs cursor-pointer"
              >
                <option value="sales-desc" className="bg-white text-slate-900">Highest Est. Monthly Sales</option>
                <option value="pricePerLiter-asc" className="bg-white text-slate-900">Lowest $/Litre (Best Value)</option>
                <option value="pricePerLiter-desc" className="bg-white text-slate-900">Highest $/Litre (Premium)</option>
                <option value="price-asc" className="bg-white text-slate-900">Lowest Bottle Price</option>
                <option value="price-desc" className="bg-white text-slate-900">Highest Bottle Price</option>
                <option value="discount-desc" className="bg-white text-slate-900">Largest Discount %</option>
                <option value="bsr-asc" className="bg-white text-slate-900">Best BSR Rank</option>
                <option value="opportunity-desc" className="bg-white text-slate-900">Highest Opportunity Score</option>
              </select>
            </div>

            <button
              onClick={handleResetFilters}
              className="px-3 py-1.5 text-xs text-purple-700 hover:text-purple-900 hover:bg-purple-50 rounded-lg border border-purple-200 transition-colors font-medium"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Engine Oil Filter Controls Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 pt-3 border-t border-purple-100 text-xs">
          {/* Viscosity Grade */}
          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">Viscosity Grade</label>
            <select
              value={selectedViscosity}
              onChange={(e) => setSelectedViscosity(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-purple-50/40 border border-purple-200 rounded-lg text-slate-900 focus:outline-none focus:border-purple-600 font-mono font-bold"
            >
              <option value="all" className="bg-white text-slate-900">All Viscosities</option>
              {viscosityList.map((v) => (
                <option key={v} value={v} className="bg-white text-slate-900">
                  {v}
                </option>
              ))}
            </select>
          </div>

          {/* Oil Brand */}
          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">Brand</label>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-purple-50/40 border border-purple-200 rounded-lg text-slate-900 focus:outline-none focus:border-purple-600"
            >
              <option value="all" className="bg-white text-slate-900">All Oil Brands</option>
              {brandsList.map((b) => (
                <option key={b} value={b} className="bg-white text-slate-900">
                  {b}
                </option>
              ))}
            </select>
          </div>

          {/* Base Oil Type */}
          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">Base Formulation</label>
            <select
              value={selectedOilType}
              onChange={(e) => setSelectedOilType(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-purple-50/40 border border-purple-200 rounded-lg text-slate-900 focus:outline-none focus:border-purple-600"
            >
              <option value="all" className="bg-white text-slate-900">All Base Types</option>
              <option value="Full Synthetic" className="bg-white text-slate-900">Full Synthetic</option>
              <option value="100% PAO / Ester" className="bg-white text-slate-900">100% PAO / Ester</option>
              <option value="Semi-Synthetic" className="bg-white text-slate-900">Semi-Synthetic</option>
              <option value="Mineral" className="bg-white text-slate-900">Mineral</option>
            </select>
          </div>

          {/* Engine Compatibility */}
          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">Engine Compatibility</label>
            <select
              value={selectedEngine}
              onChange={(e) => setSelectedEngine(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-purple-50/40 border border-purple-200 rounded-lg text-slate-900 focus:outline-none focus:border-purple-600"
            >
              <option value="all" className="bg-white text-slate-900">All Engine Types</option>
              <option value="Petrol & Hybrid" className="bg-white text-slate-900">Petrol & Hybrid</option>
              <option value="Diesel with DPF (Low SAPS)" className="bg-white text-slate-900">Diesel DPF (Low SAPS)</option>
              <option value="Heavy Towing & 4WD Turbo Diesel" className="bg-white text-slate-900">Heavy Towing Diesel</option>
              <option value="High-Performance & Track" className="bg-white text-slate-900">Racing & Track</option>
              <option value="Vintage & Classic Pushrod" className="bg-white text-slate-900">Classic Pushrod (High Zinc)</option>
            </select>
          </div>

          {/* Stock Status */}
          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">Stock Status (AU)</label>
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value as any)}
              className="w-full px-2.5 py-1.5 bg-purple-50/40 border border-purple-200 rounded-lg text-slate-900 focus:outline-none focus:border-purple-600"
            >
              <option value="all" className="bg-white text-slate-900">All Stock ({products.length})</option>
              <option value="in-stock" className="bg-white text-slate-900">In Stock ({products.filter((p) => p.inStock).length})</option>
              <option value="out-of-stock" className="bg-white text-slate-900">Out of Stock ({products.filter((p) => !p.inStock).length})</option>
            </select>
          </div>

          {/* Max Price / Litre */}
          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">Max {cfg.currencySymbol}/Litre {cfg.currency}</label>
            <input
              type="number"
              placeholder="e.g. 15.00"
              value={maxPricePerL}
              onChange={(e) => setMaxPricePerL(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-purple-50/40 border border-purple-200 rounded-lg text-slate-900 placeholder-slate-400 text-xs font-mono focus:outline-none focus:border-purple-600"
            />
          </div>

          {/* Checkboxes */}
          <div className="flex flex-col justify-end gap-1.5 py-0.5 md:col-span-6 lg:col-span-1">
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 hover:text-purple-900">
              <input
                type="checkbox"
                checked={onlySubscribeSave}
                onChange={(e) => setOnlySubscribeSave(e.target.checked)}
                className="rounded border-purple-300 accent-purple-600 text-purple-600"
              />
              <span>Subscribe & Save</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 hover:text-purple-900">
              <input
                type="checkbox"
                checked={onlyCoupons}
                onChange={(e) => setOnlyCoupons(e.target.checked)}
                className="rounded border-purple-300 accent-purple-600 text-purple-600"
              />
              <span>Digital Coupons</span>
            </label>
          </div>
        </div>
      </div>

      {/* Results Count Bar */}
      <div className="flex items-center justify-between text-xs text-slate-600 px-1">
        <div>
          Showing <span className="font-mono text-purple-700 font-bold">{filteredProducts.length}</span> matching Engine Oil listings in Amazon {cfg.countryName}
        </div>
        <div className="font-mono text-purple-700">Category: Motor Oils · Currency: {cfg.currency}</div>
      </div>

      {/* View: GRID MODE */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((prod) => (
            <div
              key={prod.asin}
              className="p-4 rounded-xl bg-white border border-purple-200/80 hover:border-purple-400 shadow-xs transition-all flex flex-col justify-between space-y-3 group"
            >
              <div>
                {/* Image + Quick Brand Row */}
                <div className="flex items-start gap-3 mb-2">
                  <div
                    onClick={() => onSelectProduct(prod)}
                    className="w-16 h-16 shrink-0 rounded-lg bg-purple-50/30 border border-purple-100 p-1 flex items-center justify-center cursor-pointer overflow-hidden"
                  >
                    <img
                      src={prod.imageUrl}
                      alt={prod.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-purple-700 truncate">
                        {prod.brand}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 border border-purple-200 font-bold shrink-0">
                        {prod.viscosity}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 truncate mt-0.5">
                      {prod.oilType} · {prod.volumeLiters}L · #{prod.bsr} BSR
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-purple-700 mt-1">
                      <Star size={12} className="fill-purple-600 text-purple-600" />
                      <span className="font-bold">{prod.rating.toFixed(2)}</span>
                      <span className="text-slate-500">({prod.reviewCount.toLocaleString()})</span>
                    </div>
                  </div>
                </div>

                {/* Title */}
                <h3
                  onClick={() => onSelectProduct(prod)}
                  className="text-xs font-semibold text-slate-900 line-clamp-2 hover:text-purple-700 cursor-pointer transition-colors"
                >
                  {prod.title}
                </h3>

                {/* Specs & Direct Amazon Link */}
                <div className="mt-2 space-y-1 text-[11px]">
                  <div className="text-slate-500 truncate">
                    {prod.engineCompatibility} · <span className="font-mono text-slate-700 font-medium">{prod.apiStandard}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <a
                      href={prod.productUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 font-mono text-purple-700 hover:text-purple-900 underline truncate"
                      title={prod.productUrl}
                    >
                      <span className="truncate">{domain}/dp/{prod.asin}</span>
                      <ExternalLink size={10} className="shrink-0" />
                    </a>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border shrink-0 ${
                        !prod.inStock
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : prod.availability === 'Buying Options Only' ||
                            prod.availability === 'Low Stock' ||
                            prod.availability === 'Only 2 Left'
                          ? 'bg-purple-100 text-purple-800 border-purple-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}
                      title={prod.availabilityDetail || prod.availability}
                    >
                      {prod.stockQuantityLeft ? `Only ${prod.stockQuantityLeft} Left` : prod.availability}
                    </span>
                  </div>
                </div>
              </div>

              {/* Pricing, Sales & $/Litre */}
              <div className="pt-3 border-t border-purple-100 space-y-2">
                <div className="flex items-baseline justify-between">
                  <div>
                    {prod.currentPriceAud > 0 ? (
                      <>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-base font-bold font-mono text-slate-900">
                            {formatMoney(prod.currentPriceAud, cfg.currency, 2, true)}
                          </span>
                          {prod.discountPct > 0 && (
                            <span className="text-[10px] font-mono font-bold text-emerald-700">
                              -{prod.discountPct.toFixed(0)}%
                            </span>
                          )}
                        </div>
                        <span className="text-xs font-mono font-bold text-purple-700 block">
                          {formatMoney(prod.pricePerLiterAud, cfg.currency)} / Litre
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-sm font-bold font-mono text-rose-700 block">
                          {prod.availability}
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          {prod.soldBy ? `Seller: ${prod.soldBy}` : `Check Amazon ${marketplace} options`}
                        </span>
                      </>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-semibold text-slate-800">
                      {prod.estMonthlySales.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-500 block">bottles/mo</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1">
                  <span className="font-mono text-purple-700 font-semibold flex items-center gap-1">
                    <Sparkles size={11} />
                    <span>Score: {prod.opportunity.overallScore}/100</span>
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onToggleTrack(prod.asin)}
                      className={`p-1.5 rounded transition-colors ${
                        prod.isTracked
                          ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                          : 'text-slate-500 hover:text-purple-700 bg-purple-50 border border-purple-200'
                      }`}
                      title={prod.isTracked ? 'Tracked' : 'Add to tracking'}
                    >
                      <CheckCircle2 size={13} />
                    </button>
                    <a
                      href={prod.productUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded bg-purple-50 border border-purple-200 hover:bg-purple-600 hover:text-white hover:border-purple-600 text-purple-700 transition-colors"
                      title={`Open ${prod.productUrl}`}
                    >
                      <ExternalLink size={13} />
                    </a>
                    <button
                      onClick={() => onSelectProduct(prod)}
                      className="px-2.5 py-1 rounded bg-purple-600 hover:bg-purple-700 text-xs font-medium text-white transition-colors"
                    >
                      All Details
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View: TABLE MODE */}
      {viewMode === 'table' && (
        <div className="rounded-xl border border-purple-200/80 bg-white overflow-x-auto shadow-xs">
          <table className="w-full text-xs text-left">
            <thead className="bg-purple-50/80 text-purple-900 border-b border-purple-200">
              <tr>
                <th className="py-3 px-4 font-semibold">ASIN / Engine Oil Title</th>
                <th className="py-3 px-3 font-semibold">Brand & Specs</th>
                <th className="py-3 px-3 font-semibold">Viscosity</th>
                <th className="py-3 px-3 font-semibold">Volume</th>
                <th className="py-3 px-3 text-right font-semibold">Price ({cfg.currency})</th>
                <th className="py-3 px-3 text-right font-bold text-purple-700">{cfg.currencySymbol}/Litre</th>
                <th className="py-3 px-3 font-semibold">Stock Status</th>
                <th className="py-3 px-3 text-right font-semibold">Discount</th>
                <th className="py-3 px-3 text-right font-semibold">Est. Mo. Sales</th>
                <th className="py-3 px-3 text-right font-semibold">Est. Mo. Rev</th>
                <th className="py-3 px-3 text-right font-semibold">Rating</th>
                <th className="py-3 px-3 text-right font-semibold">Score</th>
                <th className="py-3 px-3 font-semibold">Amazon {marketplace} Link</th>
                <th className="py-3 px-4 text-center font-semibold">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-100 bg-white">
              {filteredProducts.map((p) => (
                <tr key={p.asin} className="hover:bg-purple-50/40 transition-colors">
                  <td className="py-2.5 px-4 max-w-sm">
                    <div
                      onClick={() => onSelectProduct(p)}
                      className="font-medium text-slate-900 truncate hover:text-purple-700 cursor-pointer"
                    >
                      {p.title}
                    </div>
                    <div className="text-[11px] font-mono text-slate-500">
                      <code>{p.asin}</code> · #{p.bsr} BSR · {p.soldBy || `Amazon ${marketplace}`}
                    </div>
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="font-semibold text-purple-700">{p.brand}</div>
                    <div className="text-[10px] font-mono text-slate-500">{p.apiStandard}</div>
                  </td>
                  <td className="py-2.5 px-3 font-mono font-bold text-purple-800">{p.viscosity}</td>
                  <td className="py-2.5 px-3 font-mono text-slate-700">{p.volumeLiters}L</td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                    {p.currentPriceAud > 0 ? formatMoney(p.currentPriceAud, cfg.currency) : '—'}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-purple-700">
                    {p.pricePerLiterAud > 0 ? `${formatMoney(p.pricePerLiterAud, cfg.currency)}/L` : '—'}
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border whitespace-nowrap ${
                        !p.inStock
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : p.availability === 'Buying Options Only' ||
                            p.availability === 'Low Stock' ||
                            p.availability === 'Only 2 Left'
                          ? 'bg-purple-100 text-purple-800 border-purple-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      {p.stockQuantityLeft ? `Only ${p.stockQuantityLeft} Left` : p.availability}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-emerald-700 font-semibold">
                    {p.discountPct > 0 ? `-${p.discountPct.toFixed(1)}%` : '0%'}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-800">
                    {p.estMonthlySales.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                    {formatMoney(Math.round(p.estMonthlyRevenueAud), cfg.currency, 0)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-purple-700 font-semibold">
                    ★ {p.rating.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-purple-700">
                    {p.opportunity.overallScore}
                  </td>
                  <td className="py-2.5 px-3">
                    <a
                      href={p.productUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-mono text-[11px] text-purple-700 hover:text-purple-900 underline whitespace-nowrap"
                    >
                      <span>{domain}/dp/{p.asin}</span>
                      <ExternalLink size={11} />
                    </a>
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    <button
                      onClick={() => onSelectProduct(p)}
                      className="px-2.5 py-1 rounded bg-purple-600 hover:bg-purple-700 text-[11px] font-medium text-white transition-colors whitespace-nowrap"
                    >
                      All Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
