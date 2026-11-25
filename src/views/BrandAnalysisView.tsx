import React from 'react';
import {
  Award,
  DollarSign,
  TrendingUp,
  Percent,
  CheckCircle2,
  BarChart3,
  Droplet,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { BrandIntelligence, MarketplaceCode } from '../types/automotive';
import { formatMoney, getMpConfig } from '../utils/marketplace';

interface BrandAnalysisViewProps {
  brands: BrandIntelligence[];
  marketplace?: MarketplaceCode;
}

export const BrandAnalysisView: React.FC<BrandAnalysisViewProps> = ({
  brands,
  marketplace = 'AU',
}) => {
  const cfg = getMpConfig(marketplace);
  const sortedByRevenue = [...brands].sort((a, b) => b.totalEstRevenueAud - a.totalEstRevenueAud);
  const totalBrandRevenue = brands.reduce((acc, b) => acc + b.totalEstRevenueAud, 0);
  const totalBrandLiters = brands.reduce((acc, b) => acc + b.totalEstMonthlyLiters, 0);

  const pieData = brands.slice(0, 6).map((b) => ({
    name: b.name,
    value: b.marketSharePct,
  }));

  const COLORS = ['#6d28d9', '#7c3aed', '#9333ea', '#a855f7', '#c084fc', '#4c1d95'];

  return (
    <div className="space-y-6">
      {/* Brand Header Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-white border border-purple-200/80 shadow-xs">
          <div className="text-[11px] font-medium text-slate-500">Motor Oil Brands Tracked</div>
          <div className="text-xl font-bold font-mono tabular-nums text-slate-900 mt-0.5">
            {brands.length} Key Brands
          </div>
          <div className="text-[10px] text-purple-700 font-medium mt-1 truncate">
            {brands.slice(0, 4).map((b) => b.name).join(', ') || `${cfg.domain} Live`}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-purple-200/80 shadow-xs">
          <div className="text-[11px] font-medium text-slate-500">Total Monthly Litres</div>
          <div className="text-xl font-bold font-mono tabular-nums text-purple-700 mt-0.5">
            {(totalBrandLiters / 1000).toFixed(1)}k Litres
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Est. Volume Across Scraped SKUs</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-purple-200/80 shadow-xs">
          <div className="text-[11px] font-medium text-slate-500">Engine Oil GMV Monitored</div>
          <div className="text-xl font-bold font-mono tabular-nums text-emerald-700 mt-0.5">
            {formatMoney(totalBrandRevenue / 1000, cfg.currency, 0)}k {cfg.currency}
          </div>
          <div className="text-[10px] text-emerald-700 mt-1">Est. Monthly Gross Value</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-purple-200/80 shadow-xs">
          <div className="text-[11px] font-medium text-slate-500">Avg Benchmark {cfg.currencySymbol}/Litre</div>
          <div className="text-xl font-bold font-mono tabular-nums text-purple-700 mt-0.5">
            {(() => {
              const priced = brands.filter((b) => b.avgPricePerLiterAud > 0);
              const avg =
                priced.length > 0
                  ? priced.reduce((acc, b) => acc + b.avgPricePerLiterAud, 0) / priced.length
                  : 0;
              return `${formatMoney(avg, cfg.currency)}/L`;
            })()}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Live Scraped {cfg.currency} Average</div>
        </div>
      </div>

      {/* Brand Market Share & Positioning Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Brand Revenue Bar Chart */}
        <div className="lg:col-span-8 p-5 rounded-xl bg-white border border-purple-200/80 shadow-xs space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Droplet size={16} className="text-purple-600" />
              <span>Top Engine Oil Brands by Estimated Monthly Revenue ({cfg.currency})</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Turnover estimates across Amazon {cfg.countryName} motor oil listings
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={sortedByRevenue.map((b) => ({
                  name: b.name,
                  revenue: Math.round(b.totalEstRevenueAud / 1000),
                }))}
                margin={{ top: 10, right: 10, left: 0, bottom: 25 }}
              >
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
                  tickFormatter={(val) =>
                    cfg.currency === 'PLN' ? `${val}k zł` : `${cfg.currencySymbol}${val}k`
                  }
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
                  formatter={(val: any) => [`${formatMoney(Number(val), cfg.currency, 0)}k ${cfg.currency}`, 'Est. Monthly Revenue']}
                />
                <Bar dataKey="revenue" fill="#7c3aed" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Market Share Pie */}
        <div className="lg:col-span-4 p-5 rounded-xl bg-white border border-purple-200/80 shadow-xs space-y-3 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Market Share Volume</h2>
            <p className="text-xs text-slate-500 mt-0.5">Top engine oil brands on Amazon {cfg.code}</p>
          </div>

          <div className="h-52 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#d8b4fe',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#0f172a',
                    boxShadow: '0 4px 12px rgba(109, 40, 217, 0.08)',
                  }}
                  formatter={(val: any) => [`${val}%`, 'Market Share']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1 text-xs">
            {pieData.slice(0, 4).map((entry, idx) => (
              <div key={entry.name} className="flex items-center justify-between text-slate-700">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                  />
                  <span>{entry.name}</span>
                </div>
                <span className="font-mono text-purple-800 font-bold">{entry.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Brand Intelligence Table */}
      <div className="rounded-xl border border-purple-200/80 bg-white overflow-x-auto shadow-xs">
        <table className="w-full text-xs text-left">
          <thead className="bg-purple-50/80 text-purple-900 border-b border-purple-200">
            <tr>
              <th className="py-3 px-4 font-semibold">Brand Name</th>
              <th className="py-3 px-3 font-semibold">Heritage / Origin</th>
              <th className="py-3 px-3 font-semibold">Tier</th>
              <th className="py-3 px-3 text-right font-semibold">Avg Bottle Price</th>
              <th className="py-3 px-3 text-right font-bold text-purple-700">Avg {cfg.currencySymbol}/Litre</th>
              <th className="py-3 px-3 text-right font-semibold">Avg Rating</th>
              <th className="py-3 px-3 text-right font-semibold">Est. Mo. Litres</th>
              <th className="py-3 px-3 text-right font-semibold">Est. Mo. Revenue</th>
              <th className="py-3 px-3 text-right font-semibold">Market Share</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-purple-100 bg-white">
            {sortedByRevenue.map((b) => (
              <tr key={b.id} className="hover:bg-purple-50/40 transition-colors">
                <td className="py-3 px-4 font-bold text-purple-700 flex items-center gap-1.5">
                  <span>{b.name}</span>
                  {b.australianFormulated && (
                    <span className="text-[10px] font-sans font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1 py-0.2 rounded">
                      AU Made
                    </span>
                  )}
                </td>
                <td className="py-3 px-3 text-slate-700">{b.origin}</td>
                <td className="py-3 px-3">
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-purple-50 text-purple-800 border border-purple-200">
                    {b.marketTier}
                  </span>
                </td>
                <td className="py-3 px-3 text-right font-mono font-medium text-slate-900">
                  {b.avgPriceAud > 0 ? formatMoney(b.avgPriceAud, cfg.currency) : '—'}
                </td>
                <td className="py-3 px-3 text-right font-mono font-bold text-purple-700">
                  {b.avgPricePerLiterAud > 0 ? `${formatMoney(b.avgPricePerLiterAud, cfg.currency)}/L` : '—'}
                </td>
                <td className="py-3 px-3 text-right font-mono text-purple-700 font-semibold">
                  ★ {b.avgRating.toFixed(2)}
                </td>
                <td className="py-3 px-3 text-right font-mono text-purple-700 font-bold">
                  {(b.totalEstMonthlyLiters / 1000).toFixed(0)}k L
                </td>
                <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                  {formatMoney(Math.round(b.totalEstRevenueAud), cfg.currency, 0, true)}
                </td>
                <td className="py-3 px-3 text-right font-mono font-bold text-purple-700">
                  {b.marketSharePct.toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
