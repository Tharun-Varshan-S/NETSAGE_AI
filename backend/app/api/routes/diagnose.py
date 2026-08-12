from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.case import Case
from app.schemas.diagnosis import DiagnosisResponse
from app.services.ai_diagnosis import run_diagnosis

router = APIRouter()

@router.post("/{case_id}", response_model=DiagnosisResponse)
def diagnose_case(case_id: int, db: Session = Depends(get_db)):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    # In a full implementation, we might run the deterministic checker here
    # and attach its findings to the case before sending to the AI.
    
    diagnosis_data = run_diagnosis(case)
    
    if diagnosis_data is None:
        raise HTTPException(status_code=503, detail="AI diagnosis failed. Please proceed manually.")
    
    # Save to db
    case.ai_root_cause = diagnosis_data.root_cause
    case.ai_confidence = diagnosis_data.confidence
    case.ai_evidence = diagnosis_data.evidence
    case.ai_next_command = diagnosis_data.next_command
    case.ai_fix_steps = diagnosis_data.fix_steps
    
    db.commit()
    db.refresh(case)
    
    return diagnosis_data
