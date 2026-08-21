# Responsible AI Log

This document logs cases where the human reviewer had to correct or reject the AI's diagnosis.

## Case NC001: vlan_mismatch (High)
**Symptom**: User on PC-ACCT-04 in Accounting cannot access the internal payroll application on 10.20.10.50. She says her network icon shows connected but she cannot open the webpage or ping the server.

**AI Root Cause**: None

**Human Review Status**: Edited

**Reviewer Reason**: Human correction added for testing

---

## Case NC002: vlan_native_mismatch (Medium)
**Symptom**: NOC monitor flagged recurring syslog warnings on SW-CORE-01: '%CDP-4-NATIVE_VLAN_MISMATCH: Native VLAN mismatch discovered on GigabitEthernet0/1 (1), with SW-ACCESS-01 GigabitEthernet0/1 (99)'. Traffic between switches is dropping intermittently.

**AI Root Cause**: None

**Human Review Status**: Edited

**Reviewer Reason**: Human correction added for testing

---

## Case NC003: vlan_trunk_pruned (High)
**Symptom**: Executive desk phone (VoIP) in Branch 3 shows 'Configuring IP...' indefinitely. The PC plugged into the back of the phone works fine on VLAN 15, but phone traffic on VLAN 30 fails.

**AI Root Cause**: None

**Human Review Status**: Edited

**Reviewer Reason**: Human correction added for testing

---

## Case NC004: gateway_misconfig (High)
**Symptom**: Newly imaged workstation PC-ENG-12 cannot access intranet servers or external websites. The user can ping other computers in the same room (192.168.10.0/24) but nothing outside.

**AI Root Cause**: None

**Human Review Status**: Edited

**Reviewer Reason**: Human correction added for testing

---

## Case NC005: subnet_mask_mismatch (Critical)
**Symptom**: Application Server SRV-APP-02 is experiencing erratic connectivity. It can reach some local hosts in the 10.100.4.0 range, but fails to respond to ping from client hosts in 10.100.4.140/25.

**AI Root Cause**: None

**Human Review Status**: Edited

**Reviewer Reason**: Human correction added for testing

---

