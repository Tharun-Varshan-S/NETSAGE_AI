import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.api.deps import get_current_user
from app.database import Base, get_db
from app.main import app
from app.models.case import Case
from app.models.user import User

engine = create_engine("sqlite:///./test.db", connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def db_session():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    
    # Create test users
    junior = User(id=1, username="junior", hashed_password="pw", role="junior")
    senior = User(id=2, username="senior", hashed_password="pw", role="senior")
    db.add_all([junior, senior])
    
    # Create test cases
    case1 = Case(case_id="C1", category="Cat", difficulty="Beg", diagnosis_type="AI", symptom="S1", topology_note="T1", show_outputs="O1", expected_fault="F1", osi_layer="L1", concept_tag="C1", severity="S1", created_by_id=1)
    case2 = Case(case_id="C2", category="Cat", difficulty="Beg", diagnosis_type="AI", symptom="S2", topology_note="T2", show_outputs="O2", expected_fault="F2", osi_layer="L2", concept_tag="C2", severity="S2", created_by_id=2)
    db.add_all([case1, case2])
    
    db.commit()
    
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

def get_junior_user():
    return User(id=1, username="junior", role="junior")

def get_senior_user():
    return User(id=2, username="senior", role="senior")

def test_junior_sees_only_own_cases(db_session):
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = get_junior_user
    client = TestClient(app)
    
    response = client.get("/api/cases/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["case_id"] == "C1"

def test_senior_sees_all_cases(db_session):
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = get_senior_user
    client = TestClient(app)
    
    response = client.get("/api/cases/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
