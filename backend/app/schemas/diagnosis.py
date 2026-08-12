from pydantic import BaseModel, Field
from typing import Optional

class Diagnosis(BaseModel):
    root_cause: str = Field(description="The primary cause of the network issue")
    confidence: str = Field(description="High, Medium, or Low")
    evidence: str = Field(description="Quote or reference from show outputs supporting the diagnosis")
    next_command: str = Field(description="The next command the engineer should run")
    fix_steps: str = Field(description="Step-by-step instructions to fix the issue")

class DiagnosisResponse(Diagnosis):
    pass
