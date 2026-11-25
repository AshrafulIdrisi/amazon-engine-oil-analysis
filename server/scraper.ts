import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import * as cheerio from 'cheerio';
import {
  AutomotiveCategory,
  AutomotiveProduct,
  BrandIntelligence,
  CollectionJob,
  CompetitorProduct,
  EngineCompatibility,
  EngineOilCategorySlug,
  MarketAnalyticsSummary,
  MarketplaceCode,
  OilBaseType,
  OpportunityScoreBreakdown,
  StockAvailabilityStatus,
  ViscosityGrade,
} from '../src/types/automotive.ts';
import { MARKETPLACES } from './marketplaces.ts';
import { loadPlatformSettings } from './monthlyStore.ts';

const execFileAsync = promisify(execFile);

const DATA_DIR = path.resolve(process.cwd(), 'data');

function getCookieJarPath(mp: MarketplaceCode): string {
  return `/tmp/amz_live_cookies_${mp}.txt`;
}

function getStorePath(mp: MarketplaceCode): string {
  return mp === 'AU'
    ? path.join(DATA_DIR, 'scraped_engine_oils.json')
    : path.join(DATA_DIR, `scraped_engine_oils_${mp}.json`);
}

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

export interface ScrapedStore {
  products: AutomotiveProduct[];
  jobs: CollectionJob[];
  lastFullScrapeAt: string | null;
}

interface SeedCard {
  asin: string;
  title: string;
  priceAud: number;
  originalPriceAud: number;
  rating: number;
  reviewCount: number;
  imageUrl: string;
  bestsellerRank?: number;
  dealBadge?: AutomotiveProduct['dealBadge'];
  sourceUrl: string;
}

const locationSetAtMap: Partial<Record<MarketplaceCode, number>> = {};
const locationInitPromises: Partial<Record<MarketplaceCode, Promise<void> | null>> = {};

const EXCLUDE_KEYWORDS = [
  'chain lube',
  'chain & bar',
  'chain and bar',
  'chain oil',
  'chain lubricant',
  'chain wax',
  'bicycle',
  'bike chain',
  'ebike',
  'fork oil',
  'suspension shock',
  'shock oil',
  'air filter oil',
  'foam filter oil',
  'gear oil',
  'axle oil',
  'differential oil',
  'transmax',
  'transmission fluid',
  'atf',
  'power steering',
  'hydraulic',
  'compressor oil',
  'refrigeration',
  'a/c comp',
  'pag 46',
  'uv dye',
  'leak stop',
  'stop leak',
  'shudder fix',
  'degreaser',
  'demineralised water',
  'lithium grease',
  'heavy duty grease',
  'penetrant spray',
  'silicone lubricant spray',
  'ptfe spray',
  'lanolin lubricant',
  'multi-purpose oil',
  'multi-purpose lubricant',
  'fine oil',
  'chain oiler',
  'oil extractor',
  'transfer pump',
  'suction pump',
  'oil cooler',
  'catch can',
  'oil pan',
  'drain plug',
  'oil filter',
  'fuel filter',
  'air filter',
  'service kit',
  'oil change kit',
  'care kit',
  'lubrication guides',
  'engine flush',
  'flush',
  'brake fluid',
  'coolant',
  'antifreeze',
  'windscreen washer',
  'fuel injector cleaner',
  'fuel additive',
  'fuel treatment',
  'octane booster',
  // German & Polish exclusions (gear oil, filters, brake fluid, coolant, flush)
  'ölfilter',
  'luftfilter',
  'kraftstofffilter',
  'getriebeöl',
  'bremsflüssigkeit',
  'kühlmittel',
  'frostschutz',
  'filtr oleju',
  'filtr powietrza',
  'filtr paliwa',
  'olej przekładniowy',
  'płyn hamulcowy',
  'płyn chłodniczy',
  'płukanka',
  // Portuguese & Spanish exclusions
  'filtro de óleo',
  'filtro de aceite',
  'filtro de ar',
  'filtro de aire',
  'óleo de transmissão',
  'aceite de transmisión',
  'óleo de caixa',
  'líquido de travões',
  'líquido de frenos',
  'óleo de corrente',
  'aceite de cadena',
  'anticongelante',
  'limpa para-brisas',
  'azeite',
  'óleo de cozinha',
];

const VISCOSITY_PATTERNS: Array<{ regex: RegExp; grade: ViscosityGrade }> = [
  { regex: /\b0W[- ]?16\b/i, grade: '0W-16' },
  { regex: /\b0W[- ]?20\b/i, grade: '0W-20' },
  { regex: /\b0W[- ]?30\b/i, grade: '0W-30' },
  { regex: /\b0W[- ]?40\b/i, grade: '0W-40' },
  { regex: /\b5W[- ]?20\b/i, grade: '5W-20' },
  { regex: /\b5W[- ]?30\b/i, grade: '5W-30' },
  { regex: /\b5W[- ]?40\b/i, grade: '5W-40' },
  { regex: /\b5W[- ]?50\b/i, grade: '5W-50' },
  { regex: /\b5W[- ]?60\b/i, grade: '5W-60' },
  { regex: /\b10W[- ]?30\b/i, grade: '10W-30' },
  { regex: /\b10W[- ]?40\b/i, grade: '10W-40' },
  { regex: /\b10W[- ]?50\b/i, grade: '10W-50' },
  { regex: /\b10W[- ]?60\b/i, grade: '10W-60' },
  { regex: /\b15W[- ]?40\b/i, grade: '15W-40' },
  { regex: /\b15W[- ]?50\b/i, grade: '15W-50' },
  { regex: /\b15W[- ]?60\b/i, grade: '15W-60' },
  { regex: /\b20W[- ]?50\b/i, grade: '20W-50' },
  { regex: /\b20W[- ]?60\b/i, grade: '20W-60' },
  { regex: /\b25W[- ]?50\b/i, grade: '25W-50' },
  { regex: /\b25W[- ]?60\b/i, grade: '25W-60' },
  { regex: /\b30W[- ]?70\b/i, grade: '30W-70' },
  { regex: /\bSAE\s*30\b/i, grade: 'SAE 30' },
  { regex: /\bSAE\s*40\b/i, grade: 'SAE 40' },
  { regex: /\bSAE\s*50\b/i, grade: 'SAE 50' },
];

