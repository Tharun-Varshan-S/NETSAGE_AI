## 1. Rule-Based (Deterministic) Cases

### Rule-Based Case 1
**Expected Fault:** Interface GigabitEthernet0/5 on switch SW-ACCESS-BUILDING2 is assigned to the default VLAN 1 instead of Accounting VLAN 20.

**Topology Notes:**
```text
Switch SW-ACCESS-BUILDING2 interface GigabitEthernet0/5 connects to PC-ACCT-04. Accounting devices are required to be on VLAN 20 (10.20.20.0/24), while payroll servers reside on VLAN 10 (10.20.10.0/24).
```

**Symptoms:**
```text
User on PC-ACCT-04 in Accounting cannot access the internal payroll application on 10.20.10.50. She says her network icon shows connected but she cannot open the webpage or ping the server.
```

**Show Outputs:**
```text
SW-ACCESS-BUILDING2# show vlan brief

VLAN Name                             Status    Ports
---- -------------------------------- --------- -------------------------------
1    default                          active    Gi0/1, Gi0/3, Gi0/4, Gi0/5, Gi0/6
10   Data_Servers                     active    Gi0/2
20   Accounting                       active    Gi0/7, Gi0/8

SW-ACCESS-BUILDING2# show interface GigabitEthernet0/5 switchport
Name: Gi0/5
Administrative Mode: dynamic auto
Operational Mode: static access
Administrative Trunking Encapsulation: negotiate
Negotiation of Trunking: On
Access Mode VLAN: 1 (default)
```

---

### Rule-Based Case 2
**Expected Fault:** Native VLAN mismatch on the trunk link between SW-CORE-01 (VLAN 1) and SW-ACCESS-01 (VLAN 99) on interface GigabitEthernet0/1.

**Topology Notes:**
```text
Trunk link between core switch SW-CORE-01 and access switch SW-ACCESS-01 over interface GigabitEthernet0/1. The management policy dictates Native VLAN 99 for untagged control traffic across all trunks.
```

**Symptoms:**
```text
NOC monitor flagged recurring syslog warnings on SW-CORE-01: '%CDP-4-NATIVE_VLAN_MISMATCH: Native VLAN mismatch discovered on GigabitEthernet0/1 (1), with SW-ACCESS-01 GigabitEthernet0/1 (99)'. Traffic between switches is dropping intermittently.
```

**Show Outputs:**
```text
SW-CORE-01# show interfaces trunk

Port        Mode         Encapsulation  Status        Native vlan
Gi0/1       on           802.1q         trunking      1

SW-ACCESS-01# show interfaces trunk

Port        Mode         Encapsulation  Status        Native vlan
Gi0/1       on           802.1q         trunking      99
```

---

### Rule-Based Case 3
**Expected Fault:** Trunk interface GigabitEthernet0/1 on SW-BR3-ACC01 has an allowed VLAN list that explicitly excludes Voice VLAN 30.

**Topology Notes:**
```text
Switch SW-BR3-ACC01 connects to router R-BR3 over trunk interface Gi0/1. Data uses VLAN 15 (172.16.15.0/24) and Voice uses VLAN 30 (172.16.30.0/24).
```

**Symptoms:**
```text
Executive desk phone (VoIP) in Branch 3 shows 'Configuring IP...' indefinitely. The PC plugged into the back of the phone works fine on VLAN 15, but phone traffic on VLAN 30 fails.
```

**Show Outputs:**
```text
SW-BR3-ACC01# show interfaces GigabitEthernet0/1 switchport
Name: Gi0/1
Administrative Mode: trunk
Operational Mode: trunk
Administrative Native VLAN tagging: enabled
Voice VLAN: none
Trunking VLANs Enabled: 10,15,20

SW-BR3-ACC01# show interfaces trunk
Port        Mode         Encapsulation  Status        Native vlan
Gi0/1       on           802.1q         trunking      1
Port        VLANs allowed on trunk
Gi0/1       10,15,20
```

---

## 2. AI Reasoning / Ambiguous Cases

### AI Case 1
**Expected Fault:** OSPF neighbor adjacency is stuck in EXSTART state due to an IP MTU mismatch between R-DC1 (MTU 1500) and R-DIST2 (MTU 1400) on the interconnect link.

**Topology Notes:**
```text
R-DC1 and R-DIST2 connect over a point-to-point GigabitEthernet link (10.254.1.0/30) in OSPF Area 0.
```

**Symptoms:**
```text
OSPF routing protocol failed between Core Router R-DC1 and Distribution Router R-DIST2. Routes from Data Center 2 are missing from the global routing table across the campus.
```

**Show Outputs:**
```text
R-DC1# show ip ospf neighbor

Neighbor ID     Pri   State           Dead Time   Address         Interface
192.168.255.2     1   EXSTART/DR      00:00:33    10.254.1.2      GigabitEthernet0/0/0

R-DC1# show ip ospf interface GigabitEthernet0/0/0 | include MTU
  Interface MTU 1500, NBR MTU 1400, Protocol MTU check Enabled

R-DIST2# show interface GigabitEthernet0/0/1 | include MTU
  MTU 1400 bytes, BW 1000000 Kbit/sec
```

---

### AI Case 2
**Expected Fault:** WAP configuration sets 54 Mbps as a mandatory minimum basic rate, forcing handheld clients to drop off prematurely when roaming rather than shifting down to lower data rates.

**Topology Notes:**
```text
Warehouse WAPs AP-BAY4 and AP-BAY5 are managed by WLC-CORE. Coverage check shows strong signal (-55 dBm) across both bays, but client logs show rapid disconnect/reconnect cycles.
```

**Symptoms:**
```text
Forklift drivers in the warehouse report their handheld barcode scanners keep dropping connection for 10-15 seconds every time they drive past Bay 4 toward Bay 5.
```

**Show Outputs:**
```text
WLC-CORE# show client detail 00:24:b2:88:11:00
Client MAC Address............................... 00:24:b2:88:11:00
AP Name.......................................... AP-BAY4
AP Signal Strength............................... -82 dBm
AP Signal-to-Noise Ratio......................... 12 dB
Current Rate..................................... 54.0 Mbps
Reason Code...................................... 4 (Disassociated due to inactivity)

WLC-CORE# show ap config general AP-BAY5 | include Rate
802.11a Mandatory Rates.......................... 54 Mbps
802.11a Disabled Rates........................... 6, 9, 12, 18, 24, 36, 48 Mbps
```

---

### AI Case 3
**Expected Fault:** Ambiguous case diagnosis: While an ACL exists on R1, show output proves ACL 101 permits traffic (120 matches); root cause is missing return route for 10.10.1.0/24 on R2.

**Topology Notes:**
```text
R1 connects LAN 10.10.1.0/24 to R2 across WAN link 172.16.0.0/30. Web server is on R2 LAN 10.20.1.0/24. Extended ACL 101 is applied on R1 Gi0/0/0.
```

**Symptoms:**
```text
User at 10.10.1.50 cannot reach web server at 10.20.1.100. Junior admin reports 'It could be an ACL blocking port 80 or a missing route on R2 back to 10.10.1.0/24'.
```

**Show Outputs:**
```text
R1# show ip access-lists 101
Extended IP access list 101
    10 permit tcp 10.10.1.0 0.0.0.255 host 10.20.1.100 eq www (120 matches)
    20 permit ip any any (500 matches)

R2# show ip route 10.10.1.0
% Network not in routing table

R2# show ip route
Gateway of last resort is not set
C    10.20.1.0/24 is directly connected, GigabitEthernet0/0/0
C    172.16.0.0/30 is directly connected, GigabitEthernet0/0/1
```

---
