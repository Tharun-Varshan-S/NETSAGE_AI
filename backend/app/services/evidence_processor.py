import re
from typing import Dict, Any, List

class EvidenceProcessor:
    """
    Extracts structured evidence from symptoms, topology notes, and CLI show outputs.
    Strictly adheres to 'No evidence = no claim'. 
    If data is not present in the CLI output, it explicitly marks it as UNKNOWN or empty.
    """
    
    @staticmethod
    def process(symptoms: str, topology: str, show_outputs: str) -> Dict[str, Any]:
        evidence = {
            "interfaces": EvidenceProcessor._extract_interfaces(show_outputs),
            "vlans": EvidenceProcessor._extract_vlans(show_outputs),
            "routes": EvidenceProcessor._extract_routes(show_outputs),
            "default_gateway": EvidenceProcessor._extract_gateway(show_outputs),
        }
        
        # Check if we have any outputs at all for specific categories
        evidence["has_interface_data"] = "show ip int brief" in show_outputs or "Interface" in show_outputs
        evidence["has_vlan_data"] = "show vlan" in show_outputs or "VLAN Name" in show_outputs
        evidence["has_routing_data"] = "show ip route" in show_outputs or "Gateway of last resort" in show_outputs
        
        return evidence

    @staticmethod
    def _extract_interfaces(show_outputs: str) -> List[Dict[str, str]]:
        """
        Extracts interface information from 'show ip interface brief' style outputs.
        Example line: GigabitEthernet0/0    192.168.1.1     YES manual up                    up 
        """
        interfaces = []
        # Match lines that look like interface briefs
        # Interface IP-Address OK? Method Status Protocol
        pattern = r"^(FastEthernet\d+/\d+|GigabitEthernet\d+/\d+|Serial\d+/\d+/\d+|Vlan\d+)\s+([0-9\.]+|unassigned)\s+\w+\s+\w+\s+(up|down|administratively down)\s+(up|down)"
        
        for line in show_outputs.split('\n'):
            line = line.strip()
            match = re.search(pattern, line, re.IGNORECASE)
            if match:
                interfaces.append({
                    "name": match.group(1),
                    "ip": match.group(2),
                    "status": match.group(3),
                    "protocol": match.group(4)
                })
        return interfaces

    @staticmethod
    def _extract_vlans(show_outputs: str) -> List[Dict[str, str]]:
        """
        Extracts VLAN information.
        Example line: 10   Payroll                          active    Fa0/1, Fa0/2
        """
        vlans = []
        # Basic parsing for typical 'show vlan' output rows
        pattern = r"^(\d{1,4})\s+([\w\-]+)\s+(active|suspend)\s*(.*)$"
        
        for line in show_outputs.split('\n'):
            line = line.strip()
            match = re.search(pattern, line)
            if match:
                vlans.append({
                    "id": match.group(1),
                    "name": match.group(2),
                    "status": match.group(3),
                    "ports": match.group(4).strip() if match.group(4) else "None"
                })
        return vlans

    @staticmethod
    def _extract_routes(show_outputs: str) -> List[str]:
        """
        Extracts known routes. Returns raw route strings for now.
        """
        routes = []
        # Match lines starting with C, S, O, R, D followed by network
        pattern = r"^([CSORD][\*\s]\s+(?:[0-9\.]+/[0-9]+).*)$"
        for line in show_outputs.split('\n'):
            line = line.strip()
            match = re.search(pattern, line)
            if match:
                routes.append(match.group(1).strip())
        return routes

    @staticmethod
    def _extract_gateway(show_outputs: str) -> str:
        """
        Extracts default gateway if present.
        """
        match = re.search(r"Gateway of last resort is ([0-9\.]+) to network 0\.0\.0\.0", show_outputs)
        if match:
            return match.group(1)
        
        match_not_set = re.search(r"Gateway of last resort is not set", show_outputs)
        if match_not_set:
            return "NOT_SET"
            
        return "UNKNOWN"
