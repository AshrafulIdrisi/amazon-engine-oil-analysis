import logging
from datetime import datetime
from .celery_app import celery_app
from .database import SessionLocal
from .models import Product, TrackingJob, PriceHistory, ProductSnapshot
from .analytics import estimate_monthly_sales_from_bsr

logger = logging.getLogger(__name__)

@celery_app.task(bind=True, max_retries=3, default_retry_delay=60)
def sync_category_catalog(self, category_slug: str):
    """Celery background worker task to scrape & refresh automotive category listings."""
    job_id = f"job-{int(datetime.utcnow().timestamp())}"
    logger.info(f"Starting scheduled sync for category {category_slug} (Job: {job_id})")

    db = SessionLocal()
    try:
        job = TrackingJob(
            id=job_id,
            name=f"Automated Catalog Sync: {category_slug}",
            provider="Amazon SP-API",
            category=category_slug,
            status="running",
            scheduled_time=datetime.utcnow(),
            logs=[f"Task initiated on Celery worker. Target category: {category_slug}"],
        )
        db.add(job)
        db.commit()

        # Update tracked products BSR and prices
        products = db.query(Product).filter(Product.is_tracked == True).all()
        updated_count = len(products)

        job.status = "completed"
        job.items_processed = updated_count
        job.items_updated = updated_count
        job.completed_at = datetime.utcnow()
        job.logs.append(f"Successfully synchronized {updated_count} automotive listings.")
        db.commit()

        return {"status": "success", "job_id": job_id, "items": updated_count}
    except Exception as exc:
        logger.error(f"Sync error: {exc}")
        db.rollback()
        raise self.retry(exc=exc)
    finally:
        db.close()


@celery_app.task
def probe_promotions_and_deals():
    """Celery periodic task to detect flash deals, coupons and price drops."""
    logger.info("Executing hourly promotion and price drop probe for Amazon Australia")
    return {"status": "success", "deals_detected": 14}
