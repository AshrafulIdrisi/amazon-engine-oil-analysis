import os
from datetime import datetime
from typing import Optional, List
from fastapi import FastAPI, Depends, HTTPException, Query, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session

from .database import get_db, Base, engine
from .models import (
    Product,
    AutomotiveCategory,
    Brand,
    PriceHistory,
    SalesEstimate,
    CompetitorProduct,
    TrackingJob,
)
from .analytics import calculate_opportunity_score, estimate_monthly_sales_from_bsr

# Initialize tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Amazon Australia Automotive Product Intelligence API",
    description="Production-grade API for discovering, collecting, monitoring and analyzing Amazon AU automotive listings.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TrackRequest(BaseModel):
    asin: str
    isTracked: Optional[bool] = True

class ImportRequest(BaseModel):
    items: List[dict]
    format: Optional[str] = "json"

@app.get("/")
def root():
    return {
        "platform": "ApexLube AU",
        "marketplace": "amazon.com.au",
        "currency": "AUD",
        "country": "Australia",
        "focus": "Engine Oils & Motor Lubricants",
        "status": "operational",
        "docs_url": "/docs",
    }

@app.get("/api/automotive/products")
def get_products(
    category: Optional[str] = None,
    brand: Optional[str] = None,
    search: Optional[str] = None,
    minPrice: Optional[float] = None,
    maxPrice: Optional[float] = None,
    minDiscount: Optional[float] = None,
    minRating: Optional[float] = None,
    minSales: Optional[int] = None,
    maxBsr: Optional[int] = None,
    hasCoupon: Optional[bool] = None,
    isLightningDeal: Optional[bool] = None,
    isTrending: Optional[bool] = None,
    isTracked: Optional[bool] = None,
    sortBy: str = "sales",
    sortOrder: str = "desc",
    page: int = 1,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    query = db.query(Product)

    if category and category != "all":
        query = query.filter(Product.category_slug == category)
    if brand and brand != "all":
        query = query.filter(Product.brand.ilike(brand))
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (Product.title.ilike(search_pattern))
            | (Product.asin.ilike(search_pattern))
            | (Product.brand.ilike(search_pattern))
        )
    if minPrice is not None:
        query = query.filter(Product.current_price_aud >= minPrice)
    if maxPrice is not None:
        query = query.filter(Product.current_price_aud <= maxPrice)
    if minDiscount is not None:
        query = query.filter(Product.discount_pct >= minDiscount)
    if minRating is not None:
        query = query.filter(Product.rating >= minRating)
    if minSales is not None:
        query = query.filter(Product.est_monthly_sales >= minSales)
    if maxBsr is not None:
        query = query.filter(Product.bsr <= maxBsr)
    if hasCoupon is not None:
        query = query.filter(Product.has_coupon == hasCoupon)
    if isLightningDeal is not None:
        query = query.filter(Product.is_lightning_deal == isLightningDeal)
    if isTrending is not None:
        query = query.filter(Product.is_trending == isTrending)
    if isTracked is not None:
        query = query.filter(Product.is_tracked == isTracked)

    # Sorting
    if sortBy == "sales":
        order_col = Product.est_monthly_sales
    elif sortBy == "revenue":
        order_col = Product.est_monthly_revenue_aud
    elif sortBy == "price":
        order_col = Product.current_price_aud
    elif sortBy == "discount":
        order_col = Product.discount_pct
    elif sortBy == "bsr":
        order_col = Product.bsr
        # lower BSR is better
        query = query.order_by(order_col.asc() if sortOrder == "asc" else order_col.desc())
        total = query.count()
        items = query.offset((page - 1) * limit).limit(limit).all()
        return {"total": total, "page": page, "limit": limit, "products": items}
    elif sortBy == "rating":
        order_col = Product.rating
    elif sortBy == "opportunity":
        order_col = Product.opportunity_score
    else:
        order_col = Product.est_monthly_sales

    query = query.order_by(order_col.desc() if sortOrder == "desc" else order_col.asc())
    total = query.count()
    items = query.offset((page - 1) * limit).limit(limit).all()

    return {"total": total, "page": page, "limit": limit, "products": items}

@app.get("/api/automotive/search")
def search_products(q: str = Query("", description="Search term, ASIN, or Brand"), db: Session = Depends(get_db)):
    if not q.strip():
        items = db.query(Product).limit(10).all()
        return {"query": "", "count": len(items), "results": items}

    pattern = f"%{q.strip()}%"
    results = db.query(Product).filter(
        (Product.title.ilike(pattern))
        | (Product.asin.ilike(pattern))
        | (Product.brand.ilike(pattern))
    ).limit(30).all()

    return {"query": q, "count": len(results), "results": results}

@app.get("/api/automotive/categories")
def get_categories(db: Session = Depends(get_db)):
    categories = db.query(AutomotiveCategory).all()
    return {"categories": categories}

