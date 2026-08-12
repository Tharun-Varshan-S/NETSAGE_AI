# NetSage AI

AI-assisted stateful troubleshooter for Packet Tracer lab problems.

## How to Run

### Method 1: Using Docker Compose (Recommended)
You can spin up the entire stack using Docker:
```bash
docker compose up --build
```
- Backend API will be available at `http://localhost:8000`
- Frontend UI will be available at `http://localhost:5173`

### Method 2: Running Locally (For Development)

If you prefer to run the components separately:

**1. Start the Backend:**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install .

# Seed the database (only needed once)
python3 scripts/seed_database.py

# Start the API server
uvicorn app.main:app --reload
```

**2. Start the Frontend:**
Open a new terminal and run:
```bash
cd frontend
npm install
npm run dev
```

## Manual Testing Workflow

1. Open `http://localhost:5173` in your browser.
2. Navigate to a case (e.g., NC005).
3. Click **"Run Initial Analysis"**.
4. The AI will likely pause with a **NEEDS_INFO** status and request a specific command (e.g., `show ip route`).
5. Paste a dummy output (or actual Packet Tracer output if you have it) into the text box and click **"Submit Output to AI"**.
6. The AI will process the new evidence and attempt to diagnose the root cause!