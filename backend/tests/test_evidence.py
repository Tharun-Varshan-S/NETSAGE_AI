import sys
from pathlib import Path
sys.path.append(str(Path(__file__).resolve().parent.parent))

import pytest
from app.services.evidence_processor import EvidenceProcessor

def test_extract_interfaces():
    show_outputs = """
Interface              IP-Address      OK? Method Status                Protocol
GigabitEthernet0/0     192.168.1.1     YES manual up                    up 
GigabitEthernet0/1     unassigned      YES unset  administratively down down
"""
    evidence = EvidenceProcessor.process("", "", show_outputs)
    assert evidence["has_interface_data"] is True
    interfaces = evidence["interfaces"]
    assert len(interfaces) == 2
    assert interfaces[0]["name"] == "GigabitEthernet0/0"
    assert interfaces[0]["ip"] == "192.168.1.1"
    assert interfaces[0]["status"] == "up"
    assert interfaces[1]["ip"] == "unassigned"
    assert interfaces[1]["status"] == "administratively down"

def test_extract_gateway():
    show_outputs = "Gateway of last resort is 10.0.0.1 to network 0.0.0.0"
    evidence = EvidenceProcessor.process("", "", show_outputs)
    assert evidence["has_routing_data"] is True
    assert evidence["default_gateway"] == "10.0.0.1"
    
def test_extract_vlans():
    show_outputs = """
VLAN Name                             Status    Ports
---- -------------------------------- --------- -------------------------------
1    default                          active    Fa0/1, Fa0/2
10   Payroll                          active    Fa0/3
20   Accounting                       suspend   Fa0/4
"""
    evidence = EvidenceProcessor.process("", "", show_outputs)
    assert evidence["has_vlan_data"] is True
    vlans = evidence["vlans"]
    assert len(vlans) == 3
    assert vlans[1]["name"] == "Payroll"
    assert vlans[2]["status"] == "suspend"
    
def test_insufficient_evidence():
    evidence = EvidenceProcessor.process("", "", "Random log data")
    assert evidence["has_interface_data"] is False
    assert evidence["has_vlan_data"] is False
    assert evidence["has_routing_data"] is False
    assert evidence["default_gateway"] == "UNKNOWN"
