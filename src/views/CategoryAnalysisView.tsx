import React, { useState } from 'react';
import {
  Layers,
  TrendingUp,
  DollarSign,
  Search,
  ArrowUpDown,
  Sparkles,
  Droplet,
} from 'lucide-react';
import { AutomotiveCategory, MarketplaceCode } from '../types/automotive';
import { formatMoney, getMpConfig } from '../utils/marketplace';

interface CategoryAnalysisViewProps {
  categories: AutomotiveCategory[];
  marketplace?: MarketplaceCode;
  onSelectCategory?: (categorySlug: string) => void;
}

export const CategoryAnalysisView: React.FC<CategoryAnalysisViewProps> = ({
  categories,
  marketplace = 'AU',
  onSelectCategory,
}) => {
  const cfg = getMpConfig(marketplace);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'revenue' | 'sales' | 'products' | 'price'>('revenue');

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  filteredCategories.sort((a, b) => {
    switch (sortBy) {
      case 'revenue':
        return b.estMonthlyRevenueAud - a.estMonthlyRevenueAud;
      case 'sales':
        return b.estMonthlySalesUnits - a.estMonthlySalesUnits;
      case 'products':
        return b.productCount - a.productCount;
      case 'price':
        return b.avgPriceAud - a.avgPriceAud;
      default:
        return b.estMonthlyRevenueAud - a.estMonthlyRevenueAud;
    }
  });

  const totalCatRevenue = categories.reduce((acc, c) => acc + c.estMonthlyRevenueAud, 0);

  return (
    <div className="space-y-6">
      {/* Category Intelligence Header */}
      <div className="p-4 rounded-xl bg-white border border-purple-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Droplet size={16} className="text-purple-600" />
            <span>Engine Oil Viscosity & Specification Segments ({cfg.code})</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Total Monitored Monthly Volume: ~{formatMoney(totalCatRevenue / 1000000, cfg.currency, 1)}M {cfg.currency} across major oil classifications
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-500" />
            <input
              type="text"
              placeholder="Filter by Viscosity (5W-30, Diesel, Racing)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-purple-50/40 border border-purple-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-500/15"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-purple-50/40 border border-purple-200 px-3 py-1.5 rounded-lg text-xs shrink-0">
            <ArrowUpDown size={13} className="text-purple-500" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-slate-800 font-medium focus:outline-none cursor-pointer"
            >
              <option value="revenue" className="bg-white text-slate-900">Sort by Revenue</option>
              <option value="sales" className="bg-white text-slate-900">Sort by Unit Volume</option>
              <option value="products" className="bg-white text-slate-900">Sort by Listings</option>
              <option value="price" className="bg-white text-slate-900">Sort by Avg Price</option>
            </select>
          </div>
        </div>
      </div>

      {/* Viscosity Segments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCategories.map((cat, idx) => (
          <div
            key={cat.id}
            onClick={() => onSelectCategory && onSelectCategory(cat.slug)}
            className={`p-4 rounded-xl bg-white border border-purple-200/80 hover:border-purple-400 shadow-xs transition-all flex flex-col justify-between space-y-3 group ${onSelectCategory ? 'cursor-pointer' : ''}`}
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-1">
                <span className="text-[11px] font-mono text-purple-600 font-semibold">
                  {idx + 1 < 10 ? `0${idx + 1}` : idx + 1}.
                </span>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                    cat.demandLevel === 'Explosive'
                      ? 'bg-purple-600 text-white border border-purple-700'
                      : cat.demandLevel === 'Very High'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-purple-100 text-purple-800 border border-purple-200'
                  }`}
                >
                  {cat.demandLevel} Demand
                </span>
              </div>

              <h3 className="text-sm font-bold text-slate-900 group-hover:text-purple-700 transition-colors">
                {cat.name}
              </h3>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                {cat.description}
              </p>
            </div>

            <div className="pt-3 border-t border-purple-100 space-y-2">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 block">Est Monthly Revenue</span>
                  <span className="font-mono font-bold text-slate-900">
                    {formatMoney(cat.estMonthlyRevenueAud / 1000, cfg.currency, 0)}k {cfg.currency}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Est Monthly Bottles</span>
                  <span className="font-mono font-bold text-purple-700">
                    {cat.estMonthlySalesUnits.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div>
                  <span className="text-[10px] text-slate-500 block">Avg Bottle Price</span>
                  <span className="font-mono font-medium text-slate-700">
                    {cat.avgPriceAud > 0 ? formatMoney(cat.avgPriceAud, cfg.currency, 2, true) : '—'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Avg Discount</span>
                  <span className="font-mono font-semibold text-emerald-700">
                    {cat.avgDiscountPct.toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className="pt-2 text-[11px] text-slate-500">
                <span className="text-purple-800 font-semibold">Top {cfg.code} Brands: </span>
                <span className="text-slate-700">{cat.topBrands.join(', ')}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
