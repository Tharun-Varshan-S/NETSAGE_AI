from typing import List, Dict, Any
from app.schemas.diagnosis import Diagnosis, DiagnosisStatus

class DiagnosisAggregator:
    @staticmethod
    def aggregate(ai_diagnosis: Diagnosis, rule_findings: List[Dict[str, Any]]) -> Diagnosis:
        """
        Combines deterministic rule findings and AI diagnosis.
        Enforces constraints where deterministic evidence overrides unsupported AI claims.
        """
        
        # Determine if we have strict contradictions
        has_insufficient_routing = any(r["rule"] == "MISSING_ROUTES" and r["status"] == "INSUFFICIENT_EVIDENCE" for r in rule_findings)
        has_insufficient_interfaces = any(r["rule"] == "INTERFACE_DOWN" and r["status"] == "INSUFFICIENT_EVIDENCE" for r in rule_findings)
        
        # Example Aggregation Logic: 
        # If AI claims high confidence on a routing issue but we have INSUFFICIENT_EVIDENCE for routing, downgrade confidence.
        if ai_diagnosis.osi_layer == "Layer 3 (Network)":
            if has_insufficient_routing and ai_diagnosis.confidence == "High":
                ai_diagnosis.confidence = "Low"
                ai_diagnosis.reason = f"[Aggregator Warning: Missing routing evidence] {ai_diagnosis.reason}"
                
        if ai_diagnosis.osi_layer in ["Layer 1 (Physical)", "Layer 2 (Data Link)"]:
            if has_insufficient_interfaces and ai_diagnosis.confidence == "High":
                ai_diagnosis.confidence = "Low"
                ai_diagnosis.reason = f"[Aggregator Warning: Missing interface evidence] {ai_diagnosis.reason}"

        # Attach findings for frontend
        ai_diagnosis.rule_findings = rule_findings
        return ai_diagnosis
