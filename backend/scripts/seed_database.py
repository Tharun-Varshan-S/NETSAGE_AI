import csv
import os
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine, Base
from app.models.case import Case

def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    file_path = "data/cases.csv"
    if not os.path.exists(file_path):
        print(f"Data file {file_path} not found.")
        return
        
    # Check if cases already exist
    if db.query(Case).count() > 0:
        print("Database already seeded.")
        return
        
    try:
        with open(file_path, mode="r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            cases_to_add = []
            for row in reader:
                case = Case(
                    symptom=row.get("symptom", ""),
                    topology_note=row.get("topology_note", ""),
                    show_outputs=row.get("show_outputs", ""),
                    expected_fault=row.get("expected_fault", ""),
                    osi_layer=row.get("osi_layer", ""),
                    concept_tag=row.get("concept_tag", ""),
                    severity=row.get("severity", "")
                )
                cases_to_add.append(case)
            
            db.bulk_save_objects(cases_to_add)
            db.commit()
            print(f"Seeded {len(cases_to_add)} cases successfully.")
    except Exception as e:
        print(f"Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