export function isGenuineEngineOil(title: string): boolean {
  const lower = title.toLowerCase();
  if (!lower || lower.length < 8) return false;
  for (const bad of EXCLUDE_KEYWORDS) {
    if (lower.includes(bad)) return false;
  }
  const hasViscosity =
    /\b(?:0W|5W|10W|15W|20W|25W|30W)[- ]?(?:16|20|30|40|50|60|70)\b/i.test(title) ||
    /\bSAE\s*(?:30|40|50)\b/i.test(title);
  const hasMotorKeywords =
    lower.includes('engine oil') ||
    lower.includes('motor oil') ||
    lower.includes('motoroil') ||
    lower.includes('diesel oil') ||
    lower.includes('motorenöl') ||
    lower.includes('motoröl') ||
    lower.includes('olej silnikowy') ||
    lower.includes('óleo de motor') ||
    lower.includes('óleo para motor') ||
    lower.includes('oleo de motor') ||
    lower.includes('oleo motor') ||
    lower.includes('lubrificante de motor') ||
    lower.includes('aceite de motor') ||
    lower.includes('aceite motor') ||
    lower.includes('4t') ||
    lower.includes('2t') ||
    lower.includes('2-cycle') ||
    lower.includes('2-stroke') ||
    lower.includes('4-stroke') ||
    lower.includes('4 stroke');
  return hasViscosity || hasMotorKeywords;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function cleanCheerioText($: cheerio.CheerioAPI, root: cheerio.Cheerio<any>): string {
  if (!root || root.length === 0) return '';
  const cloned = root.clone();
  cloned.find('script, style, noscript').remove();
  return cloned
    .text()
    .replace(/[\u200e\u200f\u202a-\u202e]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function rawCurlGet(
  url: string,
  mp: MarketplaceCode = 'AU'
): Promise<{ status: number; html: string }> {
  const cookieJar = getCookieJarPath(mp);
  const langHeader =
    mp === 'DE'
      ? 'Accept-Language: de-DE,de;q=0.9,en;q=0.8'
      : mp === 'PL'
      ? 'Accept-Language: pl-PL,pl;q=0.9,en;q=0.8'
      : mp === 'PT'
      ? 'Accept-Language: pt-PT,pt;q=0.9,es;q=0.7,en;q=0.5'
      : mp === 'US'
      ? 'Accept-Language: en-US,en;q=0.9'
      : 'Accept-Language: en-AU,en;q=0.9';

  const { stdout } = await execFileAsync(
    'curl',
    [
      '-sS',
      '--compressed',
      '-L',
      '--max-time',
      '22',
      '-c',
      cookieJar,
      '-b',
      cookieJar,
      '-H',
      `User-Agent: ${USER_AGENT}`,
      '-H',
      'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      '-H',
      langHeader,
      '-H',
      'Upgrade-Insecure-Requests: 1',
      '-w',
      '\n__HTTP_STATUS__:%{http_code}',
      url,
    ],
    { maxBuffer: 22 * 1024 * 1024 }
  );

  const markerIdx = stdout.lastIndexOf('\n__HTTP_STATUS__:');
  const statusStr = markerIdx >= 0 ? stdout.slice(markerIdx + '\n__HTTP_STATUS__:'.length).trim() : '200';
  const html = markerIdx >= 0 ? stdout.slice(0, markerIdx) : stdout;
  const status = parseInt(statusStr, 10) || 0;
  return { status, html };
}

function isAmazonCaptchaHtml(html: string): boolean {
  return (
    html.includes('Type the characters you see in this image') ||
    html.includes('/errors/validateCaptcha') ||
    html.includes('opfcaptcha') ||
    html.includes('api-services-support@amazon.com')
  );
}

export async function ensureLocationCookie(mp: MarketplaceCode = 'AU', force = false): Promise<void> {
  const lastSet = locationSetAtMap[mp] || 0;
  if (!force && lastSet > 0 && Date.now() - lastSet < 20 * 60 * 1000) {
    return;
  }
  if (locationInitPromises[mp]) {
    return locationInitPromises[mp]!;
  }

  const cfg = MARKETPLACES[mp];
  const cookieJar = getCookieJarPath(mp);
  const bootstrapUrl =
    mp === 'PT'
      ? `https://${cfg.domain}/-/pt/gp/bestsellers/automotive/${cfg.bestsellersNode}`
      : mp === 'US'
      ? `https://${cfg.domain}/gp/bestsellers/automotive/${cfg.bestsellersNode}`
      : mp === 'AU'
      ? `https://${cfg.domain}/dp/B0BHW3R87B`
      : `https://${cfg.domain}/gp/bestsellers/automotive/${cfg.bestsellersNode}`;

  locationInitPromises[mp] = (async () => {
    try {
      const { html } = await rawCurlGet(bootstrapUrl, mp);
      if (isAmazonCaptchaHtml(html)) {
        return;
      }
      const $ = cheerio.load(html);
      const currentLoc = cleanCheerioText($, $('#glow-ingress-line2'));
      const locAlreadyOk =
        mp === 'PT'
          ? currentLoc.toLowerCase().includes('portugal')
          : currentLoc.includes(cfg.zipCode);
      if (!force && locAlreadyOk) {
        locationSetAtMap[mp] = Date.now();
        return;
      }

      const csrfMatch =
        html.match(/anti-csrftoken-a2z["'\s:=]+([^"'\s,}]+)/i) ||
        html.match(/CSRF_TOKEN\s*[:=]\s*["']([^"']+)/i);
      const token = csrfMatch?.[1] || '';

      const locationPayload =
        mp === 'PT'
          ? 'locationType=COUNTRY&district=PT&countryCode=PT&storeContext=automotive&deviceType=web&pageType=Detail&actionSource=glow'
          : `locationType=LOCATION_INPUT&zipCode=${encodeURIComponent(cfg.zipCode)}&storeContext=automotive&deviceType=web&pageType=Detail&actionSource=glow`;

      const { stdout: ajaxRes } = await execFileAsync('curl', [
        '-sS',
        '--compressed',
        '-L',
        '--max-time',
        '15',
        '-c',
        cookieJar,
        '-b',
        cookieJar,
        '-H',
        `User-Agent: ${USER_AGENT}`,
        '-H',
        'Accept: application/json, text/javascript, */*; q=0.01',
        '-H',
        'Content-Type: application/x-www-form-urlencoded;charset=UTF-8',
        '-H',
        `Origin: https://${cfg.domain}`,
        '-H',
        `Referer: ${bootstrapUrl}`,
        '-H',
        'X-Requested-With: XMLHttpRequest',
        ...(token ? ['-H', `anti-csrftoken-a2z: ${token}`] : []),
        '--data',
        locationPayload,
        `https://${cfg.domain}/portal-migration/hz/glow/address-change?actionSource=glow`,
      ]);

      if (ajaxRes.includes('"successful":1') || ajaxRes.includes(`"countryCode":"${mp}"`)) {
        locationSetAtMap[mp] = Date.now();
      }
    } catch (err) {
      console.warn(`[Scraper] Unable to enforce ${mp} (${cfg.zipCode}) location session:`, (err as Error).message);
    } finally {
      locationInitPromises[mp] = null;
    }
  })();

  return locationInitPromises[mp]!;
}

export async function fetchAmazonHtml(url: string, mp: MarketplaceCode = 'AU'): Promise<string> {
  const cfg = MARKETPLACES[mp];
  await ensureLocationCookie(mp);
  const { status, html } = await rawCurlGet(url, mp);

  if (isAmazonCaptchaHtml(html)) {
    throw new Error(
      `CAPTCHA_BLOCKED: ${cfg.domain} served a CAPTCHA verification page to direct requests. Configure an authorized Rainforest API key in Settings or upload CSV/JSON for ${cfg.countryName}.`
    );
  }
  if (status >= 400 || status === 0) {
    throw new Error(`${cfg.domain} returned HTTP ${status} for ${url}`);
  }
  if (html.length < 3000) {
    throw new Error(`${cfg.domain} returned an unexpectedly small response (${html.length} bytes) for ${url}`);
  }
  return html;
}

function parsePriceNumber(raw: string): number {
  if (!raw) return 0;
  let cleaned = raw.replace(/AUD|USD|EUR|PLN|AU|zł|€|\$|\s|\u00a0/gi, '').trim();
  // European format e.g. "1.234,56" or "39,99"
  if (/^\d{1,3}(?:\.\d{3})*,\d{1,2}$/.test(cleaned)) {
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } else if (/^\d+,\d{1,2}$/.test(cleaned)) {
    cleaned = cleaned.replace(',', '.');
  } else {
    cleaned = cleaned.replace(/,/g, '');
  }
  const match = cleaned.match(/\d+(?:\.\d{1,2})?/);
  if (!match) return 0;
  const val = parseFloat(match[0]);
  return Number.isFinite(val) ? val : 0;
}

function extractPriceFromCheerio($: cheerio.CheerioAPI, root: cheerio.Cheerio<any>): number {
  // Prefer .a-price-whole + .a-price-fraction because .a-offscreen on some widgets strips dots
  const aPrices = root.find('.a-price').not('.a-text-price');
  for (let idx = 0; idx < aPrices.length; idx++) {
    const aPrice = aPrices.eq(idx);
    const whole = aPrice.find('.a-price-whole').first().text().replace(/[^\d]/g, '');
    const frac = aPrice.find('.a-price-fraction').first().text().replace(/[^\d]/g, '');
    if (whole) {
      const combined = frac ? `${whole}.${frac.slice(0, 2).padEnd(2, '0')}` : whole;
      const val = parseFloat(combined);
      if (Number.isFinite(val) && val > 0) return val;
    }
    const offscreen = aPrice.find('.a-offscreen').first().text().trim();
    if (offscreen.includes('.') || offscreen.includes(',')) {
      const val = parsePriceNumber(offscreen);
      if (val > 0) return val;
    }
  }

  const p13nText = root
    .find('._cDEzb_p13n-sc-price_3mJ9Z, .p13n-sc-price, .priceToPay .a-offscreen')
    .first()
    .text()
    .trim();
  if (p13nText) {
    const val = parsePriceNumber(p13nText);
    if (val > 0) return val;
  }

  return 0;
}

function parseRatingAndReviews(ratingText: string, reviewsText: string): { rating: number; reviewCount: number } {
  const normRating = ratingText.replace(',', '.');
  const rMatch =
    normRating.match(/([0-5](?:\.\d+)?)\s+(?:out of|von|na|z|de)\s+5/i) ||
    normRating.match(/([0-5](?:\.\d+)?)/);
  const rating = rMatch ? parseFloat(rMatch[1]) : 0;
  const cDigits = reviewsText.replace(/[^\d]/g, '');
  const reviewCount = cDigits ? parseInt(cDigits, 10) : 0;
  return { rating: Number.isFinite(rating) && rating <= 5 ? rating : 0, reviewCount };
}

export async function scrapeBestsellersOilsNode(
  mp: MarketplaceCode = 'AU'
): Promise<{ seeds: SeedCard[]; logs: string[]; captchaBlocked?: boolean }> {
  const cfg = MARKETPLACES[mp];
  const logs: string[] = [];
  const seedMap = new Map<string, SeedCard>();
  const prefix = mp === 'PT' ? '/-/pt' : '';
  const urls = [
    `https://${cfg.domain}${prefix}/gp/bestsellers/automotive/${cfg.bestsellersNode}?pg=1`,
    `https://${cfg.domain}${prefix}/gp/bestsellers/automotive/${cfg.bestsellersNode}?pg=2`,
    `https://${cfg.domain}${prefix}/gp/new-releases/automotive/${cfg.bestsellersNode}`,
    `https://${cfg.domain}${prefix}/gp/movers-and-shakers/automotive/${cfg.bestsellersNode}`,
  ];
  let captchaBlocked = false;

  for (const url of urls) {
    try {
      logs.push(`[GET] Scraping live Amazon ${mp} chart: ${url}`);
      const html = await fetchAmazonHtml(url, mp);
      const $ = cheerio.load(html);
      let pageMatches = 0;

      $('[data-asin]').each((_, el) => {
        const card = $(el);
        const asin = (card.attr('data-asin') || '').trim().toUpperCase();
        if (!/^B[A-Z0-9]{9}$/.test(asin)) return;

        const title =
          card
            .find(
              '._cDEzb_p13n-sc-css-line-clamp-3_g3dy1, ._cDEzb_p13n-sc-css-line-clamp-2_EWgCb, ._cDEzb_p13n-sc-css-line-clamp-4_2q2jd, a.a-link-normal span div'
            )
            .first()
            .text()
            .replace(/\s+/g, ' ')
            .trim() ||
          card.find('img').first().attr('alt') ||
          '';

        if (!isGenuineEngineOil(title)) return;

        const priceAud = extractPriceFromCheerio($, card);
        const rankStr = card.find('.zg-bdg-text').first().text().replace(/[^\d]/g, '');
        const bestsellerRank = rankStr ? parseInt(rankStr, 10) : undefined;
        const ratingStr = card.find('.a-icon-alt').first().text().trim();
        const revStr = card.find('a[href*="customerReviews"] span, .a-size-small').last().text().trim();
        const { rating, reviewCount } = parseRatingAndReviews(ratingStr, revStr);
        const imageUrl = card.find('img').first().attr('src') || '';

        pageMatches++;
        if (!seedMap.has(asin)) {
          seedMap.set(asin, {
            asin,
            title,
            priceAud,
            originalPriceAud: priceAud,
            rating,
            reviewCount,
            imageUrl,
            bestsellerRank,
            dealBadge: bestsellerRank && bestsellerRank <= 5 ? 'Best Seller' : null,
            sourceUrl: url,
          });
        }
      });

      logs.push(`[Parsed] ${pageMatches} genuine engine oil listings from ${url}`);
      await sleep(250);
    } catch (err: any) {
      if (String(err.message).includes('CAPTCHA_BLOCKED')) {
        captchaBlocked = true;
        logs.push(`[CAPTCHA] ${err.message}`);
        break;
      }
      logs.push(`[Warn] Failed to scrape ${url}: ${err.message}`);
    }
  }

  return { seeds: Array.from(seedMap.values()), logs, captchaBlocked };
}

export async function scrapeAmazonSearch(
  query: string,
  maxPages = 2,
  mp: MarketplaceCode = 'AU'
): Promise<{ seeds: SeedCard[]; logs: string[]; captchaBlocked?: boolean }> {
  const cfg = MARKETPLACES[mp];
  const logs: string[] = [];
  const seeds: SeedCard[] = [];
  const trimmed = query.trim();
  const seen = new Set<string>();
  let captchaBlocked = false;

  const prefix = mp === 'PT' ? '/-/pt' : '';
  const targetUrls: string[] = [];
  for (let p = 1; p <= maxPages; p++) {
    if (trimmed === '__browse_node__') {
      targetUrls.push(`https://${cfg.domain}${prefix}/s?i=automotive&rh=n%3A${cfg.bestsellersNode}&page=${p}`);
    } else {
      const encoded = encodeURIComponent(trimmed);
      if (mp === 'AU' || mp === 'PT') {
        targetUrls.push(`https://${cfg.domain}${prefix}/s?i=automotive&rh=n%3A${cfg.bestsellersNode}&k=${encoded}&page=${p}`);
      } else {
        targetUrls.push(`https://${cfg.domain}${prefix}/s?i=automotive&k=${encoded}&page=${p}`);
      }
    }
  }

  for (const url of targetUrls) {
    try {
      logs.push(`[GET] Scraping Amazon ${mp} Search: ${url}`);
      const html = await fetchAmazonHtml(url, mp);
      const $ = cheerio.load(html);
      let count = 0;

      $('[data-component-type="s-search-result"]').each((_, el) => {
        const card = $(el);
        const asin = (card.attr('data-asin') || '').trim().toUpperCase();
        if (!/^B[A-Z0-9]{9}$/.test(asin) || seen.has(asin)) return;

        const titleParts = card
          .find('h2 span')
          .map((__, sp) => $(sp).text().trim())
          .get()
          .filter(Boolean);
        const title = (titleParts.length > 0 ? titleParts.join(' ') : card.find('h2').text())
          .replace(/\s+/g, ' ')
          .trim();

        if (!isGenuineEngineOil(title)) return;

        const priceAud = extractPriceFromCheerio($, card);
        const strikeRaw = card.find('.a-text-price .a-offscreen').first().text().trim();
        const parsedStrike =
          strikeRaw.includes('.') || strikeRaw.includes(',') ? parsePriceNumber(strikeRaw) : 0;
        const originalPriceAud = parsedStrike > priceAud ? parsedStrike : priceAud;
        const ratingStr = card.find('.a-icon-alt').first().text().trim();
        const revStr = card.find('a[href*="customerReviews"] span, span[aria-label*="ratings"]').first().text().trim();
        const { rating, reviewCount } = parseRatingAndReviews(ratingStr, revStr);
        const imageUrl = card.find('img.s-image').first().attr('src') || '';
        const badgeTxt = card.find('.a-badge-text').first().text().trim();

        seen.add(asin);
        count++;
        seeds.push({
          asin,
          title,
          priceAud,
          originalPriceAud,
          rating,
          reviewCount,
          imageUrl,
          dealBadge: badgeTxt.toLowerCase().includes('choice') || badgeTxt.toLowerCase().includes('escolha')
            ? 'Amazon Choice'
            : badgeTxt.toLowerCase().includes('best') ||
              badgeTxt.toLowerCase().includes('bestseller') ||
              badgeTxt.toLowerCase().includes('mais vendido')
            ? 'Best Seller'
            : badgeTxt.toLowerCase().includes('deal') ||
              badgeTxt.toLowerCase().includes('angebot') ||
              badgeTxt.toLowerCase().includes('oferta')
            ? 'Limited Time Deal'
            : null,
          sourceUrl: url,
        });
      });

      logs.push(`[Search] Extracted ${count} engine oil results for "${trimmed}" (${mp})`);
      if (count === 0) break;
      await sleep(250);
    } catch (err: any) {
      if (String(err.message).includes('CAPTCHA_BLOCKED')) {
        captchaBlocked = true;
        logs.push(`[CAPTCHA] ${err.message}`);
        break;
      }
      logs.push(`[Warn] Search error for ${url}: ${err.message}`);
    }
  }

  return { seeds, logs, captchaBlocked };
}

export const scrapeAmazonAuSearch = scrapeAmazonSearch;

function parseViscosity(text: string): ViscosityGrade {
  for (const { regex, grade } of VISCOSITY_PATTERNS) {
    if (regex.test(text)) return grade;
  }
  return '5W-30';
}

function parseVolumeLiters(primaryText: string, secondaryText: string): number {
  const tryExtract = (text: string): number => {
    if (!text) return 0;
    const multiMatch = text.match(/(\d+)\s*[xX×]\s*(\d+(?:\.\d+)?)\s*(?:litres?|liters?|litrów|l)\b/i);
    if (multiMatch) {
      const total = parseInt(multiMatch[1], 10) * parseFloat(multiMatch[2]);
      if (total > 0 && total <= 250) return Math.round(total * 100) / 100;
    }

    const multiQtMatch = text.match(/(\d+)\s*[xX×]\s*(\d+(?:\.\d+)?)\s*(?:quarts?|qts?)\b/i);
    if (multiQtMatch) {
      const total = parseInt(multiQtMatch[1], 10) * parseFloat(multiQtMatch[2]) * 0.94635;
      if (total > 0 && total <= 250) return Math.round(total * 100) / 100;
    }

    const litreMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(?:litres?|liters?|litr[óo]w|l)\b/i);
    if (litreMatch) {
      const val = parseFloat(litreMatch[1].replace(',', '.'));
      if (val > 0 && val <= 205) return Math.round(val * 100) / 100;
    }
    const mlMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:ml|millilitres?|milliliters?)\b/i);
    if (mlMatch) {
      const val = parseFloat(mlMatch[1]) / 1000;
      if (val > 0 && val <= 50) return Math.round(val * 1000) / 1000;
    }
    const qtMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:quart|qt)s?\b/i);
    if (qtMatch) {
      return Math.round(parseFloat(qtMatch[1]) * 0.94635 * 100) / 100;
    }
    const galMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:gallons?|gal)\b/i);
    if (galMatch) {
      return Math.round(parseFloat(galMatch[1]) * 3.78541 * 100) / 100;
    }
    return 0;
  };

  return tryExtract(primaryText) || tryExtract(secondaryText) || 1;
}

