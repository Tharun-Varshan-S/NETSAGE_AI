import requests
import json
import time

BASE_URL = "http://localhost:8000/api"

def login(username, password):
    resp = requests.post(f"{BASE_URL}/auth/login", data={
        "username": username,
        "password": password
    })
    resp.raise_for_status()
    return resp.json()["access_token"]

def main():
    print("--- Starting NetSage AI Workflow Demo ---")
    
    print("\n1. Logging in as Junior...")
    junior_token = login("junior", "password")
    junior_headers = {"Authorization": f"Bearer {junior_token}"}
    
    print("\n2. Junior creating a new case...")
    case_payload = {
        "category": "connectivity",
        "difficulty": "medium",
        "diagnosis_type": "Interface Down",
        "symptom": "User cannot reach the web server.",
        "topology_note": "PC -> Switch -> Router -> Web Server",
        "show_outputs": "FastEthernet0/1    192.168.1.1     YES manual administratively down down",
        "expected_fault": "Interface is administratively down",
        "osi_layer": "Layer 1",
        "concept_tag": "Interfaces",
        "severity": "HIGH",
        "expected_next_command": "show running-config",
        "expected_fix": "no shutdown",
        "verification_command": "ping 192.168.1.1"
    }
    
    resp = requests.post(f"{BASE_URL}/cases/", json=case_payload, headers=junior_headers)
    resp.raise_for_status()
    case = resp.json()
    case_id = case["id"]
    print(f"   Created Case ID: {case['case_id']} (DB ID: {case_id})")
    
    print("\n3. Junior requesting AI Diagnosis...")
    resp = requests.post(f"{BASE_URL}/diagnose/{case_id}", headers=junior_headers)
    resp.raise_for_status()
    diagnosed_case = resp.json()
    print(f"   Response: {diagnosed_case}")
    root_cause = diagnosed_case.get('root_cause') or diagnosed_case.get('ai_root_cause')
    if root_cause:
        print(f"   AI Root Cause: {root_cause}")
    else:
        print("   No ai_root_cause in response (might be needs info or error)")
    print(f"   AI Status: {diagnosed_case.get('status') or diagnosed_case.get('diagnosis_status')}")
    
    print("\n4. Junior submitting case for Senior Review...")
    resp = requests.post(f"{BASE_URL}/cases/{case_id}/submit-review", headers=junior_headers)
    resp.raise_for_status()
    print(f"   Case Status: {resp.json()['diagnosis_status']}")
    
    print("\n5. Logging in as Senior...")
    senior_token = login("senior", "password")
    senior_headers = {"Authorization": f"Bearer {senior_token}"}
    
    print("\n6. Senior fetching pending cases...")
    resp = requests.get(f"{BASE_URL}/cases/", headers=senior_headers)
    resp.raise_for_status()
    all_cases = resp.json()
    pending_cases = [c for c in all_cases if c['diagnosis_status'] == 'PENDING_REVIEW']
    print(f"   Found {len(pending_cases)} cases pending review.")
    
    print("\n7. Senior reviewing the case...")
    review_payload = {
        "status": "Accepted",
        "reason": "Good diagnosis."
    }
    resp = requests.post(f"{BASE_URL}/reviews/{case_id}", json=review_payload, headers=senior_headers)
    resp.raise_for_status()
    review = resp.json()
    print(f"   Review submitted. Status: {review['status']}")
    
    print("\n8. Checking final case status...")
    resp = requests.get(f"{BASE_URL}/cases/{case_id}", headers=senior_headers)
    resp.raise_for_status()
    final_case = resp.json()
    print(f"   Final Case Status: {final_case['diagnosis_status']}")
    print("--- Demo Complete ---")

if __name__ == "__main__":
    main()
