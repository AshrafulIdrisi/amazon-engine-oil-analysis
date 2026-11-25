import React from 'react';
import { X, Sparkles, Target, DollarSign, ShieldAlert, Star, Zap, Droplet } from 'lucide-react';

interface OpportunityMethodologyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OpportunityMethodologyModal: React.FC<OpportunityMethodologyModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-purple-950/35 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white border border-purple-200 rounded-xl shadow-2xl p-6 my-auto space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-purple-100">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-purple-100 text-purple-700">
              <Droplet size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Engine Oil Opportunity Scoring Formula (0 - 100)
              </h3>
              <p className="text-xs text-slate-600">
                Calibrated specifically for Amazon Australia Motor Oils & Lubricants market economics
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-purple-700 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="text-xs text-slate-700 leading-relaxed space-y-3">
          <p>
            The ApexLube AU Opportunity Score pinpoints high-margin engine oil formulations with strong Australian demand
            and sustainable unit profitability. In Australia, engine oil buyers are brand-conscious (Penrite, Castrol, Mobil 1, Nulon)
            and sensitive to Price per Litre ($/L), while suppliers must account for 5L/10L liquid weight tier freight.
          </p>

          <div className="space-y-3 pt-2">
            <div className="p-3 rounded-lg bg-purple-50/50 border border-purple-200/80 space-y-1">
              <div className="flex items-center justify-between font-semibold text-slate-900">
                <span className="flex items-center gap-1.5 text-purple-700">
                  <Target size={14} />
                  1. Litre Turnover & Demand Velocity
                </span>
                <span className="font-mono text-purple-700">Weight: 30% (0 - 30 pts)</span>
              </div>
              <p className="text-slate-600 text-[11px]">
                Evaluates monthly unit sales and cumulative litres. Oils selling &gt;1,200 bottles/month
                (e.g. 5W-30 and 5W-40) achieve top scores.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-purple-50/50 border border-purple-200/80 space-y-1">
              <div className="flex items-center justify-between font-semibold text-slate-900">
                <span className="flex items-center gap-1.5 text-purple-700">
                  <DollarSign size={14} />
                  2. Price per Litre & Margin Sweet Spot
                </span>
                <span className="font-mono text-purple-700">Weight: 25% (0 - 25 pts)</span>
              </div>
              <p className="text-slate-600 text-[11px]">
                The optimal Australian retail sweet spot is $12.00 - $22.00 AUD per Litre ($60 - $110 AUD per 5L jug)
                where supplier gross margins exceed 40% after factoring in $9.40 AUD FBA liquid shipping fees.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-purple-50/50 border border-purple-200/80 space-y-1">
              <div className="flex items-center justify-between font-semibold text-slate-900">
                <span className="flex items-center gap-1.5 text-purple-700">
                  <ShieldAlert size={14} />
                  3. Competitor Review Barrier & OEM Moats
                </span>
                <span className="font-mono text-purple-700">Weight: 20% (0 - 20 pts)</span>
              </div>
              <p className="text-slate-600 text-[11px]">
                Measures competitor saturation in specific OEM approvals (BMW LL-04, MB 229.51, VW 504/507, Ford M2C913-D).
                Accessible niches with &lt;1,000 reviews earn higher opportunity points.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-purple-50/50 border border-purple-200/80 space-y-1">
              <div className="flex items-center justify-between font-semibold text-slate-900">
                <span className="flex items-center gap-1.5 text-purple-700">
                  <Star size={14} />
                  4. Unmet Viscosity & Formulation Gap
                </span>
                <span className="font-mono text-purple-700">Weight: 15% (0 - 15 pts)</span>
              </div>
              <p className="text-slate-600 text-[11px]">
                Identifies high-growth formulation niches with supply gaps on Amazon AU, such as 0W-20 hybrid fuel-economy
                oils, low-SAPS DPF diesel formulations, and high-zinc classic pushrod oils.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-purple-50/50 border border-purple-200/80 space-y-1">
              <div className="flex items-center justify-between font-semibold text-slate-900">
                <span className="flex items-center gap-1.5 text-purple-700">
                  <Zap size={14} />
                  5. Subscribe & Save & Coupon Elasticity
                </span>
                <span className="font-mono text-purple-700">Weight: 10% (0 - 10 pts)</span>
              </div>
              <p className="text-slate-600 text-[11px]">
                Engine oil is a prime consumable: 10% Subscribe & Save discounts generate predictable recurring lifetime customer value.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-purple-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs rounded-lg transition-colors shadow-sm"
          >
            Close Methodology
          </button>
        </div>
      </div>
    </div>
  );
};
