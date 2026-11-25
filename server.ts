import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import {
  attachDynamicCompetitors,
  computeBrandsIntelligence,
  computeCategoryIntelligence,
  computeMarketSummary,
  loadStore,
  mergeProductHistory,
  runFullMarketplaceScrape,
  saveStore,
  scrapeAmazonProductDetail,
  ScrapedStore,
} from './server/scraper.ts';
import { MARKETPLACES, normalizeMarketplace } from './server/marketplaces.ts';
import {
  captureMonthlySnapshot,
  deleteMonthlySnapshot,
  getCurrentMonthKey,
  loadMonthlySnapshots,
  loadPlatformSettings,
  savePlatformSettings,
} from './server/monthlyStore.ts';
import { AutomotiveProduct, MarketplaceCode } from './src/types/automotive.ts';

const ALL_MARKETPLACES: MarketplaceCode[] = ['AU', 'US', 'DE', 'PL', 'PT'];

const stores: Record<MarketplaceCode, ScrapedStore> = {
  AU: loadStore('AU'),
  US: loadStore('US'),
  DE: loadStore('DE'),
  PL: loadStore('PL'),
  PT: loadStore('PT'),
};

const activeScrapePromises: Partial<Record<MarketplaceCode, Promise<void> | null>> = {};

function getMp(req: Request): MarketplaceCode {
  return normalizeMarketplace(req.query.marketplace ?? (req.body && req.body.marketplace));
}

function autoCaptureIfEnabled(mp: MarketplaceCode, jobId?: string) {
  const settings = loadPlatformSettings();
  if (!settings.autoMonthlyCapture) return;
  const st = stores[mp];
  if (st.products.length > 0) {
    captureMonthlySnapshot(mp, st.products, jobId);
  }
}

function ensureCurrentMonthSnapshots() {
  const settings = loadPlatformSettings();
  if (!settings.autoMonthlyCapture) return;
  const currentMonth = getCurrentMonthKey();
  const existing = loadMonthlySnapshots();
  for (const mp of ALL_MARKETPLACES) {
    if (stores[mp].products.length > 0) {
      const hasThisMonth = existing.some((s) => s.marketplace === mp && s.monthKey === currentMonth);
      if (!hasThisMonth) {
        captureMonthlySnapshot(mp, stores[mp].products, undefined, currentMonth);
        console.log(`[MonthlyStore] Auto-archived ${mp} snapshot for ${currentMonth} (${stores[mp].products.length} SKUs).`);
      }
    }
  }
}

async function ensureInitialLiveScrape(mp: MarketplaceCode) {
  if (stores[mp].products.length > 0) return;
  if (activeScrapePromises[mp]) return activeScrapePromises[mp];

  activeScrapePromises[mp] = (async () => {
    try {
      console.log(`[ApexLube ${mp}] No cached scrape found. Running initial live crawl on ${MARKETPLACES[mp].domain}...`);
      const { products, job } = await runFullMarketplaceScrape(mp, stores[mp].products);
      stores[mp] = {
        products,
        jobs: [job, ...stores[mp].jobs].slice(0, 50),
        lastFullScrapeAt: new Date().toISOString(),
      };
      saveStore(stores[mp], mp);
      autoCaptureIfEnabled(mp, job.id);
      console.log(`[ApexLube ${mp}] Initial live scrape complete: ${products.length} engine oils saved.`);
    } catch (err) {
      console.error(`[ApexLube ${mp}] Initial live scrape failed:`, err);
    } finally {
      activeScrapePromises[mp] = null;
    }
  })();

  return activeScrapePromises[mp];
}

const CATEGORY_TO_SEARCH_QUERY: Record<string, string | undefined> = {
  'all-engine-oils': undefined,
  '5w30-full-synthetic': '5W-30 synthetic engine oil',
  '5w40-full-synthetic': '5W-40 engine oil',
  '0w20-advanced-synthetic': '0W-20 synthetic motor oil',
  '15w40-heavy-duty-diesel': '15W-40 diesel engine oil',
  '10w40-semi-synthetic': '10W-40 engine oil',
  'pao-ester-racing': 'Liqui Moly engine oil',
  'classic-high-zinc': '20W-50 engine oil',
};

