import time
import json
from google import genai
from google.genai import types
from pydantic import ValidationError
from typing import Optional

from app.config import settings
from app.models.case import Case
from app.schemas.diagnosis import Diagnosis

def generate_diagnosis_prompt(case: Case) -> str:
    """Generates the prompt string for the LLM."""
    with open("app/prompts/diagnose_prompt.md", "r", encoding="utf-8") as f:
        prompt_template = f.read()

    # Append the current case info to the prompt
    content = (
        f"{prompt_template}\n\n"
        f"--- CURRENT CASE ---\n"
        f"Symptom: {case.symptom}\n"
        f"Topology Note: {case.topology_note}\n"
        f"Show Outputs:\n{case.show_outputs}\n"
    )
    return content

def run_diagnosis(case: Case, max_retries: int = 3) -> Optional[Diagnosis]:
    """
    Calls Gemini API to diagnose the case.
    Implements retries with exponential backoff and timeout logic.
    Returns a structured Diagnosis object, or None if it completely fails.
    """
    if not settings.GEMINI_API_KEY:
        # Fallback if no API key is provided
        return None

    client = genai.Client(api_key=settings.GEMINI_API_KEY)
    
    prompt = generate_diagnosis_prompt(case)
    
    for attempt in range(max_retries):
        try:
            # We enforce structured JSON output matching our Pydantic schema
            response = client.models.generate_content(
                model='gemini-1.5-flash',
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=Diagnosis,
                    temperature=0.2, # Low temperature for more deterministic output
                )
            )
            
            # The SDK might return a parsed object if response_schema is used,
            # or it might return a JSON string in response.text.
            # We'll parse the text to be safe.
            raw_text = response.text
            if raw_text is None:
                raise ValueError("Empty response from AI")
                
            diagnosis_data = json.loads(raw_text)
            
            # Pydantic validation
            diagnosis = Diagnosis(**diagnosis_data)
            return diagnosis
            
        except (ValueError, json.JSONDecodeError, ValidationError) as e:
            # If we get a validation error, we retry
            time.sleep(2 ** attempt)
        except Exception as e:
            # For network/API errors (like timeouts), retry with backoff
            time.sleep(2 ** attempt)

    # Graceful failure path: return None so the human reviewer can proceed manually
    return None
