import { MarketplaceCode, MarketplaceConfig } from '../src/types/automotive.ts';

export const MARKETPLACES: Record<MarketplaceCode, MarketplaceConfig> = {
  AU: {
    code: 'AU',
    countryName: 'Australia',
    domain: 'www.amazon.com.au',
    currency: 'AUD',
    currencySymbol: '$',
    marketplaceId: 'A39IBJ37TRP1C6',
    zipCode: '2000',
    locationLabel: 'Sydney NSW 2000 (AU)',
    directHtmlSupported: true,
    bestsellersNode: '4958131051',
  },
  US: {
    code: 'US',
    countryName: 'United States',
    domain: 'www.amazon.com',
    currency: 'USD',
    currencySymbol: '$',
    marketplaceId: 'ATVPDKIKX0DER',
    zipCode: '10001',
    locationLabel: 'New York NY 10001 (US)',
    directHtmlSupported: true,
    bestsellersNode: '15719391',
  },
  DE: {
    code: 'DE',
    countryName: 'Germany',
    domain: 'www.amazon.de',
    currency: 'EUR',
    currencySymbol: '€',
    marketplaceId: 'A1PA6795UKMFR9',
    zipCode: '10115',
    locationLabel: 'Berlin 10115 (DE)',
    directHtmlSupported: false,
    bestsellersNode: '79928031',
  },
  PL: {
    code: 'PL',
    countryName: 'Poland',
    domain: 'www.amazon.pl',
    currency: 'PLN',
    currencySymbol: 'zł',
    marketplaceId: 'A1C3SOZRARQ6R3',
    zipCode: '00-001',
    locationLabel: 'Warsaw 00-001 (PL)',
    directHtmlSupported: false,
    bestsellersNode: '20791871031',
  },
  PT: {
    code: 'PT',
    countryName: 'Portugal',
    domain: 'www.amazon.es',
    currency: 'EUR',
    currencySymbol: '€',
    marketplaceId: 'A1RKKUPIHCS9HS',
    zipCode: 'Portugal',
    locationLabel: 'Portugal (PT · amazon.es/-/pt)',
    directHtmlSupported: true,
    bestsellersNode: '2424815031',
  },
};

export function normalizeMarketplace(raw?: unknown): MarketplaceCode {
  const up = typeof raw === 'string' ? raw.trim().toUpperCase() : '';
  if (up === 'US' || up === 'USA') return 'US';
  if (up === 'DE' || up === 'GERMANY') return 'DE';
  if (up === 'PL' || up === 'POLAND') return 'PL';
  if (up === 'PT' || up === 'PORTUGAL') return 'PT';
  return 'AU';
}
