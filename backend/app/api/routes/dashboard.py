from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.database import get_db
from app.models.case import Case
from app.models.review import Review
from app.models.user import User

router = APIRouter()

@router.get("/")
def get_dashboard_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role == "junior":
        cases = db.query(Case).filter(Case.created_by_id == current_user.id).all()
        # Since reviews are tied to cases, we could query reviews for these cases or by reviewer_id
        reviews = db.query(Review).join(Case).filter(Case.created_by_id == current_user.id).all()
    else:
        cases = db.query(Case).all()
        reviews = db.query(Review).all()

    
    issues_by_type = {}
    issues_by_severity = {}
    
    for case in cases:
        issues_by_type[case.category] = issues_by_type.get(case.category, 0) + 1
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
