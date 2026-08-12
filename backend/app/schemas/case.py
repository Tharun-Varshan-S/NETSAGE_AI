from pydantic import BaseModel
from typing import Optional
from app.schemas.diagnosis import DiagnosisResponse
from app.schemas.review import ReviewResponse

class CaseBase(BaseModel):
    case_id: str
    category: str
    difficulty: str
    diagnosis_type: str
    symptom: str
    topology_note: str
    show_outputs: str
    expected_fault: str
    osi_layer: str
    concept_tag: str
    severity: str
    expected_next_command: Optional[str] = None
    expected_fix: Optional[str] = None
    verification_command: Optional[str] = None

class CaseCreate(CaseBase):
    pass

class CaseResponse(CaseBase):
    id: int
    
    ai_root_cause: Optional[str] = None
    ai_osi_layer: Optional[str] = None
    ai_confidence: Optional[str] = None
    ai_evidence: Optional[str] = None
    ai_reason: Optional[str] = None
    ai_next_command: Optional[str] = None
    ai_fix_steps: Optional[str] = None
    ai_verification_command: Optional[str] = None
    
    review: Optional[ReviewResponse] = None

    model_config = {"from_attributes": True}
