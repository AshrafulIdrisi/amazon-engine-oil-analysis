import React, { useState } from 'react';
import { X, FileSpreadsheet, FileCode, Printer, Check } from 'lucide-react';
import { MarketplaceCode } from '../types/automotive';
import { getMpConfig } from '../utils/marketplace';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  productsCount: number;
  marketplace?: MarketplaceCode;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  productsCount,
  marketplace = 'AU',
}) => {
  const [downloading, setDownloading] = useState<string | null>(null);

  if (!isOpen) return null;

  const cfg = getMpConfig(marketplace);

  const handleExport = (format: 'csv' | 'excel' | 'json' | 'pdf') => {
    setDownloading(format);
    window.open(`/api/export/${format}?marketplace=${marketplace}`, '_blank');
    setTimeout(() => {
      setDownloading(null);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-purple-950/35 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-white border border-purple-200 rounded-xl shadow-2xl p-6">
        <div className="flex items-center justify-between pb-4 border-b border-purple-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Export {cfg.countryName} Engine Oil Data
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              {productsCount} products ready in {cfg.currency} ({cfg.currencySymbol})
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-purple-700 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-4 space-y-2.5">
          <button
            onClick={() => handleExport('csv')}
            disabled={downloading !== null}
            className="w-full flex items-center justify-between p-3.5 rounded-lg border border-purple-200/80 hover:border-purple-400 bg-purple-50/40 hover:bg-purple-50 text-left transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded bg-purple-100 text-purple-700">
                <FileSpreadsheet size={18} />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-900">CSV Spreadsheet</div>
                <div className="text-[11px] text-slate-600">
                  Universal comma-separated format for Google Sheets & Python
                </div>
              </div>
            </div>
            {downloading === 'csv' && <Check size={16} className="text-purple-700" />}
          </button>

          <button
            onClick={() => handleExport('excel')}
            disabled={downloading !== null}
            className="w-full flex items-center justify-between p-3.5 rounded-lg border border-purple-200/80 hover:border-purple-400 bg-purple-50/40 hover:bg-purple-50 text-left transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded bg-purple-100 text-purple-700">
                <FileSpreadsheet size={18} />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-900">Microsoft Excel (XLS)</div>
                <div className="text-[11px] text-slate-600">
                  Formatted columns with {cfg.currency} currency and BSR metrics
                </div>
              </div>
            </div>
            {downloading === 'excel' && <Check size={16} className="text-purple-700" />}
          </button>

          <button
            onClick={() => handleExport('json')}
            disabled={downloading !== null}
            className="w-full flex items-center justify-between p-3.5 rounded-lg border border-purple-200/80 hover:border-purple-400 bg-purple-50/40 hover:bg-purple-50 text-left transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded bg-purple-100 text-purple-700">
                <FileCode size={18} />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-900">Raw JSON Payload</div>
                <div className="text-[11px] text-slate-600">
                  Complete hierarchical dataset including historical price points
                </div>
              </div>
            </div>
            {downloading === 'json' && <Check size={16} className="text-purple-700" />}
          </button>

          <button
            onClick={() => handleExport('pdf')}
            disabled={downloading !== null}
            className="w-full flex items-center justify-between p-3.5 rounded-lg border border-purple-200/80 hover:border-purple-400 bg-purple-50/40 hover:bg-purple-50 text-left transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded bg-purple-600 text-white">
                <Printer size={18} />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-900">Printable Executive Report (PDF)</div>
                <div className="text-[11px] text-slate-600">
                  Clean tabular audit summary for stakeholders & investors
                </div>
              </div>
            </div>
            {downloading === 'pdf' && <Check size={16} className="text-purple-700" />}
          </button>
        </div>
      </div>
    </div>
  );
};
