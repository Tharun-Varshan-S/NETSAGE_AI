import re
from typing import Dict, List, Any

def check_duplicate_ips(show_outputs: str, evidence: Dict[str, Any]) -> Dict[str, Any]:
    if not evidence.get("has_interface_data"):
        return {
            "rule": "DUPLICATE_IP",
            "status": "INSUFFICIENT_EVIDENCE",
            "evidence": [],
            "reason": "Interface IP assignment information was not supplied."
        }
        
    findings = []
    if "DUPADDR" in show_outputs or "Duplicate address" in show_outputs:
        findings.append("Detected duplicate IP address warning in logs.")
        
    seen = set()
    for intf in evidence.get("interfaces", []):
        ip = intf.get("ip")
        if ip and ip != "unassigned":
            if ip in seen:
                findings.append(f"Duplicate IP configured across interfaces: {ip}")
            seen.add(ip)
            
    if findings:
        return {
            "rule": "DUPLICATE_IP",
            "status": "DETECTED",
            "severity": "HIGH",
            "confidence": 1.0,
            "evidence": findings,
            "source": "show ip interface brief / logs"
        }
    return {"rule": "DUPLICATE_IP", "status": "NOT_DETECTED"}

def check_wrong_masks(show_outputs: str, evidence: Dict[str, Any]) -> Dict[str, Any]:
    # We can't strictly know if it's wrong without context, but we check for suspicious ones
    if not show_outputs:
        return {"rule": "WRONG_MASK", "status": "INSUFFICIENT_EVIDENCE", "evidence": [], "reason": "No CLI outputs provided."}
        
    findings = []
    ip_mask_pattern = r"((?:192\.168|172\.(?:1[6-9]|2[0-9]|3[0-1])|10\.)\.\d{1,3}\.\d{1,3})[/ ](?:255\.0\.0\.0|/8)"
    matches = re.findall(ip_mask_pattern, show_outputs)
    for ip in matches:
        findings.append(f"Suspicious subnet mask for private IP {ip}: appears to be /8 (255.0.0.0) which is overly broad.")
        
    if findings:
        return {
            "rule": "WRONG_MASK",
            "status": "DETECTED",
            "severity": "MEDIUM",
            "confidence": 0.8,
            "evidence": findings,
            "source": "show running-config / interfaces"
        }
    return {"rule": "WRONG_MASK", "status": "NOT_DETECTED"}

def check_gateway_mismatch(show_outputs: str, evidence: Dict[str, Any]) -> Dict[str, Any]:
    if not evidence.get("has_routing_data"):
         return {
            "rule": "GATEWAY_MISMATCH",
            "status": "INSUFFICIENT_EVIDENCE",
            "evidence": [],
            "reason": "Routing or gateway information was not supplied."
        }
    
    findings = []
    gateway = evidence.get("default_gateway")
    if gateway == "NOT_SET":
        findings.append("No default route is set (Gateway of last resort is not set).")
        
    if findings:
        return {
            "rule": "GATEWAY_MISMATCH",
            "status": "DETECTED",
            "severity": "HIGH",
            "confidence": 0.9,
            "evidence": findings,
            "source": "show ip route"
        }
    return {"rule": "GATEWAY_MISMATCH", "status": "NOT_DETECTED"}

def check_interface_down(show_outputs: str, evidence: Dict[str, Any]) -> Dict[str, Any]:
    if not evidence.get("has_interface_data"):
        return {
            "rule": "INTERFACE_DOWN",
            "status": "INSUFFICIENT_EVIDENCE",
            "evidence": [],
            "reason": "Interface state information was not supplied."
        }
        
    findings = []
    for intf in evidence.get("interfaces", []):
        if "down" in intf.get("status", "").lower() or "down" in intf.get("protocol", "").lower():
            findings.append(f"Interface {intf['name']} is {intf['status']}/{intf['protocol']}")
            
    # Also check raw output for unparsed lines
    for line in show_outputs.split('\n'):
        if "administratively down" in line and not any("administratively down" in f for f in findings):
            findings.append(f"Interface is administratively down: {line.strip()}")
            
    if findings:
        return {
            "rule": "INTERFACE_DOWN",
            "status": "DETECTED",
            "severity": "HIGH",
            "confidence": 1.0,
            "evidence": findings,
            "source": "show ip interface brief"
        }
    return {"rule": "INTERFACE_DOWN", "status": "NOT_DETECTED"}

def check_missing_vlan(show_outputs: str, evidence: Dict[str, Any]) -> Dict[str, Any]:
    if not evidence.get("has_vlan_data"):
        return {
            "rule": "MISSING_VLAN",
            "status": "INSUFFICIENT_EVIDENCE",
            "evidence": [],
            "reason": "VLAN database information was not supplied."
        }
        
    findings = []
    if "does not exist" in show_outputs and "VLAN" in show_outputs:
         findings.append("A port is assigned to a VLAN that does not exist in the VLAN database.")
         
    for vlan in evidence.get("vlans", []):
        if vlan.get("status") == "suspend" or "inactive" in vlan.get("status", ""):
            findings.append(f"VLAN {vlan['id']} ({vlan['name']}) is suspended/inactive.")
            
    if findings:
        return {
            "rule": "MISSING_VLAN",
            "status": "DETECTED",
            "severity": "HIGH",
            "confidence": 1.0,
            "evidence": findings,
            "source": "show vlan brief"
        }
    return {"rule": "MISSING_VLAN", "status": "NOT_DETECTED"}

def check_missing_routes(show_outputs: str, evidence: Dict[str, Any]) -> Dict[str, Any]:
    if not evidence.get("has_routing_data"):
        return {
            "rule": "MISSING_ROUTES",
            "status": "INSUFFICIENT_EVIDENCE",
            "evidence": [],
            "reason": "Routing table information was not supplied."
        }
        
    findings = []
    if evidence.get("default_gateway") == "NOT_SET" and len(evidence.get("routes", [])) == 0:
        findings.append("Routing table is empty and no default gateway is set.")
        
    if findings:
        return {
            "rule": "MISSING_ROUTES",
            "status": "DETECTED",
            "severity": "MEDIUM",
            "confidence": 0.8,
            "evidence": findings,
            "source": "show ip route"
        }
    return {"rule": "MISSING_ROUTES", "status": "NOT_DETECTED"}