function parseStandardsAndApprovals(fullText: string) {
  const apiMatches =
    fullText.match(/API\s+(?:SQ|SP|SN\s*Plus|SN|SM|SL|SJ|CK-4|CJ-4|CI-4|CH-4|CF|FA-4|TC|TC-W3)/gi) || [];
  const aceaMatches = fullText.match(/ACEA\s+[A-E]\d(?:\/[A-E]\d)?/gi) || [];
  const ilsacMatches = fullText.match(/ILSAC\s+GF-?\d[A-B]?/gi) || [];
  const jasoMatches = fullText.match(/JASO\s+M[AB]\d?/gi) || [];

  const oemPatterns = [
    /VW\s+\d{3}\s*00(?:\s*\/\s*\d{3}\s*00)?/gi,
    /BMW\s+(?:Longlife|LL)-\d{2}(?:\s*(?:FE|Plus))?/gi,
    /MB[-\s]+(?:Approval\s+)?229\.\d{1,2}/gi,
    /Porsche\s+[AC]\d{2}/gi,
    /dexos\d?(?:\s*Gen\s*\d)?/gi,
    /Ford\s+WSS-M2C[\w-]+/gi,
    /Renault\s+RN\d{4}/gi,
    /PSA\s+B71\s*\d{4}/gi,
    /Volvo\s+VCC\s*[\w-]+/gi,
    /Fiat\s+9\.55535-[\w-]+/gi,
  ];
  const oems: string[] = [];
  for (const pat of oemPatterns) {
    const found = fullText.match(pat);
    if (found) oems.push(...found.map((s) => s.replace(/\s+/g, ' ').trim()));
  }

  return {
    apiStandard: apiMatches[0] ? apiMatches[0].toUpperCase().replace(/\s+/g, ' ') : 'API Rated',
    aceaStandard:
      aceaMatches[0]?.toUpperCase() ||
      ilsacMatches[0]?.toUpperCase() ||
      jasoMatches[0]?.toUpperCase() ||
      'OEM Spec',
    oemApprovals: Array.from(new Set(oems)).slice(0, 10),
  };
}

function inferCategoryAndCompatibility(
  title: string,
  description: string,
  viscosity: ViscosityGrade
): {
  oilType: OilBaseType;
  engineCompatibility: EngineCompatibility;
  categoryId: EngineOilCategorySlug;
  categoryName: string;
} {
  const combined = `${title} ${description}`.toLowerCase();

  let oilType: OilBaseType = 'Full Synthetic';
  if (combined.includes('pao') || combined.includes('ester')) {
    oilType = '100% PAO / Ester';
  } else if (combined.includes('mineral')) {
    oilType = 'Mineral';
  } else if (
    combined.includes('semi synthetic') ||
    combined.includes('semi-synthetic') ||
    combined.includes('semi syn') ||
    combined.includes('synthetic technology') ||
    combined.includes('gtx') ||
    combined.includes('part synthetic')
  ) {
    oilType =
      combined.includes('full synthetic') || combined.includes('fully synthetic')
        ? 'Full Synthetic'
        : 'Semi-Synthetic';
  }

  let engineCompatibility: EngineCompatibility = 'Universal Petrol & Light Diesel';
  if (combined.includes('dpf') || combined.includes('low saps') || combined.includes('c3') || combined.includes('c2')) {
    engineCompatibility = 'Diesel with DPF (Low SAPS)';
  } else if (combined.includes('diesel') || viscosity === '15W-40') {
    engineCompatibility = 'Heavy Towing & 4WD Turbo Diesel';
  } else if (combined.includes('hybrid') || viscosity === '0W-20' || viscosity === '0W-16') {
    engineCompatibility = 'Petrol & Hybrid';
  } else if (
    combined.includes('racing') ||
    combined.includes('4t') ||
    combined.includes('motorcycle') ||
    viscosity === '10W-60' ||
    viscosity === '0W-40'
  ) {
    engineCompatibility = 'High-Performance & Track';
  } else if (
    combined.includes('classic') ||
    combined.includes('zinc') ||
    viscosity === '20W-50' ||
    viscosity === '25W-50' ||
    viscosity === '30W-70'
  ) {
    engineCompatibility = 'Vintage & Classic Pushrod';
  }

  let categoryId: EngineOilCategorySlug = 'full-synthetic';
  let categoryName = 'Full Synthetic Engine Oils';

  if (
    combined.includes('motorcycle') ||
    combined.includes('4t') ||
    combined.includes('scooter') ||
    combined.includes('2-stroke') ||
    combined.includes('2-cycle')
  ) {
    categoryId = 'motorcycle-4t';
    categoryName = 'Motorcycle 4T & 2T Oils';
  } else if (viscosity === '0W-20' || viscosity === '0W-16') {
    categoryId = '0w-20-fuel-economy';
    categoryName = '0W-20 Fuel Economy & Hybrid Oils';
  } else if (viscosity === '5W-30') {
    categoryId = '5w-30-passenger';
    categoryName = '5W-30 Universal Passenger Oils';
  } else if (viscosity === '5W-40') {
    categoryId = '5w-40-full-protection';
    categoryName = '5W-40 High-Temp Full Synthetic';
  } else if (viscosity === '10W-40' || viscosity === '10W-30') {
    categoryId = '10w-40-high-protection';
    categoryName = '10W-30 & 10W-40 Multi-Grade Oils';
  } else if (viscosity === '15W-40' || combined.includes('diesel')) {
    categoryId = '15w-40-towing-diesel';
    categoryName = '15W-40 Heavy Duty Diesel Oils';
  } else if (
    viscosity === '20W-50' ||
    viscosity === '20W-60' ||
    viscosity === '25W-50' ||
    viscosity === '30W-70'
  ) {
    categoryId = 'classic-car-high-zinc';
    categoryName = '20W-50+ Classic & Heavy Viscosities';
  } else if (oilType === 'Semi-Synthetic') {
    categoryId = 'semi-synthetic';
    categoryName = 'Semi-Synthetic Engine Oils';
  }

  return { oilType, engineCompatibility, categoryId, categoryName };
}

function estimateSalesFromBsr(
  bsr: number,
  subcategoryRank: number,
  inStock: boolean
): { monthly: number; demand: AutomotiveProduct['demandIndicator'] } {
  const effectiveSubRank = subcategoryRank > 0 ? subcategoryRank : Math.max(1, Math.round(bsr / 40));
  const rawMonthly = Math.max(15, Math.round(1450 * Math.pow(effectiveSubRank, -0.56)));
  const monthly = inStock ? rawMonthly : Math.max(0, Math.round(rawMonthly * 0.25));
  const demand: AutomotiveProduct['demandIndicator'] =
    effectiveSubRank <= 5
      ? 'Surging'
      : effectiveSubRank <= 20
      ? 'Very High'
      : effectiveSubRank <= 45
      ? 'High'
      : 'Moderate';
  return { monthly, demand };
}

function calculateOpportunityScore(params: {
  estMonthlySales: number;
  pricePerLiterAud: number;
  reviewCount: number;
  rating: number;
  discountPct: number;
  subscribeAndSave: boolean;
  hasCoupon: boolean;
  oemCount: number;
  inStock: boolean;
}): OpportunityScoreBreakdown {
  const demandScore = Math.min(30, Math.max(6, Math.round((params.estMonthlySales / 1400) * 30)));
  const marginScore =
    params.pricePerLiterAud > 0
      ? Math.min(25, Math.max(10, Math.round((params.pricePerLiterAud / 24) * 20 + 5)))
      : 10;
  const competitionScore = params.reviewCount < 100 ? 18 : params.reviewCount < 500 ? 14 : 10;
  const ratingGapScore = params.rating >= 4.7 ? 13 : params.rating >= 4.3 ? 10 : 12;
  const promoElasticityScore =
    (params.subscribeAndSave ? 4 : 1) + (params.hasCoupon ? 3 : 0) + (params.discountPct > 10 ? 3 : 1);

  const overallScore = Math.min(
    99,
    demandScore + marginScore + competitionScore + ratingGapScore + promoElasticityScore
  );

  const strengths: string[] = [];
  if (params.estMonthlySales >= 400)
    strengths.push(`Strong AU demand velocity (~${params.estMonthlySales.toLocaleString()} units/mo from BSR)`);
  if (params.pricePerLiterAud > 0)
    strengths.push(`Scraped retail unit economics at $${params.pricePerLiterAud.toFixed(2)} AUD/Litre`);
  if (params.reviewCount < 150)
    strengths.push(`Lower review moat (${params.reviewCount} reviews) offers challenger entry window`);
  if (params.oemCount > 0) strengths.push(`Verified ${params.oemCount} OEM / specification approvals on listing`);
  if (!params.inStock)
    strengths.push('Competitor stock-out gap detected in Amazon Australia — immediate Buy Box capture potential');
  if (strengths.length === 0) strengths.push('Active Amazon Australia Oils category ranking');

  const risks: string[] = ['Heavy liquid FBA/AusPost parcel freight tier'];
  if (!params.inStock) risks.push('Currently out of stock or no active AU featured Buy Box offer');
  if (params.reviewCount >= 500)
    risks.push(`Established incumbent review moat (${params.reviewCount.toLocaleString()} reviews)`);
  if (params.rating > 0 && params.rating < 4.3)
    risks.push(`Customer rating (${params.rating.toFixed(1)}) indicates formulation/packaging feedback gap`);

  const keyVerdict = !params.inStock
    ? 'Stock-out alert on Amazon Australia — supply gap opportunity in AU Oils catalog'
    : overallScore >= 85
    ? 'High-velocity Australian engine oil listing with strong $/L economics'
    : overallScore >= 75
    ? 'Solid Amazon AU demand with competitive brand positioning'
    : 'Specialized viscosity / niche lubricant SKU in Amazon Australia';

  return {
    overallScore,
    demandScore,
    marginScore,
    competitionScore,
    ratingGapScore,
    promoElasticityScore,
    keyVerdict,
    strengths,
    risks,
  };
}