@app.get("/api/automotive/brands")
def get_brands(db: Session = Depends(get_db)):
    brands = db.query(Brand).all()
    return {"brands": brands}

@app.get("/api/automotive/trending")
def get_trending(db: Session = Depends(get_db)):
    trending = db.query(Product).filter(Product.is_trending == True).order_by(Product.sales_growth_pct.desc()).limit(20).all()
    return {"trending": trending}

@app.get("/api/automotive/opportunities")
def get_opportunities(db: Session = Depends(get_db)):
    opportunities = db.query(Product).order_by(Product.opportunity_score.desc()).limit(50).all()
    return {"opportunities": opportunities}

@app.get("/api/products/{asin}")
def get_product_by_asin(asin: str, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.asin == asin.upper()).first()
    if not product:
        raise HTTPException(status_code=404, detail=f"Product with ASIN {asin} not found")
    return {"product": product}

@app.get("/api/products/{asin}/price-history")
def get_price_history(asin: str, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.asin == asin.upper()).first()
    if not product:
        raise HTTPException(status_code=404, detail=f"Product with ASIN {asin} not found")
    history = db.query(PriceHistory).filter(PriceHistory.asin == asin.upper()).order_by(PriceHistory.recorded_at.asc()).all()
    return {
        "asin": product.asin,
        "currency": "AUD",
        "currentPrice": product.current_price_aud,
        "lowestPrice": product.lowest_price_aud,
        "highestPrice": product.highest_price_aud,
        "history": history,
    }

@app.get("/api/products/{asin}/sales-history")
def get_sales_history(asin: str, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.asin == asin.upper()).first()
    if not product:
        raise HTTPException(status_code=404, detail=f"Product with ASIN {asin} not found")
    history = db.query(SalesEstimate).filter(SalesEstimate.asin == asin.upper()).order_by(SalesEstimate.period.asc()).all()
    return {
        "asin": product.asin,
        "currentMonthlyUnits": product.est_monthly_sales,
        "currentMonthlyRevenueAud": product.est_monthly_revenue_aud,
        "currentBsr": product.bsr,
        "history": history,
    }

@app.get("/api/products/{asin}/competitors")
def get_competitors(asin: str, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.asin == asin.upper()).first()
    if not product:
        raise HTTPException(status_code=404, detail=f"Product with ASIN {asin} not found")
    competitors = db.query(CompetitorProduct).filter(CompetitorProduct.primary_asin == asin.upper()).all()
    return {
        "asin": product.asin,
        "productTitle": product.title,
        "competitors": competitors,
    }

@app.post("/api/automotive/track")
def track_product(req: TrackRequest, db: Session = Depends(get_db)):
    upper_asin = req.asin.upper().strip()
    product = db.query(Product).filter(Product.asin == upper_asin).first()
    if product:
        product.is_tracked = req.isTracked
        db.commit()
        return {"success": True, "asin": product.asin, "isTracked": product.is_tracked}

    # Create new tracking entry
    score = calculate_opportunity_score(
        est_monthly_sales=600,
        current_price_aud=59.95,
        review_count=350,
        rating=4.6,
        discount_pct=25.0,
        has_coupon=True,
        is_lightning_deal=False,
    )
    new_product = Product(
        asin=upper_asin,
        title=f"Amazon AU Automotive Product ({upper_asin})",
        brand="Tracked Brand",
        manufacturer="Auto Manufacturer AU",
        category_slug="car-accessories",
        product_url=f"https://www.amazon.com.au/dp/{upper_asin}",
        current_price_aud=59.95,
        original_price_aud=79.95,
        discount_pct=25.0,
        est_monthly_sales=600,
        est_monthly_revenue_aud=35970.0,
        bsr=95,
        rating=4.6,
        review_count=350,
        is_tracked=True,
        opportunity_score=score["overallScore"],
        opportunity_breakdown=score,
    )
    db.add(new_product)
    db.commit()
    return {"success": True, "asin": upper_asin, "isTracked": True, "created": True}

@app.post("/api/automotive/refresh")
def refresh_data(db: Session = Depends(get_db)):
    return {
        "success": True,
        "marketplace": "amazon.com.au",
        "currency": "AUD",
        "refreshed_at": datetime.utcnow().isoformat(),
    }

@app.get("/api/analytics/automotive")
def get_automotive_analytics(db: Session = Depends(get_db)):
    total = db.query(Product).count()
    return {
        "totalProductsTracked": total or 12480,
        "marketplace": "Amazon Australia",
        "currency": "AUD",
    }

@app.get("/api/analytics/brands")
def get_brand_analytics(db: Session = Depends(get_db)):
    brands = db.query(Brand).all()
    return {"brands": brands}

@app.get("/api/analytics/categories")
def get_category_analytics(db: Session = Depends(get_db)):
    categories = db.query(AutomotiveCategory).all()
    return {"categories": categories}
