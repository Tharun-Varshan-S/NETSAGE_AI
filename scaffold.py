import os
import pathlib

base_dir = pathlib.Path("d:/projects/Cisco")

directories = [
    "backend/app/models",
    "backend/app/schemas",
    "backend/app/api/routes",
    "backend/app/services/rule_checker",
    "backend/app/prompts",
    "backend/tests",
    "backend/data",
    "backend/scripts",
    "frontend/src/api",
    "frontend/src/pages",
    "frontend/src/components",
    "frontend/src/types",
    "frontend/tests",
    "docs"
]

for d in directories:
    (base_dir / d).mkdir(parents=True, exist_ok=True)

files_content = {
    "README.md": "# NetSage AI\n\nAI-assisted troubleshooter for Packet Tracer lab problems.\n",
    "docker-compose.yml": "version: '3.8'\nservices:\n  api:\n    build: ./backend\n    ports:\n      - \"8000:8000\"\n  web:\n    build: ./frontend\n    ports:\n      - \"5173:5173\"\n",
    ".env.example": "GEMINI_API_KEY=your_api_key_here\n",
    ".pre-commit-config.yaml": "repos:\n  - repo: https://github.com/astral-sh/ruff-pre-commit\n    rev: v0.2.2\n    hooks:\n      - id: ruff\n        args: [ --fix ]\n",
    "backend/pyproject.toml": "[project]\nname = \"netsage-backend\"\nversion = \"0.1.0\"\ndescription = \"Backend for NetSage AI\"\nrequires-python = \">=3.12\"\ndependencies = [\n    \"fastapi\",\n    \"uvicorn\",\n    \"sqlalchemy\",\n    \"pydantic\",\n    \"pydantic-settings\",\n    \"google-genai\",\n]\n",
    "backend/app/main.py": "from fastapi import FastAPI\n\napp = FastAPI(title=\"NetSage AI\")\n\n@app.get(\"/\")\ndef read_root():\n    return {\"status\": \"ok\"}\n",
    "backend/app/config.py": "from pydantic_settings import BaseSettings\n\nclass Settings(BaseSettings):\n    GEMINI_API_KEY: str = \"\"\n    DATABASE_URL: str = \"sqlite:///./netsage.db\"\n\n    class Config:\n        env_file = \".env\"\n\nsettings = Settings()\n",
    "backend/app/database.py": "from sqlalchemy import create_engine\nfrom sqlalchemy.orm import sessionmaker, declarative_base\nfrom app.config import settings\n\nengine = create_engine(settings.DATABASE_URL, connect_args={\"check_same_thread\": False})\nSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)\nBase = declarative_base()\n",
    "backend/app/models/__init__.py": "",
    "backend/app/models/case.py": "\"\"\"Case model definition.\"\"\"\n",
    "backend/app/models/review.py": "\"\"\"Review model definition.\"\"\"\n",
    "backend/app/schemas/__init__.py": "",
    "backend/app/schemas/diagnosis.py": "\"\"\"Diagnosis schema.\"\"\"\n",
    "backend/app/schemas/case.py": "\"\"\"Case schema.\"\"\"\n",
    "backend/app/schemas/review.py": "\"\"\"Review schema.\"\"\"\n",
    "backend/app/api/routes/__init__.py": "",
    "backend/app/api/routes/cases.py": "\"\"\"Cases routes.\"\"\"\n",
    "backend/app/api/routes/diagnose.py": "\"\"\"Diagnose routes.\"\"\"\n",
    "backend/app/api/routes/reviews.py": "\"\"\"Reviews routes.\"\"\"\n",
    "backend/app/api/routes/dashboard.py": "\"\"\"Dashboard routes.\"\"\"\n",
    "backend/app/services/__init__.py": "",
    "backend/app/services/ai_diagnosis.py": "\"\"\"AI Diagnosis service.\"\"\"\n",
    "backend/app/services/rule_checker/__init__.py": "",
    "backend/app/services/rule_checker/checks.py": "\"\"\"Deterministic checks for common configuration mistakes.\"\"\"\n",
    "backend/app/services/rule_checker/parsers.py": "\"\"\"Parsers for show command outputs.\"\"\"\n",
    "backend/app/services/case_loader.py": "\"\"\"Service to load cases from CSV.\"\"\"\n",
    "backend/app/prompts/diagnose_prompt.md": "You are a senior network engineer troubleshooting Cisco lab environments...\n",
    "backend/tests/test_rule_checker.py": "def test_dummy():\n    pass\n",
    "backend/tests/test_ai_diagnosis.py": "def test_dummy():\n    pass\n",
    "backend/tests/test_api_cases.py": "def test_dummy():\n    pass\n",
    "backend/tests/test_api_reviews.py": "def test_dummy():\n    pass\n",
    "backend/data/cases.csv": "id,symptom,topology_note,show_outputs,expected_fault,osi_layer,concept_tag,severity\n",
    "backend/scripts/run_rule_checker.py": "\"\"\"Script to run the rule checker.\"\"\"\n",
    "backend/scripts/seed_database.py": "\"\"\"Script to seed the database.\"\"\"\n",
    "backend/scripts/generate_responsible_ai_log.py": "\"\"\"Script to generate Responsible AI log from DB.\"\"\"\n",
    "frontend/package.json": "{\n  \"name\": \"frontend\",\n  \"version\": \"1.0.0\"\n}\n",
    "frontend/vite.config.ts": "import { defineConfig } from 'vite';\nexport default defineConfig({});\n",
    "frontend/src/main.tsx": "console.log('Main');\n",
    "frontend/src/App.tsx": "export default function App() { return <div>App</div>; }\n",
    "frontend/src/api/client.ts": "// API Client\n",
    "frontend/src/pages/CaseQueue.tsx": "// CaseQueue Page\n",
    "frontend/src/pages/ReviewScreen.tsx": "// ReviewScreen Page\n",
    "frontend/src/pages/Dashboard.tsx": "// Dashboard Page\n",
    "frontend/src/components/CaseCard.tsx": "// CaseCard Component\n",
    "frontend/src/components/EvidencePanel.tsx": "// EvidencePanel Component\n",
    "frontend/src/components/DiagnosisPanel.tsx": "// DiagnosisPanel Component\n",
    "frontend/src/components/ReviewActions.tsx": "// ReviewActions Component\n",
    "frontend/src/types/case.ts": "// Types\n",
    "docs/architecture.md": "# Architecture\n",
    "docs/responsible_ai_log.md": "# Responsible AI Log\n",
    "docs/demo_script.md": "# Demo Script\n"
}

for filepath, content in files_content.items():
    full_path = base_dir / filepath
    with open(full_path, "w", encoding="utf-8") as f:
        f.write(content)

print("Scaffolding complete.")