export async function scrapeAmazonProductDetail(
  asin: string,
  seed?: SeedCard,
  mp: MarketplaceCode = 'AU'
): Promise<AutomotiveProduct> {
  const cfg = MARKETPLACES[mp];
  const cleanAsin = asin.trim().toUpperCase();
  const productUrl =
    mp === 'PT'
      ? `https://${cfg.domain}/-/pt/dp/${cleanAsin}`
      : `https://${cfg.domain}/dp/${cleanAsin}`;
  let html = await fetchAmazonHtml(productUrl, mp);
  let $ = cheerio.load(html);

  let locText = cleanCheerioText($, $('#glow-ingress-line2'));
  const hasExpectedLoc =
    mp === 'PT' ? locText.toLowerCase().includes('portugal') : locText.includes(cfg.zipCode);
  if (!hasExpectedLoc) {
    await ensureLocationCookie(mp, true);
    html = await fetchAmazonHtml(productUrl, mp);
    $ = cheerio.load(html);
    locText = cleanCheerioText($, $('#glow-ingress-line2'));
  }

  const pageTitle = cleanCheerioText($, $('#productTitle'));
  const title = pageTitle || seed?.title || `Engine Oil (${cleanAsin})`;

  // Overview table, Tech specs tables, and Detail Bullets (ALL minor specs)
  const specifications: Record<string, string> = {};
  $('#productOverview_feature_div tr').each((_, tr) => {
    const k = cleanCheerioText($, $(tr).find('td').eq(0));
    const v = cleanCheerioText($, $(tr).find('td').eq(1));
    if (k && v) specifications[k] = v;
  });

  let bsrRawText = '';
  $(
    '.prodDetTable tr, #productDetails_techSpec_section_1 tr, #productDetails_techSpec_section_2 tr, #productDetails_detailBullets_sections1 tr, #productDetails_detailBullets_sections2 tr'
  ).each((_, tr) => {
    const k = cleanCheerioText($, $(tr).find('th'));
    const v = cleanCheerioText($, $(tr).find('td'));
    if (!k || !v) return;
    const kl = k.toLowerCase();
    if (
      kl.includes('best sellers rank') ||
      kl.includes('bestseller-rang') ||
      kl.includes('ranking najlepszych') ||
      kl.includes('classificação dos produtos mais vendidos') ||
      kl.includes('clasificación en los más vendidos')
    ) {
      bsrRawText = v;
      return;
    }
    if (
      kl.includes('customer reviews') ||
      kl.includes('kundenrezensionen') ||
      kl.includes('oceny klientów') ||
      kl.includes('avaliações de clientes') ||
      kl.includes('opiniones de los clientes')
    )
      return;
    specifications[k] = v;
  });

  $('#detailBullets_feature_div li').each((_, li) => {
    const raw = cleanCheerioText($, $(li));
    if (!raw || !raw.includes(':')) return;
    const idx = raw.indexOf(':');
    const k = raw.slice(0, idx).replace(/\s+/g, ' ').trim();
    const v = raw.slice(idx + 1).replace(/\s+/g, ' ').trim();
    if (!k || !v) return;
    const kl = k.toLowerCase();
    if (
      kl.includes('best sellers rank') ||
      kl.includes('bestseller-rang') ||
      kl.includes('ranking najlepszych') ||
      kl.includes('classificação dos produtos mais vendidos') ||
      kl.includes('clasificación en los más vendidos')
    ) {
      if (!bsrRawText) bsrRawText = v;
      return;
    }
    if (
      kl.includes('customer reviews') ||
      kl.includes('kundenrezensionen') ||
      kl.includes('avaliações de clientes') ||
      kl.includes('opiniones de los clientes')
    )
      return;
    if (!specifications[k]) specifications[k] = v;
  });

  // Brand & Manufacturer
  let brand =
    specifications['Brand'] ||
    specifications['Brand Name'] ||
    specifications['Marke'] ||
    specifications['Marka'] ||
    specifications['Marca'] ||
    cleanCheerioText($, $('#bylineInfo')) ||
    '';
  brand = brand
    .replace(/^Visit the\s+/i, '')
    .replace(/^Besuche den\s+/i, '')
    .replace(/^Odwiedź sklep\s+/i, '')
    .replace(/^Visite a loja\s+/i, '')
    .replace(/^Visita la tienda de\s+/i, '')
    .replace(/\s+Store$/i, '')
    .replace(/-Store$/i, '')
    .replace(/^(?:Brand|Marke|Marka|Marca):\s*/i, '')
    .trim();
  if (!brand || brand.toLowerCase() === 'generic') {
    const knownBrandMatch = title.match(
      /\b(Penrite|Castrol|Nulon|Valvoline|Mobil|Pennzoil|Quaker\s*State|Shell|Liqui\s*Moly|Motul|Gulf\s*Western|Red\s*Line|Royal\s*Purple|Lucas\s*Oil|TotalEnergies|Total|Repsol|Cepsa|Fuchs|K&N|ELF|Mannol|Amazon\s*Basics|ACDelco|Motorcraft|Toyota|Honda|Yamaha|Mopar)\b/i
    );
    brand = knownBrandMatch ? knownBrandMatch[1] : title.split(/\s+/)[0] || 'Unknown Brand';
  }
  const brandLower = brand.toLowerCase();
  if (brandLower.includes('gulf western')) brand = 'Gulf Western Oils';
  else if (brandLower === 'total' || brandLower === 'totalenergies') brand = 'TotalEnergies';
  else if (brandLower.includes('liqui') && brandLower.includes('moly')) brand = 'Liqui Moly';
  else if (brandLower === 'elf') brand = 'ELF';
  const specManuf =
    specifications['Manufacturer'] ||
    specifications['Hersteller'] ||
    specifications['Producent'] ||
    specifications['Fabricante'];
  const manufacturer = specManuf && specManuf.toLowerCase() !== 'generic' ? specManuf : brand;

  const partNumber =
    specifications['Manufacturer Part Number'] ||
    specifications['Model Number'] ||
    specifications['Item model number'] ||
    specifications['Part Number'] ||
    specifications['Herstellernummer'] ||
    specifications['Modellnummer'] ||
    specifications['Numer części'] ||
    specifications['Número da peça do fabricante'] ||
    specifications['Número do modelo do artigo'] ||
    specifications['Referência do fabricante'] ||
    specifications['Número de modelo del producto'] ||
    undefined;
  const gtin =
    specifications['Global Trade Identification Number'] ||
    specifications['EAN'] ||
    specifications['UPC'] ||
    undefined;
  const itemWeight =
    specifications['Item Weight'] ||
    specifications['Weight'] ||
    specifications['Artikelgewicht'] ||
    specifications['Waga przedmiotu'] ||
    specifications['Peso do artigo'] ||
    specifications['Peso del producto'] ||
    undefined;
  const packageDimensions =
    specifications['Package Dimensions'] ||
    specifications['Product Dimensions'] ||
    specifications['Item Dimensions LxWxH'] ||
    specifications['Produktabmessungen'] ||
    specifications['Wymiary produktu'] ||
    specifications['Dimensões do produto'] ||
    specifications['Dimensões da embalagem'] ||
    specifications['Dimensiones del producto'] ||
    undefined;
  const countryOfOrigin =
    specifications['Country of Origin'] ||
    specifications['Herkunftsland'] ||
    specifications['Kraj pochodzenia'] ||
    specifications['País de origem'] ||
    specifications['País de origen'] ||
    undefined;
  const dateFirstAvailable =
    specifications['Date First Available'] ||
    specifications['Im Angebot von Amazon.de seit'] ||
    specifications['Disponível para compra desde'] ||
    specifications['Producto en Amazon.es desde'] ||
    undefined;

  const hiResImg =
    $('#landingImage').attr('data-old-hires') ||
    $('#landingImage').attr('src') ||
    $('#imgBlkFront').attr('src') ||
    seed?.imageUrl ||
    '';

  const bullets = $('#feature-bullets li span.a-list-item')
    .map((_, el) => cleanCheerioText($, $(el)))
    .get()
    .filter((t) => t.length > 5 && !t.toLowerCase().includes('make sure this fits'));
  const prodDesc = cleanCheerioText($, $('#productDescription'));
  const importantInfo = cleanCheerioText($, $('#important-information'));
  const aplusText = cleanCheerioText($, $('#aplus, #aplusProductDescription'));
  const description =
    bullets.length > 0 ? bullets.join(' ') : prodDesc || importantInfo || title;

  const rawVars = $(
    '#twister li, #twister_feature_div li, #twister-plus-inline-twister li, #variation_size_name li, #inline-twister-expander-content-size_name li'
  )
    .map((_, el) =>
      cleanCheerioText($, $(el))
        .replace(/\s*See available options.*$/i, '')
        .replace(/\s*Currently unavailable.*$/i, '')
        .trim()
    )
    .get()
    .filter(
      (v) =>
        v.length > 0 &&
        v.length < 45 &&
        !/^[\d←→‹›]+$/.test(v) &&
        !/^Page\s+\d+/i.test(v)
    );
  const variations = Array.from(new Set(rawVars)).slice(0, 10);

  // Availability & Stock Check (cleaned of script/style tags, multilingual AU/US/DE/PL/PT)
  const rawAvail =
    cleanCheerioText($, $('#availability')) ||
    cleanCheerioText($, $('#availabilityInsideBuyBox_feature_div'));
  const oosText = cleanCheerioText($, $('#outOfStock'));
  const hasAddToCart = $('#add-to-cart-button').length > 0 || $('#buy-now-button').length > 0;
  const hasBuyingOptionsBtn =
    $('#buybox-see-all-buying-choices').length > 0 ||
    $('a[title="See All Buying Options"]').length > 0 ||
    $('a[title="Alle Kaufoptionen ansehen"]').length > 0 ||
    $('a[title="Zobacz wszystkie opcje zakupu"]').length > 0 ||
    $('a[title="Ver todas as opções de compra"]').length > 0 ||
    $('a[title="Ver todas las opciones de compra"]').length > 0;
  const combinedStockText = `${rawAvail} ${oosText}`.toLowerCase();

  const soldBy =
    cleanCheerioText($, $('#merchantInfoFeature_feature_div .offer-display-feature-text-message').first()) ||
    cleanCheerioText($, $('#sellerProfileTriggerId').first()) ||
    undefined;
  const shipsFrom =
    cleanCheerioText($, $('#fulfillerInfoFeature_feature_div .offer-display-feature-text-message').first()) ||
    soldBy ||
    undefined;
  const returnPolicy =
    cleanCheerioText($, $('#returnsInfoFeature_feature_div .offer-display-feature-text-message').first()) ||
    undefined;
  const deliveryRaw = cleanCheerioText($, $('#mir-layout-DELIVERY_BLOCK, #deliveryBlockMessage').first());
  const deliveryEstimate = deliveryRaw
    ? deliveryRaw
        .split(/Deliver to\b|Order within\b|Lieferung nach\b|Dostawa do\b|Enviar a\b|Entrega em\b|Encomende dentro de\b/i)[0]
        .trim()
        .slice(0, 120)
    : undefined;
  const isPrime =
    $('#primeLogo, #bbop-sbbop-container, #priceBadging_feature_div .a-icon-prime').length > 0 ||
    (soldBy?.toLowerCase().includes('amazon') ?? false);

  const dpPrice = extractPriceFromCheerio(
    $,
    $('#corePriceDisplay_desktop_feature_div, #corePrice_desktop, #apex_desktop, #apex_offerDisplay_desktop')
  );
  const olpPriceRaw = cleanCheerioText($, $('#olp_feature_div, #olpLinkWidget_feature_div, #moreBuyingChoices_feature_div'));
  const olpPriceMatch = olpPriceRaw.match(/(?:\$|€|zł)?\s*(\d+(?:[.,]\d{1,2})?)/);
  const olpPrice = olpPriceMatch ? parsePriceNumber(olpPriceMatch[1]) : 0;

  let inStock = true;
  let availability: StockAvailabilityStatus = 'In Stock';
  let availabilityDetail = rawAvail || 'In stock';
  let stockQuantityLeft: number | undefined;

  const onlyLeftMatch =
    rawAvail.match(/only\s+(\d+)\s+left/i) ||
    rawAvail.match(/nur noch\s+(\d+)\s+auf lager/i) ||
    rawAvail.match(/pozostało tylko\s+(\d+)/i) ||
    rawAvail.match(/zostało tylko\s+(\d+)/i) ||
    rawAvail.match(/apenas\s+(\d+)\s+em\s+stoc?k/i) ||
    rawAvail.match(/só\s+restam?\s+(\d+)/i) ||
    rawAvail.match(/sólo\s+queda(?:\(n\))?\s+(\d+)/i);

  if (onlyLeftMatch) {
    stockQuantityLeft = parseInt(onlyLeftMatch[1], 10);
    inStock = true;
    availability = stockQuantityLeft === 2 ? 'Only 2 Left' : 'Low Stock';
    availabilityDetail = rawAvail;
  } else if (
    combinedStockText.includes('currently unavailable') ||
    combinedStockText.includes('derzeit nicht verfügbar') ||
    combinedStockText.includes('obecnie niedostępny') ||
    combinedStockText.includes('atualmente indisponível') ||
    combinedStockText.includes('no disponible')
  ) {
    inStock = false;
    availability = 'Currently Unavailable';
    availabilityDetail = rawAvail || `Currently unavailable on ${cfg.domain}.`;
  } else if (
    combinedStockText.includes('temporarily out of stock') ||
    combinedStockText.includes('out of stock') ||
    combinedStockText.includes('vorübergehend nicht auf lager') ||
    combinedStockText.includes('tymczasowo niedostępny') ||
    combinedStockText.includes('temporariamente esgotado') ||
    combinedStockText.includes('sem stock') ||
    combinedStockText.includes('temporalmente sin stock') ||
    ($('#outOfStock').length > 0 && !hasAddToCart)
  ) {
    inStock = false;
    availability = 'Temporarily Out of Stock';
    availabilityDetail = rawAvail || `Temporarily out of stock on ${cfg.domain}.`;
  } else if (
    combinedStockText.includes('pre-order') ||
    combinedStockText.includes('vorbestell') ||
    combinedStockText.includes('pré-venda')
  ) {
    inStock = false;
    availability = 'Pre-order';
    availabilityDetail = rawAvail;
  } else if (
    hasAddToCart ||
    combinedStockText.includes('in stock') ||
    combinedStockText.includes('auf lager') ||
    combinedStockText.includes('w magazynie') ||
    combinedStockText.includes('em stock') ||
    combinedStockText.includes('em estoque') ||
    combinedStockText.includes('en stock') ||
    combinedStockText.includes('usually dispatched') ||
    combinedStockText.includes('normalmente enviado')
  ) {
    inStock = true;
    availability = 'In Stock';
    availabilityDetail = rawAvail || `In stock (${cfg.domain})`;
  } else if (hasBuyingOptionsBtn) {
    inStock = true;
    availability = 'Buying Options Only';
    availabilityDetail = `No featured Buy Box — available via third-party sellers on ${cfg.domain}`;
  } else if (dpPrice <= 0 && (!seed?.priceAud || seed.priceAud <= 0)) {
    inStock = false;
    availability = 'Currently Unavailable';
    availabilityDetail = rawAvail || 'No active Buy Box or seller stock found';
  }

  const currentPriceAud =
    dpPrice > 0 ? dpPrice : olpPrice > 0 ? olpPrice : inStock ? seed?.priceAud || 0 : 0;

  const priceBox = $(
    '#corePriceDisplay_desktop_feature_div, #corePrice_desktop, #apex_desktop, #apex_offerDisplay_desktop'
  );
  const strikePriceRaw =
    priceBox.find('.basisPrice .a-offscreen').first().text().trim() ||
    $('.basisPrice .a-offscreen').first().text().trim();
  const dpStrike =
    strikePriceRaw.includes('.') || strikePriceRaw.includes(',') ? parsePriceNumber(strikePriceRaw) : 0;
  const originalPriceAud =
    dpStrike > currentPriceAud
      ? dpStrike
      : seed?.originalPriceAud && seed.originalPriceAud > currentPriceAud
      ? seed.originalPriceAud
      : currentPriceAud;
  const pctBadgeRaw =
    cleanCheerioText($, priceBox.find('.savingsPercentage').first()) ||
    cleanCheerioText($, $('.savingsPercentage').first());
  const pctBadgeMatch = pctBadgeRaw.match(/(\d+(?:\.\d+)?)%/);
  const discountPct =
    originalPriceAud > currentPriceAud && currentPriceAud > 0
      ? Math.round(((originalPriceAud - currentPriceAud) / originalPriceAud) * 1000) / 10
      : pctBadgeMatch && currentPriceAud > 0
      ? parseFloat(pctBadgeMatch[1])
      : 0;

  // Promotions (Coupons, Subscribe & Save, Deal Badges)
  const couponText = cleanCheerioText(
    $,
    $('#couponBadgeRegularVpc, [id*="coupon"], .couponBadge, label[for*="coupon"]')
  );
  const couponMoneyMatch = couponText.match(/(?:\$|€)\s*(\d+(?:[.,]\d+)?)|(\d+(?:[.,]\d+)?)\s*(?:€|zł)/i);
  const couponPctMatch = couponText.match(/(\d+)\s*%/);
  const couponValueAud = couponMoneyMatch
    ? parsePriceNumber(couponMoneyMatch[1] || couponMoneyMatch[2])
    : couponPctMatch && currentPriceAud > 0
    ? Math.round(((currentPriceAud * parseFloat(couponPctMatch[1])) / 100) * 100) / 100
    : undefined;
  const hasCoupon = Boolean(couponValueAud && couponValueAud > 0);
  const subscribeAndSave =
    $('#snsAccordionRowMiddle, #sns-base-price, #snsDetailPage').length > 0 ||
    cleanCheerioText($, $('#buybox, #apex_desktop')).includes('Subscribe & Save');

  const dpBadgeText = cleanCheerioText(
    $,
    $('#dealBadge_feature_div, #acBadge_feature_div, #zeitgeistBadge_feature_div')
  ).toLowerCase();
  const isLightningDeal = dpBadgeText.includes('lightning');
  const dpDealBadge: AutomotiveProduct['dealBadge'] = isLightningDeal
    ? 'Lightning Deal'
    : dpBadgeText.includes('limited time')
    ? 'Limited Time Deal'
    : dpBadgeText.includes('choice')
    ? 'Amazon Choice'
    : dpBadgeText.includes('best seller')
    ? 'Best Seller'
    : seed?.dealBadge || null;

  // Ratings & reviews
  const dpRatingText = $('#acrPopover').attr('title') || $('.a-icon-star span').first().text().trim();
  const dpReviewsText = $('#acrCustomerReviewText').first().text().trim();
  const parsedRev = parseRatingAndReviews(dpRatingText, dpReviewsText);
  const rating = parsedRev.rating > 0 ? parsedRev.rating : seed?.rating || 0;
  const reviewCount = parsedRev.reviewCount > 0 ? parsedRev.reviewCount : seed?.reviewCount || 0;

  // Histogram percentages
  const starPcts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  $('#histogramTable li').each((idx, el) => {
    const txt = $(el).text().replace(/\s+/g, ' ').trim();
    const pctMatch = txt.match(/(\d+)%\s*$/);
    const starNum = 5 - idx;
    if (pctMatch && starNum >= 1 && starNum <= 5) {
      starPcts[starNum] = parseInt(pctMatch[1], 10);
    }
  });
  const totalHist = Object.values(starPcts).reduce((a, b) => a + b, 0);
  const ratingDistribution =
    totalHist > 0
      ? {
          fiveStar: starPcts[5],
          fourStar: starPcts[4],
          threeStar: starPcts[3],
          twoStar: starPcts[2],
          oneStar: starPcts[1],
        }
      : {
          fiveStar: rating >= 4.7 ? 84 : 72,
          fourStar: rating >= 4.7 ? 11 : 18,
          threeStar: 3,
          twoStar: 1,
          oneStar: 1,
        };

  // BSR parsing (AU, US, DE, PL, PT)
  const normBsr = bsrRawText.replace(/(\d)\.(\d{3})/g, '$1$2');
  const autoRankMatch = normBsr.match(
    /([\d,]+)\s+(?:in\s+Automotive|in\s+Auto\s*&\s*Motorrad|w\s+kategorii\s+Motoryzacja|em\s+Automóvel|en\s+Coche\s+y\s+moto)\b/i
  );
  const oilsRankMatch = normBsr.match(
    /([\d,]+)\s+(?:in\s+(?:Automotive\s+Oils|Motor\s+Oils|Motorenöle|Motoröle)|w\s+kategorii\s+Oleje\s+silnikowe|em\s+(?:Óleos\s+para\s+Motor\s+Automóvel|Lubrificantes\s+de\s+Motor\s+Automóvel)|en\s+Aceites\s+de\s+motor)\b/i
  );
  const categoryRank = autoRankMatch ? parseInt(autoRankMatch[1].replace(/,/g, ''), 10) : 0;
  const subcategoryRank = oilsRankMatch
    ? parseInt(oilsRankMatch[1].replace(/,/g, ''), 10)
    : seed?.bestsellerRank || 0;
  const bsr = categoryRank || subcategoryRank || 9999;

  // Engine oil attributes
  const viscosityText = specifications['SAE J300 Viscosity Grade'] || title;
  const viscosity = parseViscosity(`${viscosityText} ${title} ${description}`);
  const explicitVolText = [
    title,
    specifications['Liquid volume'],
    specifications['Liquid Volume'],
    specifications['Volume líquido'],
    specifications['Volumen del líquido'],
    specifications['Size'],
    specifications['Tamanho'],
    specifications['Tamaño'],
  ]
    .filter(Boolean)
    .join(' ');
  const fallbackVolText = specifications['Unit Count'] || '';
  const volumeLiters = parseVolumeLiters(explicitVolText, fallbackVolText);
  const pricePerLiterAud =
    currentPriceAud > 0 && volumeLiters > 0
      ? Math.round((currentPriceAud / volumeLiters) * 100) / 100
      : 0;

  const { apiStandard, aceaStandard, oemApprovals } = parseStandardsAndApprovals(
    `${title} ${description} ${aplusText.slice(0, 3000)} ${Object.values(specifications).join(' ')}`
  );
  const { oilType, engineCompatibility, categoryId, categoryName } = inferCategoryAndCompatibility(
    title,
    description,
    viscosity
  );

  // Extract optional zinc ZDDP ppm if disclosed
  const zincMatch = `${title} ${description} ${aplusText.slice(0, 2000)}`.match(
    /(?:zinc|zddp)[^\d]{0,18}(\d{3,4})\s*ppm/i
  );
  const zincContentPpm = zincMatch ? parseInt(zincMatch[1], 10) : undefined;

  // Sales estimates (BSR-derived estimates, scaled appropriately when out of stock)
  const { monthly: estMonthlySales, demand: demandIndicator } = estimateSalesFromBsr(
    bsr,
    subcategoryRank,
    inStock
  );
  const estDailySales = estMonthlySales > 0 ? Math.max(1, Math.round(estMonthlySales / 30)) : 0;
  const estWeeklySales = estMonthlySales > 0 ? Math.max(1, Math.round((estMonthlySales / 30) * 7)) : 0;
  const estMonthlyRevenueAud = Math.round(estMonthlySales * currentPriceAud);

  const opportunity = calculateOpportunityScore({
    estMonthlySales,
    pricePerLiterAud,
    reviewCount,
    rating,
    discountPct,
    subscribeAndSave,
    hasCoupon,
    oemCount: oemApprovals.length,
    inStock,
  });

  const nowIso = new Date().toISOString();
  const todayDate = nowIso.split('T')[0];

  return {
    asin: cleanAsin,
    marketplace: mp,
    currency: cfg.currency,
    title,
    brand,
    manufacturer,
    categoryId,
    categoryName,
    productUrl,
    imageUrl: hiResImg,
    description,
    viscosity,
    volumeLiters,
    pricePerLiterAud,
    oilType,
    engineCompatibility,
    apiStandard,
    aceaStandard,
    oemApprovals,
    zincContentPpm,
    specifications,
    variations: variations.length > 0 ? variations : [`${volumeLiters}L`],
    partNumber,
    gtin,
    itemWeight,
    packageDimensions,
    countryOfOrigin,
    dateFirstAvailable,
    currentPriceAud,
    originalPriceAud,
    listPriceAud: originalPriceAud,
    salePriceAud: discountPct > 0 ? currentPriceAud : undefined,
    couponPriceAud:
      couponValueAud && currentPriceAud > 0
        ? Math.max(0, Math.round((currentPriceAud - couponValueAud) * 100) / 100)
        : undefined,
    discountPct,
    lowestPriceAud: currentPriceAud,
    highestPriceAud: originalPriceAud,
    avgPriceAud: currentPriceAud,
    hasCoupon,
    couponValueAud,
    dealBadge:
      dpDealBadge || (subcategoryRank > 0 && subcategoryRank <= 3 ? 'Best Seller' : null),
    isLightningDeal,
    subscribeAndSave,
    promoHistoryCount: (hasCoupon ? 1 : 0) + (discountPct > 0 ? 1 : 0) + (subscribeAndSave ? 1 : 0),
    estDailySales,
    estWeeklySales,
    estMonthlySales,
    estMonthlyRevenueAud,
    salesGrowthPct: subcategoryRank > 0 && subcategoryRank <= 15 ? 14.5 : 8.2,
    demandIndicator,
    bsr,
    categoryRank: categoryRank || bsr,
    subcategoryRank: subcategoryRank || 0,
    bsrChange7dPct: 0,
    rating: rating || 0,
    reviewCount,
    ratingDistribution,
    reviewGrowth30d: Math.max(0, Math.round(reviewCount * 0.04)),
    availability,
    availabilityDetail,
    stockQuantityLeft,
    hasAddToCart,
    soldBy,
    shipsFrom,
    isPrime,
    deliveryEstimate,
    returnPolicy,
    verifiedLocation: locText ? `${locText} (${mp})` : cfg.locationLabel,
    inStock,
    isTrending: (subcategoryRank > 0 && subcategoryRank <= 12) || discountPct >= 10,
    isTracked: true,
    opportunity,
    lastScrapedAt: nowIso,
    firstTrackedAt: nowIso,
    priceHistory:
      currentPriceAud > 0
        ? [
            {
              date: todayDate,
              priceAud: currentPriceAud,
              originalPriceAud,
              discountPct,
              couponAud: couponValueAud,
              eventType: discountPct > 0 ? 'price_drop' : hasCoupon ? 'coupon' : 'normal',
            },
          ]
        : [],
    salesHistory: [
      {
        date: todayDate,
        estMonthlyUnits: estMonthlySales,
        estMonthlyRevenueAud,
        bsr,
      },
    ],
    competitors: [],
  };
}

