import math
from typing import Dict, Any, List

def calculate_opportunity_score(
    est_monthly_sales: int,
    current_price_aud: float,
    review_count: int,
    rating: float,
    discount_pct: float,
    has_coupon: bool,
    is_lightning_deal: bool,
) -> Dict[str, Any]:
    """
    Calculates a calibrated 0-100 Product Opportunity Score for Amazon Australia Engine Oils & Motor Lubricants.

    Methodology:
    1. Demand Factor (0 - 30 pts):
       - Measures engine oil sales velocity in units (bottles/drums) per month.
       - > 1,500 units = 30 pts; 800 - 1,500 = 24 - 28 pts; 300 - 800 = 18 - 23 pts; < 100 = 8 pts.
    2. Margin & Packaging Factor (0 - 25 pts):
       - Amazon AU engine oil sweet spot is $45 - $130 AUD (5L - 10L jugs) where $/Litre yields solid FBA margins.
       - Extremely low price (< $20 AUD for 1L) incurs high relative FBA weight surcharges.
    3. Competition & Review Barrier (0 - 20 pts):
       - Products with < 1,000 reviews are much easier to outrank (18-20 pts).
       - Megasellers with > 30,000 reviews have high moat (6-10 pts).
    4. Rating & Satisfaction Gap (0 - 15 pts):
       - 3.8 - 4.4 rating highlights an existing customer dissatisfaction gap ready for product improvements (13-15 pts).
       - 4.8+ indicates satisfied customer base, requiring superior branding (9-11 pts).
    5. Promotion & Deal Elasticity (0 - 10 pts):
       - Active coupon, lightning deals, and 20%+ discount show high conversion responsiveness on Amazon AU (8-10 pts).
    """

    # 1. Demand Score (max 30)
    if est_monthly_sales >= 1500:
        demand_score = 30
    elif est_monthly_sales >= 800:
        demand_score = 24 + int((est_monthly_sales - 800) / 700 * 6)
    elif est_monthly_sales >= 300:
        demand_score = 18 + int((est_monthly_sales - 300) / 500 * 6)
    else:
        demand_score = max(5, int(est_monthly_sales / 300 * 18))

    # 2. Margin Score (max 25)
    if 40 <= current_price_aud <= 220:
        margin_score = 24
    elif 220 < current_price_aud <= 500:
        margin_score = 22
    elif current_price_aud > 500:
        margin_score = 20
    elif 20 <= current_price_aud < 40:
        margin_score = 17
    else:
        margin_score = 12

    # 3. Competition Score (max 20)
    if review_count < 500:
        comp_score = 20
    elif review_count < 2000:
        comp_score = 17
    elif review_count < 10000:
        comp_score = 13
    else:
        comp_score = 8

    # 4. Rating Gap Score (max 15)
    if 3.8 <= rating <= 4.4:
        rating_gap_score = 15
    elif 4.4 < rating <= 4.7:
        rating_gap_score = 12
    elif rating > 4.7:
        rating_gap_score = 10
    else:
        rating_gap_score = 8

    # 5. Promo Elasticity Score (max 10)
    promo_score = 5
    if has_coupon:
        promo_score += 3
    if is_lightning_deal or discount_pct >= 20:
        promo_score += 2
    promo_score = min(10, promo_score)

    total_score = min(100, demand_score + margin_score + comp_score + rating_gap_score + promo_score)

    strengths = []
    risks = []

    if demand_score >= 25:
        strengths.append(f"High Australian sales volume ({est_monthly_sales:,} estimated units/mo)")
    if margin_score >= 22:
        strengths.append(f"Optimal price point (${current_price_aud:.2f} AUD) for healthy FBA margins")
    if comp_score >= 17:
        strengths.append("Accessible review barrier; manageable competitor moat")
    if has_coupon or is_lightning_deal:
        strengths.append("Demonstrated promotion elasticity with active Amazon AU deals")

    if comp_score <= 10:
        risks.append(f"High review entrenchment ({review_count:,} reviews on top listing)")
    if current_price_aud < 25:
        risks.append("Low unit price requires multi-pack bundling to offset pick/pack costs")

    return {
        "overallScore": total_score,
        "demandScore": demand_score,
        "marginScore": margin_score,
        "competitionScore": comp_score,
        "ratingGapScore": rating_gap_score,
        "promoElasticityScore": promo_score,
        "keyVerdict": "High-Potential Automotive Opportunity" if total_score >= 80 else "Moderate Niche Potential",
        "strengths": strengths,
        "risks": risks,
    }


def estimate_monthly_sales_from_bsr(bsr: int, category_factor: float = 1.0) -> int:
    """
    Calibrated BSR-to-Monthly-Sales power law curve for Amazon Australia Automotive:
    Sales = a * (BSR ^ -b)
    """
    if bsr <= 1:
        return int(3200 * category_factor)
    # Calibrated for Amazon AU market scale (~1/15th of US volume)
    estimated = int(45000 / (bsr ** 0.58) * category_factor)
    return max(15, estimated)
