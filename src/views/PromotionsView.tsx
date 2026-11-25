import React, { useState } from 'react';
import {
  Tag,
  Zap,
  RotateCcw,
  Clock,
  Sparkles,
  ExternalLink,
  Percent,
  Droplet,
} from 'lucide-react';
import { AutomotiveProduct, MarketplaceCode } from '../types/automotive';
import { formatMoney, getMpConfig, shortDomain } from '../utils/marketplace';

interface PromotionsViewProps {
  products: AutomotiveProduct[];
  marketplace?: MarketplaceCode;
  onSelectProduct: (product: AutomotiveProduct) => void;
}

export const PromotionsView: React.FC<PromotionsViewProps> = ({
  products,
  marketplace = 'AU',
  onSelectProduct,
}) => {
  const [filter, setFilter] = useState<'all' | 'coupons' | 'subscribe'>('all');
  const cfg = getMpConfig(marketplace);
  const domainShort = shortDomain(marketplace);

  const promoProducts = products.filter((p) => {
    if (filter === 'coupons') return p.hasCoupon;
    if (filter === 'subscribe') return p.subscribeAndSave;
    return p.hasCoupon || p.isLightningDeal || p.discountPct >= 15 || p.subscribeAndSave;
  });

  return (
    <div className="space-y-5">
      {/* Promotion KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-white border border-purple-200/80 shadow-xs">
          <div className="text-[11px] font-medium text-slate-500">Total Active Oil Deals</div>
          <div className="text-xl font-bold font-mono tabular-nums text-purple-700 mt-0.5">
            {products.filter((p) => p.hasCoupon || p.discountPct >= 15).length} SKUs
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Across {cfg.countryName} Motor Oil Catalog</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-purple-200/80 shadow-xs">
          <div className="text-[11px] font-medium text-slate-500">Digital Clip Coupons ({cfg.currency})</div>
          <div className="text-xl font-bold font-mono tabular-nums text-purple-700 mt-0.5">
            {products.filter((p) => p.hasCoupon).length} Vouchers
          </div>
          <div className="text-[10px] text-purple-600 mt-1">Clip Vouchers on 5L/10L Bottles</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-purple-200/80 shadow-xs">
          <div className="text-[11px] font-medium text-slate-500">Subscribe & Save Enabled</div>
          <div className="text-xl font-bold font-mono tabular-nums text-emerald-700 mt-0.5">
            {products.filter((p) => p.subscribeAndSave).length} SKUs
          </div>
          <div className="text-[10px] text-emerald-700 mt-1">10% - 15% Repeat Service Savings</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-purple-200/80 shadow-xs">
          <div className="text-[11px] font-medium text-slate-500">Average Oil Discount</div>
          <div className="text-xl font-bold font-mono tabular-nums text-emerald-700 mt-0.5">
            {(() => {
              const priced = products.filter((p) => p.currentPriceAud > 0);
              return priced.length > 0
                ? (priced.reduce((acc, p) => acc + p.discountPct, 0) / priced.length).toFixed(1)
                : '0.0';
            })()}
            % OFF
          </div>
          <div className="text-[10px] text-emerald-700 mt-1">Live Scraped List vs Buy Box</div>
        </div>
      </div>

      {/* Segmented Filter Control */}
      <div className="flex flex-wrap items-center gap-1 p-1 bg-purple-50 border border-purple-200 rounded-lg w-fit text-xs font-medium">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded transition-colors ${
            filter === 'all'
              ? 'bg-purple-600 text-white font-bold shadow-xs'
              : 'text-slate-600 hover:text-purple-900'
          }`}
        >
          All Active Promotions
        </button>
        <button
          onClick={() => setFilter('coupons')}
          className={`px-3 py-1.5 rounded transition-colors ${
            filter === 'coupons'
              ? 'bg-purple-600 text-white font-bold shadow-xs'
              : 'text-slate-600 hover:text-purple-900'
          }`}
        >
          Digital Vouchers ({cfg.currency})
        </button>
        <button
          onClick={() => setFilter('subscribe')}
          className={`px-3 py-1.5 rounded transition-colors ${
            filter === 'subscribe'
              ? 'bg-purple-600 text-white font-bold shadow-xs'
              : 'text-slate-600 hover:text-purple-900'
          }`}
        >
          Subscribe & Save (Consumable Oil Changes)
        </button>
      </div>

      {/* Promotions Product Table */}
      <div className="rounded-xl border border-purple-200/80 bg-white overflow-x-auto shadow-xs">
        <table className="w-full text-xs text-left">
          <thead className="bg-purple-50/80 text-purple-900 border-b border-purple-200">
            <tr>
              <th className="py-3 px-4 font-semibold">Engine Oil / ASIN</th>
              <th className="py-3 px-3 font-semibold">Brand</th>
              <th className="py-3 px-3 font-semibold">Viscosity</th>
              <th className="py-3 px-3 font-semibold">Promotion Type</th>
              <th className="py-3 px-3 text-right font-semibold">Regular Price</th>
              <th className="py-3 px-3 text-right font-semibold">Deal Price ({cfg.currency})</th>
              <th className="py-3 px-3 text-right font-bold text-purple-700">Deal {cfg.currencySymbol}/Litre</th>
              <th className="py-3 px-3 text-center font-semibold">Subscribe & Save</th>
              <th className="py-3 px-3 font-semibold">Amazon {cfg.code} Link</th>
              <th className="py-3 px-4 text-center font-semibold">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-purple-100 bg-white">
            {promoProducts.map((p) => (
              <tr key={p.asin} className="hover:bg-purple-50/40 transition-colors">
                <td className="py-3 px-4 max-w-sm">
                  <div
                    onClick={() => onSelectProduct(p)}
                    className="font-medium text-slate-900 truncate hover:text-purple-700 cursor-pointer"
                  >
                    {p.title}
                  </div>
                  <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                    <code>{p.asin}</code> · {p.volumeLiters}L {p.oilType}
                  </div>
                </td>
                <td className="py-3 px-3 font-semibold text-purple-700">{p.brand}</td>
                <td className="py-3 px-3 font-mono font-bold text-purple-800">{p.viscosity}</td>
                <td className="py-3 px-3">
                  {p.hasCoupon ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-purple-100 text-purple-800 border border-purple-200">
                      <Tag size={10} />
                      <span>{formatMoney(p.couponValueAud || 0, cfg.currency, 2, true)} Coupon</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-purple-50 text-purple-700 border border-purple-200">
                      {p.dealBadge || 'Price Discount'}
                    </span>
                  )}
                </td>
                <td className="py-3 px-3 text-right font-mono text-slate-400 line-through">
                  {p.originalPriceAud > p.currentPriceAud ? formatMoney(p.originalPriceAud, cfg.currency) : '—'}
                </td>
                <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700">
                  {p.currentPriceAud > 0 ? formatMoney(p.currentPriceAud, cfg.currency, 2, true) : p.availability}
                </td>
                <td className="py-3 px-3 text-right font-mono font-bold text-purple-700">
                  {p.pricePerLiterAud > 0 ? `${formatMoney(p.pricePerLiterAud, cfg.currency)}/L` : '—'}
                </td>
                <td className="py-3 px-3 text-center">
                  {p.subscribeAndSave ? (
                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                      <RotateCcw size={11} />
                      <span>10% - 15% Off</span>
                    </span>
                  ) : (
                    <span className="text-slate-400 text-[11px] font-mono">No</span>
                  )}
                </td>
                <td className="py-3 px-3">
                  <a
                    href={p.productUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-mono text-[11px] text-purple-700 hover:text-purple-900 underline whitespace-nowrap"
                  >
                    <span>{domainShort}/dp/{p.asin}</span>
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