export async function scrapeAmazonAuProductDetail(
  asin: string,
  seed?: SeedCard
): Promise<AutomotiveProduct> {
  return scrapeAmazonProductDetail(asin, seed, 'AU');
}

async function scrapeViaRainforestApi(
  mp: MarketplaceCode,
  apiKey: string,
  queries: string[]
): Promise<{ seeds: SeedCard[]; logs: string[] }> {
  const cfg = MARKETPLACES[mp];
  const logs: string[] = [];
  const seedMap = new Map<string, SeedCard>();
  const domain = cfg.domain.replace(/^www\./, '');

  for (const q of queries) {
    try {
      const apiUrl = `https://api.rainforestapi.com/request?api_key=${encodeURIComponent(
        apiKey
      )}&type=search&amazon_domain=${encodeURIComponent(domain)}&search_term=${encodeURIComponent(q)}`;
      logs.push(`[Rainforest API] Querying ${domain} for "${q}"`);
      const resp = await fetch(apiUrl);
      if (!resp.ok) {
        logs.push(`[Rainforest Warn] HTTP ${resp.status} for "${q}"`);
        continue;
      }
      const data: any = await resp.json();
      const results = Array.isArray(data?.search_results) ? data.search_results : [];
      let added = 0;
      for (const item of results) {
        const asin = String(item.asin || '').trim().toUpperCase();
        const title = String(item.title || '').trim();
        if (!/^B[A-Z0-9]{9}$/.test(asin) || !isGenuineEngineOil(title) || seedMap.has(asin)) continue;
        const priceVal = typeof item.price?.value === 'number' ? item.price.value : 0;
        const rrpVal = typeof item.prices?.[1]?.value === 'number' ? item.prices[1].value : priceVal;
        seedMap.set(asin, {
          asin,
          title,
          priceAud: priceVal,
          originalPriceAud: rrpVal > priceVal ? rrpVal : priceVal,
          rating: typeof item.rating === 'number' ? item.rating : 0,
          reviewCount: typeof item.ratings_total === 'number' ? item.ratings_total : 0,
          imageUrl: item.image || '',
          bestsellerRank: item.bestseller ? 1 : undefined,
          dealBadge: item.bestseller ? 'Best Seller' : item.amazon_choice ? 'Amazon Choice' : null,
          sourceUrl: item.link || `https://${cfg.domain}/dp/${asin}`,
        });
        added++;
      }
      logs.push(`[Rainforest Parsed] ${added} engine oil results on ${domain} for "${q}"`);
    } catch (err: any) {
      logs.push(`[Rainforest Error] ${err.message}`);
    }
  }

  return { seeds: Array.from(seedMap.values()), logs };
}

