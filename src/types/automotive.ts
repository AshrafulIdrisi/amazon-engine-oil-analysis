export type MarketplaceCode = 'AU' | 'US' | 'DE' | 'PL' | 'PT';
export type CurrencyCode = 'AUD' | 'USD' | 'EUR' | 'PLN';

export interface MarketplaceConfig {
  code: MarketplaceCode;
  countryName: string;
  domain: string;
  currency: CurrencyCode;
  currencySymbol: string;
  marketplaceId: string;
  zipCode: string;
  locationLabel: string;
  directHtmlSupported: boolean;
  bestsellersNode: string;
}

export type EngineOilCategorySlug =
  | 'full-synthetic'
  | 'semi-synthetic'
  | 'mineral-oils'
  | 'heavy-duty-diesel'
  | 'high-mileage'
  | 'racing-performance'
  | 'european-spec'
  | '0w-20-fuel-economy'
  | '5w-30-passenger'
  | '5w-40-full-protection'
  | '10w-40-high-protection'
  | '15w-40-towing-diesel'
  | 'motorcycle-4t'
  | 'classic-car-high-zinc'
  | 'engine-flush-cleaners'
  | 'oil-additives-stabilizers';

export type OilBaseType = 'Full Synthetic' | 'Semi-Synthetic' | 'Mineral' | '100% PAO / Ester';

export type ViscosityGrade =
  | '0W-16'
  | '0W-20'
  | '0W-30'
  | '0W-40'
  | '5W-20'
  | '5W-30'
  | '5W-40'
  | '5W-50'
  | '5W-60'
  | '10W-30'
  | '10W-40'
  | '10W-50'
  | '10W-60'
  | '15W-40'
  | '15W-50'
  | '15W-60'
  | '20W-50'
  | '20W-60'
  | '25W-50'
  | '25W-60'
  | '30W-70'
  | 'SAE 30'
  | 'SAE 40'
  | 'SAE 50'
  | 'Monograde';

export type EngineCompatibility =
  | 'Petrol & Hybrid'
  | 'Diesel with DPF (Low SAPS)'
  | 'Heavy Towing & 4WD Turbo Diesel'
  | 'High-Performance & Track'
  | 'Universal Petrol & Light Diesel'
  | 'Vintage & Classic Pushrod';

export interface AutomotiveCategory {
  id: string;
  name: string;
  slug: EngineOilCategorySlug;
  productCount: number;
  avgPriceAud: number;
  avgDiscountPct: number;
  estMonthlySalesUnits: number;
  estMonthlyRevenueAud: number;
  topBrands: string[];
  demandLevel: 'High' | 'Very High' | 'Moderate' | 'Explosive';
  description: string;
}

export interface PricePoint {
  date: string;
  priceAud: number;
  originalPriceAud?: number;
  discountPct?: number;
  isDeal?: boolean;
  couponAud?: number;
  eventType?: 'normal' | 'lightning_deal' | 'coupon' | 'price_drop' | 'price_hike';
}

export interface SalesHistoryPoint {
  date: string;
  estMonthlyUnits: number;
  estMonthlyRevenueAud: number;
  bsr: number;
}

export interface CompetitorProduct {
  competitorAsin: string;
  title: string;
  brand: string;
  priceAud: number;
  viscosity: ViscosityGrade;
  volumeLiters: number;
  pricePerLiterAud: number;
  rating: number;
  reviewCount: number;
  bsr: number;
  discountPct: number;
  estMonthlySales: number;
  estMonthlyRevenue: number;
  similarityScore: number;
  priceDifferencePct: number;
  imageUrl?: string;
}

export interface OpportunityScoreBreakdown {
  overallScore: number; // 0 - 100
  demandScore: number; // 0 - 30 weight (Australian sales velocity)
  marginScore: number; // 0 - 25 weight (Price/Litre & 5L FBA unit margin)
  competitionScore: number; // 0 - 20 weight (Review moat & competitor concentration)
  ratingGapScore: number; // 0 - 15 weight (Unmet viscosity or DPF approval gaps)
  promoElasticityScore: number; // 0 - 10 weight (Subscribe & Save / coupon conversion lift)
  keyVerdict: string;
  strengths: string[];
  risks: string[];
}

export type StockAvailabilityStatus =
  | 'In Stock'
  | 'Low Stock'
  | 'Only 2 Left'
  | 'Buying Options Only'
  | 'Temporarily Out of Stock'
  | 'Currently Unavailable'
  | 'Pre-order';

export interface AutomotiveProduct {
  asin: string;
  marketplace?: MarketplaceCode;
  currency?: CurrencyCode;
  title: string;
  brand: string;
  manufacturer: string;
  categoryId: EngineOilCategorySlug;
  categoryName: string;
  productUrl: string;
  imageUrl: string;
  description: string;

  // Engine Oil Specific Attributes & Minor Details
  viscosity: ViscosityGrade;
  volumeLiters: number;
  pricePerLiterAud: number;
  oilType: OilBaseType;
  engineCompatibility: EngineCompatibility;
  apiStandard: string; // e.g. API SP, API SN Plus, API CK-4
  aceaStandard: string; // e.g. ACEA C3, ACEA A3/B4
  oemApprovals: string[]; // e.g. BMW LL-04, MB 229.51, VW 504.00/507.00, Ford WSS-M2C913-D
  zincContentPpm?: number; // Full Zinc ZDDP ppm
  specifications: Record<string, string>;
  variations?: string[];
  partNumber?: string;
  gtin?: string;
  itemWeight?: string;
  packageDimensions?: string;
  countryOfOrigin?: string;
  dateFirstAvailable?: string;

