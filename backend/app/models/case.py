from sqlalchemy import Column, Integer, String, Text, JSON
from sqlalchemy.orm import relationship
from app.database import Base

class Case(Base):
    __tablename__ = "cases"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(String, unique=True, index=True, nullable=False) # E.g. NC001
    
    # Input data
    category = Column(String, nullable=False)
    difficulty = Column(String, nullable=False)
    diagnosis_type = Column(String, nullable=False)
    symptom = Column(Text, nullable=False)
    topology_note = Column(Text, nullable=False)
    show_outputs = Column(Text, nullable=False)
    
    # Ground truth (from dataset) - Never expose to AI
    expected_fault = Column(Text, nullable=False)
    osi_layer = Column(String, nullable=False)
    concept_tag = Column(String, nullable=False)
    severity = Column(String, nullable=False)
    expected_next_command = Column(Text, nullable=True)
    expected_fix = Column(Text, nullable=True)
    verification_command = Column(Text, nullable=True)
    
    # AI Diagnosis results (populated later)
    ai_root_cause = Column(Text, nullable=True)
    ai_osi_layer = Column(String, nullable=True)
    ai_confidence = Column(String, nullable=True)
    ai_evidence = Column(Text, nullable=True)
    ai_reason = Column(Text, nullable=True)
    ai_next_command = Column(Text, nullable=True)
    ai_fix_steps = Column(Text, nullable=True)
    ai_verification_command = Column(Text, nullable=True)
    
    # Stateful fields
    diagnosis_status = Column(String, nullable=True, default="NEEDS_INFO")
    session_history = Column(JSON, nullable=True, default=list)

    # Relationship to review
    review = relationship("Review", back_populates="case", uselist=False)
