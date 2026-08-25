from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


class DiagnosisStatus(str, Enum):
    NEEDS_INFO = "NEEDS_INFO"
    DIAGNOSED = "DIAGNOSED"
    VERIFICATION_REQUIRED = "VERIFICATION_REQUIRED"
    RESOLVED = "RESOLVED"
    NOT_RESOLVED = "NOT_RESOLVED"

class Diagnosis(BaseModel):
    status: DiagnosisStatus = Field(description="The current state of the troubleshooting session")
    root_cause: str | None = Field(None, description="The primary cause of the network issue, if diagnosed")
    osi_layer: str | None = Field(None, description="The OSI layer where the fault is located")
    confidence: str | None = Field(None, description="High, Medium, or Low")
    evidence: str | None = Field(None, description="Quote or reference from show outputs supporting the diagnosis")
    reason: str | None = Field(None, description="Explanation of why this status/conclusion was reached")
    next_command: str | None = Field(None, description="The next command the engineer should run")
    fix_steps: str | None = Field(None, description="Step-by-step instructions to fix the issue")
    verification_command: str | None = Field(None, description="Command to confirm the fix worked")
    rule_findings: list[dict[str, Any]] | None = Field(None, description="Deterministic rule findings to display to the user")

class DiagnosisResponse(Diagnosis):
    pass

class CommandInput(BaseModel):
    command_executed: str = Field(description="The command that was executed")
    output: str = Field(description="The raw output from the terminal")
