import pytest
from app.analytics import calculate_opportunity_score, estimate_monthly_sales_from_bsr
from app.providers.csv_provider import CsvImportProvider

def test_opportunity_score_calculation():
    # Test high opportunity product (sweet spot pricing, strong sales, accessible reviews)
    result = calculate_opportunity_score(
        est_monthly_sales=1200,
        current_price_aud=89.0,
        review_count=850,
        rating=4.5,
        discount_pct=25.0,
        has_coupon=True,
        is_lightning_deal=True,
    )

    assert 0 <= result["overallScore"] <= 100
    assert result["demandScore"] >= 24
    assert result["marginScore"] >= 22
    assert result["competitionScore"] >= 15
    assert len(result["strengths"]) > 0

def test_bsr_to_sales_estimation():
    # Lower BSR (e.g. #15) should produce significantly higher sales than #500
    sales_bsr_15 = estimate_monthly_sales_from_bsr(15)
    sales_bsr_500 = estimate_monthly_sales_from_bsr(500)

    assert sales_bsr_15 > sales_bsr_500
    assert sales_bsr_15 > 1000
    assert sales_bsr_500 > 10

def test_csv_provider_parsing():
    provider = CsvImportProvider()
    csv_sample = """asin,title,brand,price,bsr,sales
B083G3J2P7,Vantrue 4K Dashcam,Vantrue,289.0,42,1140
B07ZPC94G4,NOCO Jump Starter,NOCO,154.95,28,1320"""

    parsed = provider.parse_csv_content(csv_sample)
    assert len(parsed) == 2
    assert parsed[0]["asin"] == "B083G3J2P7"
    assert parsed[0]["currentPriceAud"] == 289.0
    assert parsed[1]["brand"] == "NOCO"
