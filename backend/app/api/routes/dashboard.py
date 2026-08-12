from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.case import Case
from app.models.review import Review

router = APIRouter()

@router.get("/")
def get_dashboard_stats(db: Session = Depends(get_db)):
    cases = db.query(Case).all()
    reviews = db.query(Review).all()
    
    issues_by_type = {}
    issues_by_severity = {}
    
    for case in cases:
        issues_by_type[case.concept_tag] = issues_by_type.get(case.concept_tag, 0) + 1
        issues_by_severity[case.severity] = issues_by_severity.get(case.severity, 0) + 1
        
    review_status_counts = {"Accepted": 0, "Edited": 0, "Rejected": 0}
    for r in reviews:
        if r.status in review_status_counts:
            review_status_counts[r.status] += 1
            
    total_reviews = len(reviews)
    agreement_rate = (review_status_counts["Accepted"] / total_reviews * 100) if total_reviews > 0 else 0
    
    return {
        "issues_by_type": [{"name": k, "value": v} for k, v in issues_by_type.items()],
        "issues_by_severity": [{"name": k, "value": v} for k, v in issues_by_severity.items()],
        "review_stats": {
            "total_reviews": total_reviews,
            "accepted": review_status_counts["Accepted"],
            "edited": review_status_counts["Edited"],
            "rejected": review_status_counts["Rejected"],
            "agreement_rate": round(agreement_rate, 2)
        }
    }
