import React from 'react';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Info,
  Calendar,
  Sparkles,
  Droplet,
  ExternalLink,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ScatterChart,
  Scatter,
} from 'recharts';
import { AutomotiveProduct, MarketplaceCode } from '../types/automotive';
import { formatMoney, getMpConfig, shortDomain } from '../utils/marketplace';

interface SalesIntelligenceViewProps {
  products: AutomotiveProduct[];
  marketplace?: MarketplaceCode;
  onSelectProduct: (product: AutomotiveProduct) => void;
}

export const SalesIntelligenceView: React.FC<SalesIntelligenceViewProps> = ({
  products,
  marketplace = 'AU',
  onSelectProduct,
}) => {
  const cfg = getMpConfig(marketplace);
  const domain = shortDomain(marketplace);
  const sortedBySales = [...products].sort((a, b) => b.estMonthlySales - a.estMonthlySales);
  const totalEstMonthlyRevenue = products.reduce((acc, p) => acc + p.estMonthlyRevenueAud, 0);
  const totalEstMonthlyUnits = products.reduce((acc, p) => acc + p.estMonthlySales, 0);
  const totalEstMonthlyLiters = products.reduce((acc, p) => acc + (p.estMonthlySales * p.volumeLiters), 0);

  const scatterData = products.map((p) => ({
    name: p.brand + ' ' + p.viscosity,
    bsr: p.subcategoryRank || p.bsr,
    sales: p.estMonthlySales,
    litres: p.estMonthlySales * p.volumeLiters,
  }));

  return (
    <div className="space-y-6">
      {/* Disclaimer Banner */}
      <div className="p-3.5 rounded-xl bg-purple-50/70 border border-purple-200 flex items-start gap-3 text-xs">
        <Info size={16} className="text-purple-600 shrink-0 mt-0.5" />
        <div className="text-slate-700 leading-relaxed">
          <strong className="text-purple-800">{cfg.countryName} Motor Oil Sales Estimates:</strong> Product
          metadata, prices, ratings, and BSR ranks are scraped live from Amazon {cfg.countryName}
          (<code className="text-purple-700 font-mono">{domain}</code>). Monthly bottle units and revenue are estimated from live scraped
          Automotive Oils Best Sellers Rank curves.
        </div>
      </div>

      {/* Aggregate Engine Oil Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-white border border-purple-200/80 shadow-xs">
          <div className="text-[11px] font-medium text-slate-500">Est. Monthly Bottle Volume</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-0.5">
            {totalEstMonthlyUnits.toLocaleString()} units
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Across {products.length} Live Oils</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-purple-200/80 shadow-xs">
          <div className="text-[11px] font-medium text-slate-500">Est. Monthly Dispensed Volume</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-purple-700 mt-0.5">
            {(totalEstMonthlyLiters / 1000).toFixed(1)}k Litres
          </div>
          <div className="text-[10px] text-purple-600 mt-1">Estimated Volume / mo</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-purple-200/80 shadow-xs">
          <div className="text-[11px] font-medium text-slate-500">Est. Monthly Oil GMV ({cfg.currency})</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-emerald-700 mt-0.5">
            {cfg.currencySymbol}{(totalEstMonthlyRevenue / 1000).toFixed(0)}k {cfg.currency}
          </div>
          <div className="text-[10px] text-emerald-700 mt-1">Across Live Scraped Catalog</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-purple-200/80 shadow-xs">
          <div className="text-[11px] font-medium text-slate-500">Top Category Leader</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-purple-700 mt-0.5">
            {sortedBySales[0]?.viscosity || '5W-30'}
          </div>
          <div className="text-[10px] text-slate-500 mt-1 truncate">
            {sortedBySales[0] ? `#${sortedBySales[0].subcategoryRank} Oils · ${sortedBySales[0].brand}` : domain}
          </div>
        </div>
      </div>

      {/* Correlation Chart: BSR vs Monthly Sales */}
      <div className="p-5 rounded-xl bg-white border border-purple-200/80 shadow-xs space-y-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 size={16} className="text-purple-600" />
            <span>Automotive Oils Rank vs. Estimated Monthly Unit Turnover</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Derived directly from live scraped Amazon {cfg.countryName} Automotive Oils Best Sellers Ranks
          </p>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e9d5ff" opacity={0.8} />
              <XAxis
                type="number"
                dataKey="bsr"
                name="Oils Rank"
                stroke="#64748b"
                tick={{ fontSize: 11, fill: '#475569' }}
                domain={['auto', 'auto']}
                label={{ value: 'Best Seller Rank in Automotive Oils (Lower = Better)', position: 'insideBottom', offset: -5, fill: '#64748b', fontSize: 11 }}
              />
              <YAxis
                type="number"
                dataKey="sales"
                name="Monthly Sales"
                stroke="#64748b"
                tick={{ fontSize: 11, fill: '#475569' }}
                domain={['auto', 'auto']}
                label={{ value: 'Est. Units / Mo', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 11 }}
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
                formatter={(val: any, name: any) => [
                  name === 'Monthly Sales' ? `${val.toLocaleString()} bottles` : `#${val}`,
                  name,
                ]}
              />
              <Scatter name="Engine Oils" data={scatterData} fill="#7c3aed" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Engine Oil Leaderboard Table */}
      <div className="rounded-xl border border-purple-200/80 bg-white overflow-x-auto shadow-xs">
        <div className="p-4 border-b border-purple-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">
            Engine Oil Sales &amp; Litre Volume Leaderboard (Amazon {marketplace})
          </h2>
          <span className="text-xs text-purple-700 font-mono">Ranked by Monthly Unit Volume</span>
        </div>

        <table className="w-full text-xs text-left">
          <thead className="bg-purple-50/80 text-purple-900 border-b border-purple-200">
            <tr>
              <th className="py-3 px-4 font-semibold">Engine Oil / ASIN</th>
              <th className="py-3 px-3 font-semibold">Brand</th>
              <th className="py-3 px-3 font-semibold">Viscosity</th>
              <th className="py-3 px-3 font-semibold">Pack</th>
              <th className="py-3 px-3 text-right font-bold text-purple-700">Monthly Bottles</th>
              <th className="py-3 px-3 text-right font-bold text-purple-700">Monthly Litres</th>
              <th className="py-3 px-3 text-right font-bold text-slate-900">Monthly Revenue</th>
              <th className="py-3 px-3 text-right font-semibold">Growth MoM</th>
              <th className="py-3 px-3 font-semibold">Amazon {marketplace} Link</th>
              <th className="py-3 px-4 text-center font-semibold">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-purple-100 bg-white">
            {sortedBySales.map((p) => (
              <tr key={p.asin} className="hover:bg-purple-50/40 transition-colors">
                <td className="py-3 px-4 max-w-sm">
                  <div
                    onClick={() => onSelectProduct(p)}
                    className="font-medium text-slate-900 truncate hover:text-purple-700 cursor-pointer"
                  >
                    {p.title}
                  </div>
                  <div className="text-[11px] font-mono text-slate-500">
                    <code>{p.asin}</code> · #{p.bsr} BSR · {p.estDailySales}/day
                  </div>
                </td>
                <td className="py-3 px-3 font-semibold text-purple-700">{p.brand}</td>
                <td className="py-3 px-3 font-mono font-bold text-purple-800">{p.viscosity}</td>
                <td className="py-3 px-3 font-mono text-slate-700">{p.volumeLiters}L</td>
                <td className="py-3 px-3 text-right font-mono font-bold text-purple-700">
                  {p.estMonthlySales.toLocaleString()}
                </td>
                <td className="py-3 px-3 text-right font-mono font-bold text-purple-800">
                  {(p.estMonthlySales * p.volumeLiters).toLocaleString()} L
                </td>
                <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                  {formatMoney(Math.round(p.estMonthlyRevenueAud), cfg.currency, 0, true)}
                </td>
                <td
                  className={`py-3 px-3 text-right font-mono font-semibold ${
                    p.salesGrowthPct > 15 ? 'text-emerald-700' : 'text-slate-600'
                  }`}
                >
                  +{p.salesGrowthPct.toFixed(1)}%
                </td>
                <td className="py-3 px-3">
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
                <td className="py-3 px-4 text-center">
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
    </div>
  );
};
