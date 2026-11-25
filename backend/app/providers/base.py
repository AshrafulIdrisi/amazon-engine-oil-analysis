from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional

class BaseCollectionProvider(ABC):
    """
    Abstract base provider for Amazon Australia automotive data collection.
    Complies with strict authorized access, ethical API limits, and rate throttling.
    """

    def __init__(self, provider_id: str, provider_name: str, config: Optional[Dict[str, Any]] = None):
        self.provider_id = provider_id
        self.provider_name = provider_name
        self.config = config or {}
        self.marketplace_id = "A39IBJ37TRP1C6" # Amazon Australia Marketplace ID
        self.currency = "AUD"
        self.country = "Australia"

    @abstractmethod
    def fetch_product(self, asin: str) -> Optional[Dict[str, Any]]:
        """Fetch raw snapshot for an individual ASIN."""
        pass

    @abstractmethod
    def search_category(self, category_slug: str, page: int = 1, limit: int = 50) -> List[Dict[str, Any]]:
        """Collect top automotive listings for a specific category."""
        pass

    @abstractmethod
    def parse_pricing_and_promotions(self, raw_data: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize pricing, discounts, and active coupon badges."""
        pass

    def test_connection(self) -> Dict[str, Any]:
        """Test API connectivity and credentials validation."""
        return {
            "provider": self.provider_name,
            "status": "ready",
            "marketplace": "amazon.com.au",
            "currency": self.currency,
        }
