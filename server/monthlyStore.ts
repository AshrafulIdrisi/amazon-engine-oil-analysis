import fs from 'fs';
import path from 'path';
import {
  AutomotiveProduct,
  MarketplaceCode,
  MonthlySnapshot,
  MonthlySnapshotProduct,
} from '../src/types/automotive.ts';
import { MARKETPLACES } from './marketplaces.ts';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const SNAPSHOTS_PATH = path.join(DATA_DIR, 'monthly_snapshots.json');
const SETTINGS_PATH = path.join(DATA_DIR, 'platform_settings.json');

export interface PlatformSettings {
  includeTax: boolean;
  fbaFeeModel: string;
  pollFrequency: 'hourly' | 'daily' | 'monthly' | 'manual';
  autoMonthlyCapture: boolean;
  rainforestApiKey: string;
  keepaApiKey: string;
  spApiClientId: string;
  updatedAt: string;
}

const DEFAULT_SETTINGS: PlatformSettings = {
  includeTax: true,
  fbaFeeModel: 'standard-au',
  pollFrequency: 'monthly',
  autoMonthlyCapture: true,
  rainforestApiKey: process.env.RAINFOREST_API_KEY || '',
  keepaApiKey: process.env.KEEPA_API_KEY || '',
  spApiClientId: '',
  updatedAt: new Date().toISOString(),
};

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function getCurrentMonthKey(date = new Date()): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function loadPlatformSettings(): PlatformSettings {
  try {
    if (fs.existsSync(SETTINGS_PATH)) {
      const parsed = JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8'));
      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
        rainforestApiKey: parsed.rainforestApiKey || process.env.RAINFOREST_API_KEY || '',
        keepaApiKey: parsed.keepaApiKey || process.env.KEEPA_API_KEY || '',
      };
    }
  } catch (err) {
    console.warn('[Settings] Failed to read platform_settings.json:', err);
  }
  return { ...DEFAULT_SETTINGS };
}

export function savePlatformSettings(patch: Partial<PlatformSettings>): PlatformSettings {
  ensureDataDir();
  const current = loadPlatformSettings();
  const next: PlatformSettings = {
    ...current,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(next, null, 2), 'utf8');
  return next;
}

export function loadMonthlySnapshots(marketplace?: MarketplaceCode): MonthlySnapshot[] {
  try {
    if (fs.existsSync(SNAPSHOTS_PATH)) {
      const parsed = JSON.parse(fs.readFileSync(SNAPSHOTS_PATH, 'utf8'));
      const all: MonthlySnapshot[] = Array.isArray(parsed) ? parsed : [];
      const filtered = marketplace ? all.filter((s) => s.marketplace === marketplace) : all;
      return filtered.sort((a, b) => b.monthKey.localeCompare(a.monthKey) || b.capturedAt.localeCompare(a.capturedAt));
    }
  } catch (err) {
    console.warn('[MonthlyStore] Failed to load monthly_snapshots.json:', err);
  }
  return [];
}

function saveAllSnapshots(snapshots: MonthlySnapshot[]): void {
  ensureDataDir();
  fs.writeFileSync(SNAPSHOTS_PATH, JSON.stringify(snapshots, null, 2), 'utf8');
}

export function captureMonthlySnapshot(
  marketplace: MarketplaceCode,
  products: AutomotiveProduct[],
  sourceJobId?: string,
  monthKey = getCurrentMonthKey()
): MonthlySnapshot {
  const cfg = MARKETPLACES[marketplace];
  const inStockCount = products.filter((p) => p.inStock).length;
  const priced = products.filter((p) => p.currentPriceAud > 0);
  const avgPrice =
    priced.length > 0
      ? Math.round((priced.reduce((a, p) => a + p.currentPriceAud, 0) / priced.length) * 100) / 100
      : 0;
  const avgPricePerLiter =
    priced.length > 0
      ? Math.round((priced.reduce((a, p) => a + p.pricePerLiterAud, 0) / priced.length) * 100) / 100
      : 0;
  const avgDiscountPct =
    products.length > 0
      ? Math.round((products.reduce((a, p) => a + p.discountPct, 0) / products.length) * 10) / 10
      : 0;
  const estMonthlySalesTotal = products.reduce((a, p) => a + p.estMonthlySales, 0);
  const estMonthlyRevenueTotal = Math.round(
    products.reduce((a, p) => a + p.estMonthlyRevenueAud, 0)
  );

  const snapshotProducts: MonthlySnapshotProduct[] = products.map((p) => ({
    asin: p.asin,
    title: p.title,
    brand: p.brand,
    viscosity: p.viscosity,
    volumeLiters: p.volumeLiters,
    currentPriceAud: p.currentPriceAud,
    originalPriceAud: p.originalPriceAud,
    pricePerLiterAud: p.pricePerLiterAud,
    discountPct: p.discountPct,
    inStock: p.inStock,
    availability: p.availability,
    bsr: p.bsr,
    rating: p.rating,
    reviewCount: p.reviewCount,
    estMonthlySales: p.estMonthlySales,
    estMonthlyRevenueAud: p.estMonthlyRevenueAud,
    soldBy: p.soldBy,
    productUrl: p.productUrl,
  }));

  const id = `${marketplace}-${monthKey}`;
  const snapshot: MonthlySnapshot = {
    id,
    marketplace,
    monthKey,
    currency: cfg.currency,
    capturedAt: new Date().toISOString(),
    sourceJobId,
    summary: {
      totalSkus: products.length,
      inStockCount,
      outOfStockCount: products.length - inStockCount,
      avgPrice,
      avgPricePerLiter,
      avgDiscountPct,
      estMonthlySalesTotal,
      estMonthlyRevenueTotal,
    },
    products: snapshotProducts,
  };

  const all = loadMonthlySnapshots();
  const idx = all.findIndex((s) => s.id === id);
  if (idx >= 0) {
    all[idx] = snapshot;
  } else {
    all.unshift(snapshot);
  }
  saveAllSnapshots(all);
  return snapshot;
}

export function deleteMonthlySnapshot(id: string): boolean {
  const all = loadMonthlySnapshots();
  const next = all.filter((s) => s.id !== id);
  if (next.length === all.length) return false;
  saveAllSnapshots(next);
  return true;
}
