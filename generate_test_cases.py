import csv
import os

cases = list(csv.DictReader(open("netsage_final_cases.csv")))
rule_based = [c for c in cases if c["diagnosis_type"] == "Deterministic"]
ai_based = [c for c in cases if c["diagnosis_type"] in ("AI Reasoning", "Ambiguous")]

with open("/home/tharun-varshan-s/.gemini/antigravity-ide/brain/045be2c6-e647-4328-b32a-0aad080545d3/test_cases.md", "w") as f:
    f.write("# NetSage Test Cases for Manual Entry\n\n")
    f.write("Use these snippets to manually test the website. Copy the `Symptoms` and `Show Outputs` into the New Case form.\n\n")
    
    f.write("## 1. Rule-Based (Deterministic) Cases\n\n")
    for i, c in enumerate(rule_based[:5]):
        f.write(f"### Rule-Based Case {i+1}: {c['case_id']}\n")
        f.write(f"**Expected Fault:** {c['expected_fault']}\n\n")
        f.write(f"**Symptoms:**\n```\n{c['symptoms']}\n```\n\n")
        f.write(f"**Show Outputs:**\n```\n{c['show_outputs']}\n```\n\n")
        f.write("---\n\n")
        
    f.write("## 2. AI Reasoning / Ambiguous Cases\n\n")
    for i, c in enumerate(ai_based[:5]):
        f.write(f"### AI Case {i+1}: {c['case_id']}\n")
        f.write(f"**Expected Fault:** {c['expected_fault']}\n\n")
        f.write(f"**Symptoms:**\n```\n{c['symptoms']}\n```\n\n")
        f.write(f"**Show Outputs:**\n```\n{c['show_outputs']}\n```\n\n")
        f.write("---\n\n")
