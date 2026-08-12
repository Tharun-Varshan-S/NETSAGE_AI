# NetSage AI Architecture

## Overview
NetSage AI is a troubleshooting assistant designed for Cisco-style network lab environments. It provides AI-assisted diagnosis of network configuration issues while enforcing human review of every diagnosis to ensure accuracy and build a "Responsible AI" log.

## Tech Stack
- **Backend**: Python 3.12, FastAPI, SQLAlchemy 2.0 with SQLite.
- **Frontend**: React with TypeScript, Vite, Tailwind CSS, Recharts, TanStack Query.
- **AI Integration**: Google Gemini 1.5 Flash via `google-genai` SDK.

## Design Decisions

### 1. Single-Node SQLite Database
Since this is a capstone demo meant for 2-3 users with roughly 30-50 cases, we opted for SQLite instead of PostgreSQL. This drastically simplifies the setup and eliminates external dependencies like Dockerized DBs, while still utilizing SQLAlchemy so that migrating to Postgres in the future requires just a one-line connection string change.

### 2. Standalone Rule Checker
The deterministic rule checker (`app/services/rule_checker/checks.py`) is implemented as a set of pure Python functions with no framework dependencies. This makes it easily unit-testable and allows it to be run via a CLI script (`scripts/run_rule_checker.py`), ensuring it meets the rubric requirement of being "independently testable and runnable".

### 3. Graceful AI Failure
The AI integration incorporates retry logic with exponential backoff for transient API errors. Crucially, if the AI service completely fails (e.g., due to an outage or rate limit), it fails gracefully and returns `None`. The UI handles this by displaying an error and still allowing the human reviewer to manually "Edit" or "Reject" and supply their own reason, ensuring the workflow is never entirely blocked by the AI.

### 4. Direct State Management vs React Router
For the frontend, we used simple React state (`view = 'queue' | 'dashboard' | 'review'`) instead of adding a full routing library like `react-router-dom`. Given the application only has three screens and is designed for a simple, linear troubleshooting flow, this minimizes dependencies and cognitive overhead for new teammates reading the code.

### 5. Consolidated Data Model
Instead of deeply normalizing the AI diagnosis and Human Review into many separate tables, we placed the AI output fields directly on the `Case` model, and created a 1-to-1 `Review` table. This is because a case receives exactly one AI diagnosis in this workflow, keeping queries simple.
