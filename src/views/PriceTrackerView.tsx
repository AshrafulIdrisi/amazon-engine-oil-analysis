import React, { useState } from 'react';
import {
  TrendingDown,
  TrendingUp,
  Tag,
  ArrowDownRight,
  ExternalLink,
  Calendar,
  Sparkles,
  Droplet,
} from 'lucide-react';
import { AutomotiveProduct, MarketplaceCode } from '../types/automotive';
import { formatMoney, getMpConfig, shortDomain } from '../utils/marketplace';

interface PriceTrackerViewProps {
  products: AutomotiveProduct[];
  marketplace?: MarketplaceCode;
  onSelectProduct: (product: AutomotiveProduct) => void;
}

export const PriceTrackerView: React.FC<PriceTrackerViewProps> = ({
  products,
  marketplace = 'AU',
  onSelectProduct,
}) => {
  const cfg = getMpConfig(marketplace);
  const domain = shortDomain(marketplace);
  const [filterType, setFilterType] = useState<'all' | 'all-time-low' | 'drops' | 'coupons'>('all');

  const trackedItems = products.filter((p) => {
    if (filterType === 'all-time-low') {
      return p.currentPriceAud > 0 && p.currentPriceAud <= p.lowestPriceAud + 1.0;
    }
    if (filterType === 'drops') {
      return p.discountPct >= 15;
    }
    if (filterType === 'coupons') {
      return p.hasCoupon;
    }
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-white border border-purple-200/80 shadow-xs">
          <div className="text-[11px] font-medium text-slate-500">Total Monitored Oils</div>
          <div className="text-xl font-bold font-mono tabular-nums text-slate-900 mt-0.5">
            {products.length} SKUs
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Amazon {marketplace} Buy Box Polling</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-purple-200/80 shadow-xs">
          <div className="text-[11px] font-medium text-slate-500">Active Oil Price Drops (&gt;15%)</div>
          <div className="text-xl font-bold font-mono tabular-nums text-emerald-700 mt-0.5">
            {products.filter((p) => p.discountPct >= 15).length}
          </div>
          <div className="text-[10px] text-emerald-700 mt-1">Below List MSRP</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-purple-200/80 shadow-xs">
          <div className="text-[11px] font-medium text-slate-500">At All-Time Low ({cfg.currencySymbol}/Litre)</div>
          <div className="text-xl font-bold font-mono tabular-nums text-purple-700 mt-0.5">
            {products.filter((p) => p.currentPriceAud > 0 && p.currentPriceAud <= p.lowestPriceAud + 1.0).length}
          </div>
          <div className="text-[10px] text-purple-600 mt-1">Best Historical Value</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-purple-200/80 shadow-xs">
          <div className="text-[11px] font-medium text-slate-500">Digital Clip Vouchers</div>
          <div className="text-xl font-bold font-mono tabular-nums text-purple-700 mt-0.5">
            {products.filter((p) => p.hasCoupon).length}
          </div>
          <div className="text-[10px] text-purple-600 mt-1">Amazon {marketplace} Clip Vouchers</div>
        </div>
      </div>

      {/* Segmented Filter Bar */}
      <div className="flex flex-wrap items-center gap-1 p-1 bg-purple-50 border border-purple-200 rounded-lg w-fit text-xs font-medium">
        <button
          onClick={() => setFilterType('all')}
          className={`px-3 py-1.5 rounded transition-colors ${
            filterType === 'all'
              ? 'bg-purple-600 text-white font-bold shadow-xs'
              : 'text-slate-600 hover:text-purple-900'
          }`}
        >
          All Monitored Oils
        </button>
        <button
          onClick={() => setFilterType('drops')}
          className={`px-3 py-1.5 rounded transition-colors ${
            filterType === 'drops'
              ? 'bg-purple-600 text-white font-bold shadow-xs'
              : 'text-slate-600 hover:text-purple-900'
          }`}
        >
          Active Price Drops (&gt;15%)
        </button>
        <button
          onClick={() => setFilterType('all-time-low')}
          className={`px-3 py-1.5 rounded transition-colors ${
            filterType === 'all-time-low'
              ? 'bg-purple-600 text-white font-bold shadow-xs'
              : 'text-slate-600 hover:text-purple-900'
          }`}
        >
          All-Time Lows ({cfg.currency})
        </button>
        <button
          onClick={() => setFilterType('coupons')}
          className={`px-3 py-1.5 rounded transition-colors ${
            filterType === 'coupons'
              ? 'bg-purple-600 text-white font-bold shadow-xs'
              : 'text-slate-600 hover:text-purple-900'
          }`}
        >
          Clip Coupons
        </button>
      </div>

      {/* Price Tracker Table */}
      <div className="rounded-xl border border-purple-200/80 bg-white overflow-x-auto shadow-xs">
        <table className="w-full text-xs text-left">
          <thead className="bg-purple-50/80 text-purple-900 border-b border-purple-200">
            <tr>
              <th className="py-3 px-4 font-semibold">Engine Oil / ASIN</th>
              <th className="py-3 px-3 font-semibold">Brand</th>
              <th className="py-3 px-3 font-semibold">Viscosity</th>
              <th className="py-3 px-3 font-semibold">Volume</th>
              <th className="py-3 px-3 text-right font-semibold">Current Price</th>
              <th className="py-3 px-3 text-right font-bold text-purple-700">Current $/L</th>
              <th className="py-3 px-3 text-right font-semibold">Lowest Obs.</th>
              <th className="py-3 px-3 text-right font-semibold">Discount</th>
              <th className="py-3 px-3 text-center font-semibold">Promotions</th>
              <th className="py-3 px-3 font-semibold">Amazon {marketplace} Link</th>
              <th className="py-3 px-4 text-center font-semibold">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-purple-100 bg-white">
            {trackedItems.map((p) => {
              const isAtLow = p.currentPriceAud > 0 && p.currentPriceAud <= p.lowestPriceAud + 1.0;
              return (
                <tr key={p.asin} className="hover:bg-purple-50/40 transition-colors">
                  <td className="py-3 px-4 max-w-sm">
                    <div
                      onClick={() => onSelectProduct(p)}
                      className="font-medium text-slate-900 truncate hover:text-purple-700 cursor-pointer"
                    >
                      {p.title}
                    </div>
                    <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                      ASIN: {p.asin} · {p.apiStandard}
                    </div>
                  </td>
                  <td className="py-3 px-3 font-semibold text-purple-700">{p.brand}</td>
                  <td className="py-3 px-3 font-mono font-bold text-purple-800">{p.viscosity}</td>
                  <td className="py-3 px-3 font-mono text-slate-700">{p.volumeLiters}L</td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                    {p.currentPriceAud > 0 ? (
                      <div className="flex items-center justify-end gap-1">
                        {isAtLow && (
                          <span className="text-[10px] text-purple-800 bg-purple-100 border border-purple-200 px-1 py-0.2 rounded font-sans font-semibold">
                            LOW
                          </span>
                        )}
                        <span>{formatMoney(p.currentPriceAud, cfg.currency, 2, true)}</span>
                      </div>
                    ) : (
                      <span className="text-[11px] font-medium text-rose-600">
                        {p.availability || 'No Buy Box'}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-purple-700">
                    {p.pricePerLiterAud > 0 ? `${formatMoney(p.pricePerLiterAud, cfg.currency)}/L` : '—'}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-emerald-700 font-semibold">
                    {p.lowestPriceAud > 0 ? formatMoney(p.lowestPriceAud, cfg.currency) : '—'}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-emerald-700 font-bold">
                    {p.discountPct > 0 ? `-${p.discountPct.toFixed(1)}%` : '0%'}
                  </td>
                  <td className="py-3 px-3 text-center">
                    {p.hasCoupon ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-purple-100 text-purple-800 border border-purple-200">
                        <Tag size={10} />
                        <span>{cfg.currencySymbol}{p.couponValueAud} Coupon</span>
                      </span>
                    ) : p.dealBadge ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-purple-50 text-purple-700 border border-purple-200">
                        {p.dealBadge}
                      </span>
                    ) : (
                      <span className="text-slate-500 font-mono text-[11px]">Regular</span>
                    )}
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
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
