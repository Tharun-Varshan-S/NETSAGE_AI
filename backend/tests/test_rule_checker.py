from app.services.rule_checker.checks import run_all_checks, check_interface_down, check_duplicate_ips

def test_interface_down():
    output = "FastEthernet0/0 is administratively down, line protocol is down"
    issues = check_interface_down(output)
    assert len(issues) == 1
    assert "administratively down" in issues[0]

def test_duplicate_ips():
    output = "%IP-4-DUPADDR: Duplicate address 192.168.1.1 on FastEthernet0/0"
    issues = check_duplicate_ips(output)
    assert len(issues) == 1
    assert "DUPADDR" in issues[0]

def test_run_all_checks():
    output = "FastEthernet0/0 is administratively down\n%IP-4-DUPADDR: Duplicate address"
    results = run_all_checks(output)
    
    assert len(results["interface_down"]) == 1
    assert len(results["duplicate_ips"]) == 1
    assert len(results["missing_routes"]) == 0