export function mergeProductHistory(
  existing: AutomotiveProduct | undefined,
  fresh: AutomotiveProduct
): AutomotiveProduct {
  if (!existing) return fresh;

  const priceHistory = [...(existing.priceHistory || [])];
  if (fresh.currentPriceAud > 0) {
    const todayDate = fresh.lastScrapedAt.split('T')[0];
    const lastPt = priceHistory[priceHistory.length - 1];
    if (!lastPt || lastPt.date !== todayDate || Math.abs(lastPt.priceAud - fresh.currentPriceAud) > 0.01) {
      priceHistory.push({
        date: todayDate,
        priceAud: fresh.currentPriceAud,
        originalPriceAud: fresh.originalPriceAud,
        discountPct: fresh.discountPct,
        couponAud: fresh.couponValueAud,
        eventType: fresh.discountPct > 0 ? 'price_drop' : fresh.hasCoupon ? 'coupon' : 'normal',
      });
    }
  }

  const salesHistory = [...(existing.salesHistory || [])];
  const todayDate = fresh.lastScrapedAt.split('T')[0];
  const lastSales = salesHistory[salesHistory.length - 1];
  if (!lastSales || lastSales.date !== todayDate) {
    salesHistory.push({
      date: todayDate,
      estMonthlyUnits: fresh.estMonthlySales,
      estMonthlyRevenueAud: fresh.estMonthlyRevenueAud,
      bsr: fresh.bsr,
    });
  }

  const observedPrices = priceHistory.map((p) => p.priceAud).filter((p) => p > 0);
  const lowestPriceAud =
    observedPrices.length > 0 ? Math.min(...observedPrices) : fresh.lowestPriceAud;
  const highestPriceAud =
    observedPrices.length > 0
      ? Math.max(...observedPrices, fresh.highestPriceAud)
      : fresh.highestPriceAud;
  const avgPriceAud =
    observedPrices.length > 0
      ? Math.round((observedPrices.reduce((a, b) => a + b, 0) / observedPrices.length) * 100) / 100
      : fresh.avgPriceAud;

  return {
    ...fresh,
    firstTrackedAt: existing.firstTrackedAt || fresh.firstTrackedAt,
    isTracked: existing.isTracked ?? fresh.isTracked,
    lowestPriceAud,
    highestPriceAud,
    avgPriceAud,
    priceHistory: priceHistory.slice(-36),
    salesHistory: salesHistory.slice(-24),
  };
}

export function attachDynamicCompetitors(products: AutomotiveProduct[]): AutomotiveProduct[] {
  return products.map((p) => {
    const candidates = products
      .filter((other) => other.asin !== p.asin)
      .map((other) => {
        let score = 40;
        if (other.viscosity === p.viscosity) score += 35;
        if (other.oilType === p.oilType) score += 10;
        if (Math.abs(other.volumeLiters - p.volumeLiters) <= 1.5) score += 10;
        if (other.brand !== p.brand) score += 5;
        const priceDiffPct =
          p.currentPriceAud > 0 && other.currentPriceAud > 0
            ? Math.round(((other.currentPriceAud - p.currentPriceAud) / p.currentPriceAud) * 1000) / 10
            : 0;
        return { other, score, priceDiffPct };
      })
      .sort((a, b) => b.score - a.score || a.other.bsr - b.other.bsr)
      .slice(0, 4);

    const competitors: CompetitorProduct[] = candidates.map(({ other, score, priceDiffPct }) => ({
      competitorAsin: other.asin,
      title: other.title,
      brand: other.brand,
      priceAud: other.currentPriceAud,
      viscosity: other.viscosity,
      volumeLiters: other.volumeLiters,
      pricePerLiterAud: other.pricePerLiterAud,
      rating: other.rating,
      reviewCount: other.reviewCount,
      bsr: other.bsr,
      discountPct: other.discountPct,
      estMonthlySales: other.estMonthlySales,
      estMonthlyRevenue: other.estMonthlyRevenueAud,
      similarityScore: Math.min(99, score),
      priceDifferencePct: priceDiffPct,
      imageUrl: other.imageUrl,
    }));

    return {
      ...p,
      competitors,
    };
  });
}

