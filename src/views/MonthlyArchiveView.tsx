import React, { useMemo, useState } from 'react';
import {
  Calendar,
  Camera,
  CheckCircle2,
  Download,
  ExternalLink,
  Trash2,
  TrendingDown,
  TrendingUp,
  ArrowRightLeft,
  Archive,
  Package,
} from 'lucide-react';
import {
  AutomotiveProduct,
  MarketplaceCode,
  MonthlySnapshot,
} from '../types/automotive';
import { formatMoney, getMpConfig } from '../utils/marketplace';

interface MonthlyArchiveViewProps {
  marketplace: MarketplaceCode;
  products: AutomotiveProduct[];
  snapshots: MonthlySnapshot[];
  currentMonthKey: string;
  onCaptureSnapshot: (monthKey?: string) => Promise<{ ok: boolean; error?: string }>;
  onDeleteSnapshot: (id: string) => Promise<void>;
  onSelectProduct: (product: AutomotiveProduct) => void;
}

export const MonthlyArchiveView: React.FC<MonthlyArchiveViewProps> = ({
  marketplace,
  products,
  snapshots,
  currentMonthKey,
  onCaptureSnapshot,
  onDeleteSnapshot,
  onSelectProduct,
}) => {
  const cfg = getMpConfig(marketplace);
  const [filterMp, setFilterMp] = useState<'ALL' | MarketplaceCode>(marketplace);
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string>('');
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureMsg, setCaptureMsg] = useState<string | null>(null);
  const [customMonth, setCustomMonth] = useState<string>(currentMonthKey || '2026-11');

  const visibleSnapshots = useMemo(() => {
    const list =
      filterMp === 'ALL' ? snapshots : snapshots.filter((s) => s.marketplace === filterMp);
    return [...list].sort(
      (a, b) => b.monthKey.localeCompare(a.monthKey) || b.capturedAt.localeCompare(a.capturedAt)
    );
  }, [snapshots, filterMp]);

  const activeSnapshot = useMemo(() => {
    if (selectedSnapshotId) {
      const found = snapshots.find((s) => s.id === selectedSnapshotId);
      if (found) return found;
    }
    return (
      snapshots.find((s) => s.marketplace === marketplace) ||
      visibleSnapshots[0] ||
      null
    );
  }, [snapshots, visibleSnapshots, selectedSnapshotId, marketplace]);

  // Compare active snapshot against live catalog (only when matching marketplace)
  const comparisonRows = useMemo(() => {
    if (!activeSnapshot) return [];
    const liveByAsin = new Map(products.map((p) => [p.asin, p]));
    const compareWithLive = activeSnapshot.marketplace === marketplace && products.length > 0;

    return activeSnapshot.products.slice(0, 60).map((sp) => {
      const live = compareWithLive ? liveByAsin.get(sp.asin) : undefined;
      const priceDelta = live && live.currentPriceAud > 0 && sp.currentPriceAud > 0
        ? Math.round((live.currentPriceAud - sp.currentPriceAud) * 100) / 100
        : 0;
      const bsrDelta = live && live.bsr > 0 && sp.bsr > 0 ? sp.bsr - live.bsr : 0; // positive = improved rank
      const stockChanged = live ? live.inStock !== sp.inStock : false;
      return {
        snap: sp,
        live,
        priceDelta,
        bsrDelta,
        stockChanged,
      };
    });
  }, [activeSnapshot, products, marketplace]);

  const handleCapture = async () => {
    setIsCapturing(true);
    setCaptureMsg(null);
    const res = await onCaptureSnapshot(customMonth);
    setIsCapturing(false);
    if (res.ok) {
      setCaptureMsg(`Saved ${marketplace} monthly snapshot for ${customMonth} (${products.length} SKUs).`);
    } else {
      setCaptureMsg(res.error || 'Unable to capture snapshot.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-5 rounded-xl bg-white border border-purple-200/80 shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Archive size={18} className="text-purple-600" />
            <h2 className="text-sm font-bold text-slate-900">
              Monthly Engine Oil Catalog Archive ({cfg.countryName} · {cfg.currency})
            </h2>
            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold">
              Auto-Store Monthly Active
            </span>
          </div>
          <p className="text-xs text-slate-600">
            Stores complete <code className="text-purple-700 font-mono">YYYY-MM</code> snapshots on disk
            (<code className="text-purple-700 font-mono">data/monthly_snapshots.json</code>) for every
            scrape and month rollover, tracking Month-over-Month price, $/L, BSR, and stock changes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <div className="flex items-center gap-1.5 bg-purple-50/60 border border-purple-200 rounded-lg px-2.5 py-1.5">
            <Calendar size={13} className="text-purple-600" />
            <input
              type="month"
              value={customMonth}
              onChange={(e) => setCustomMonth(e.target.value)}
              className="bg-transparent text-xs font-mono text-slate-900 focus:outline-none"
            />
          </div>
          <button
            onClick={handleCapture}
            disabled={isCapturing || products.length === 0}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs transition-colors shadow-xs disabled:opacity-50"
          >
            <Camera size={14} />
            <span>
              {isCapturing
                ? 'Saving Snapshot...'
                : `Capture ${marketplace} Month (${products.length} SKUs)`}
            </span>
          </button>
        </div>
      </div>

      {captureMsg && (
        <div className="p-3 rounded-lg bg-purple-50 border border-purple-200 text-xs text-purple-900 flex items-center gap-2">
          <CheckCircle2 size={15} className="text-purple-600 shrink-0" />
          <span>{captureMsg}</span>
        </div>
      )}

      {/* Filter Pills + Stored Monthly Snapshot Cards */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            {(['ALL', 'AU', 'US', 'DE', 'PL', 'PT'] as const).map((code) => {
              const active = filterMp === code;
              return (
                <button
                  key={code}
                  onClick={() => setFilterMp(code)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
                    active
                      ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                      : 'bg-white text-slate-600 border-purple-200 hover:bg-purple-50 hover:text-purple-900'
                  }`}
                >
                  {code === 'ALL' ? `All Marketplaces (${snapshots.length})` : code}
                </button>
              );
            })}
          </div>
          <div className="text-xs text-slate-500">
            Click any snapshot card to inspect its Month-over-Month SKU delta table
          </div>
        </div>

        {visibleSnapshots.length === 0 ? (
          <div className="p-8 rounded-xl bg-white border border-purple-200/80 text-center space-y-2">
            <Package size={24} className="mx-auto text-purple-400" />
            <div className="text-sm font-semibold text-slate-800">
              No monthly snapshots stored for {filterMp === 'ALL' ? 'any marketplace' : filterMp} yet
            </div>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Switch to a marketplace with scraped engine oil listings (such as AU or US) and click
              &ldquo;Capture Month&rdquo; to archive a monthly snapshot.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {visibleSnapshots.map((snap) => {
              const isSelected = activeSnapshot?.id === snap.id;
              return (
                <div
                  key={snap.id}
                  onClick={() => setSelectedSnapshotId(snap.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer bg-white shadow-xs ${
                    isSelected
                      ? 'border-purple-600 ring-2 ring-purple-500/20'
                      : 'border-purple-200/80 hover:border-purple-400'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-mono text-[11px] font-bold">
                          {snap.marketplace}
                        </span>
                        <span className="text-sm font-bold text-slate-900 font-mono">
                          {snap.monthKey}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        Archived {new Date(snap.capturedAt).toLocaleString()}
                      </div>
                    </div>

                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <a
                        href={`/api/monthly-snapshots/${snap.id}/export?format=csv`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg border border-purple-200 bg-purple-50/50 hover:bg-purple-100 text-purple-700"
                        title="Download Monthly Snapshot CSV"
                      >
                        <Download size={13} />
                      </a>
                      <button
                        onClick={() => onDeleteSnapshot(snap.id)}
                        className="p-1.5 rounded-lg border border-rose-200 bg-rose-50/50 hover:bg-rose-100 text-rose-600"
                        title="Delete snapshot"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-purple-100 text-xs">
                    <div>
                      <div className="text-[10px] text-slate-500">SKUs Stored</div>
                      <div className="font-mono font-bold text-slate-900">
                        {snap.summary.totalSkus}
                      </div>
                      <div className="text-[10px] text-emerald-700">
                        {snap.summary.inStockCount} in stock
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500">Avg Price / $/L</div>
                      <div className="font-mono font-bold text-slate-900">
                        {formatMoney(snap.summary.avgPrice, snap.currency)}
                      </div>
                      <div className="text-[10px] text-purple-700 font-mono">
                        {formatMoney(snap.summary.avgPricePerLiter, snap.currency)}/L
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500">Est. Mo. GMV</div>
                      <div className="font-mono font-bold text-purple-800">
                        {formatMoney(snap.summary.estMonthlyRevenueTotal, snap.currency, 0)}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {snap.summary.estMonthlySalesTotal.toLocaleString()} units
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Month-over-Month Comparison Table */}
      {activeSnapshot && (
        <div className="rounded-xl bg-white border border-purple-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-purple-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ArrowRightLeft size={15} className="text-purple-600" />
                <span>
                  Snapshot Audit: {activeSnapshot.marketplace} · {activeSnapshot.monthKey} ({activeSnapshot.currency})
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {activeSnapshot.marketplace === marketplace
                  ? `Comparing archived ${activeSnapshot.monthKey} snapshot prices, stock, and BSR against current live ${marketplace} scrape`
                  : `Showing archived ${activeSnapshot.marketplace} (${activeSnapshot.monthKey}) records — switch active marketplace pill in top bar to ${activeSnapshot.marketplace} to diff against live state`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={`/api/monthly-snapshots/${activeSnapshot.id}/export?format=csv`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-lg border border-purple-200 bg-purple-50/50 hover:bg-purple-100 text-xs font-semibold text-purple-800 flex items-center gap-1.5"
              >
                <Download size={13} />
                <span>Export {activeSnapshot.monthKey} CSV</span>
              </a>
              <a
                href={`/api/monthly-snapshots/${activeSnapshot.id}/export?format=json`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-lg border border-purple-200 bg-white hover:bg-purple-50 text-xs font-semibold text-slate-700"
              >
                JSON
              </a>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-purple-50/80 text-purple-900 border-b border-purple-200">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">ASIN & Brand</th>
                  <th className="py-2.5 px-3 font-semibold">Product & Viscosity</th>
                  <th className="py-2.5 px-3 text-right font-semibold">
                    Archived Price ({activeSnapshot.monthKey})
                  </th>
                  <th className="py-2.5 px-3 text-right font-semibold">Live Price</th>
                  <th className="py-2.5 px-3 text-right font-semibold">Price Delta</th>
                  <th className="py-2.5 px-3 font-semibold">Stock Change</th>
                  <th className="py-2.5 px-3 text-right font-semibold">BSR</th>
                  <th className="py-2.5 px-3 font-semibold">Link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-100 bg-white">
                {comparisonRows.map(({ snap, live, priceDelta, bsrDelta, stockChanged }) => (
                  <tr
                    key={snap.asin}
                    onClick={() => live && onSelectProduct(live)}
                    className={`hover:bg-purple-50/50 transition-colors ${live ? 'cursor-pointer' : ''}`}
                  >
                    <td className="py-2.5 px-3">
                      <div className="font-mono font-semibold text-purple-700">{snap.asin}</div>
                      <div className="text-[11px] text-slate-600 font-medium">{snap.brand}</div>
                    </td>
                    <td className="py-2.5 px-3 max-w-xs">
                      <div className="font-medium text-slate-900 truncate">{snap.title}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {snap.viscosity} · {snap.volumeLiters}L
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                      {snap.currentPriceAud > 0
                        ? formatMoney(snap.currentPriceAud, activeSnapshot.currency)
                        : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900">
                      {live
                        ? live.currentPriceAud > 0
                          ? formatMoney(live.currentPriceAud, activeSnapshot.currency)
                          : live.availability
                        : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono">
                      {!live || priceDelta === 0 ? (
                        <span className="text-slate-400">0.00</span>
                      ) : priceDelta < 0 ? (
                        <span className="inline-flex items-center gap-0.5 text-emerald-700 font-semibold">
                          <TrendingDown size={12} />
                          {formatMoney(Math.abs(priceDelta), activeSnapshot.currency)}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 text-rose-700 font-semibold">
                          <TrendingUp size={12} />+{formatMoney(priceDelta, activeSnapshot.currency)}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                          (live ? live.inStock : snap.inStock)
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {stockChanged && live
                          ? `${snap.availability} → ${live.availability}`
                          : live
                          ? live.availability
                          : snap.availability}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                      #{live ? live.bsr : snap.bsr}
                      {bsrDelta !== 0 && (
                        <span
                          className={`block text-[10px] ${
                            bsrDelta > 0 ? 'text-emerald-700' : 'text-rose-700'
                          }`}
                        >
                          {bsrDelta > 0 ? `↑${bsrDelta}` : `↓${Math.abs(bsrDelta)}`}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3" onClick={(e) => e.stopPropagation()}>
                      <a
                        href={snap.productUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-purple-700 hover:text-purple-900 hover:underline font-mono text-[11px]"
                      >
                        <span>{snap.asin}</span>
                        <ExternalLink size={11} />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
