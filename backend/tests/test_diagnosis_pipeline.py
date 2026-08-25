from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.api.deps import get_current_user
from app.database import Base, get_db
from app.main import app
from app.models.case import Case
from app.models.user import User
from app.schemas.diagnosis import Diagnosis, DiagnosisStatus
from app.services.aggregator import DiagnosisAggregator
from app.services.rule_orchestrator import RuleOrchestrator

engine = create_engine("sqlite:///./test.db", connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def db_session():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

def override_get_current_user():
    return User(id=1, username="testuser", role="senior")

app.dependency_overrides[get_db] = override_get_db
app.dependency_overrides[get_current_user] = override_get_current_user
client = TestClient(app)

# --- TEST 1: Rule Checker ---
def test_rule_checker():
    evidence = {
        "has_interface_data": True,
        "has_routing_data": False,
        "has_vlan_data": False,
        "interfaces": [{"name": "GigabitEthernet0/1", "ip": "192.168.1.1", "status": "administratively down", "protocol": "down"}],
        "routes": [],
        "default_gateway": "UNKNOWN"
    }
    show_outputs = "GigabitEthernet0/1    192.168.1.1     YES manual administratively down down"
    
    findings = RuleOrchestrator.run_all(show_outputs, evidence)
    
    interface_finding = next((f for f in findings if f["rule"] == "INTERFACE_DOWN"), None)
    assert interface_finding is not None
    assert interface_finding["status"] == "DETECTED"
    assert "GigabitEthernet0/1 is administratively down" in interface_finding["evidence"][0]


# --- TEST 2: Diagnosis Orchestration (Mock Gemini) ---
@patch('app.api.routes.diagnose.run_diagnosis')
def test_diagnosis_orchestration_success(mock_run_diagnosis, db_session):
    mock_diagnosis = Diagnosis(
        status=DiagnosisStatus.DIAGNOSED,
        root_cause="Test AI root cause",
        osi_layer="Layer 1 (Physical)",
        confidence="High",
        evidence="Some test evidence",
        reason="Because I said so",
        next_command="show interfaces",
        fix_steps="no shutdown",
        verification_command="show ip int brief"
    )
    mock_run_diagnosis.return_value = mock_diagnosis
    
    # Create a mock case
    case = Case(case_id="TEST-100", category="Switching", difficulty="Beginner", diagnosis_type="AI", symptom="Test", topology_note="Test", show_outputs="Test", expected_fault="Test", osi_layer="Test", concept_tag="Test", severity="Test")
    db_session.add(case)
    db_session.commit()
    
    response = client.post(f"/api/diagnose/{case.id}")
    assert response.status_code == 200
    data = response.json()
    
    assert data["status"] == "DIAGNOSED"
    assert data["root_cause"] == "Test AI root cause"
    
    # --- TEST 5: Persistence ---
    db_session.refresh(case)
    assert case.ai_root_cause == "Test AI root cause"
    assert case.diagnosis_status == "DIAGNOSED"


# --- TEST 3: API Endpoint missing API key ---
@patch('app.api.routes.diagnose.run_diagnosis')
def test_diagnosis_api_missing_key(mock_run_diagnosis, db_session):
    mock_run_diagnosis.return_value = None  # Simulate missing key
    
    case = Case(case_id="TEST-101", category="Routing", difficulty="Beginner", diagnosis_type="AI", symptom="Test", topology_note="Test", show_outputs="Test", expected_fault="Test", osi_layer="Test", concept_tag="Test", severity="Test")
    db_session.add(case)
    db_session.commit()
    
    response = client.post(f"/api/diagnose/{case.id}")
    assert response.status_code == 503
    assert "Missing GEMINI_API_KEY" in response.json()["detail"]


# --- TEST 4: Aggregator Logic ---
def test_aggregator_downgrades_confidence_on_contradiction():
    ai_diag = Diagnosis(
        status=DiagnosisStatus.DIAGNOSED,
        root_cause="Bad cable",
        osi_layer="Layer 1 (Physical)",
        confidence="High",
        reason="AI says cable is bad"
    )
    
    rule_findings = [{"rule": "INTERFACE_DOWN", "status": "INSUFFICIENT_EVIDENCE", "evidence": [], "reason": "No data"}]
    
    result = DiagnosisAggregator.aggregate(ai_diag, rule_findings)
    assert result.confidence == "Low"
    assert "Aggregator Warning" in result.reason