function maskSecret(val: string): string {
  if (!val || val.length < 6) return val ? '••••••' : '';
  return `••••••${val.slice(-4)}`;
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json({ limit: '10mb' }));

  // Start initial scrape in background for AU if empty, and auto-snapshot current month
  if (stores.AU.products.length === 0) {
    void ensureInitialLiveScrape('AU');
  } else {
    ensureCurrentMonthSnapshots();
  }

  // Monthly scheduler check every 6 hours so month transitions auto-capture snapshots
  setInterval(() => {
    try {
      ensureCurrentMonthSnapshots();
    } catch (err) {
      console.warn('[MonthlyScheduler] Check error:', err);
    }
  }, 6 * 60 * 60 * 1000);

  const apiRouter = express.Router();

  // 0. GET /api/marketplaces
  apiRouter.get('/marketplaces', (_req: Request, res: Response) => {
    const settings = loadPlatformSettings();
    const snapshots = loadMonthlySnapshots();
    const list = ALL_MARKETPLACES.map((code) => {
      const cfg = MARKETPLACES[code];
      const st = stores[code];
      const inStockCount = st.products.filter((p) => p.inStock).length;
      const snapCount = snapshots.filter((s) => s.marketplace === code).length;
      return {
        ...cfg,
        productCount: st.products.length,
        inStockCount,
        lastFullScrapeAt: st.lastFullScrapeAt,
        snapshotCount: snapCount,
        rainforestConfigured: Boolean(settings.rainforestApiKey),
      };
    });
    res.json({ marketplaces: list, currentMonthKey: getCurrentMonthKey() });
  });

  // 1. GET /api/automotive/products
  apiRouter.get('/automotive/products', async (req: Request, res: Response) => {
    try {
      const mp = getMp(req);
      const st = stores[mp];
      if (st.products.length === 0 && activeScrapePromises[mp]) {
        await activeScrapePromises[mp];
      }

      const {
        category,
        brand,
        viscosity,
        oilType,
        engineCompatibility,
        search,
        minPrice,
        maxPrice,
        maxPricePerLiter,
        minDiscount,
        minRating,
        minSales,
        maxBsr,
        hasCoupon,
        isLightningDeal,
        isTrending,
        isTracked,
        inStock,
        sortBy = 'sales',
        sortOrder = 'desc',
        page = '1',
        limit = '250',
      } = req.query;

      let filtered = [...stores[mp].products];

      if (category && category !== 'all') {
        filtered = filtered.filter(
          (p) => p.categoryId === category || p.categoryName.toLowerCase() === (category as string).toLowerCase()
        );
      }

      if (brand && brand !== 'all') {
        filtered = filtered.filter(
          (p) => p.brand.toLowerCase() === (brand as string).toLowerCase()
        );
      }

      if (viscosity && viscosity !== 'all') {
        filtered = filtered.filter((p) => p.viscosity === viscosity);
      }

      if (oilType && oilType !== 'all') {
        filtered = filtered.filter((p) => p.oilType === oilType);
      }

      if (engineCompatibility && engineCompatibility !== 'all') {
        filtered = filtered.filter((p) => p.engineCompatibility === engineCompatibility);
      }

      if (search) {
        const q = (search as string).toLowerCase().trim();
        filtered = filtered.filter(
          (p) =>
            p.title.toLowerCase().includes(q) ||
            p.asin.toLowerCase().includes(q) ||
            p.brand.toLowerCase().includes(q) ||
            p.viscosity.toLowerCase().includes(q) ||
            p.apiStandard.toLowerCase().includes(q) ||
            p.categoryName.toLowerCase().includes(q) ||
            p.productUrl.toLowerCase().includes(q)
        );
      }

      if (minPrice) filtered = filtered.filter((p) => p.currentPriceAud >= parseFloat(minPrice as string));
      if (maxPrice) filtered = filtered.filter((p) => p.currentPriceAud <= parseFloat(maxPrice as string));
      if (maxPricePerLiter) filtered = filtered.filter((p) => p.pricePerLiterAud <= parseFloat(maxPricePerLiter as string));
      if (minDiscount) filtered = filtered.filter((p) => p.discountPct >= parseFloat(minDiscount as string));
      if (minRating) filtered = filtered.filter((p) => p.rating >= parseFloat(minRating as string));
      if (minSales) filtered = filtered.filter((p) => p.estMonthlySales >= parseInt(minSales as string, 10));
      if (maxBsr) filtered = filtered.filter((p) => p.bsr <= parseInt(maxBsr as string, 10));
      if (hasCoupon === 'true') filtered = filtered.filter((p) => p.hasCoupon);
      if (isLightningDeal === 'true') filtered = filtered.filter((p) => p.isLightningDeal);
      if (isTrending === 'true') filtered = filtered.filter((p) => p.isTrending);
      if (isTracked === 'true') filtered = filtered.filter((p) => p.isTracked);
      if (inStock === 'true') filtered = filtered.filter((p) => p.inStock);
      else if (inStock === 'false') filtered = filtered.filter((p) => !p.inStock);

      filtered.sort((a, b) => {
        let valA: number;
        let valB: number;

        switch (sortBy) {
          case 'sales':
            valA = a.estMonthlySales;
            valB = b.estMonthlySales;
            break;
          case 'revenue':
            valA = a.estMonthlyRevenueAud;
            valB = b.estMonthlyRevenueAud;
            break;
          case 'price':
            valA = a.currentPriceAud;
            valB = b.currentPriceAud;
            break;
          case 'pricePerLiter':
            valA = a.pricePerLiterAud;
            valB = b.pricePerLiterAud;
            break;
          case 'discount':
            valA = a.discountPct;
            valB = b.discountPct;
            break;
          case 'bsr':
            valA = a.bsr;
            valB = b.bsr;
            return sortOrder === 'asc' ? valA - valB : valB - valA;
          case 'rating':
            valA = a.rating;
            valB = b.rating;
            break;
          case 'opportunity':
            valA = a.opportunity.overallScore;
            valB = b.opportunity.overallScore;
            break;
          default:
            valA = a.estMonthlySales;
            valB = b.estMonthlySales;
        }

        return sortOrder === 'asc' ? valA - valB : valB - valA;
      });

      const pageNum = parseInt(page as string, 10) || 1;
      const pageSize = parseInt(limit as string, 10) || 250;
      const totalCount = filtered.length;
      const paginated = filtered.slice((pageNum - 1) * pageSize, pageNum * pageSize);

      res.json({
        marketplace: mp,
        currency: MARKETPLACES[mp].currency,
        total: totalCount,
        page: pageNum,
        limit: pageSize,
        lastFullScrapeAt: stores[mp].lastFullScrapeAt,
        isScraping: Boolean(activeScrapePromises[mp]),
        products: paginated,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch live scraped engine oils' });
    }
  });

  // 2. GET /api/automotive/search
  apiRouter.get('/automotive/search', (req: Request, res: Response) => {
    const mp = getMp(req);
    const st = stores[mp];
    const q = ((req.query.q as string) || '').toLowerCase().trim();
    if (!q) {
      return res.json({ results: st.products.slice(0, 10) });
    }

    const matches = st.products.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.asin.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.viscosity.toLowerCase().includes(q) ||
        p.categoryName.toLowerCase().includes(q)
    );

    res.json({
      marketplace: mp,
      query: q,
      count: matches.length,
      results: matches,
    });
  });

  // 3. GET /api/automotive/categories
  apiRouter.get('/automotive/categories', (req: Request, res: Response) => {
    const mp = getMp(req);
    res.json({ categories: computeCategoryIntelligence(stores[mp].products) });
  });

  // 4. GET /api/automotive/brands
  apiRouter.get('/automotive/brands', (req: Request, res: Response) => {
    const mp = getMp(req);
    res.json({ brands: computeBrandsIntelligence(stores[mp].products) });
  });

  // 5. GET /api/automotive/trending
  apiRouter.get('/automotive/trending', (req: Request, res: Response) => {
    const mp = getMp(req);
    const trending = stores[mp].products
      .filter((p) => p.isTrending || p.salesGrowthPct > 10)
      .sort((a, b) => b.salesGrowthPct - a.salesGrowthPct);
    res.json({ trending });
  });

  // 6. GET /api/automotive/opportunities
  apiRouter.get('/automotive/opportunities', (req: Request, res: Response) => {
    const mp = getMp(req);
    const opportunities = [...stores[mp].products].sort(
      (a, b) => b.opportunity.overallScore - a.opportunity.overallScore
    );
    res.json({ opportunities });
  });

  // 7. GET /api/products/:asin
  apiRouter.get('/products/:asin', (req: Request, res: Response) => {
    const mp = getMp(req);
    const { asin } = req.params;
    const product = stores[mp].products.find((p) => p.asin.toUpperCase() === asin.toUpperCase());
    if (!product) {
      return res.status(404).json({ error: `Engine oil with ASIN ${asin} not found in ${mp}` });
    }
    res.json({ product });
  });

  // 8. GET /api/products/:asin/price-history
  apiRouter.get('/products/:asin/price-history', (req: Request, res: Response) => {
    const mp = getMp(req);
    const { asin } = req.params;
    const product = stores[mp].products.find((p) => p.asin.toUpperCase() === asin.toUpperCase());
    if (!product) {
      return res.status(404).json({ error: `Engine oil with ASIN ${asin} not found in ${mp}` });
    }
    res.json({
      asin: product.asin,
      marketplace: mp,
      currency: MARKETPLACES[mp].currency,
      currentPrice: product.currentPriceAud,
      pricePerLiter: product.pricePerLiterAud,
      lowestPrice: product.lowestPriceAud,
      highestPrice: product.highestPriceAud,
      avgPrice: product.avgPriceAud,
      history: product.priceHistory,
    });
  });

  // 9. GET /api/products/:asin/sales-history
  apiRouter.get('/products/:asin/sales-history', (req: Request, res: Response) => {
    const mp = getMp(req);
    const { asin } = req.params;
    const product = stores[mp].products.find((p) => p.asin.toUpperCase() === asin.toUpperCase());
    if (!product) {
      return res.status(404).json({ error: `Engine oil with ASIN ${asin} not found in ${mp}` });
    }
    res.json({
      asin: product.asin,
      marketplace: mp,
      currentMonthlyUnits: product.estMonthlySales,
      currentMonthlyRevenueAud: product.estMonthlyRevenueAud,
      currentBsr: product.bsr,
      history: product.salesHistory,
    });
  });

  // 10. GET /api/products/:asin/competitors
  apiRouter.get('/products/:asin/competitors', (req: Request, res: Response) => {
    const mp = getMp(req);
    const { asin } = req.params;
    const product = stores[mp].products.find((p) => p.asin.toUpperCase() === asin.toUpperCase());
    if (!product) {
      return res.status(404).json({ error: `Engine oil with ASIN ${asin} not found in ${mp}` });
    }
    res.json({
      asin: product.asin,
      productTitle: product.title,
      competitors: product.competitors,
    });
  });

  // 11. POST /api/automotive/import (User CSV/JSON import for AU/US/DE/PL)
  apiRouter.post('/automotive/import', (req: Request, res: Response) => {
    try {
      const mp = getMp(req);
      const cfg = MARKETPLACES[mp];
      const st = stores[mp];
      const { items, format = 'json' } = req.body;
      if (!items || !Array.isArray(items)) {
        return res.status(400).json({ error: 'Valid array of items is required' });
      }

      let importedCount = 0;
      for (const item of items) {
        if (!item.asin || !item.title) continue;

        const cleanAsin = String(item.asin).toUpperCase().trim();
        const existingIndex = st.products.findIndex((p) => p.asin === cleanAsin);
        const volume = parseFloat(item.volumeLiters) || 5;
        const currentPrice = parseFloat(item.currentPriceAud) || parseFloat(item.price) || 0;
        const pricePerL = volume > 0 && currentPrice > 0 ? Math.round((currentPrice / volume) * 100) / 100 : 0;

        const newProduct: AutomotiveProduct = {
          asin: cleanAsin,
          marketplace: mp,
          currency: cfg.currency,
          title: item.title,
          brand: item.brand || 'Unknown',
          manufacturer: item.manufacturer || item.brand || 'Unknown',
          categoryId: item.categoryId || '5w-30-passenger',
          categoryName: item.categoryName || '5W-30 Universal Passenger Oils',
          productUrl: item.productUrl || `https://${cfg.domain}/dp/${cleanAsin}`,
          imageUrl: item.imageUrl || '',
          description: item.description || item.title,
          viscosity: item.viscosity || '5W-30',
          volumeLiters: volume,
          pricePerLiterAud: pricePerL,
          oilType: item.oilType || 'Full Synthetic',
          engineCompatibility: item.engineCompatibility || 'Universal Petrol & Light Diesel',
          apiStandard: item.apiStandard || 'API Rated',
          aceaStandard: item.aceaStandard || 'OEM Spec',
          oemApprovals: item.oemApprovals || [],
          specifications: item.specifications || { Viscosity: item.viscosity || '5W-30', Volume: `${volume}L` },
          currentPriceAud: currentPrice,
          originalPriceAud: parseFloat(item.originalPriceAud) || currentPrice,
          listPriceAud: parseFloat(item.listPriceAud) || currentPrice,
          discountPct: parseFloat(item.discountPct) || 0,
          lowestPriceAud: currentPrice,
          highestPriceAud: parseFloat(item.originalPriceAud) || currentPrice,
          avgPriceAud: currentPrice,
          hasCoupon: Boolean(item.hasCoupon),
          isLightningDeal: Boolean(item.isLightningDeal),
          subscribeAndSave: Boolean(item.subscribeAndSave),
          promoHistoryCount: 0,
          estDailySales: Math.round((parseInt(item.estMonthlySales, 10) || 100) / 30),
          estWeeklySales: Math.round(((parseInt(item.estMonthlySales, 10) || 100) / 30) * 7),
          estMonthlySales: parseInt(item.estMonthlySales, 10) || 100,
          estMonthlyRevenueAud: (parseInt(item.estMonthlySales, 10) || 100) * currentPrice,
          salesGrowthPct: parseFloat(item.salesGrowthPct) || 0,
          demandIndicator: 'High',
          bsr: parseInt(item.bsr, 10) || 100,
          categoryRank: parseInt(item.categoryRank, 10) || 100,
          subcategoryRank: parseInt(item.subcategoryRank, 10) || 25,
          bsrChange7dPct: 0,
          rating: parseFloat(item.rating) || 4.5,
          reviewCount: parseInt(item.reviewCount, 10) || 0,
          ratingDistribution: { fiveStar: 80, fourStar: 12, threeStar: 4, twoStar: 2, oneStar: 2 },
          reviewGrowth30d: 0,
          availability: item.inStock === false ? 'Currently Unavailable' : 'In Stock',
          inStock: item.inStock !== false,
          isTrending: false,
          isTracked: true,
          opportunity: {
            overallScore: 75,
            demandScore: 22,
            marginScore: 20,
            competitionScore: 14,
            ratingGapScore: 11,
            promoElasticityScore: 8,
            keyVerdict: `User-imported Amazon ${mp} engine oil listing`,
            strengths: ['Imported record'],
            risks: ['Requires live refresh for current Buy Box'],
          },
          lastScrapedAt: new Date().toISOString(),
          firstTrackedAt: new Date().toISOString(),
          priceHistory: [
            {
              date: new Date().toISOString().split('T')[0],
              priceAud: currentPrice,
              discountPct: parseFloat(item.discountPct) || 0,
              eventType: 'normal',
            },
          ],
          salesHistory: [],
          competitors: [],
        };

        if (existingIndex >= 0) {
          st.products[existingIndex] = { ...st.products[existingIndex], ...newProduct };
        } else {
          st.products.unshift(newProduct);
        }
        importedCount++;
      }

      st.products = attachDynamicCompetitors(st.products);
      saveStore(st, mp);
      autoCaptureIfEnabled(mp);

      res.json({
        success: true,
        marketplace: mp,
        format,
        importedCount,
        totalProductsNow: st.products.length,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Import failed' });
    }
  });

  // 12. POST /api/automotive/track
  apiRouter.post('/automotive/track', async (req: Request, res: Response) => {
    const mp = getMp(req);
    const cfg = MARKETPLACES[mp];
    const st = stores[mp];
    const { asin, isTracked } = req.body;
    if (!asin) {
      return res.status(400).json({ error: 'ASIN is required' });
    }

    const upperAsin = String(asin).toUpperCase().trim();
    if (!/^[A-Z0-9]{10}$/.test(upperAsin)) {
      return res.status(400).json({ error: 'Invalid 10-character Amazon ASIN' });
    }

    const existing = st.products.find((p) => p.asin === upperAsin);
    if (existing && isTracked === undefined) {
      existing.isTracked = !existing.isTracked;
      saveStore(st, mp);
      return res.json({ success: true, asin: existing.asin, isTracked: existing.isTracked });
    }

    try {
      const scraped = await scrapeAmazonProductDetail(upperAsin, undefined, mp);
      const merged = mergeProductHistory(existing, { ...scraped, isTracked: true });
      const idx = st.products.findIndex((p) => p.asin === upperAsin);
      if (idx >= 0) {
        st.products[idx] = merged;
      } else {
        st.products.unshift(merged);
      }
      st.products = attachDynamicCompetitors(st.products);
      saveStore(st, mp);
      autoCaptureIfEnabled(mp);

      const finalProduct = st.products.find((p) => p.asin === upperAsin) || merged;
      return res.json({
        success: true,
        marketplace: mp,
        asin: upperAsin,
        isTracked: true,
        created: idx < 0,
        product: finalProduct,
      });
    } catch (err: any) {
      return res.status(422).json({
        error: `Failed to scrape live listing https://${cfg.domain}/dp/${upperAsin}: ${err.message}`,
      });
    }
  });

  // 13. POST /api/automotive/refresh
  apiRouter.post('/automotive/refresh', async (req: Request, res: Response) => {
    const mp = getMp(req);
    const cfg = MARKETPLACES[mp];
    try {
      const { products, job } = await runFullMarketplaceScrape(mp, stores[mp].products);
      stores[mp] = {
        products,
        jobs: [job, ...stores[mp].jobs].slice(0, 50),
        lastFullScrapeAt: new Date().toISOString(),
      };
      saveStore(stores[mp], mp);
      if (job.status === 'completed') {
        autoCaptureIfEnabled(mp, job.id);
      }

      res.json({
        success: job.status === 'completed',
        marketplace: mp,
        domain: cfg.domain,
        currency: cfg.currency,
        refreshedAt: stores[mp].lastFullScrapeAt,
        updatedProducts: job.itemsUpdated,
        totalProducts: stores[mp].products.length,
        job,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Live refresh scrape failed' });
    }
  });

  // 14. GET /api/analytics/automotive
  apiRouter.get('/analytics/automotive', async (req: Request, res: Response) => {
    const mp = getMp(req);
    const cfg = MARKETPLACES[mp];
    if (stores[mp].products.length === 0 && activeScrapePromises[mp]) {
      await activeScrapePromises[mp];
    }

    const products = stores[mp].products;
    const total = products.length || 1;
    const viscMap = new Map<string, number>();
    for (const p of products) {
      viscMap.set(p.viscosity, (viscMap.get(p.viscosity) || 0) + 1);
    }

    const viscosityShare = Array.from(viscMap.entries())
      .map(([grade, count]) => ({
        grade,
        sharePct: Math.round((count / total) * 1000) / 10,
        description: `${count} live scraped SKU${count === 1 ? '' : 's'}`,
      }))
      .sort((a, b) => b.sharePct - a.sharePct);

    res.json({
      summary: computeMarketSummary(products),
      marketplaceCode: mp,
      marketplace: `Amazon ${cfg.countryName} (${cfg.domain.replace('www.', '')})`,
      currency: cfg.currency,
      currencySymbol: cfg.currencySymbol,
      lastFullScrapeAt: stores[mp].lastFullScrapeAt,
      viscosityShare,
      demandBreakdown: [
        { level: 'Surging', count: products.filter((p) => p.demandIndicator === 'Surging').length },
        { level: 'Very High', count: products.filter((p) => p.demandIndicator === 'Very High').length },
        { level: 'High', count: products.filter((p) => p.demandIndicator === 'High').length },
      ],
    });
  });

  // 15. GET /api/analytics/brands
  apiRouter.get('/analytics/brands', (req: Request, res: Response) => {
    const mp = getMp(req);
    res.json({ brands: computeBrandsIntelligence(stores[mp].products) });
  });

  // 16. GET /api/analytics/categories
  apiRouter.get('/analytics/categories', (req: Request, res: Response) => {
    const mp = getMp(req);
    res.json({ categories: computeCategoryIntelligence(stores[mp].products) });
  });

  // 17. GET /api/jobs & POST /api/jobs/run
  apiRouter.get('/jobs', (req: Request, res: Response) => {
    const mp = getMp(req);
    res.json({ jobs: stores[mp].jobs });
  });

  apiRouter.post('/jobs/run', async (req: Request, res: Response) => {
    try {
      const mp = getMp(req);
      const { category = 'all-engine-oils', query } = req.body;
      const customQuery =
        typeof query === 'string' && query.trim()
          ? query.trim()
          : CATEGORY_TO_SEARCH_QUERY[category];

      const { products, job } = await runFullMarketplaceScrape(mp, stores[mp].products, customQuery);
      stores[mp] = {
        products,
        jobs: [job, ...stores[mp].jobs].slice(0, 50),
        lastFullScrapeAt: new Date().toISOString(),
      };
      saveStore(stores[mp], mp);
      if (job.status === 'completed') {
        autoCaptureIfEnabled(mp, job.id);
      }

      res.json({
        success: job.status === 'completed',
        marketplace: mp,
        job,
        totalProducts: stores[mp].products.length,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Live collection job failed' });
    }
  });

  // 18. Monthly Snapshots Endpoints
  apiRouter.get('/monthly-snapshots', (req: Request, res: Response) => {
    const rawMp = req.query.marketplace as string | undefined;
    const mp = rawMp && rawMp !== 'all' ? normalizeMarketplace(rawMp) : undefined;
    const snapshots = loadMonthlySnapshots(mp);
    res.json({
      currentMonthKey: getCurrentMonthKey(),
      snapshots,
    });
  });

  apiRouter.post('/monthly-snapshots/capture', (req: Request, res: Response) => {
    try {
      const mp = getMp(req);
      const monthKey =
        typeof req.body?.monthKey === 'string' && /^\d{4}-\d{2}$/.test(req.body.monthKey)
          ? req.body.monthKey
          : getCurrentMonthKey();
      const products = stores[mp].products;
      if (products.length === 0) {
        return res.status(400).json({
          error: `No products stored in ${MARKETPLACES[mp].countryName} (${mp}) yet to snapshot. Run a scrape or import first.`,
        });
      }
      const snapshot = captureMonthlySnapshot(mp, products, undefined, monthKey);
      res.json({ success: true, snapshot });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to capture monthly snapshot' });
    }
  });

  apiRouter.delete('/monthly-snapshots/:id', (req: Request, res: Response) => {
    const deleted = deleteMonthlySnapshot(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Snapshot not found' });
    }
    res.json({ success: true });
  });

  apiRouter.get('/monthly-snapshots/:id/export', (req: Request, res: Response) => {
    const snap = loadMonthlySnapshots().find((s) => s.id === req.params.id);
    if (!snap) {
      return res.status(404).json({ error: 'Snapshot not found' });
    }
    const format = String(req.query.format || 'csv').toLowerCase();
    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="engine_oil_snapshot_${snap.id}.json"`);
      return res.send(JSON.stringify(snap, null, 2));
    }

    const headers = [
      'Month',
      'Marketplace',
      'Currency',
      'ASIN',
      'Brand',
      'Viscosity',
      'Volume (L)',
      'Title',
      `Price (${snap.currency})`,
      `Price/L (${snap.currency})`,
      'Discount %',
      'In Stock',
      'Availability',
      'BSR',
      'Rating',
      'Review Count',
      'Est Monthly Sales',
      `Est Monthly Revenue (${snap.currency})`,
      'Sold By',
      'Product URL',
    ];
    const rows = snap.products.map((p) => [
      `"${snap.monthKey}"`,
      `"${snap.marketplace}"`,
      `"${snap.currency}"`,
      `"${p.asin}"`,
      `"${p.brand.replace(/"/g, '""')}"`,
      `"${p.viscosity}"`,
      p.volumeLiters,
      `"${p.title.replace(/"/g, '""')}"`,
      p.currentPriceAud.toFixed(2),
      p.pricePerLiterAud.toFixed(2),
      p.discountPct.toFixed(1),
      p.inStock ? 'Yes' : 'No',
      `"${p.availability}"`,
      p.bsr,
      p.rating.toFixed(1),
      p.reviewCount,
      p.estMonthlySales,
      p.estMonthlyRevenueAud.toFixed(2),
      `"${(p.soldBy || '').replace(/"/g, '""')}"`,
      `"${p.productUrl}"`,
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="engine_oil_snapshot_${snap.id}.csv"`);
    return res.send(csv);
  });

  // 19. Settings Endpoints
  apiRouter.get('/settings', (_req: Request, res: Response) => {
    const s = loadPlatformSettings();
    res.json({
      includeTax: s.includeTax,
      fbaFeeModel: s.fbaFeeModel,
      pollFrequency: s.pollFrequency,
      autoMonthlyCapture: s.autoMonthlyCapture,
      spApiClientId: s.spApiClientId,
      hasRainforestApiKey: Boolean(s.rainforestApiKey),
      rainforestApiKeyMasked: maskSecret(s.rainforestApiKey),
      hasKeepaApiKey: Boolean(s.keepaApiKey),
      keepaApiKeyMasked: maskSecret(s.keepaApiKey),
      updatedAt: s.updatedAt,
    });
  });

  apiRouter.post('/settings', (req: Request, res: Response) => {
    const body = req.body || {};
    const patch: Record<string, unknown> = {};
    if (typeof body.includeTax === 'boolean') patch.includeTax = body.includeTax;
    if (typeof body.fbaFeeModel === 'string') patch.fbaFeeModel = body.fbaFeeModel;
    if (typeof body.pollFrequency === 'string') patch.pollFrequency = body.pollFrequency;
    if (typeof body.autoMonthlyCapture === 'boolean') patch.autoMonthlyCapture = body.autoMonthlyCapture;
    if (typeof body.spApiClientId === 'string') patch.spApiClientId = body.spApiClientId.trim();
    if (typeof body.rainforestApiKey === 'string' && !body.rainforestApiKey.startsWith('••••')) {
      patch.rainforestApiKey = body.rainforestApiKey.trim();
    }
    if (typeof body.keepaApiKey === 'string' && !body.keepaApiKey.startsWith('••••')) {
      patch.keepaApiKey = body.keepaApiKey.trim();
    }

    const updated = savePlatformSettings(patch);
    res.json({
      success: true,
      includeTax: updated.includeTax,
      fbaFeeModel: updated.fbaFeeModel,
      pollFrequency: updated.pollFrequency,
      autoMonthlyCapture: updated.autoMonthlyCapture,
      spApiClientId: updated.spApiClientId,
      hasRainforestApiKey: Boolean(updated.rainforestApiKey),
      rainforestApiKeyMasked: maskSecret(updated.rainforestApiKey),
      hasKeepaApiKey: Boolean(updated.keepaApiKey),
      keepaApiKeyMasked: maskSecret(updated.keepaApiKey),
      updatedAt: updated.updatedAt,
    });
  });

  // 20. GET /api/export/:format
  apiRouter.get('/export/:format', (req: Request, res: Response) => {
    const mp = getMp(req);
    const cfg = MARKETPLACES[mp];
    const { format } = req.params;
    const products = stores[mp].products;

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="amazon_${mp.toLowerCase()}_engine_oil_intelligence.json"`
      );
      return res.send(JSON.stringify(products, null, 2));
    }

    if (format === 'csv' || format === 'excel') {
      const delimiter = format === 'excel' ? '\t' : ',';
      const ext = format === 'excel' ? 'xls' : 'csv';
      const headers = [
        'Marketplace',
        'Currency',
        'ASIN',
        'Title',
        'Brand',
        'Manufacturer',
        'Viscosity',
        'Volume (L)',
        `Price per Litre (${cfg.currency})`,
        `Current Price (${cfg.currency})`,
        `Original Price (${cfg.currency})`,
        'Discount %',
        'Base Oil Type',
        'Engine Compatibility',
        'API Spec',
        'ACEA Spec',
        'OEM Approvals',
        'Variations',
        'In Stock',
        'Stock Status',
        'Page Availability Detail',
        'Sold By',
        'Ships From',
        'Part Number',
        'GTIN / EAN',
        'Item Weight',
        'Est Monthly Sales',
        `Est Monthly Revenue (${cfg.currency})`,
        'BSR',
        'Rating',
        'Review Count',
        'Opportunity Score',
        `Amazon ${mp} URL`,
        'Last Scraped At',
        'Description',
      ];

      const rows = products.map((p) => [
        `"${mp}"`,
        `"${cfg.currency}"`,
        `"${p.asin}"`,
        `"${p.title.replace(/"/g, '""')}"`,
        `"${p.brand.replace(/"/g, '""')}"`,
        `"${p.manufacturer.replace(/"/g, '""')}"`,
        `"${p.viscosity}"`,
        p.volumeLiters,
        `${cfg.currencySymbol}${p.pricePerLiterAud.toFixed(2)}`,
        p.currentPriceAud.toFixed(2),
        p.originalPriceAud.toFixed(2),
        p.discountPct.toFixed(1),
        `"${p.oilType}"`,
        `"${p.engineCompatibility}"`,
        `"${p.apiStandard}"`,
        `"${p.aceaStandard}"`,
        `"${(p.oemApprovals || []).join('; ').replace(/"/g, '""')}"`,
        `"${(p.variations || []).join('; ').replace(/"/g, '""')}"`,
        p.inStock ? 'Yes' : 'No',
        `"${p.availability}"`,
        `"${(p.availabilityDetail || p.availability).replace(/"/g, '""')}"`,
        `"${(p.soldBy || `Amazon ${mp}`).replace(/"/g, '""')}"`,
        `"${(p.shipsFrom || `Amazon ${mp}`).replace(/"/g, '""')}"`,
        `"${(p.partNumber || '').replace(/"/g, '""')}"`,
        `"${(p.gtin || '').replace(/"/g, '""')}"`,
        `"${(p.itemWeight || '').replace(/"/g, '""')}"`,
        p.estMonthlySales,
        p.estMonthlyRevenueAud.toFixed(2),
        p.bsr,
        p.rating.toFixed(1),
        p.reviewCount,
        p.opportunity.overallScore,
        `"${p.productUrl}"`,
        `"${p.lastScrapedAt}"`,
        `"${p.description.replace(/"/g, '""')}"`,
      ]);

      const content = [headers.join(delimiter), ...rows.map((r) => r.join(delimiter))].join('\n');
      res.setHeader('Content-Type', format === 'excel' ? 'application/vnd.ms-excel' : 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="amazon_${mp.toLowerCase()}_engine_oil_intelligence.${ext}"`
      );
      return res.send(content);
    }

    if (format === 'pdf') {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Amazon ${cfg.countryName} Engine Oil Intelligence Report</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; background: #ffffff; color: #1e1b4b; }
            h1 { font-size: 24px; color: #4c1d95; margin-bottom: 4px; }
            .meta { color: #64748b; font-size: 13px; margin-bottom: 24px; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 11px; background: #ffffff; }
            th { text-align: left; background: #faf5ff; color: #581c87; padding: 8px; border-bottom: 2px solid #c084fc; font-weight: 600; }
            td { padding: 8px; border-bottom: 1px solid #f3e8ff; vertical-align: top; }
            .num { text-align: right; font-variant-numeric: tabular-nums; }
            .score { font-weight: bold; color: #7c3aed; }
            a { color: #6d28d9; text-decoration: underline; }
          </style>
        </head>
        <body>
          <h1>Amazon ${cfg.countryName} Engine Oil Live Market Audit</h1>
          <div class="meta">Generated: ${new Date().toLocaleDateString()} · Currency: ${cfg.currency} · Source: ${cfg.domain} · Records: ${products.length}</div>
          <table>
            <thead>
              <tr>
                <th>ASIN</th>
                <th>Brand</th>
                <th>Viscosity</th>
                <th>Product Title & Specs</th>
                <th class="num">${cfg.currencySymbol}/Litre</th>
                <th class="num">Price (${cfg.currency})</th>
                <th>Stock</th>
                <th class="num">Est Mo. Sales</th>
                <th class="num">Est Mo. Revenue</th>
                <th class="num">BSR</th>
                <th class="num">Rating</th>
                <th class="num">Score</th>
                <th>Amazon ${mp} Product Link</th>
              </tr>
            </thead>
            <tbody>
              ${products
                .map(
                  (p) => `
                <tr>
                  <td><code>${p.asin}</code></td>
                  <td><strong style="color:#6d28d9;">${p.brand}</strong></td>
                  <td><span style="background:#f3e8ff;color:#6d28d9;border:1px solid #e9d5ff;padding:2px 6px;border-radius:4px;font-family:monospace;font-size:11px;font-weight:600;">${p.viscosity}</span></td>
                  <td>
                    <div><strong>${p.title}</strong></div>
                    <div style="color:#64748b;font-size:10px;margin-top:2px;">${p.volumeLiters}L · ${p.oilType} · ${p.apiStandard} · ${p.soldBy || `Amazon ${mp}`}${p.partNumber ? ` · Part# ${p.partNumber}` : ''}</div>
                  </td>
                  <td class="num"><strong>${p.pricePerLiterAud > 0 ? `${cfg.currencySymbol}${p.pricePerLiterAud.toFixed(2)}/L` : '—'}</strong></td>
                  <td class="num">${p.currentPriceAud > 0 ? `${cfg.currencySymbol}${p.currentPriceAud.toFixed(2)}` : 'Unavailable'}</td>
                  <td><span style="padding:2px 6px;border-radius:4px;font-size:10px;font-weight:600;background:${p.inStock ? '#ecfdf5;color:#047857' : '#fff1f2;color:#be123c'};">${p.availability}</span></td>
                  <td class="num">${p.estMonthlySales.toLocaleString()}</td>
                  <td class="num">${cfg.currencySymbol}${Math.round(p.estMonthlyRevenueAud).toLocaleString()}</td>
                  <td class="num">#${p.bsr}</td>
                  <td class="num">★ ${p.rating.toFixed(1)} (${p.reviewCount.toLocaleString()})</td>
                  <td class="num score">${p.opportunity.overallScore}/100</td>
                  <td><a href="${p.productUrl}" target="_blank">${p.productUrl}</a></td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
          <script>window.onload = function() { window.print(); };</script>
        </body>
        </html>
      `;
      res.setHeader('Content-Type', 'text/html');
      return res.send(html);
    }

    res.status(400).json({ error: 'Unsupported format. Use csv, excel, json, or pdf.' });
  });

  app.use('/api', apiRouter);

  const vite = await createViteServer({
    server: {
      middlewareMode: true,
      allowedHosts: true,
    },
    appType: 'spa',
  });
  app.use(vite.middlewares);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[ApexLube Multi-Market] Live Engine Oil Scraper & Monthly Archive Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
