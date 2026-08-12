from sqlalchemy import Column, Integer, String, Text
from sqlalchemy.orm import relationship
from app.database import Base

class Case(Base):
    __tablename__ = "cases"

    id = Column(Integer, primary_key=True, index=True)
    
    # Input data
    symptom = Column(Text, nullable=False)
    topology_note = Column(Text, nullable=False)
    show_outputs = Column(Text, nullable=False)
    
    # Ground truth (from dataset)
    expected_fault = Column(String, nullable=False)
    osi_layer = Column(String, nullable=False)
    concept_tag = Column(String, nullable=False)
    severity = Column(String, nullable=False)
    
    # AI Diagnosis results (populated later)
    ai_root_cause = Column(Text, nullable=True)
    ai_confidence = Column(String, nullable=True)
    ai_evidence = Column(Text, nullable=True)
    ai_next_command = Column(String, nullable=True)
    ai_fix_steps = Column(Text, nullable=True)

    # Relationship to review
    review = relationship("Review", back_populates="case", uselist=False)
