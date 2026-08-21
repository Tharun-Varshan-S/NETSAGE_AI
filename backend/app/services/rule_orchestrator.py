from typing import Any

from .rule_checker.checks import (
    check_duplicate_ips,
    check_gateway_mismatch,
    check_interface_down,
    check_missing_routes,
    check_missing_vlan,
    check_wrong_masks,
)


class RuleOrchestrator:
    """
    Orchestrates the deterministic rules based on the extracted evidence.
    """
    
    @staticmethod
    def run_all(show_outputs: str, evidence: dict[str, Any]) -> list[dict[str, Any]]:
        results = [
            check_duplicate_ips(show_outputs, evidence),
            check_wrong_masks(show_outputs, evidence),
            check_gateway_mismatch(show_outputs, evidence),
            check_interface_down(show_outputs, evidence),
            check_missing_vlan(show_outputs, evidence),
            check_missing_routes(show_outputs, evidence)
        ]
        
        # Filter out NOT_DETECTED to keep the prompt clean, 
        # but keep INSUFFICIENT_EVIDENCE to inform the LLM that it cannot make assumptions
        important_results = [r for r in results if r["status"] in ("DETECTED", "INSUFFICIENT_EVIDENCE")]
        
        return important_results