function getDiscoveryQueriesForMarketplace(mp: MarketplaceCode): Array<{ q: string; pages: number }> {
  if (mp === 'US') {
    return [
      { q: '5W-30 synthetic motor oil', pages: 2 },
      { q: '5W-40 motor oil', pages: 1 },
      { q: '0W-20 synthetic motor oil', pages: 1 },
      { q: '10W-30 motor oil', pages: 1 },
      { q: '15W-40 diesel motor oil', pages: 1 },
      { q: 'Mobil 1 motor oil', pages: 1 },
      { q: 'Castrol Edge motor oil', pages: 1 },
      { q: 'Valvoline motor oil', pages: 1 },
      { q: 'Pennzoil Platinum motor oil', pages: 1 },
      { q: 'Liqui Moly engine oil', pages: 1 },
    ];
  }
  if (mp === 'DE') {
    return [
      { q: '5W-30 Motorenöl', pages: 2 },
      { q: '5W-40 Motorenöl', pages: 1 },
      { q: '0W-20 Motorenöl', pages: 1 },
      { q: '10W-40 Motorenöl', pages: 1 },
      { q: 'Castrol Edge 5W-30', pages: 1 },
      { q: 'Liqui Moly 5W-30', pages: 1 },
      { q: 'Mobil 1 Motorenöl', pages: 1 },
    ];
  }
  if (mp === 'PL') {
    return [
      { q: '5W-30 olej silnikowy', pages: 2 },
      { q: '5W-40 olej silnikowy', pages: 1 },
      { q: '0W-20 olej silnikowy', pages: 1 },
      { q: '10W-40 olej silnikowy', pages: 1 },
      { q: 'Castrol Edge 5W-30', pages: 1 },
      { q: 'Motul 8100 5W-30', pages: 1 },
    ];
  }
  if (mp === 'PT') {
    return [
      { q: '__browse_node__', pages: 2 },
      { q: 'óleo de motor 5W-30', pages: 2 },
      { q: 'óleo de motor 5W-40', pages: 1 },
      { q: 'óleo de motor 0W-20', pages: 1 },
      { q: 'óleo de motor 10W-40', pages: 1 },
      { q: 'Castrol Edge 5W-30', pages: 1 },
      { q: 'Motul 8100 5W-30', pages: 1 },
      { q: 'Liqui Moly 5W-30', pages: 1 },
      { q: 'Repsol óleo motor', pages: 1 },
      { q: 'Total Quartz 5W-30', pages: 1 },
    ];
  }
  return [
    { q: '__browse_node__', pages: 3 },
    { q: 'engine oil', pages: 2 },
    { q: '5W-30 engine oil', pages: 1 },
    { q: '5W-40 engine oil', pages: 1 },
    { q: '0W-20 engine oil', pages: 1 },
    { q: '10W-40 engine oil', pages: 1 },
    { q: '15W-40 diesel engine oil', pages: 1 },
    { q: 'Penrite engine oil', pages: 1 },
    { q: 'Nulon engine oil', pages: 1 },
    { q: 'Valvoline engine oil', pages: 1 },
    { q: 'Mobil 1 engine oil', pages: 1 },
    { q: 'Shell Helix engine oil', pages: 1 },
  ];
}

export async function runFullMarketplaceScrape(
  mp: MarketplaceCode = 'AU',
  existingProducts: AutomotiveProduct[] = [],
  customQuery?: string
): Promise<{ products: AutomotiveProduct[]; job: CollectionJob }> {
  const cfg = MARKETPLACES[mp];
  const startedAt = Date.now();
  const scheduledTime = new Date().toISOString();
  const logs: string[] = [];
  const settings = loadPlatformSettings();

  logs.push(`[Scraper] Initializing ${mp} (${cfg.locationLabel}) session & live HTTP crawl on https://${cfg.domain} (${cfg.currency})`);
  await ensureLocationCookie(mp, true);

  const seedMap = new Map<string, SeedCard>();
  let captchaHit = false;

  if (settings.rainforestApiKey && (mp === 'DE' || mp === 'PL')) {
    const queries = customQuery
      ? [customQuery]
      : getDiscoveryQueriesForMarketplace(mp).slice(0, 4).map((d) => d.q);
    const rfRes = await scrapeViaRainforestApi(mp, settings.rainforestApiKey, queries);
    logs.push(...rfRes.logs);
    for (const s of rfRes.seeds) seedMap.set(s.asin, s);
  } else if (customQuery) {
    const searchRes = await scrapeAmazonSearch(customQuery, 3, mp);
    logs.push(...searchRes.logs);
    if (searchRes.captchaBlocked) captchaHit = true;
    for (const s of searchRes.seeds) seedMap.set(s.asin, s);
  } else {
    const bsRes = await scrapeBestsellersOilsNode(mp);
    logs.push(...bsRes.logs);
    if (bsRes.captchaBlocked) captchaHit = true;
    for (const s of bsRes.seeds) seedMap.set(s.asin, s);

    if (!captchaHit) {
      const discoveryQueries = getDiscoveryQueriesForMarketplace(mp);
      for (const item of discoveryQueries) {
        const res = await scrapeAmazonSearch(item.q, item.pages, mp);
        logs.push(...res.logs);
        if (res.captchaBlocked) {
          captchaHit = true;
          break;
        }
        for (const s of res.seeds) {
          if (!seedMap.has(s.asin)) {
            seedMap.set(s.asin, s);
          }
        }
      }
    }

    for (const ex of existingProducts) {
      if (!seedMap.has(ex.asin)) {
        seedMap.set(ex.asin, {
          asin: ex.asin,
          title: ex.title,
          priceAud: ex.currentPriceAud,
          originalPriceAud: ex.originalPriceAud,
          rating: ex.rating,
          reviewCount: ex.reviewCount,
          imageUrl: ex.imageUrl,
          bestsellerRank: ex.subcategoryRank || undefined,
          dealBadge: ex.dealBadge,
          sourceUrl: ex.productUrl,
        });
      }
    }
  }

  const maxCandidates = mp === 'AU' ? 140 : 60;
  const candidates = Array.from(seedMap.values()).slice(0, maxCandidates);
  logs.push(
    `[Enrichment] Discovered ${candidates.length} unique ${mp} engine oil ASINs. Scraping /dp/<ASIN> details...`
  );

  const existingByAsin = new Map(existingProducts.map((p) => [p.asin, p]));
  const updatedByAsin = new Map(existingProducts.map((p) => [p.asin, p]));

  let processed = 0;
  let updated = 0;
  let outOfStockCount = 0;
  let discountsFound = 0;
  const usedRainforest = Boolean(settings.rainforestApiKey && (mp === 'DE' || mp === 'PL'));

  if (usedRainforest && candidates.length > 0) {
    const nowIso = new Date().toISOString();
    const todayDate = nowIso.split('T')[0];
    for (const seed of candidates) {
      processed++;
      const viscosity = parseViscosity(seed.title);
      const volumeLiters = parseVolumeLiters(seed.title, '');
      const pricePerLiterAud =
        seed.priceAud > 0 && volumeLiters > 0 ? Math.round((seed.priceAud / volumeLiters) * 100) / 100 : 0;
      const { apiStandard, aceaStandard, oemApprovals } = parseStandardsAndApprovals(seed.title);
      const { oilType, engineCompatibility, categoryId, categoryName } = inferCategoryAndCompatibility(
        seed.title,
        seed.title,
        viscosity
      );
      const discountPct =
        seed.originalPriceAud > seed.priceAud && seed.originalPriceAud > 0
          ? Math.round(((seed.originalPriceAud - seed.priceAud) / seed.originalPriceAud) * 1000) / 10
          : 0;
      const inStock = seed.priceAud > 0;
      const { monthly: estMonthlySales, demand: demandIndicator } = estimateSalesFromBsr(
        seed.bestsellerRank || 2500,
        seed.bestsellerRank || 0,
        inStock
      );
      const estMonthlyRevenueAud = Math.round(estMonthlySales * seed.priceAud);
      const prod: AutomotiveProduct = {
        asin: seed.asin,
        marketplace: mp,
        currency: cfg.currency,
        title: seed.title,
        brand: seed.title.split(/\s+/)[0] || 'Unknown Brand',
        manufacturer: seed.title.split(/\s+/)[0] || 'Unknown Brand',
        categoryId,
        categoryName,
        productUrl: seed.sourceUrl || `https://${cfg.domain}/dp/${seed.asin}`,
        imageUrl: seed.imageUrl,
        description: seed.title,
        viscosity,
        volumeLiters,
        pricePerLiterAud,
        oilType,
        engineCompatibility,
        apiStandard,
        aceaStandard,
        oemApprovals,
        specifications: { Viscosity: viscosity, Volume: `${volumeLiters}L`, Source: 'Rainforest API' },
        variations: [`${volumeLiters}L`],
        currentPriceAud: seed.priceAud,
        originalPriceAud: seed.originalPriceAud,
        listPriceAud: seed.originalPriceAud,
        discountPct,
        lowestPriceAud: seed.priceAud,
        highestPriceAud: seed.originalPriceAud,
        avgPriceAud: seed.priceAud,
        hasCoupon: false,
        dealBadge: seed.dealBadge || null,
        isLightningDeal: false,
        subscribeAndSave: false,
        promoHistoryCount: discountPct > 0 ? 1 : 0,
        estDailySales: Math.max(1, Math.round(estMonthlySales / 30)),
        estWeeklySales: Math.max(1, Math.round((estMonthlySales / 30) * 7)),
        estMonthlySales,
        estMonthlyRevenueAud,
        salesGrowthPct: 8.0,
        demandIndicator,
        bsr: seed.bestsellerRank || 9999,
        categoryRank: seed.bestsellerRank || 9999,
        subcategoryRank: seed.bestsellerRank || 0,
        bsrChange7dPct: 0,
        rating: seed.rating,
        reviewCount: seed.reviewCount,
        ratingDistribution: { fiveStar: 80, fourStar: 12, threeStar: 4, twoStar: 2, oneStar: 2 },
        reviewGrowth30d: Math.round(seed.reviewCount * 0.03),
        availability: inStock ? 'In Stock' : 'Currently Unavailable',
        availabilityDetail: inStock ? `Available on ${cfg.domain} (Rainforest API)` : `No offer on ${cfg.domain}`,
        soldBy: `Amazon ${mp}`,
        shipsFrom: `Amazon ${mp}`,
        isPrime: true,
        verifiedLocation: cfg.locationLabel,
        inStock,
        isTrending: discountPct >= 10,
        isTracked: true,
        opportunity: calculateOpportunityScore({
          estMonthlySales,
          pricePerLiterAud,
          reviewCount: seed.reviewCount,
          rating: seed.rating,
          discountPct,
          subscribeAndSave: false,
          hasCoupon: false,
          oemCount: oemApprovals.length,
          inStock,
        }),
        lastScrapedAt: nowIso,
        firstTrackedAt: nowIso,
        priceHistory:
          seed.priceAud > 0
            ? [{ date: todayDate, priceAud: seed.priceAud, originalPriceAud: seed.originalPriceAud, discountPct, eventType: discountPct > 0 ? 'price_drop' : 'normal' }]
            : [],
        salesHistory: [{ date: todayDate, estMonthlyUnits: estMonthlySales, estMonthlyRevenueAud, bsr: seed.bestsellerRank || 9999 }],
        competitors: [],
      };
      const merged = mergeProductHistory(existingByAsin.get(prod.asin), prod);
      updatedByAsin.set(merged.asin, merged);
      updated++;
      if (!merged.inStock) outOfStockCount++;
      if (merged.discountPct > 0) discountsFound++;
    }
  } else if (!captchaHit && candidates.length > 0) {
    for (let i = 0; i < candidates.length; i += 5) {
      const batch = candidates.slice(i, i + 5);
      const results = await Promise.allSettled(
        batch.map(async (seed) => {
          try {
            return await scrapeAmazonProductDetail(seed.asin, seed, mp);
          } catch (firstErr: any) {
            if (String(firstErr?.message).includes('CAPTCHA_BLOCKED')) throw firstErr;
            await sleep(400);
            return await scrapeAmazonProductDetail(seed.asin, seed, mp);
          }
        })
      );

      for (let j = 0; j < results.length; j++) {
        const r = results[j];
        const seed = batch[j];
        processed++;
        if (r.status === 'fulfilled') {
          const prod = r.value;
          if (!isGenuineEngineOil(prod.title)) {
            logs.push(`[Filter] ${prod.asin} skipped (not an engine oil): ${prod.title.slice(0, 55)}`);
            continue;
          }
          const merged = mergeProductHistory(existingByAsin.get(prod.asin), prod);
          updatedByAsin.set(merged.asin, merged);
          updated++;
          if (!merged.inStock) outOfStockCount++;
          if (merged.discountPct > 0 || merged.hasCoupon) discountsFound++;
        } else {
          const msg = r.reason?.message || 'Unknown error';
          if (msg.includes('CAPTCHA_BLOCKED')) captchaHit = true;
          logs.push(`[Warn] Failed /dp/${seed.asin}: ${msg}`);
        }
      }
      if (captchaHit) break;
      if (i + 5 < candidates.length) await sleep(200);
    }
  }

  const finalList = attachDynamicCompetitors(
    Array.from(updatedByAsin.values()).sort((a, b) => {
      if (a.inStock !== b.inStock) return a.inStock ? -1 : 1;
      const subA = a.subcategoryRank > 0 ? a.subcategoryRank : 99999;
      const subB = b.subcategoryRank > 0 ? b.subcategoryRank : 99999;
      return subA - subB || a.bsr - b.bsr;
    })
  );

  const durationMs = Date.now() - startedAt;
  if (captchaHit && updated === 0) {
    logs.push(
      `[CAPTCHA Notice] ${cfg.domain} enforces an automated CAPTCHA gate for direct unauthenticated requests from this server region. Add a Rainforest API key in Settings or upload CSV/JSON for ${cfg.countryName}.`
    );
  } else {
    logs.push(
      `[Committed] Saved ${updated} live scraped Amazon ${mp} engine oils (${outOfStockCount} out-of-stock, ${finalList.length} total) in ${(durationMs / 1000).toFixed(1)}s.`
    );
  }

  const job: CollectionJob = {
    id: `job-${mp.toLowerCase()}-${Date.now()}`,
    marketplace: mp,
    name: customQuery
      ? `Live ${mp} Search Scrape: "${customQuery}"`
      : `Full Amazon ${mp} (${cfg.currency}) Oils Catalog & Stock Audit`,
    provider: settings.rainforestApiKey && (mp === 'DE' || mp === 'PL')
      ? 'Licensed Partner API'
      : 'Amazon.com.au Live Scraper',
    category: customQuery || `${cfg.countryName} (${cfg.domain}) · Node ${cfg.bestsellersNode}`,
    status: updated > 0 ? 'completed' : 'failed',
    itemsProcessed: processed,
    itemsUpdated: updated,
    newDiscountsFound: discountsFound,
    durationMs,
    scheduledTime,
    completedAt: new Date().toISOString(),
    logs,
  };

  return { products: finalList, job };
}

