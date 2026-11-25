import os
from celery import Celery

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

celery_app = Celery(
    "amazon_au_automotive",
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=["app.tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Australia/Sydney",
    enable_utc=True,
    beat_schedule={
        "nightly-au-automotive-catalog-sync": {
            "task": "app.tasks.sync_category_catalog",
            "schedule": 86400.0, # Every 24 hours
            "args": ("all",),
        },
        "hourly-promotion-price-drop-probe": {
            "task": "app.tasks.probe_promotions_and_deals",
            "schedule": 3600.0, # Every 1 hour
        },
    },
)
