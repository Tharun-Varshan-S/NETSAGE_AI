import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.database import get_db
from app.models.case import Case
from app.models.user import User
from app.schemas.case import CaseCreate, CaseResponse

router = APIRouter()

@router.post("/", response_model=CaseResponse)
def create_case(case_in: CaseCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Generate a unique case ID like DYN-1234
    short_uuid = str(uuid.uuid4())[:8].upper()
    new_case_id = f"DYN-{short_uuid}"
    
    new_case = Case(
        case_id=new_case_id,
        category=case_in.category,
        difficulty=case_in.difficulty,
        diagnosis_type=case_in.diagnosis_type,
        symptom=case_in.symptom,
        topology_note=case_in.topology_note,
        show_outputs=case_in.show_outputs,
        expected_fault=case_in.expected_fault,
        osi_layer=case_in.osi_layer,
        concept_tag=case_in.concept_tag,
        severity=case_in.severity,
        expected_next_command=case_in.expected_next_command,
        expected_fix=case_in.expected_fix,
        verification_command=case_in.verification_command,
        diagnosis_status="NEEDS_INFO",
        created_by_id=current_user.id
    )
    
    db.add(new_case)
    db.commit()
    db.refresh(new_case)
    return new_case

@router.get("/", response_model=list[CaseResponse])
def get_cases(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = db.query(Case)
    if current_user.role == "junior":
        query = query.filter(Case.created_by_id == current_user.id)
    # Seniors see everything
    cases = query.order_by(Case.id.desc()).offset(skip).limit(limit).all()
    return cases

@router.get("/{case_id}", response_model=CaseResponse)
def get_case(case_id: int, db: Session = Depends(get_db)):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case
