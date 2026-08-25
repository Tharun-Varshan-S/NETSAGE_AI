import csv

cases = list(csv.DictReader(open("netsage_final_cases.csv")))
rule_based = [c for c in cases if c["diagnosis_type"] == "Deterministic"]
ai_based = [c for c in cases if c["diagnosis_type"] in ("AI Reasoning", "Ambiguous")]

print("## 1. Rule-Based (Deterministic) Cases")
for i, c in enumerate(rule_based[:3]):
    print(f"\n### Rule-Based Case {i+1}")
    print(f"**Expected Fault:** {c['expected_fault']}\n")
    print(f"**Topology Notes:**\n```text\n{c['topology']}\n```\n")
    print(f"**Symptoms:**\n```text\n{c['symptoms']}\n```\n")
    print(f"**Show Outputs:**\n```text\n{c['show_outputs']}\n```\n")
    print("---")

print("\n## 2. AI Reasoning / Ambiguous Cases")
for i, c in enumerate(ai_based[:3]):
    print(f"\n### AI Case {i+1}")
    print(f"**Expected Fault:** {c['expected_fault']}\n")
    print(f"**Topology Notes:**\n```text\n{c['topology']}\n```\n")
    print(f"**Symptoms:**\n```text\n{c['symptoms']}\n```\n")
    print(f"**Show Outputs:**\n```text\n{c['show_outputs']}\n```\n")
    print("---")
