
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_current_senior_user
from app.database import get_db
from app.models.case import Case
from app.models.review import Review
from app.models.user import User
from app.schemas.review import ReviewCreate, ReviewResponse

router = APIRouter()

@router.post("/{case_id}", response_model=ReviewResponse)
def create_review(case_id: int, review: ReviewCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_senior_user)):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
        
    existing_review = db.query(Review).filter(Review.case_id == case_id).first()
    if existing_review:
        existing_review.status = review.status
        existing_review.reason = review.reason
        existing_review.reviewer_id = current_user.id
        db_review = existing_review
    else:
        db_review = Review(case_id=case_id, status=review.status, reason=review.reason, reviewer_id=current_user.id)
        db.add(db_review)
        
    if review.status == "Accepted":
        case.diagnosis_status = "RESOLVED"
    elif review.status == "Rejected":
        case.diagnosis_status = "NEEDS_INFO"
        
    db.commit()
    db.refresh(db_review)
    return db_review
