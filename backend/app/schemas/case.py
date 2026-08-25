
from pydantic import BaseModel

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
    expected_next_command: str | None = None
    expected_fix: str | None = None
    verification_command: str | None = None

class CaseCreate(BaseModel):
    symptom: str
    topology_note: str
    show_outputs: str
    
    # Optional fields for dynamic cases
    category: str | None = "Dynamic"
    difficulty: str | None = "Unknown"
    diagnosis_type: str | None = "Dynamic"
    
    # Ground truth fields are not expected for dynamic ingestion
    expected_fault: str | None = "Unknown"
    osi_layer: str | None = "Unknown"
    concept_tag: str | None = "Dynamic"
    severity: str | None = "Unknown"
    expected_next_command: str | None = None
    expected_fix: str | None = None
    verification_command: str | None = None

class CaseResponse(CaseBase):
    id: int
    
    ai_root_cause: str | None = None
    ai_osi_layer: str | None = None
    ai_confidence: str | None = None
    ai_evidence: str | None = None
    ai_reason: str | None = None
    ai_next_command: str | None = None
    ai_fix_steps: str | None = None
    ai_verification_command: str | None = None
    
    review: ReviewResponse | None = None

    model_config = {"from_attributes": True}
