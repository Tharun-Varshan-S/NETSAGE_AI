import sys
import time
import requests
from pathlib import Path

# Add backend to path so we can import app modules if needed
backend_dir = Path(__file__).resolve().parent.parent
sys.path.append(str(backend_dir))

from app.database import SessionLocal
from app.models.case import Case

API_BASE = "http://localhost:8000/api"

def evaluate():
    db = SessionLocal()
    cases = db.query(Case).all()
    
    if not cases:
        print("No cases found in DB. Run seed_database.py first.")
        db.close()
        return

    print(f"Starting evaluation of {len(cases)} cases...\n")
    
    results = []
    
    for case in cases:
        print(f"Evaluating Case {case.case_id}...")
        try:
            # Trigger initial diagnosis via API
            response = requests.post(f"{API_BASE}/diagnose/{case.id}")
            
            if response.status_code != 200:
                print(f"  [ERROR] API returned {response.status_code}")
                results.append({"case_id": case.case_id, "success": False, "reason": "API Error"})
                continue
                
            data = response.json()
            status = data.get("status")
            
            print(f"  Status: {status}")
            
            match_next_cmd = None
            match_fault = None
            
            if status == "NEEDS_INFO":
                # Compare next command
                ai_cmd = data.get("next_command", "")
                exp_cmd = case.expected_next_command or ""
                # Simple exact or substring match for evaluation
                match_next_cmd = exp_cmd.lower() in ai_cmd.lower() if exp_cmd else True
                print(f"  Expected Cmd: {exp_cmd}")
                print(f"  AI Cmd      : {ai_cmd}")
                print(f"  Cmd Match   : {match_next_cmd}")
            elif status in ["DIAGNOSED", "RESOLVED"]:
                # Compare root cause
                ai_fault = data.get("root_cause", "")
                exp_fault = case.expected_fault or ""
                # We can't do exact string matching easily for natural language, 
                # but we can log them side-by-side for human review or use an LLM-as-a-judge (future).
                print(f"  Expected Fault: {exp_fault}")
                print(f"  AI Fault      : {ai_fault}")
            
            results.append({
                "case_id": case.case_id,
                "success": True,
                "status": status,
                "match_next_cmd": match_next_cmd
            })
            
        except requests.exceptions.ConnectionError:
            print("  [ERROR] Could not connect to API. Is the server running?")
            break
        
        # Give the API / LLM a short break
        time.sleep(1)

    print("\n--- Evaluation Summary ---")
    total = len(results)
    needs_info = sum(1 for r in results if r.get("status") == "NEEDS_INFO")
    diagnosed = sum(1 for r in results if r.get("status") in ["DIAGNOSED", "RESOLVED"])
    cmd_matches = sum(1 for r in results if r.get("match_next_cmd") is True)
    
    print(f"Total Evaluated: {total}")
    print(f"NEEDS_INFO State Reached: {needs_info}")
    print(f"DIAGNOSED State Reached: {diagnosed}")
    if needs_info > 0:
        print(f"Next Command Match Rate: {(cmd_matches/needs_info)*100:.2f}%")
        
    db.close()

if __name__ == "__main__":
    evaluate()
