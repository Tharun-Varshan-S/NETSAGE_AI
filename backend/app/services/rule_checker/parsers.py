import re
from typing import Dict, List, Any

def parse_interfaces_brief(show_output: str) -> List[Dict[str, str]]:
    """Parse 'show ip interface brief'"""
    interfaces = []
    pattern = r"^(FastEthernet\d+/\d+|GigabitEthernet\d+/\d+|Serial\d+/\d+/\d+|Vlan\d+)\s+([0-9\.]+|unassigned)\s+\w+\s+\w+\s+(up|down|administratively down)\s+(up|down)"
    for line in show_output.split('\n'):
        match = re.search(pattern, line.strip(), re.IGNORECASE)
        if match:
            interfaces.append({
                "name": match.group(1),
                "ip": match.group(2),
                "status": match.group(3),
                "protocol": match.group(4)
            })
    return interfaces

def parse_interfaces_config(show_output: str) -> Dict[str, Dict[str, str]]:
    """Parse 'show running-config' for interface IPs and masks"""
    interfaces = {}
    current_iface = None
    for line in show_output.split('\n'):
        line = line.strip()
        if line.startswith("interface "):
            current_iface = line.split()[1]
            interfaces[current_iface] = {}
        elif current_iface and line.startswith("ip address "):
            parts = line.split()
            if len(parts) >= 4:
                interfaces[current_iface]["ip"] = parts[2]
                interfaces[current_iface]["mask"] = parts[3]
        elif line == "!":
            current_iface = None
    return interfaces

def parse_routes(show_output: str) -> Dict[str, Any]:
    """Parse 'show ip route'"""
    result = {"routes": [], "gateway": None}
    
    gw_match = re.search(r"Gateway of last resort is ([0-9\.]+) to network 0\.0\.0\.0", show_output)
    if gw_match:
        result["gateway"] = gw_match.group(1)
        
    for line in show_output.split('\n'):
        line = line.strip()
        if re.match(r"^[CSORD][\*\s]*\s+", line):
            dest_match = re.search(r"([0-9\.]+/[0-9]+)", line)
            if dest_match:
                result["routes"].append(dest_match.group(1))
    return result

def parse_vlans(show_output: str) -> List[Dict[str, str]]:
    """Parse 'show vlan brief' or 'show vlan'"""
    vlans = []
    pattern = r"^(\d{1,4})\s+([\w\-]+)\s+(active|suspend|act/lshut)\s*(.*)$"
    for line in show_output.split('\n'):
        match = re.search(pattern, line.strip())
        if match:
            vlans.append({
                "id": match.group(1),
                "name": match.group(2),
                "status": match.group(3),
                "ports": match.group(4)
            })
    return vlans

def parse_switchports(show_output: str) -> Dict[str, str]:
    """Parse 'show interfaces switchport' to find access vlan assignments"""
    ports = {}
    current_port = None
    for line in show_output.split('\n'):
        line = line.strip()
        if line.startswith("Name: "):
            current_port = line.split()[1]
        elif current_port and line.startswith("Access Mode VLAN:"):
            match = re.search(r"Access Mode VLAN:\s*(\d+)", line)
            if match:
                ports[current_port] = match.group(1)
    return ports
