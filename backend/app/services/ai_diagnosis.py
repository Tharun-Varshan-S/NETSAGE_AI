import json
import os
import time
from datetime import datetime
from typing import Any

from google import genai
from google.genai import types
from pydantic import ValidationError

from app.config import settings
from app.models.case import Case
from app.schemas.diagnosis import Diagnosis


def generate_diagnosis_prompt(case: Case, evidence: dict[str, Any], rule_findings: list[dict[str, Any]]) -> str:
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

def run_diagnosis(case: Case, evidence: dict[str, Any], rule_findings: list[dict[str, Any]], max_retries: int = 3) -> Diagnosis | None:
    """
    Calls Gemini API to diagnose the case.
    """
    if not settings.GEMINI_API_KEY:
        return None

    client = genai.Client(api_key=settings.GEMINI_API_KEY)
    
    prompt = generate_diagnosis_prompt(case, evidence, rule_findings)
    
    def _extract_json_from_text(text: str):
        """Try to find a JSON object anywhere in the returned text.
        Returns a Python object or None."""
        decoder = json.JSONDecoder()
        text = text or ""
        for i, ch in enumerate(text):
            if ch != '{':
                continue
            try:
                obj, end = decoder.raw_decode(text[i:])
                return obj
            except json.JSONDecodeError:
                continue
        return None

    logs_dir = os.path.join(os.path.dirname(__file__), '..', '..', 'logs')
    try:
        os.makedirs(logs_dir, exist_ok=True)
    except Exception:
        logs_dir = None

    for attempt in range(max_retries):
        try:
            response = client.models.generate_content(
                model='gemini-3.6-flash',
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="text/plain",
                    temperature=0.1, # Extremely low temperature for strict adherence to evidence
                )
            )

            raw_text = getattr(response, 'text', None) or str(response)
            # log raw response for debugging
            if logs_dir and raw_text:
                try:
                    with open(os.path.join(logs_dir, 'ai_raw_responses.log'), 'a', encoding='utf-8') as f:
                        f.write(f"{datetime.utcnow().isoformat()} - CASE:{case.id if hasattr(case, 'id') else 'unknown'}\n")
                        f.write(raw_text)
                        f.write("\n---\n")
                except Exception:
                    pass

            if not raw_text:
                raise ValueError("Empty response from AI")

            # Try strict JSON parse first, then try to extract JSON substring
            diagnosis_data = None
            try:
                diagnosis_data = json.loads(raw_text)
            except json.JSONDecodeError:
                diagnosis_data = _extract_json_from_text(raw_text)

            if not diagnosis_data:
                raise ValueError("Could not extract JSON from AI response")

            diagnosis = Diagnosis(**diagnosis_data)
            return diagnosis

        except (ValueError, json.JSONDecodeError, ValidationError) as e:
            print(f"Parsing/Validation Error: {e}")
            time.sleep(2 ** attempt)
        except Exception as e:
            print(f"API Error: {e}")
            time.sleep(2 ** attempt)

    # If the AI failed after retries, return a safe NEEDS_INFO diagnosis that includes deterministic rule findings
    try:
        fallback = Diagnosis(
            status="NEEDS_INFO",
            root_cause=None,
            osi_layer=None,
            confidence="Low",
            evidence=None,
            reason="AI failed to return a valid structured diagnosis after multiple attempts. Returning deterministic rule findings for human review.",
            next_command=None,
            fix_steps=None,
            verification_command=None,
            rule_findings=rule_findings
        )
        return fallback
    except Exception:
        return None
