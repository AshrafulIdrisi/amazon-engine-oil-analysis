from datetime import datetime
from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    Boolean,
    DateTime,
    ForeignKey,
    Text,
    JSON,
    Index,
)
from sqlalchemy.orm import relationship
from .database import Base

class AutomotiveCategory(Base):
    __tablename__ = "automotive_categories"

    id = Column(String(50), primary_key=True)
    name = Column(String(100), nullable=False)
    slug = Column(String(100), unique=True, nullable=False, index=True)
    product_count = Column(Integer, default=0)
    avg_price_aud = Column(Float, default=0.0)
    avg_discount_pct = Column(Float, default=0.0)
    est_monthly_sales_units = Column(Integer, default=0)
    est_monthly_revenue_aud = Column(Float, default=0.0)
    top_brands = Column(JSON, default=list)
    demand_level = Column(String(50), default="High")
    description = Column(Text, nullable=True)

    products = relationship("Product", back_populates="category")


class Brand(Base):
    __tablename__ = "brands"

    id = Column(String(50), primary_key=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    origin = Column(String(100), default="Australia")
    product_count = Column(Integer, default=0)
    avg_price_aud = Column(Float, default=0.0)
    avg_rating = Column(Float, default=0.0)
    total_est_monthly_sales = Column(Integer, default=0)
    total_est_revenue_aud = Column(Float, default=0.0)
    avg_discount_pct = Column(Float, default=0.0)
    market_tier = Column(String(50), default="Mid-tier")
    top_categories = Column(JSON, default=list)
    promo_frequency_pct = Column(Float, default=0.0)
    market_share_pct = Column(Float, default=0.0)


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, autoincrement=True)
    asin = Column(String(20), unique=True, nullable=False, index=True)
    title = Column(String(500), nullable=False)
    brand = Column(String(100), nullable=False, index=True)
    manufacturer = Column(String(150), nullable=True)
    category_slug = Column(String(100), ForeignKey("automotive_categories.slug"), nullable=False)
    product_url = Column(String(500), nullable=False)
    image_url = Column(String(500), nullable=True)
    description = Column(Text, nullable=True)
    specifications = Column(JSON, default=dict)
    variations = Column(JSON, default=list)

    # Engine Oil Specific Attributes
    viscosity = Column(String(50), nullable=True, index=True)
    volume_liters = Column(Float, default=5.0)
    price_per_liter_aud = Column(Float, default=0.0, index=True)
    oil_type = Column(String(50), default="Full Synthetic")
    engine_compatibility = Column(String(50), default="Petrol & Diesel")

    # Pricing (AUD)
    current_price_aud = Column(Float, nullable=False, index=True)
    original_price_aud = Column(Float, nullable=False)
    list_price_aud = Column(Float, nullable=True)
    sale_price_aud = Column(Float, nullable=True)
    coupon_price_aud = Column(Float, nullable=True)
    discount_pct = Column(Float, default=0.0, index=True)
    lowest_price_aud = Column(Float, nullable=True)
    highest_price_aud = Column(Float, nullable=True)
    avg_price_aud = Column(Float, nullable=True)

    # Promotions
    has_coupon = Column(Boolean, default=False, index=True)
    coupon_value_aud = Column(Float, default=0.0)
    deal_badge = Column(String(50), nullable=True)
    is_lightning_deal = Column(Boolean, default=False, index=True)
    subscribe_and_save = Column(Boolean, default=False)
    promo_history_count = Column(Integer, default=0)

    # Sales Intelligence
    est_daily_sales = Column(Integer, default=0)
    est_weekly_sales = Column(Integer, default=0)
    est_monthly_sales = Column(Integer, default=0, index=True)
    est_monthly_revenue_aud = Column(Float, default=0.0, index=True)
    sales_growth_pct = Column(Float, default=0.0)
    demand_indicator = Column(String(50), default="High")

    # Ranking
    bsr = Column(Integer, nullable=False, index=True)
    category_rank = Column(Integer, default=1)
    subcategory_rank = Column(Integer, default=1)
    bsr_change_7d_pct = Column(Float, default=0.0)

    # Reviews
    rating = Column(Float, default=0.0, index=True)
    review_count = Column(Integer, default=0)
    rating_distribution = Column(JSON, default=dict)
    review_growth_30d = Column(Integer, default=0)

    # Inventory & Status
    availability = Column(String(50), default="In Stock")
    in_stock = Column(Boolean, default=True)
    is_trending = Column(Boolean, default=False, index=True)
    is_tracked = Column(Boolean, default=True, index=True)

    # Opportunity Score
    opportunity_score = Column(Float, default=0.0, index=True)
    opportunity_breakdown = Column(JSON, default=dict)

    # Timestamps
    last_scraped_at = Column(DateTime, default=datetime.utcnow)
    first_tracked_at = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    category = relationship("AutomotiveCategory", back_populates="products")
    snapshots = relationship("ProductSnapshot", back_populates="product", cascade="all, delete-orphan")
    price_records = relationship("PriceHistory", back_populates="product", cascade="all, delete-orphan")
    sales_records = relationship("SalesEstimate", back_populates="product", cascade="all, delete-orphan")
    promotions = relationship("Promotion", back_populates="product", cascade="all, delete-orphan")
    ranking_records = relationship("RankingHistory", back_populates="product", cascade="all, delete-orphan")


