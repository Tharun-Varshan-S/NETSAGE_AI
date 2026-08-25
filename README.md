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
# On Windows use: .\venv\Scripts\activate
source venv/bin/activate
pip install .

# Create a .env file and add your GEMINI_API_KEY and SECRET_KEY
echo 'GEMINI_API_KEY="your-api-key"' > .env
echo 'SECRET_KEY="super-secret-key-change-me"' >> .env

# Seed the database (creates users and assigns cases)
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

## Demo Accounts (RBAC)
When logging into the frontend, you can use the automatically seeded demo accounts:
- **Junior Developer:** `junior` / `password` (Only sees their own cases)
- **Senior Developer:** `senior` / `password` (Sees all cases, handles reviews)

## Manual Testing Workflow

1. Open `http://localhost:5173` in your browser.
2. Navigate to **New Diagnosis** on the left sidebar.
3. Paste symptoms, topology notes, and raw CLI outputs (e.g., from Packet Tracer) into the Data Ingestion form.
4. Click **Begin AI Diagnosis**. This automatically creates a dynamic case and routes you to the Review Screen.
5. Click **"Run Initial Analysis"**. The AI and Deterministic Rule Checker will process the evidence.
6. The AI may diagnose the root cause immediately or pause with a **NEEDS_INFO** status requesting a specific command (e.g., `show ip route`).
7. If more info is needed, paste the new command output into the text box and click **"Submit Output to AI"**.
8. The AI will process the new evidence and attempt to diagnose the root cause!