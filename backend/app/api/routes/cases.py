from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.case import Case
from app.schemas.case import CaseResponse
from typing import List

router = APIRouter()

@router.get("/", response_model=List[CaseResponse])
def get_cases(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    cases = db.query(Case).offset(skip).limit(limit).all()
    return cases

@router.get("/{case_id}", response_model=CaseResponse)
def get_case(case_id: int, db: Session = Depends(get_db)):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case