export async function runFullAmazonAuScrape(
  existingProducts: AutomotiveProduct[] = [],
  customQuery?: string
): Promise<{ products: AutomotiveProduct[]; job: CollectionJob }> {
  return runFullMarketplaceScrape('AU', existingProducts, customQuery);
}

export function loadStore(mp: MarketplaceCode = 'AU'): ScrapedStore {
  const storePath = getStorePath(mp);
  try {
    if (fs.existsSync(storePath)) {
      const raw = fs.readFileSync(storePath, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.products)) {
        const cfg = MARKETPLACES[mp];
        const withMp = parsed.products.map((p: AutomotiveProduct) => ({
          ...p,
          marketplace: p.marketplace || mp,
          currency: p.currency || cfg.currency,
        }));
        return {
          products: attachDynamicCompetitors(withMp),
          jobs: Array.isArray(parsed.jobs) ? parsed.jobs : [],
          lastFullScrapeAt: parsed.lastFullScrapeAt || null,
        };
      }
    }
  } catch (err) {
    console.warn(`[ScraperStore:${mp}] Failed to load existing store:`, err);
  }
  return { products: [], jobs: [], lastFullScrapeAt: null };
}

export function saveStore(store: ScrapedStore, mp: MarketplaceCode = 'AU'): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(getStorePath(mp), JSON.stringify(store, null, 2), 'utf8');
}

export function computeBrandsIntelligence(products: AutomotiveProduct[]): BrandIntelligence[] {
  const byBrand = new Map<string, AutomotiveProduct[]>();
  for (const p of products) {
    const key = p.brand.trim() || 'Other';
    if (!byBrand.has(key)) byBrand.set(key, []);
    byBrand.get(key)!.push(p);
  }

  const totalRevenue = products.reduce((acc, p) => acc + p.estMonthlyRevenueAud, 0) || 1;
  const brands: BrandIntelligence[] = [];

  for (const [name, items] of byBrand.entries()) {
    const count = items.length;
    const pricedItems = items.filter((p) => p.currentPriceAud > 0);
    const ratedItems = items.filter((p) => p.rating > 0);
    const avgPriceAud =
      pricedItems.length > 0
        ? Math.round((pricedItems.reduce((a, p) => a + p.currentPriceAud, 0) / pricedItems.length) * 100) / 100
        : 0;
    const avgPricePerLiterAud =
      pricedItems.length > 0
        ? Math.round((pricedItems.reduce((a, p) => a + p.pricePerLiterAud, 0) / pricedItems.length) * 100) / 100
        : 0;
    const avgRating =
      ratedItems.length > 0
        ? Math.round((ratedItems.reduce((a, p) => a + p.rating, 0) / ratedItems.length) * 100) / 100
        : 0;
    const totalEstMonthlySales = items.reduce((a, p) => a + p.estMonthlySales, 0);
    const totalEstMonthlyLiters = Math.round(
      items.reduce((a, p) => a + p.estMonthlySales * p.volumeLiters, 0)
    );
    const totalEstRevenueAud = Math.round(items.reduce((a, p) => a + p.estMonthlyRevenueAud, 0));
    const avgDiscountPct =
      Math.round((items.reduce((a, p) => a + p.discountPct, 0) / count) * 10) / 10;
    const promoFreq = Math.round(
      (items.filter((p) => p.hasCoupon || p.subscribeAndSave || p.discountPct > 0).length / count) * 100
    );
    const viscosities = Array.from(new Set(items.map((p) => p.viscosity))).slice(0, 4);
    const lower = name.toLowerCase();
    const australianFormulated =
      lower.includes('penrite') || lower.includes('nulon') || lower.includes('gulf western');
    const origin = australianFormulated
      ? 'Australia'
      : lower.includes('liqui') || lower.includes('fuchs')
      ? 'Germany'
      : lower.includes('castrol') || lower.includes('shell')
      ? 'UK / Global'
      : lower.includes('total') || lower.includes('elf') || lower.includes('motul')
      ? 'France'
      : lower.includes('valvoline') ||
        lower.includes('k&n') ||
        lower.includes('mobil') ||
        lower.includes('royal purple') ||
        lower.includes('red line')
      ? 'USA / Global'
      : 'International';

    const marketTier: BrandIntelligence['marketTier'] =
      avgPricePerLiterAud >= 20
        ? 'Enthusiast / Racing'
        : avgPricePerLiterAud >= 14
        ? 'Premium'
        : avgPricePerLiterAud >= 9
        ? 'Mid-tier'
        : 'Budget';

    brands.push({
      id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      name,
      origin,
      productCount: count,
      avgPriceAud,
      avgPricePerLiterAud,
      avgRating,
      totalEstMonthlySales,
      totalEstMonthlyLiters,
      totalEstRevenueAud,
      avgDiscountPct,
      marketTier,
      topViscosities: viscosities,
      promoFrequencyPct: promoFreq,
      marketSharePct: Math.round((totalEstRevenueAud / totalRevenue) * 1000) / 10,
      australianFormulated,
    });
  }

  return brands.sort((a, b) => b.totalEstRevenueAud - a.totalEstRevenueAud || b.productCount - a.productCount);
}

export function computeCategoryIntelligence(products: AutomotiveProduct[]): AutomotiveCategory[] {
  const byCat = new Map<EngineOilCategorySlug, AutomotiveProduct[]>();
  for (const p of products) {
    if (!byCat.has(p.categoryId)) byCat.set(p.categoryId, []);
    byCat.get(p.categoryId)!.push(p);
  }

  const categories: AutomotiveCategory[] = [];
  for (const [slug, items] of byCat.entries()) {
    const count = items.length;
    const pricedItems = items.filter((p) => p.currentPriceAud > 0);
    const avgPriceAud =
      pricedItems.length > 0
        ? Math.round((pricedItems.reduce((a, p) => a + p.currentPriceAud, 0) / pricedItems.length) * 100) / 100
        : 0;
    const avgDiscountPct =
      Math.round((items.reduce((a, p) => a + p.discountPct, 0) / count) * 10) / 10;
    const estMonthlySalesUnits = items.reduce((a, p) => a + p.estMonthlySales, 0);
    const estMonthlyRevenueAud = Math.round(items.reduce((a, p) => a + p.estMonthlyRevenueAud, 0));
    const topBrands = Array.from(new Set(items.map((p) => p.brand))).slice(0, 3);
    const topName = items[0]?.categoryName || slug;

    categories.push({
      id: slug,
      name: topName,
      slug,
      productCount: count,
      avgPriceAud,
      avgDiscountPct,
      estMonthlySalesUnits,
      estMonthlyRevenueAud,
      topBrands,
      demandLevel:
        estMonthlySalesUnits >= 2000 ? 'Explosive' : estMonthlySalesUnits >= 800 ? 'Very High' : 'High',
      description: `Live scraped Amazon ${items[0]?.marketplace || 'AU'} ${topName} listings (${count} active SKUs tracked).`,
    });
  }

  return categories.sort((a, b) => b.estMonthlyRevenueAud - a.estMonthlyRevenueAud);
}

export function computeMarketSummary(products: AutomotiveProduct[]): MarketAnalyticsSummary {
  const count = products.length;
  if (count === 0) {
    return {
      totalProductsTracked: 0,
      inStockCount: 0,
      outOfStockCount: 0,
      totalBrandsTracked: 0,
      avgProductPriceAud: 0,
      avgPricePerLiterAud: 0,
      avgDiscountPct: 0,
      productsWithPromotions: 0,
      estMonthlySalesTotal: 0,
      estMonthlyLitersTotal: 0,
      estMonthlyRevenueTotalAud: 0,
      productsWithPriceDrops: 0,
      trendingProductsCount: 0,
      topViscosityGrade: '—',
      hottestPriceDropAsin: '',
    };
  }

  const inStockCount = products.filter((p) => p.inStock).length;
  const outOfStockCount = count - inStockCount;
  const pricedProducts = products.filter((p) => p.currentPriceAud > 0);
  const brandsSet = new Set(products.map((p) => p.brand));
  const avgProductPriceAud =
    pricedProducts.length > 0
      ? Math.round((pricedProducts.reduce((a, p) => a + p.currentPriceAud, 0) / pricedProducts.length) * 100) / 100
      : 0;
  const avgPricePerLiterAud =
    pricedProducts.length > 0
      ? Math.round((pricedProducts.reduce((a, p) => a + p.pricePerLiterAud, 0) / pricedProducts.length) * 100) / 100
      : 0;
  const avgDiscountPct = Math.round((products.reduce((a, p) => a + p.discountPct, 0) / count) * 10) / 10;
  const productsWithPromotions = products.filter(
    (p) => p.hasCoupon || p.subscribeAndSave || p.discountPct > 0
  ).length;
  const estMonthlySalesTotal = products.reduce((a, p) => a + p.estMonthlySales, 0);
  const estMonthlyLitersTotal = Math.round(
    products.reduce((a, p) => a + p.estMonthlySales * p.volumeLiters, 0)
  );
  const estMonthlyRevenueTotalAud = Math.round(
    products.reduce((a, p) => a + p.estMonthlyRevenueAud, 0)
  );
  const productsWithPriceDrops = products.filter((p) => p.discountPct > 0).length;
  const trendingProductsCount = products.filter((p) => p.isTrending).length;

  const viscCounts = new Map<string, number>();
  for (const p of products) {
    viscCounts.set(p.viscosity, (viscCounts.get(p.viscosity) || 0) + 1);
  }
  const topViscosityGrade =
    Array.from(viscCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || '5W-30';
  const hottest = [...products].sort((a, b) => b.discountPct - a.discountPct)[0];

  return {
    totalProductsTracked: count,
    inStockCount,
    outOfStockCount,
    totalBrandsTracked: brandsSet.size,
    avgProductPriceAud,
    avgPricePerLiterAud,
    avgDiscountPct,
    productsWithPromotions,
    estMonthlySalesTotal,
    estMonthlyLitersTotal,
    estMonthlyRevenueTotalAud,
    productsWithPriceDrops,
    trendingProductsCount,
    topViscosityGrade,
    hottestPriceDropAsin: hottest?.asin || '',
  };
}
