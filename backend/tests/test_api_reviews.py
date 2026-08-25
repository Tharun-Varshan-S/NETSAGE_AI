import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.api.deps import get_current_user
from app.database import Base, get_db
from app.main import app
from app.models.case import Case
from app.models.review import Review
from app.models.user import User

engine = create_engine("sqlite:///./test.db", connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def db_session():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    
    # Create test users
    senior = User(id=1, username="senior", hashed_password="pw", role="senior")
    db.add(senior)
    
    # Create test case
    case1 = Case(case_id="C1", category="Cat", difficulty="Beg", diagnosis_type="AI", symptom="S1", topology_note="T1", show_outputs="O1", expected_fault="F1", osi_layer="L1", concept_tag="C1", severity="S1", created_by_id=1)
    db.add(case1)
    
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

def get_senior_user():
    return User(id=1, username="senior", role="senior")

def test_create_review(db_session):
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = get_senior_user
    client = TestClient(app)
    
    # We use Case ID 1 since we just created one case
    response = client.post("/api/reviews/1", json={"status": "Accepted", "reason": "Looks good"})
    
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "Accepted"
    
    # Verify the reviewer_id was attached
    review = db_session.query(Review).first()
    assert review is not None
    assert review.reviewer_id == 1
