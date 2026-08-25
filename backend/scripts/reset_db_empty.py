import sys
from pathlib import Path

# Add backend to path so we can import app modules when running as a script
backend_dir = Path(__file__).resolve().parent.parent
sys.path.append(str(backend_dir))

from app.api.routes.auth import get_password_hash
from app.database import Base, SessionLocal, engine
from app.models.case import Case
from app.models.user import User


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    # Create default users if they don't exist
    junior_user = db.query(User).filter(User.username == "junior").first()
    if not junior_user:
        junior_user = User(username="junior", hashed_password=get_password_hash("password"), role="junior")
        db.add(junior_user)
        
    senior_user = db.query(User).filter(User.username == "senior").first()
    if not senior_user:
        senior_user = User(username="senior", hashed_password=get_password_hash("password"), role="senior")
        db.add(senior_user)
        
    db.commit()
    db.close()
    
    print("Database reset successfully with default users. No cases were seeded.")

if __name__ == "__main__":
    seed()