class ProductSnapshot(Base):
    __tablename__ = "product_snapshots"

    id = Column(Integer, primary_key=True, autoincrement=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False, index=True)
    asin = Column(String(20), nullable=False, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    price_aud = Column(Float, nullable=False)
    bsr = Column(Integer, nullable=False)
    est_monthly_sales = Column(Integer, default=0)
    rating = Column(Float, default=0.0)
    review_count = Column(Integer, default=0)
    has_coupon = Column(Boolean, default=False)
    is_lightning_deal = Column(Boolean, default=False)

    product = relationship("Product", back_populates="snapshots")


class PriceHistory(Base):
    __tablename__ = "price_history"

    id = Column(Integer, primary_key=True, autoincrement=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False, index=True)
    asin = Column(String(20), nullable=False, index=True)
    recorded_at = Column(DateTime, default=datetime.utcnow, index=True)
    price_aud = Column(Float, nullable=False)
    original_price_aud = Column(Float, nullable=True)
    discount_pct = Column(Float, default=0.0)
    is_deal = Column(Boolean, default=False)
    coupon_aud = Column(Float, default=0.0)
    event_type = Column(String(50), default="normal")

    product = relationship("Product", back_populates="price_records")


class SalesEstimate(Base):
    __tablename__ = "sales_estimates"

    id = Column(Integer, primary_key=True, autoincrement=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False, index=True)
    asin = Column(String(20), nullable=False, index=True)
    period = Column(String(20), nullable=False) # e.g. '2026-10'
    est_units = Column(Integer, nullable=False)
    est_revenue_aud = Column(Float, nullable=False)
    bsr = Column(Integer, nullable=False)
    confidence_score = Column(Float, default=0.85)
    estimation_method = Column(String(50), default="bsr_curve_v2")
    created_at = Column(DateTime, default=datetime.utcnow)

    product = relationship("Product", back_populates="sales_records")


class Promotion(Base):
    __tablename__ = "promotions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False, index=True)
    asin = Column(String(20), nullable=False, index=True)
    promo_type = Column(String(50), nullable=False) # coupon, lightning_deal, prime_exclusive
    discount_amount_aud = Column(Float, default=0.0)
    discount_pct = Column(Float, default=0.0)
    badge_text = Column(String(100), nullable=True)
    start_time = Column(DateTime, default=datetime.utcnow)
    end_time = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True, index=True)

    product = relationship("Product", back_populates="promotions")


class RankingHistory(Base):
    __tablename__ = "ranking_history"

    id = Column(Integer, primary_key=True, autoincrement=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False, index=True)
    asin = Column(String(20), nullable=False, index=True)
    recorded_at = Column(DateTime, default=datetime.utcnow, index=True)
    bsr = Column(Integer, nullable=False)
    category_rank = Column(Integer, default=1)
    subcategory_rank = Column(Integer, default=1)

    product = relationship("Product", back_populates="ranking_records")


class CompetitorProduct(Base):
    __tablename__ = "competitor_products"

    id = Column(Integer, primary_key=True, autoincrement=True)
    primary_asin = Column(String(20), nullable=False, index=True)
    competitor_asin = Column(String(20), nullable=False, index=True)
    title = Column(String(500), nullable=False)
    brand = Column(String(100), nullable=False)
    price_aud = Column(Float, nullable=False)
    rating = Column(Float, default=0.0)
    review_count = Column(Integer, default=0)
    bsr = Column(Integer, nullable=False)
    discount_pct = Column(Float, default=0.0)
    est_monthly_sales = Column(Integer, default=0)
    est_monthly_revenue = Column(Float, default=0.0)
    similarity_score = Column(Float, default=0.0)
    price_difference_pct = Column(Float, default=0.0)
    image_url = Column(String(500), nullable=True)


class TrackingJob(Base):
    __tablename__ = "tracking_jobs"

    id = Column(String(50), primary_key=True)
    name = Column(String(200), nullable=False)
    provider = Column(String(100), nullable=False)
    category = Column(String(100), nullable=False)
    status = Column(String(50), default="queued", index=True)
    items_processed = Column(Integer, default=0)
    items_updated = Column(Integer, default=0)
    new_discounts_found = Column(Integer, default=0)
    duration_ms = Column(Integer, default=0)
    scheduled_time = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    logs = Column(JSON, default=list)


class DataSource(Base):
    __tablename__ = "data_sources"

    id = Column(String(50), primary_key=True)
    name = Column(String(100), nullable=False)
    provider_type = Column(String(50), nullable=False) # amazon_sp_api, licensed_partner, csv_import, demo
    status = Column(String(50), default="active")
    credentials_configured = Column(Boolean, default=False)
    rate_limit_per_min = Column(Integer, default=60)
    last_sync_at = Column(DateTime, nullable=True)
    metadata_config = Column(JSON, default=dict)
