from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.database import get_db
from app.models.case import Case
from app.models.user import User
from app.schemas.diagnosis import CommandInput, DiagnosisResponse
from app.services.ai_diagnosis import run_diagnosis
from app.services.evidence_processor import EvidenceProcessor
from app.services.rule_orchestrator import RuleOrchestrator

router = APIRouter()

def process_and_diagnose(case: Case, db: Session) -> DiagnosisResponse:
    # 1. Process Evidence
    evidence = EvidenceProcessor.process(case.symptom, case.topology_note, case.show_outputs)
    
    # 2. Run Rules
    rule_findings = RuleOrchestrator.run_all(case.show_outputs, evidence)
    
    # 3. Ask AI
    diagnosis_data = run_diagnosis(case, evidence, rule_findings)
    
    if diagnosis_data is None:
        raise HTTPException(status_code=503, detail="AI diagnostic service unavailable. Missing GEMINI_API_KEY in backend/.env configuration.")
    
    # 4. Aggregator (Combines AI & Deterministic Findings)
    from app.services.aggregator import DiagnosisAggregator
    diagnosis_data = DiagnosisAggregator.aggregate(diagnosis_data, rule_findings)

    # 5. Save state
    case.diagnosis_status = diagnosis_data.status
    case.ai_root_cause = diagnosis_data.root_cause
    case.ai_osi_layer = diagnosis_data.osi_layer
    case.ai_confidence = diagnosis_data.confidence
    case.ai_evidence = diagnosis_data.evidence
    case.ai_reason = diagnosis_data.reason
    case.ai_next_command = diagnosis_data.next_command
    case.ai_fix_steps = diagnosis_data.fix_steps
    case.ai_verification_command = diagnosis_data.verification_command
    
    db.commit()
    db.refresh(case)
    
    return diagnosis_data

@router.post("/{case_id}", response_model=DiagnosisResponse)
def diagnose_case(case_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
        
    return process_and_diagnose(case, db)

@router.post("/{case_id}/command-output", response_model=DiagnosisResponse)
def submit_command_output(case_id: int, input_data: CommandInput, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
        
    # Append to raw outputs for the EvidenceProcessor
    new_output_text = f"\n\n--- Output of {input_data.command_executed} ---\n{input_data.output}"
    case.show_outputs += new_output_text
    
    # Append to structured history for the AI prompt
    history = case.session_history or []
    # Make a copy since SQLAlchemy might not track deep mutations on JSON column easily
    new_history = list(history)
    new_history.append({
        "command": input_data.command_executed,
        "output": input_data.output
    })
    case.session_history = new_history
    
    db.commit()
    db.refresh(case)
    
    return process_and_diagnose(case, db)
