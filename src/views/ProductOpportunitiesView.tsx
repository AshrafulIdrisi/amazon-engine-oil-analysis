import React, { useState } from 'react';
import {
  Sparkles,
  Target,
  DollarSign,
  ShieldCheck,
  Star,
  Zap,
  Info,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  Droplet,
  ExternalLink,
} from 'lucide-react';
import { AutomotiveProduct, MarketplaceCode } from '../types/automotive';
import { formatMoney, getMpConfig, shortDomain } from '../utils/marketplace';

interface ProductOpportunitiesViewProps {
  products: AutomotiveProduct[];
  marketplace?: MarketplaceCode;
  onSelectProduct: (product: AutomotiveProduct) => void;
  onOpenMethodology: () => void;
}

export const ProductOpportunitiesView: React.FC<ProductOpportunitiesViewProps> = ({
  products,
  marketplace = 'AU',
  onSelectProduct,
  onOpenMethodology,
}) => {
  const [minScore, setMinScore] = useState<number>(80);
  const cfg = getMpConfig(marketplace);
  const domainShort = shortDomain(marketplace);

  const sortedOpportunities = [...products]
    .filter((p) => p.opportunity.overallScore >= minScore)
    .sort((a, b) => b.opportunity.overallScore - a.opportunity.overallScore);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-5 rounded-xl bg-gradient-to-r from-white via-purple-50/60 to-purple-100/70 border border-purple-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-purple-100 text-purple-700 border border-purple-200">
              <Droplet size={18} />
            </div>
            <h2 className="text-base font-bold text-slate-900">
              Engine Oil Opportunity Radar (0 - 100 Score) · Amazon {cfg.code}
            </h2>
          </div>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Algorithmic score evaluating lucrative motor oil SKUs in Amazon {cfg.countryName}. Weighs {cfg.code} sales
            velocity (30%), price per litre & 5L margin (25%), OEM approval saturation (20%), unmet formulation
            demand (15%), and Subscribe & Save recurring order elasticity (10%).
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 bg-white border border-purple-200 px-3 py-1.5 rounded-lg text-xs shadow-xs">
            <span className="text-slate-500">Min Score:</span>
            <select
              value={minScore}
              onChange={(e) => setMinScore(parseInt(e.target.value, 10))}
              className="bg-transparent text-purple-700 font-bold focus:outline-none cursor-pointer"
            >
              <option value={90} className="bg-white text-slate-900">90+ (Prime #1 Tier)</option>
              <option value={85} className="bg-white text-slate-900">85+ (High Potential)</option>
              <option value={80} className="bg-white text-slate-900">80+ (Viable Segment)</option>
              <option value={70} className="bg-white text-slate-900">70+ (All Tracked)</option>
            </select>
          </div>

          <button
            onClick={onOpenMethodology}
            className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-purple-50 border border-purple-200 text-xs font-semibold text-purple-800 transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Info size={14} className="text-purple-600" />
            <span>Scoring Methodology</span>
          </button>
        </div>
      </div>

      {/* Opportunity Oil Cards */}
      <div className="space-y-4">
        {sortedOpportunities.map((p) => (
          <div
            key={p.asin}
            className="p-5 rounded-xl bg-white border border-purple-200/80 hover:border-purple-400 transition-all flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 group shadow-xs"
          >
            {/* Left: Product Info */}
            <div className="flex items-start gap-4 flex-1 min-w-0">
              <div
                onClick={() => onSelectProduct(p)}
                className="w-16 h-16 shrink-0 rounded-lg bg-purple-50/40 border border-purple-200/80 p-1 flex items-center justify-center cursor-pointer overflow-hidden"
              >
                <img
                  src={p.imageUrl}
                  alt={p.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>

              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="font-bold text-purple-700">{p.brand}</span>
                  <span>·</span>
                  <span className="font-mono font-bold text-purple-800 bg-purple-100 border border-purple-200 px-1.5 py-0.5 rounded">
                    {p.viscosity}
                  </span>
                  <span>·</span>
                  <span>{p.volumeLiters}L {p.oilType}</span>
                  <span>·</span>
                  <span className="font-mono text-slate-500">ASIN: {p.asin}</span>
                </div>

                <h3
                  onClick={() => onSelectProduct(p)}
                  className="text-sm font-bold text-slate-900 hover:text-purple-700 cursor-pointer transition-colors line-clamp-1"
                >
                  {p.title}
                </h3>

                <div className="text-xs text-slate-600 font-medium">
                  {p.opportunity.keyVerdict}
                </div>

                {/* Advantages bullet preview */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 pt-1">
                  <span className="text-emerald-700 font-mono font-bold">
                    ✓ {p.pricePerLiterAud > 0 ? `${formatMoney(p.pricePerLiterAud, cfg.currency)}/L ${cfg.currency}` : p.availability}
                  </span>
                  <span className="text-slate-800 font-mono font-medium">
                    ✓ {p.estMonthlySales.toLocaleString()} bottles/mo
                  </span>
                  <span className="text-purple-700 font-mono font-medium">
                    ✓ ~{(p.estMonthlySales * p.volumeLiters).toLocaleString()} Litres/mo
                  </span>
                  <span className="text-slate-600">
                    ✓ ★ {p.rating.toFixed(2)} ({p.reviewCount.toLocaleString()} reviews)
                  </span>
                  <a
                    href={p.productUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-mono text-purple-700 hover:text-purple-900 underline"
                  >
                    <span>{domainShort}/dp/{p.asin}</span>
                    <ExternalLink size={11} />
                  </a>
                </div>
              </div>
            </div>

            {/* Middle: 5-Factor Score Radar Strip */}
            <div className="grid grid-cols-5 gap-2 text-center shrink-0 w-full lg:w-auto">
              <div className="p-2 rounded-lg bg-purple-50/60 border border-purple-200/80 w-16">
                <span className="text-[10px] text-slate-500 block">Demand</span>
                <span className="text-xs font-bold font-mono text-purple-900">
                  {p.opportunity.demandScore}/30
                </span>
              </div>
              <div className="p-2 rounded-lg bg-purple-50/60 border border-purple-200/80 w-16">
                <span className="text-[10px] text-slate-500 block">Margin</span>
                <span className="text-xs font-bold font-mono text-purple-900">
                  {p.opportunity.marginScore}/25
                </span>
              </div>
              <div className="p-2 rounded-lg bg-purple-50/60 border border-purple-200/80 w-16">
                <span className="text-[10px] text-slate-500 block">Barrier</span>
                <span className="text-xs font-bold font-mono text-purple-900">
                  {p.opportunity.competitionScore}/20
                </span>
              </div>
              <div className="p-2 rounded-lg bg-purple-50/60 border border-purple-200/80 w-16">
                <span className="text-[10px] text-slate-500 block">Quality</span>
                <span className="text-xs font-bold font-mono text-purple-900">
                  {p.opportunity.ratingGapScore}/15
                </span>
              </div>
              <div className="p-2 rounded-lg bg-purple-50/60 border border-purple-200/80 w-16">
                <span className="text-[10px] text-slate-500 block">Promo</span>
                <span className="text-xs font-bold font-mono text-purple-900">
                  {p.opportunity.promoElasticityScore}/10
                </span>
              </div>
            </div>

            {/* Right: Big Score Badge & Action */}
            <div className="flex lg:flex-col justify-between lg:justify-center items-center lg:items-end shrink-0 w-full lg:w-28 gap-2">
              <div className="text-right lg:text-center">
                <div className="text-2xl font-black font-mono text-purple-700">
                  {p.opportunity.overallScore}
                </div>
                <div className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider">
                  Opportunity Score
                </div>
              </div>

              <button
                onClick={() => onSelectProduct(p)}
                className="px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-colors shadow-xs"
              >
                All Details
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
