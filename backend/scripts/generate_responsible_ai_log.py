import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parent.parent
sys.path.append(str(backend_dir))

from app.database import SessionLocal
from app.models.review import Review


def generate_log():
    db = SessionLocal()
    
    # We want to find cases where the AI diagnosis was edited or rejected
    reviews = db.query(Review).filter(Review.status.in_(["Edited", "Rejected"])).all()
    
    log_content = "# Responsible AI Log\n\n"
    log_content += "This document logs cases where the human reviewer had to correct or reject the AI's diagnosis.\n\n"
    
    count = 0
    for review in reviews:
        case = review.case
        count += 1
        log_content += f"## Case {case.case_id}: {case.concept_tag} ({case.severity})\n"
        log_content += f"**Symptom**: {case.symptom}\n\n"
        log_content += f"**AI Root Cause**: {case.ai_root_cause}\n\n"
        log_content += f"**Human Review Status**: {review.status}\n\n"
        log_content += f"**Reviewer Reason**: {review.reason}\n\n"
        log_content += "---\n\n"
        
    if count == 0:
        log_content += "No edited or rejected cases logged yet.\n"
        
    docs_dir = backend_dir.parent / "docs"
    docs_dir.mkdir(exist_ok=True)
    out_file = docs_dir / "responsible_ai_log.md"
    
    with open(out_file, "w", encoding="utf-8") as f:
        f.write(log_content)
        
    print(f"Generated responsible AI log with {count} cases at {out_file}")
    db.close()

if __name__ == "__main__":
    generate_log()
