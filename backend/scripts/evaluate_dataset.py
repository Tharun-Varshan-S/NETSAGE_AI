import csv
import json
import os
import requests
import time
from pathlib import Path

BASE_URL = "http://localhost:8000/api"

def login(username, password):
    resp = requests.post(f"{BASE_URL}/auth/login", data={
        "username": username,
        "password": password
    })
    resp.raise_for_status()
    return resp.json()["access_token"]

def evaluate():
    print("--- Starting Evaluation ---")
    token = login("junior", "password")
    headers = {"Authorization": f"Bearer {token}"}
    
    project_root = Path(__file__).resolve().parent.parent.parent
    csv_path = project_root / "netsage_final_cases.csv"
    
    results = []
    
    with open(csv_path, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for i, row in enumerate(reader, start=1):
            case_id = row.get("case_id", "").strip()
            if not case_id: continue
            
            print(f"\nEvaluating Case {i}: {case_id}")
            
            # 1. Create the case
            case_payload = {
                "category": row.get("category", "Dynamic"),
                "difficulty": row.get("difficulty", "Unknown"),
                "diagnosis_type": row.get("diagnosis_type", "Dynamic"),
                "symptom": row.get("symptoms", ""),
                "topology_note": row.get("topology", ""),
                "show_outputs": row.get("show_outputs", ""),
                "expected_fault": row.get("expected_fault", ""),
                "osi_layer": row.get("osi_layer", ""),
                "concept_tag": row.get("concept", ""),
                "severity": row.get("severity", ""),
                "expected_next_command": row.get("expected_next_command", ""),
                "expected_fix": row.get("expected_fix", ""),
                "verification_command": row.get("verification_command", "")
            }
            
            resp = requests.post(f"{BASE_URL}/cases/", json=case_payload, headers=headers)
            if resp.status_code != 200:
                print(f"Error creating case {case_id}: {resp.text}")
                continue
                
            db_case = resp.json()
            db_id = db_case["id"]
            
            # 2. Diagnose
            try:
                diag_resp = requests.post(f"{BASE_URL}/diagnose/{db_id}", headers=headers)
                diag_resp.raise_for_status()
                diagnosis = diag_resp.json()
                
                results.append({
                    "case_id": case_id,
                    "expected_fault": row.get("expected_fault", ""),
                    "ai_root_cause": diagnosis.get("root_cause") or diagnosis.get("ai_root_cause"),
                    "expected_osi": row.get("osi_layer", ""),
                    "ai_osi": diagnosis.get("osi_layer") or diagnosis.get("ai_osi_layer"),
                    "status": diagnosis.get("status") or diagnosis.get("diagnosis_status"),
                    "ai_confidence": diagnosis.get("confidence") or diagnosis.get("ai_confidence")
                })
                
                print(f"  Status: {diagnosis.get('status')}")
                print(f"  Expected Fault: {row.get('expected_fault')}")
                print(f"  AI Fault:       {diagnosis.get('root_cause')}")
                
            except Exception as e:
                print(f"  Error diagnosing case {case_id}: {e}")
                
            # Optional: Delete the case after testing so we don't pollute the DB
            # We don't have a delete endpoint yet, so it stays in DB.
            
            time.sleep(1) # Small delay to respect API rate limits
            
    # Write report
    report_path = project_root / "evaluation_report.md"
    with open(report_path, "w", encoding="utf-8") as f:
        f.write("# NetSage AI - Dataset Evaluation Report\n\n")
        f.write("| Case ID | Status | Confidence | Expected Fault | AI Root Cause |\n")
        f.write("|---------|--------|------------|----------------|---------------|\n")
        for res in results:
            # Escape pipes
            expected = str(res['expected_fault']).replace("|", "\\|").replace("\n", " ")
            actual = str(res['ai_root_cause']).replace("|", "\\|").replace("\n", " ")
            f.write(f"| {res['case_id']} | {res['status']} | {res['ai_confidence']} | {expected} | {actual} |\n")
            
    print(f"\nEvaluation complete. Report saved to {report_path}")

if __name__ == "__main__":
    evaluate()
