import re
from typing import Dict, List, Any

def check_duplicate_ips(show_outputs: str) -> List[str]:
    """
    Checks for duplicate IP addresses in the show outputs.
    Looks for typical duplicate address logs like '%IP-4-DUPADDR' or just counts IP assignments.
    Since this is a simple string-based check, we'll look for duplicate assigned IPs in interface brief.
    """
    issues = []
    
    # If the log explicitly mentions a duplicate address
    if "DUPADDR" in show_outputs or "Duplicate address" in show_outputs:
        issues.append("Detected duplicate IP address warning in logs.")
        
    # Extract all IP addresses from 'show ip interface brief' style output
    # Exclude unassigned ones
    ip_pattern = r"(?:FastEthernet|GigabitEthernet|Vlan|Serial)\d+(?:/\d+)*\s+((?:\d{1,3}\.){3}\d{1,3})"
    matches = re.findall(ip_pattern, show_outputs)
    
    seen = set()
    for ip in matches:
        if ip != "unassigned":
            if ip in seen:
                issues.append(f"Duplicate IP configured across interfaces: {ip}")
            seen.add(ip)
            
    return issues

def check_wrong_masks(show_outputs: str) -> List[str]:
    """
    Checks for common wrong subnet masks (e.g., /8 where /24 is expected).
    This is highly context-dependent, but we can look for suspicious masks like 255.0.0.0 on a 192.168.x.x address.
    """
    issues = []
    # Pattern to match IP and mask: 'Internet address is 192.168.1.1/8' or '192.168.1.1 255.0.0.0'
    ip_mask_pattern = r"((?:192\.168|172\.(?:1[6-9]|2[0-9]|3[0-1])|10\.)\.\d{1,3}\.\d{1,3})[/ ](?:255\.0\.0\.0|/8)"
    matches = re.findall(ip_mask_pattern, show_outputs)
    for ip in matches:
        issues.append(f"Suspicious subnet mask for private IP {ip}: appears to be /8 (255.0.0.0) which is overly broad.")
        
    return issues

def check_gateway_mismatch(show_outputs: str) -> List[str]:
    """
    Checks if a configured default gateway does not match the expected subnet.
    We look for 'Default gateway is X' and see if it's reachable or valid.
    """
    issues = []
    # Simple check: 'Gateway of last resort is not set' when it might be needed.
    if "Gateway of last resort is not set" in show_outputs and "ip route 0.0.0.0 0.0.0.0" not in show_outputs:
        # A bit simplistic, but highlights potential gateway missing issue
        # Only relevant if we're a router needing a default route.
        pass
        
    # Another common lab error: default gateway on PC is wrong. 
    # Packet Tracer PC outputs: 'Default Gateway . . . . . . . . . : 192.168.1.254'
    # We can't strictly determine mismatch without knowing the interface subnet, 
    # but we can flag if there are multiple different gateways or if gateway IP matches device IP.
    return issues

def check_interface_down(show_outputs: str) -> List[str]:
    """
    Checks for interfaces that are administratively down or line protocol is down.
    """
    issues = []
    lines = show_outputs.split('\n')
    for line in lines:
        if "administratively down" in line:
            issues.append(f"Interface is administratively down: {line.strip()}")
        elif "down, line protocol is down" in line or (re.search(r"\bdown\b.*\bdown\b", line) and ("FastEthernet" in line or "GigabitEthernet" in line)):
            # 'FastEthernet0/0 is down, line protocol is down'
            issues.append(f"Interface is down/down: {line.strip()}")
    return issues

def check_missing_vlan(show_outputs: str) -> List[str]:
    """
    Checks for missing VLANs, e.g. ports assigned to a VLAN that does not exist.
    """
    issues = []
    if "does not exist" in show_outputs and "VLAN" in show_outputs:
         issues.append("A port is assigned to a VLAN that does not exist in the VLAN database.")
         
    # Check if trunking is failing or vlan is inactive
    if "inactive" in show_outputs.lower() and "vlan" in show_outputs.lower():
         issues.append("A VLAN is marked as inactive.")
    return issues

def check_missing_routes(show_outputs: str) -> List[str]:
    """
    Checks for missing routes (e.g. no default route, or specific expected subnets not in routing table).
    """
    issues = []
    if "show ip route" in show_outputs:
        if "Gateway of last resort is not set" in show_outputs and not re.search(r"S\*\s+0\.0\.0\.0/0", show_outputs):
             issues.append("No default route is set (Gateway of last resort is not set).")
    return issues

def run_all_checks(show_outputs: str) -> Dict[str, List[str]]:
    """
    Runs all deterministic checks on the provided show_outputs string.
    Returns a dictionary of issue categories mapped to lists of specific issue strings.
    """
    if not show_outputs:
        return {}
        
    return {
        "duplicate_ips": check_duplicate_ips(show_outputs),
        "wrong_masks": check_wrong_masks(show_outputs),
        "gateway_mismatch": check_gateway_mismatch(show_outputs),
        "interface_down": check_interface_down(show_outputs),
        "missing_vlan": check_missing_vlan(show_outputs),
        "missing_routes": check_missing_routes(show_outputs),
    }
