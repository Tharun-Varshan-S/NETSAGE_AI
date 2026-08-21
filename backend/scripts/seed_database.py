import csv
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
    
    # Path to the real dataset in the project root
    project_root = backend_dir.parent
    file_path = project_root / "netsage_final_cases.csv"
    
    if not file_path.exists():
        print(f"Data file {file_path} not found.")
        db.close()
        return
        
    print(f"Loading dataset from: {file_path}")
        
    try:
        with open(file_path, mode="r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            
            # Validate headers
            expected_headers = [
                "case_id", "category", "difficulty", "diagnosis_type", "symptoms", 
                "topology", "show_outputs", "expected_fault", "osi_layer", 
                "concept", "severity", "expected_next_command", "expected_fix", 
                "verification_command"
            ]
            
            actual_headers = reader.fieldnames
            if not actual_headers:
                print("CSV file is empty.")
                return
                
            missing_headers = [h for h in expected_headers if h not in actual_headers]
            if missing_headers:
                print(f"Error: CSV is missing required columns: {missing_headers}")
                return

            cases_to_add = []
            seen_case_ids = set()
            
            # Query existing case IDs to prevent duplicates if DB is partially seeded
            existing_case_ids = {c[0] for c in db.query(Case.case_id).all()}
            seen_case_ids.update(existing_case_ids)
            
            invalid_rows = 0
            duplicate_ids = 0
            loaded = 0
            
            for row_idx, row in enumerate(reader, start=2): # Start at 2 to account for header
                case_id = row.get("case_id", "").strip()
                
                # Validation: Required fields
                if not case_id:
                    print(f"Row {row_idx}: Invalid row - missing case_id.")
                    invalid_rows += 1
                    continue
                    
                if not row.get("symptoms", "").strip():
                    print(f"Row {row_idx} (Case {case_id}): Invalid row - missing symptoms.")
                    invalid_rows += 1
                    continue
                    
                if case_id in seen_case_ids:
                    print(f"Row {row_idx} (Case {case_id}): Duplicate case_id detected. Skipping.")
                    duplicate_ids += 1
                    continue
                    
                seen_case_ids.add(case_id)
                
                case = Case(
                    case_id=case_id,
                    category=row.get("category", ""),
                    difficulty=row.get("difficulty", ""),
                    diagnosis_type=row.get("diagnosis_type", ""),
                    symptom=row.get("symptoms", ""),
                    topology_note=row.get("topology", ""),
                    show_outputs=row.get("show_outputs", ""),
                    expected_fault=row.get("expected_fault", ""),
                    osi_layer=row.get("osi_layer", ""),
                    concept_tag=row.get("concept", ""),
                    severity=row.get("severity", ""),
                    expected_next_command=row.get("expected_next_command", ""),
                    expected_fix=row.get("expected_fix", ""),
                    verification_command=row.get("verification_command", ""),
                    created_by_id=junior_user.id
                )
                cases_to_add.append(case)
            
            if cases_to_add:
                db.bulk_save_objects(cases_to_add)
                db.commit()
                loaded = len(cases_to_add)
                
            print("\n--- Seeding Report ---")
            print(f"Cases loaded successfully: {loaded}")
            print(f"Invalid rows skipped: {invalid_rows}")
            print(f"Duplicate IDs skipped: {duplicate_ids}")
            print(f"Total cases currently in DB: {db.query(Case).count()}")
            print("----------------------\n")
            
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed()
