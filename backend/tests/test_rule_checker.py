import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parent.parent))

from app.services.rule_checker.checks import check_duplicate_ips, check_interface_down


def test_interface_down_rule():
    evidence = {
        "has_interface_data": True,
        "interfaces": [
            {"name": "GigabitEthernet0/1", "status": "administratively down", "protocol": "down"}
        ]
    }
    result = check_interface_down("", evidence)
    assert result["status"] == "DETECTED"
    assert "GigabitEthernet0/1" in result["evidence"][0]
    
def test_interface_down_insufficient_evidence():
    evidence = {"has_interface_data": False}
    result = check_interface_down("", evidence)
    assert result["status"] == "INSUFFICIENT_EVIDENCE"
    
def test_duplicate_ip():
    evidence = {
        "has_interface_data": True,
        "interfaces": [
            {"name": "Gi0/1", "ip": "10.0.0.1"},
            {"name": "Gi0/2", "ip": "10.0.0.1"}
        ]
    }
    result = check_duplicate_ips("", evidence)
    assert result["status"] == "DETECTED"
    assert "10.0.0.1" in result["evidence"][0]