  // Pricing (AUD)
  currentPriceAud: number;
  originalPriceAud: number;
  listPriceAud: number;
  salePriceAud?: number;
  couponPriceAud?: number;
  discountPct: number;
  lowestPriceAud: number;
  highestPriceAud: number;
  avgPriceAud: number;

  // Promotions
  hasCoupon: boolean;
  couponValueAud?: number;
  dealBadge?: 'Lightning Deal' | 'Best Seller' | 'Amazon Choice' | 'Limited Time Deal' | 'Save 15%' | null;
  isLightningDeal: boolean;
  subscribeAndSave: boolean;
  promoHistoryCount: number;

  // Sales Intelligence (Estimated)
  estDailySales: number;
  estWeeklySales: number;
  estMonthlySales: number;
  estMonthlyRevenueAud: number;
  salesGrowthPct: number;
  demandIndicator: 'High' | 'Very High' | 'Surging' | 'Moderate';

  // Ranking
  bsr: number;
  categoryRank: number;
  subcategoryRank: number;
  bsrChange7dPct: number;

  // Reviews
  rating: number;
  reviewCount: number;
  ratingDistribution: {
    fiveStar: number;
    fourStar: number;
    threeStar: number;
    twoStar: number;
    oneStar: number;
  };
  reviewGrowth30d: number;

  // Inventory, Seller & Stock Verification
  availability: StockAvailabilityStatus;
  availabilityDetail?: string;
  stockQuantityLeft?: number;
  hasAddToCart?: boolean;
  soldBy?: string;
  shipsFrom?: string;
  isPrime?: boolean;
  deliveryEstimate?: string;
  returnPolicy?: string;
  verifiedLocation?: string;
  inStock: boolean;
  isTrending: boolean;
  isTracked: boolean;
  opportunity: OpportunityScoreBreakdown;

  // Timestamps
  lastScrapedAt: string;
  firstTrackedAt: string;

  // Historical data
  priceHistory: PricePoint[];
  salesHistory: SalesHistoryPoint[];
  competitors: CompetitorProduct[];
}

export interface BrandIntelligence {
  id: string;
  name: string;
  origin: string;
  productCount: number;
  avgPriceAud: number;
  avgPricePerLiterAud: number;
  avgRating: number;
  totalEstMonthlySales: number;
  totalEstMonthlyLiters: number;
  totalEstRevenueAud: number;
  avgDiscountPct: number;
  marketTier: 'Budget' | 'Mid-tier' | 'Premium' | 'Enthusiast / Racing';
  topViscosities: string[];
  promoFrequencyPct: number;
  marketSharePct: number;
  australianFormulated: boolean;
}

export interface CollectionJob {
  id: string;
  marketplace?: MarketplaceCode;
  name: string;
  provider:
    | 'Amazon.com.au Live Scraper'
    | 'Amazon SP-API'
    | 'Licensed Partner API'
    | 'CSV / Excel Upload';
  category: string;
  status: 'running' | 'completed' | 'queued' | 'failed';
  itemsProcessed: number;
  itemsUpdated: number;
  newDiscountsFound: number;
  durationMs: number;
  scheduledTime: string;
  completedAt?: string;
  logs: string[];
}

export interface MarketAnalyticsSummary {
  totalProductsTracked: number;
  inStockCount?: number;
  outOfStockCount?: number;
  totalBrandsTracked: number;
  avgProductPriceAud: number;
  avgPricePerLiterAud: number;
  avgDiscountPct: number;
  productsWithPromotions: number;
  estMonthlySalesTotal: number;
  estMonthlyLitersTotal: number;
  estMonthlyRevenueTotalAud: number;
  productsWithPriceDrops: number;
  trendingProductsCount: number;
  topViscosityGrade: string;
  hottestPriceDropAsin: string;
}

export interface MonthlySnapshotProduct {
  asin: string;
  title: string;
  brand: string;
  viscosity: ViscosityGrade;
  volumeLiters: number;
  currentPriceAud: number;
  originalPriceAud: number;
  pricePerLiterAud: number;
  discountPct: number;
  inStock: boolean;
  availability: StockAvailabilityStatus;
  bsr: number;
  rating: number;
  reviewCount: number;
  estMonthlySales: number;
  estMonthlyRevenueAud: number;
  soldBy?: string;
  productUrl: string;
}

export interface MonthlySnapshot {
  id: string;
  marketplace: MarketplaceCode;
  monthKey: string;
  currency: CurrencyCode;
  capturedAt: string;
  sourceJobId?: string;
  summary: {
    totalSkus: number;
    inStockCount: number;
    outOfStockCount: number;
    avgPrice: number;
    avgPricePerLiter: number;
    avgDiscountPct: number;
    estMonthlySalesTotal: number;
    estMonthlyRevenueTotal: number;
  };
  products: MonthlySnapshotProduct[];
}

export type ActiveTab =
  | 'dashboard'
  | 'discovery'
  | 'database'
  | 'price-tracker'
  | 'sales-intel'
  | 'promotions'
  | 'competitor-analysis'
  | 'brand-analysis'
  | 'category-analysis'
  | 'opportunities'
  | 'monthly-archive'
  | 'jobs'
  | 'settings';
