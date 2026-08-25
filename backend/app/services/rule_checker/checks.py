import ipaddress
from typing import Any
from .parsers import (
    parse_interfaces_brief,
    parse_interfaces_config,
    parse_routes,
    parse_vlans,
    parse_switchports
)

def check_duplicate_ips(show_outputs: str, evidence: dict[str, Any]) -> dict[str, Any]:
    if "show ip interface brief" not in show_outputs and "Interface" not in show_outputs:
        return {"rule": "CRITICAL_DUPLICATE_IP", "status": "INSUFFICIENT_EVIDENCE", "evidence": [], "reason": "Interface IP assignment information was not supplied."}
    
    findings = []
    if "DUPADDR" in show_outputs or "Duplicate address" in show_outputs:
        findings.append("Detected duplicate IP address warning in logs.")
        
    interfaces = parse_interfaces_brief(show_outputs)
    seen = set()
    for intf in interfaces:
        ip = intf.get("ip")
        status = intf.get("status", "").lower()
        if ip and ip != "unassigned" and "down" not in status:
            if ip in seen:
                findings.append(f"Duplicate IP configured across active interfaces: {ip}")
            seen.add(ip)
            
    if findings:
        return {"rule": "CRITICAL_DUPLICATE_IP", "status": "DETECTED", "severity": "HIGH", "confidence": 1.0, "evidence": findings, "source": "show ip interface brief"}
    return {"rule": "CRITICAL_DUPLICATE_IP", "status": "NOT_DETECTED"}

def check_wrong_masks(show_outputs: str, evidence: dict[str, Any]) -> dict[str, Any]:
    if "show running-config" not in show_outputs:
        return {"rule": "WRONG_MASK", "status": "INSUFFICIENT_EVIDENCE", "evidence": [], "reason": "No CLI outputs provided."}
    
    findings = []
    interfaces = parse_interfaces_config(show_outputs)
    
    for intf, data in interfaces.items():
        ip = data.get("ip")
        mask = data.get("mask")
        if ip and mask:
            try:
                network = ipaddress.IPv4Network(f"{ip}/{mask}", strict=False)
                if network.prefixlen == 8 and ip.startswith("192.168."):
                     findings.append(f"Suspicious mask {mask} for private IP {ip}: appears to be /8 (255.0.0.0) which is overly broad.")
            except ValueError:
                findings.append(f"Invalid IP/mask combination: {ip}/{mask}")

    if findings:
        return {"rule": "WRONG_MASK", "status": "DETECTED", "severity": "MEDIUM", "confidence": 0.9, "evidence": findings, "source": "show running-config"}
    return {"rule": "WRONG_MASK", "status": "NOT_DETECTED"}

def check_gateway_mismatch(show_outputs: str, evidence: dict[str, Any]) -> dict[str, Any]:
    if "show ip route" not in show_outputs:
        return {"rule": "GATEWAY_MISMATCH", "status": "INSUFFICIENT_EVIDENCE", "evidence": [], "reason": "Routing or gateway information was not supplied."}
        
    findings = []
    routes = parse_routes(show_outputs)
    gw = routes.get("gateway")
    
    if gw and gw != "NOT_SET":
        interfaces = parse_interfaces_config(show_outputs)
        gw_reachable = False
        try:
            gw_ip = ipaddress.IPv4Address(gw)
            for data in interfaces.values():
                if "ip" in data and "mask" in data:
                    net = ipaddress.IPv4Network(f"{data['ip']}/{data['mask']}", strict=False)
                    if gw_ip in net:
                        gw_reachable = True
                        break
        except ValueError:
            pass
            
        if not gw_reachable and interfaces:
            findings.append(f"Configured default gateway {gw} is not in any interface's subnet.")
    elif gw == "NOT_SET" or not gw:
        findings.append("No default route is set (Gateway of last resort is not set).")
            
    if findings:
        return {"rule": "GATEWAY_MISMATCH", "status": "DETECTED", "severity": "HIGH", "confidence": 0.9, "evidence": findings, "source": "show ip route"}
    return {"rule": "GATEWAY_MISMATCH", "status": "NOT_DETECTED"}

def check_interface_down(show_outputs: str, evidence: dict[str, Any]) -> dict[str, Any]:
    if "show ip interface brief" not in show_outputs:
        return {"rule": "INTERFACE_DOWN", "status": "INSUFFICIENT_EVIDENCE", "evidence": [], "reason": "Interface state information was not supplied."}
        
    findings = []
    interfaces = parse_interfaces_brief(show_outputs)
    for intf in interfaces:
        if intf.get("ip") != "unassigned":
            if "down" in intf.get("status", "").lower() or "down" in intf.get("protocol", "").lower():
                findings.append(f"Interface {intf['name']} with IP {intf['ip']} is {intf['status']}/{intf['protocol']}")
                
    if findings:
        return {"rule": "INTERFACE_DOWN", "status": "DETECTED", "severity": "HIGH", "confidence": 1.0, "evidence": findings, "source": "show ip interface brief"}
    return {"rule": "INTERFACE_DOWN", "status": "NOT_DETECTED"}

def check_missing_vlan(show_outputs: str, evidence: dict[str, Any]) -> dict[str, Any]:
    if "show vlan" not in show_outputs and "show interfaces switchport" not in show_outputs:
        return {"rule": "MISSING_VLAN", "status": "INSUFFICIENT_EVIDENCE", "evidence": [], "reason": "VLAN database information was not supplied."}
        
    findings = []
    vlans = parse_vlans(show_outputs)
    switchports = parse_switchports(show_outputs)
    
    valid_vlan_ids = [v["id"] for v in vlans if "active" in v["status"].lower()]
    
    for port, vlan_id in switchports.items():
        if vlan_id not in valid_vlan_ids and vlan_id != "1":
            findings.append(f"Port {port} is assigned to VLAN {vlan_id}, which is missing or inactive in VLAN database.")
            
    if "does not exist" in show_outputs and "VLAN" in show_outputs:
         findings.append("A port is assigned to a VLAN that does not exist in the VLAN database.")
         
    if findings:
        return {"rule": "MISSING_VLAN", "status": "DETECTED", "severity": "HIGH", "confidence": 1.0, "evidence": findings, "source": "show vlan"}
    return {"rule": "MISSING_VLAN", "status": "NOT_DETECTED"}

def check_missing_routes(show_outputs: str, evidence: dict[str, Any]) -> dict[str, Any]:
    if "show ip route" not in show_outputs:
        return {"rule": "MISSING_ROUTES", "status": "INSUFFICIENT_EVIDENCE", "evidence": [], "reason": "Routing table information was not supplied."}
        
    findings = []
    routes_data = parse_routes(show_outputs)
    if not routes_data["gateway"] and len(routes_data["routes"]) == 0:
        findings.append("Routing table is empty and no default gateway (0.0.0.0/0) is set.")
    
    if findings:
        return {"rule": "MISSING_ROUTES", "status": "DETECTED", "severity": "MEDIUM", "confidence": 0.8, "evidence": findings, "source": "show ip route"}
    return {"rule": "MISSING_ROUTES", "status": "NOT_DETECTED"}
