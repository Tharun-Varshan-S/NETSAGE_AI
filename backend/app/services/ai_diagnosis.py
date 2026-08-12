import time
import json
from google import genai
from google.genai import types
from pydantic import ValidationError
from typing import Optional, Dict, Any, List

from app.config import settings
from app.models.case import Case
from app.schemas.diagnosis import Diagnosis

def generate_diagnosis_prompt(case: Case, evidence: Dict[str, Any], rule_findings: List[Dict[str, Any]]) -> str:
    """Generates the prompt string for the LLM."""
    with open("app/prompts/diagnose_prompt.md", "r", encoding="utf-8") as f:
        prompt_template = f.read()

    # Format session history
    history_str = ""
    if case.session_history:
        history_str = "\n--- PREVIOUS COMMANDS & OUTPUTS ---\n"
        for idx, turn in enumerate(case.session_history, 1):
            history_str += f"Step {idx}:\nCommand: {turn['command']}\nOutput:\n{turn['output']}\n\n"

    # Format rules
    rules_str = "\n--- DETERMINISTIC RULE FINDINGS ---\n"
    if not rule_findings:
        rules_str += "No rules flagged.\n"
    else:
        for finding in rule_findings:
            rules_str += f"Rule: {finding['rule']}\nStatus: {finding['status']}\nDetails: {finding.get('evidence', [])}\n\n"

    # Format structured evidence
    evidence_str = "\n--- PARSED EVIDENCE ---\n"
    evidence_str += json.dumps(evidence, indent=2)

    content = (
        f"{prompt_template}\n\n"
        f"--- CURRENT CASE ---\n"
        f"Symptom: {case.symptom}\n"
        f"Topology Note: {case.topology_note}\n"
        f"Initial Show Outputs:\n{case.show_outputs}\n"
        f"{evidence_str}"
        f"{rules_str}"
        f"{history_str}"
    )
    return content

def run_diagnosis(case: Case, evidence: Dict[str, Any], rule_findings: List[Dict[str, Any]], max_retries: int = 3) -> Optional[Diagnosis]:
    """
    Calls Gemini API to diagnose the case.
    """
    if not settings.GEMINI_API_KEY:
        return None

    client = genai.Client(api_key=settings.GEMINI_API_KEY)
    
    prompt = generate_diagnosis_prompt(case, evidence, rule_findings)
    
    for attempt in range(max_retries):
        try:
            response = client.models.generate_content(
                model='gemini-3.6-flash',
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=Diagnosis,
                    temperature=0.1, # Extremely low temperature for strict adherence to evidence
                )
            )
            
            raw_text = response.text
            if raw_text is None:
                raise ValueError("Empty response from AI")
                
            diagnosis_data = json.loads(raw_text)
            diagnosis = Diagnosis(**diagnosis_data)
            return diagnosis
            
        except (ValueError, json.JSONDecodeError, ValidationError) as e:
            print(f"Parsing/Validation Error: {e}")
            time.sleep(2 ** attempt)
        except Exception as e:
            print(f"API Error: {e}")
            time.sleep(2 ** attempt)

    return None
