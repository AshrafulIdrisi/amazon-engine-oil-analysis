# ApexLube AU — Amazon Australia Engine Oil Market Intelligence Platform

A high-performance automotive lubricant intelligence and market research platform focused exclusively on **Engine Oils & Motor Lubricants** on **Amazon Australia (`amazon.com.au`)** with pricing in **Australian Dollars (AUD)** and explicit **Price per Litre ($/Litre AUD)** analytics.

## Core Focus: Engine Oils & Motor Lubricants Only

All unrelated general automotive accessories, car wash chemicals, dash cameras, and oil filters have been purged. The platform models the real-world Australian engine oil market dynamics:
- **Viscosity Breakdown**: 5W-30, 5W-40, 0W-20, 15W-40, 10W-40, 20W-60, and specialized racing/vintage formulations.
- **Base Formulation Types**: Full Synthetic, PAO / Ester Synthetic, Semi-Synthetic, and Mineral.
- **Engine Compatibility**: Petrol, Turbo-Petrol, Diesel with DPF (Low SAPS), LPG, and Hybrid engines.
- **OEM Approvals & Standards**: API SP/SN, ACEA C3/A3/B4, MB 229.51, BMW Longlife-04, VW 504.00/507.00, Porsche C30, Ford WSS, etc.
- **Anti-Wear Additives**: ZDDP Zinc content tracking (ppm) for classic flat-tappet camshafts and racing applications.
- **Packaging Economics**: 5 Litre jugs, 6 Litre packs, 10 Litre drums, and 1 Litre top-ups with normalized `$/Litre AUD` calculations.

---

## Architecture Overview

ApexLube AU is engineered with a dual-execution architecture:
1. **Interactive Full-Stack Web Engine (Node/Express + Vite + React 19 + TypeScript + Recharts)**:
   - Live development server mounting API routes and Vite middleware on port 3000 (`tsx server.ts`).
   - Comprehensive analytical dashboard supporting Engine Oil Viscosity Segments, Brand Benchmarking, and $/Litre pricing trackers.
2. **Enterprise Python Backend (FastAPI + SQLAlchemy + Celery + Redis + PostgreSQL)**:
   - Located in `/backend` with clean data collection provider abstraction.
   - Background worker task scheduling via Celery and Redis.
   - Relational database schema modeling engine oils, viscosities, packaging volumes, price per litre, and opportunity scores.

---

## Engine Oil Viscosity & Application Segments

1. **5W-30 Full Synthetic (Passenger Car & Euro DPF)**
2. **5W-40 Full Synthetic (High Thermal Stability & Euro)**
3. **0W-20 Advanced Synthetic (Modern Fuel-Efficient & Hybrids)**
4. **15W-40 Heavy Duty Diesel (4WD, Towing & Transport)**
5. **10W-40 Semi-Synthetic (Multi-Valve & Commuter)**
6. **100% PAO / Ester Racing Lubricants (Track & Turbo Competition)**
7. **Classic & Vintage High-Zinc Mineral (Flat-Tappet Protection)**
8. **20W-50 / 20W-60 High Mileage & Heavy Towing**

---

## Opportunity Score Methodology for Engine Oils (0 to 100)

Every engine oil listing is evaluated across 5 quantitative dimensions:
1. **Demand & Volume Factor (Weight: 30%)**: Monthly bottle and litre consumption velocity on Amazon Australia.
2. **Packaging Margin & $/Litre Factor (Weight: 25%)**: Evaluates bottle volume (5L/10L) and retail price ($45–$130 AUD). FBA heavy/bulky rates are optimized for 5L jugs compared to single 1L bottles.
3. **Competition & Moat Factor (Weight: 20%)**: Review entrenchment of leading OEM brands vs emerging private label or specialty boutique blenders.
4. **Customer Rating Gap (Weight: 15%)**: Engine oil ratings between 3.8–4.4 indicate engine sludge, leaking packaging during courier delivery, or misaligned specs.
5. **Promotion & Subscribe & Save Elasticity (Weight: 10%)**: Conversion lift from repeat Subscribe & Save discounts and clip coupons.

---

## API Endpoints

- `GET /api/automotive/products` - Search and filter by viscosity, base oil type, engine compatibility, price-per-litre ($/L), discount, and BSR.
- `GET /api/automotive/search` - Instant autocomplete search by title, ASIN, brand, or viscosity.
- `GET /api/automotive/categories` - Metrics for all engine oil viscosity segments.
- `GET /api/automotive/brands` - Australian market oil brands (Penrite, Castrol, Mobil 1, Nulon, Valvoline, Liqui Moly, Gulf Western).
- `GET /api/automotive/trending` - Engine oils with highest monthly sales velocity and improving BSR.
- `GET /api/automotive/opportunities` - Engine oils ranked by Opportunity Score (0-100).
- `GET /api/products/:asin` - Detailed engine oil profile with specs, approvals, and bottle volumes.
- `GET /api/products/:asin/price-history` - Historical price points, discounts, and $/Litre fluctuations.
- `GET /api/products/:asin/sales-history` - Monthly units and litres dispensed.
- `GET /api/products/:asin/competitors` - Head-to-head competitor comparisons.
- `POST /api/automotive/track` - Toggle or add ASIN to continuous tracking.
- `GET /api/export/:format` - Export engine oil dataset to CSV, Excel, JSON, or PDF with $/Litre metrics.

---

## Docker Deployment

To launch the complete PostgreSQL, Redis, FastAPI, Celery, and UI stack:

```bash
docker-compose up --build
```
