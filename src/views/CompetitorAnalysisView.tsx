import React, { useState, useEffect } from 'react';
import {
  Swords,
  TrendingDown,
  Star,
  ExternalLink,
  Plus,
  Trash2,
  Droplet,
} from 'lucide-react';
import { AutomotiveProduct, MarketplaceCode } from '../types/automotive';
import { formatMoney, getMpConfig, shortDomain } from '../utils/marketplace';

interface CompetitorAnalysisViewProps {
  products: AutomotiveProduct[];
  marketplace?: MarketplaceCode;
  onSelectProduct: (product: AutomotiveProduct) => void;
}

export const CompetitorAnalysisView: React.FC<CompetitorAnalysisViewProps> = ({
  products,
  marketplace = 'AU',
  onSelectProduct,
}) => {
  const cfg = getMpConfig(marketplace);
  const domainShort = shortDomain(marketplace);

  const [selectedAsins, setSelectedAsins] = useState<string[]>(() =>
    products.slice(0, 3).map((p) => p.asin)
  );

  useEffect(() => {
    if (products.length > 0 && selectedAsins.every((a) => !products.some((p) => p.asin === a))) {
      setSelectedAsins(products.slice(0, 3).map((p) => p.asin));
    }
  }, [products, selectedAsins]);

  const selectedProducts = products.filter((p) => selectedAsins.includes(p.asin));

  const handleAddAsin = (asin: string) => {
    if (!selectedAsins.includes(asin) && selectedAsins.length < 4) {
      setSelectedAsins([...selectedAsins, asin]);
    }
  };

  const handleRemoveAsin = (asin: string) => {
    if (selectedAsins.length > 1) {
      setSelectedAsins(selectedAsins.filter((id) => id !== asin));
    }
  };

  return (
    <div className="space-y-6">
      {/* Selector Strip */}
      <div className="p-4 rounded-xl bg-white border border-purple-200/80 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Swords size={16} className="text-purple-600" />
              <span>Head-to-Head Engine Oil Benchmark Tool ({cfg.code})</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Side-by-side comparison of Viscosities, {cfg.currencySymbol}/Litre value, OEM approvals, and calibrated monthly turnover
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-600 font-medium">Add Oil to Compare:</span>
            <select
              onChange={(e) => {
                if (e.target.value) handleAddAsin(e.target.value);
              }}
              value=""
              className="px-2.5 py-1.5 bg-purple-50/50 border border-purple-200 rounded-lg text-slate-900 text-xs focus:outline-none focus:border-purple-600 font-mono"
            >
              <option value="" className="bg-white text-slate-900">+ Select Engine Oil...</option>
              {products
                .filter((p) => !selectedAsins.includes(p.asin))
                .map((p) => (
                  <option key={p.asin} value={p.asin} className="bg-white text-slate-900">
                    {p.brand} {p.viscosity} ({p.volumeLiters}L) - {p.currentPriceAud > 0 ? formatMoney(p.currentPriceAud, cfg.currency) : p.availability}
                  </option>
                ))}
            </select>
          </div>
        </div>
      </div>

      {/* Side-by-Side Comparison Matrix */}
      <div className="rounded-xl border border-purple-200/80 bg-white overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-purple-50/90 text-purple-900 border-b border-purple-200">
              <tr>
                <th className="py-3 px-4 w-52 font-semibold">Engine Oil Attribute</th>
                {selectedProducts.map((p) => (
                  <th key={p.asin} className="py-3 px-4 min-w-[220px]">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-purple-700 text-sm">{p.brand}</span>
                      {selectedProducts.length > 1 && (
                        <button
                          onClick={() => handleRemoveAsin(p.asin)}
                          className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                          title="Remove from comparison"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                    <div className="text-[11px] font-mono text-slate-600 mt-0.5 truncate font-normal">
                      {p.viscosity} · {p.volumeLiters}L · {p.asin}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-100 bg-white">
              {/* Product Title */}
              <tr>
                <td className="py-3 px-4 font-medium text-slate-600">Oil Formula Title</td>
                {selectedProducts.map((p) => (
                  <td key={p.asin} className="py-3 px-4">
                    <span
                      onClick={() => onSelectProduct(p)}
                      className="font-medium text-slate-900 hover:text-purple-700 cursor-pointer line-clamp-2"
                    >
                      {p.title}
                    </span>
                  </td>
                ))}
              </tr>

              {/* Viscosity & Base Oil */}
              <tr className="bg-purple-50/35">
                <td className="py-3 px-4 font-medium text-slate-600">Viscosity & Base Oil</td>
                {selectedProducts.map((p) => (
                  <td key={p.asin} className="py-3 px-4">
                    <span className="font-mono font-bold text-purple-800 text-sm">{p.viscosity}</span>
                    <span className="text-slate-500 text-[11px] block">{p.oilType}</span>
                  </td>
                ))}
              </tr>

              {/* Current Price */}
              <tr>
                <td className="py-3 px-4 font-medium text-slate-600">Current Buy Box ({cfg.currency})</td>
                {selectedProducts.map((p) => (
                  <td key={p.asin} className="py-3 px-4 font-mono font-extrabold text-slate-900 text-sm">
                    {p.currentPriceAud > 0 ? formatMoney(p.currentPriceAud, cfg.currency, 2, true) : (
                      <span className="text-rose-600 text-xs">{p.availability}</span>
                    )}
                  </td>
                ))}
              </tr>

              {/* Price per Litre */}
              <tr className="bg-purple-50/50">
                <td className="py-3 px-4 font-medium text-slate-600">Price per Litre ({cfg.currencySymbol}/L)</td>
                {selectedProducts.map((p) => (
                  <td key={p.asin} className="py-3 px-4 font-mono font-extrabold text-purple-700 text-sm">
                    {p.pricePerLiterAud > 0 ? `${formatMoney(p.pricePerLiterAud, cfg.currency)} / Litre` : '—'}
                  </td>
                ))}
              </tr>

              {/* Engine Compatibility */}
              <tr>
                <td className="py-3 px-4 font-medium text-slate-600">Engine Compatibility</td>
                {selectedProducts.map((p) => (
                  <td key={p.asin} className="py-3 px-4 text-slate-800 font-medium">
                    {p.engineCompatibility}
                  </td>
                ))}
              </tr>

              {/* API & ACEA Standards */}
              <tr className="bg-purple-50/35">
                <td className="py-3 px-4 font-medium text-slate-600">Industry Standards</td>
                {selectedProducts.map((p) => (
                  <td key={p.asin} className="py-3 px-4 text-slate-800 font-mono">
                    <div>{p.apiStandard}</div>
                    <div className="text-slate-500">{p.aceaStandard}</div>
                  </td>
                ))}
              </tr>

              {/* Est Monthly Bottles */}
              <tr>
                <td className="py-3 px-4 font-medium text-slate-600">Est. Monthly Bottles</td>
                {selectedProducts.map((p) => (
                  <td key={p.asin} className="py-3 px-4 font-mono font-bold text-slate-900 text-sm">
                    {p.estMonthlySales.toLocaleString()} bottles
                  </td>
                ))}
              </tr>

              {/* Est Monthly Litres */}
              <tr className="bg-purple-50/35">
                <td className="py-3 px-4 font-medium text-slate-600">Est. Monthly Litres Dispensed</td>
                {selectedProducts.map((p) => (
                  <td key={p.asin} className="py-3 px-4 font-mono font-bold text-purple-700">
                    {(p.estMonthlySales * p.volumeLiters).toLocaleString()} Litres
                  </td>
                ))}
              </tr>

              {/* Opportunity Score */}
              <tr className="bg-purple-50/50">
                <td className="py-3 px-4 font-medium text-slate-600">Opportunity Score (0-100)</td>
                {selectedProducts.map((p) => (
                  <td key={p.asin} className="py-3 px-4 font-mono font-extrabold text-purple-700 text-base">
                    {p.opportunity.overallScore} / 100
                  </td>
                ))}
              </tr>

              {/* OEM Approvals */}
              <tr>
                <td className="py-3 px-4 font-medium text-slate-600">OEM Approvals</td>
                {selectedProducts.map((p) => (
                  <td key={p.asin} className="py-3 px-4">
                    <div className="flex flex-wrap gap-1">
                      {p.oemApprovals.map((appr, idx) => (
                        <span
                          key={idx}
                          className="px-1.5 py-0.5 rounded bg-purple-50 border border-purple-200 text-purple-900 font-mono text-[10px]"
                        >
                          {appr}
                        </span>
                      ))}
                    </div>
                  </td>
                ))}
              </tr>

              {/* Amazon Product Link & Full Details */}
              <tr className="bg-purple-50/50">
                <td className="py-3 px-4 font-medium text-slate-600">Amazon {cfg.code} Link & Details</td>
                {selectedProducts.map((p) => (
                  <td key={p.asin} className="py-3 px-4 space-y-2">
                    <div>
                      <a
                        href={p.productUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-mono text-[11px] text-purple-700 hover:text-purple-900 underline"
                      >
                        <span>{domainShort}/dp/{p.asin}</span>
                        <ExternalLink size={11} />
                      </a>
                    </div>
                    <button
                      onClick={() => onSelectProduct(p)}
                      className="px-2.5 py-1 rounded bg-purple-600 hover:bg-purple-700 text-[11px] font-medium text-white transition-colors"
                    >
                      All Details
                    </button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
