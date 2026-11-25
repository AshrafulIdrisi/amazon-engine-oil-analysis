import React, { useState } from 'react';
import {
  Download,
  Copy,
  Check,
  Eye,
  ExternalLink,
  Link2,
} from 'lucide-react';
import { AutomotiveProduct, MarketplaceCode } from '../types/automotive';
import { formatMoney, getMpConfig, shortDomain } from '../utils/marketplace';

interface DatabaseViewProps {
  products: AutomotiveProduct[];
  marketplace?: MarketplaceCode;
  onSelectProduct: (product: AutomotiveProduct) => void;
  onToggleTrack: (asin: string) => void;
  onOpenExportModal: () => void;
}

export const DatabaseView: React.FC<DatabaseViewProps> = ({
  products,
  marketplace = 'AU',
  onSelectProduct,
  onToggleTrack: _onToggleTrack,
  onOpenExportModal,
}) => {
  const cfg = getMpConfig(marketplace);
  const domain = shortDomain(marketplace);
  const [selectedAsins, setSelectedAsins] = useState<string[]>([]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [stockFilter, setStockFilter] = useState<'all' | 'in-stock' | 'out-of-stock'>('all');

  const visibleProducts = products.filter((p) => {
    if (stockFilter === 'in-stock') return p.inStock;
    if (stockFilter === 'out-of-stock') return !p.inStock;
    return true;
  });

  const handleCopy = (value: string, key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(value);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const toggleSelectAll = () => {
    if (selectedAsins.length === visibleProducts.length) {
      setSelectedAsins([]);
    } else {
      setSelectedAsins(visibleProducts.map((p) => p.asin));
    }
  };

  const toggleSelectRow = (asin: string) => {
    if (selectedAsins.includes(asin)) {
      setSelectedAsins(selectedAsins.filter((id) => id !== asin));
    } else {
      setSelectedAsins([...selectedAsins, asin]);
    }
  };

  const inStockCount = products.filter((p) => p.inStock).length;
  const outOfStockCount = products.length - inStockCount;

  return (
    <div className="space-y-4">
      {/* Table Toolbar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 p-3.5 rounded-xl bg-white border border-purple-200/80 shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-semibold text-slate-900">
            {visibleProducts.length} of {products.length} Engine Oils (AU Catalog)
          </span>
          <span className="text-xs text-purple-300">·</span>
          <div className="flex items-center p-0.5 rounded-lg bg-purple-50 border border-purple-200 text-[11px]">
            <button
              onClick={() => setStockFilter('all')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                stockFilter === 'all' ? 'bg-purple-600 text-white font-semibold' : 'text-slate-600 hover:text-purple-800'
              }`}
            >
              All ({products.length})
            </button>
            <button
              onClick={() => setStockFilter('in-stock')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                stockFilter === 'in-stock' ? 'bg-purple-600 text-white font-semibold' : 'text-slate-600 hover:text-purple-800'
              }`}
            >
              In Stock ({inStockCount})
            </button>
            <button
              onClick={() => setStockFilter('out-of-stock')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                stockFilter === 'out-of-stock' ? 'bg-purple-600 text-white font-semibold' : 'text-slate-600 hover:text-purple-800'
              }`}
            >
              Out of Stock ({outOfStockCount})
            </button>
          </div>
          <span className="text-xs text-purple-700 font-medium">
            {selectedAsins.length} Selected
          </span>
        </div>

        <div className="flex items-center gap-2">
          {selectedAsins.length > 0 && (
            <button
              onClick={onOpenExportModal}
              className="px-3 py-1.5 rounded-lg bg-purple-100 text-purple-800 border border-purple-300 text-xs font-semibold hover:bg-purple-200 transition-colors"
            >
              Export Selected ({selectedAsins.length})
            </button>
          )}

          <button
            onClick={onOpenExportModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-xs font-semibold text-white transition-colors shadow-xs"
          >
            <Download size={13} />
            <span>Export Oil Database</span>
          </button>
        </div>
      </div>

      {/* Main High-Density Table */}
      <div className="rounded-xl border border-purple-200/80 bg-white overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-purple-50/80 text-purple-900 border-b border-purple-200">
              <tr>
                <th className="py-3 px-3 w-8">
                  <input
                    type="checkbox"
                    checked={selectedAsins.length === visibleProducts.length && visibleProducts.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-purple-300 accent-purple-600"
                  />
                </th>
                <th className="py-3 px-3 font-semibold">ASIN & Part #</th>
                <th className="py-3 px-4 font-semibold">Engine Oil Title & Specs</th>
                <th className="py-3 px-3 font-semibold">Stock &amp; Seller ({marketplace})</th>
                <th className="py-3 px-3 font-semibold">Brand / API &amp; ACEA</th>
                <th className="py-3 px-3 font-semibold">Viscosity</th>
                <th className="py-3 px-3 font-semibold">Volume</th>
                <th className="py-3 px-3 text-right font-bold text-purple-700">{cfg.currencySymbol}/Litre</th>
                <th className="py-3 px-3 text-right font-semibold">Price ({cfg.currency})</th>
                <th className="py-3 px-3 text-right font-semibold">Discount</th>
                <th className="py-3 px-3 text-right font-semibold">Est. Mo. Sales</th>
                <th className="py-3 px-3 text-right font-semibold">BSR</th>
                <th className="py-3 px-3 text-right font-semibold">Rating</th>
                <th className="py-3 px-3 text-right font-semibold">Score</th>
                <th className="py-3 px-3 font-semibold">Amazon {marketplace} Product Link</th>
                <th className="py-3 px-3 text-center font-semibold">All Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-100 bg-white">
              {visibleProducts.map((p) => {
                const isSelected = selectedAsins.includes(p.asin);
                return (
                  <tr
                    key={p.asin}
                    className={`hover:bg-purple-50/40 transition-colors ${
                      isSelected ? 'bg-purple-50' : ''
                    }`}
                  >
                    <td className="py-2.5 px-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectRow(p.asin)}
                        className="rounded border-purple-300 accent-purple-600"
                      />
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-700">
                      <div className="flex items-center gap-1.5">
                        <span>{p.asin}</span>
                        <button
                          onClick={(e) => handleCopy(p.asin, `asin-${p.asin}`, e)}
                          className="text-slate-400 hover:text-purple-700"
                          title="Copy ASIN"
                        >
                          {copiedKey === `asin-${p.asin}` ? (
                            <Check size={12} className="text-emerald-600" />
                          ) : (
                            <Copy size={12} />
                          )}
                        </button>
                      </div>
                      {p.partNumber && (
                        <div className="text-[10px] text-purple-700 truncate max-w-[110px]" title={`Part #: ${p.partNumber}`}>
                          #{p.partNumber}
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-4 max-w-sm">
                      <div
                        onClick={() => onSelectProduct(p)}
                        className="font-medium text-slate-900 truncate hover:text-purple-700 cursor-pointer"
                      >
                        {p.title}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate mt-0.5">
                        {p.oilType} · {p.engineCompatibility}
                        {p.itemWeight ? ` · ${p.itemWeight}` : ''}
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold border whitespace-nowrap ${
                          !p.inStock
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : p.availability === 'Buying Options Only' ||
                              p.availability === 'Low Stock' ||
                              p.availability === 'Only 2 Left'
                            ? 'bg-purple-100 text-purple-800 border-purple-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}
                        title={p.availabilityDetail || p.availability}
                      >
                        {p.stockQuantityLeft ? `Only ${p.stockQuantityLeft} Left` : p.availability}
                      </span>
                      <div className="text-[10px] text-slate-500 truncate max-w-[130px] mt-0.5">
                        {p.soldBy || `Amazon ${marketplace}`}
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-purple-700">{p.brand}</div>
                      <div className="text-[10px] font-mono text-slate-500 truncate max-w-[140px]">
                        {p.apiStandard} · {p.aceaStandard}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-purple-800">{p.viscosity}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-700">{p.volumeLiters}L</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-purple-700">
                      {p.pricePerLiterAud > 0 ? `${formatMoney(p.pricePerLiterAud, cfg.currency)}/L` : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                      {p.currentPriceAud > 0 ? (
                        <>
                          <div>{formatMoney(p.currentPriceAud, cfg.currency)}</div>
                          {p.originalPriceAud > p.currentPriceAud && (
                            <div className="text-[10px] text-slate-400 line-through font-normal">
                              {formatMoney(p.originalPriceAud, cfg.currency)}
                            </div>
                          )}
                        </>
                      ) : (
                        <span className="text-[11px] text-rose-700">No Buy Box</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-700 font-semibold">
                      {p.discountPct > 0 ? `-${p.discountPct.toFixed(1)}%` : '0%'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-800 font-medium">
                      <div>{p.estMonthlySales.toLocaleString()}</div>
                      <div className="text-[10px] text-slate-500">
                        {cfg.currencySymbol}{Math.round(p.estMonthlyRevenueAud / 1000)}k {cfg.currency}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-600">#{p.bsr}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-purple-700 font-semibold">
                      <div>★ {p.rating.toFixed(2)}</div>
                      <div className="text-[10px] text-slate-500 font-normal">
                        ({p.reviewCount.toLocaleString()})
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-purple-700">
                      {p.opportunity.overallScore}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1.5 whitespace-nowrap">
                        <a
                          href={p.productUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-mono text-[11px] text-purple-700 hover:text-purple-900 underline"
                          title={p.productUrl}
                        >
                          <Link2 size={11} />
                          <span>{domain}/dp/{p.asin}</span>
                          <ExternalLink size={10} />
                        </a>
                        <button
                          onClick={(e) => handleCopy(p.productUrl, `url-${p.asin}`, e)}
                          className="text-slate-400 hover:text-purple-700 p-0.5"
                          title="Copy Product Link"
                        >
                          {copiedKey === `url-${p.asin}` ? (
                            <Check size={12} className="text-emerald-600" />
                          ) : (
                            <Copy size={12} />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => onSelectProduct(p)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-purple-600 hover:bg-purple-700 text-[11px] font-medium text-white transition-colors whitespace-nowrap"
                        title="View Full Engine Oil Snapshot"
                      >
                        <Eye size={12} />
                        <span>Details</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
