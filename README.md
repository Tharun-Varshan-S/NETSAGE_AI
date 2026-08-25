<div align="center">
  <img src="https://img.shields.io/badge/NetSage-AI-blue?style=for-the-badge&logo=cisco" alt="NetSage AI Logo">
  <h1>NetSage AI</h1>
  <p><em>AI-assisted stateful troubleshooter for network lab problems.</em></p>
</div>

---

## 📖 Overview

**NetSage AI** is an intelligent assistant designed to help diagnose and troubleshoot network issues (e.g., Packet Tracer labs). It acts as a deterministic rule checker and an AI-driven diagnosis engine that continuously analyzes symptoms, topology notes, and CLI outputs to identify root causes.

## ✨ Features

- **Dynamic Case Management**: Create cases with symptoms, topology, and initial evidence.
- **AI-Powered Diagnostics**: Leverage advanced AI models to interpret network outputs.
- **Deterministic Rule Checking**: Quickly identify standard configuration issues.
- **Interactive Troubleshooting**: The AI can request specific commands (e.g., `show ip route`) to gather more evidence until the root cause is found.

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed:
- [Docker](https://docs.docker.com/get-docker/) & Docker Compose (Recommended)
- [Node.js](https://nodejs.org/) 18+ (For local frontend development)
- [Python](https://www.python.org/) 3.12+ (For local backend development)

---

### Method 1: Using Docker Compose (Recommended)

You can spin up the entire stack seamlessly using Docker:

```bash
docker compose up --build
```

- **Backend API**: `http://localhost:8000`
- **Frontend UI**: `http://localhost:5173`

---

### Method 2: Running Locally (For Development)

If you prefer to run the components separately for development:

#### 1. Start the Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -e .

# Start the API server
uvicorn app.main:app --reload
```

#### 2. Start the Frontend

Open a new terminal and run:

```bash
cd frontend
npm install
npm run dev
```

---

## 🛠️ Manual Testing Workflow

1. **Access the UI**: Open `http://localhost:5173` in your browser.
2. **Start a Diagnosis**: Navigate to **New Diagnosis** on the left sidebar.
3. **Provide Context**: Paste symptoms, topology notes, and raw CLI outputs (e.g., from Packet Tracer) into the Data Ingestion form.
4. **Initialize Case**: Click **Begin AI Diagnosis**. This automatically creates a dynamic case and routes you to the Review Screen.
5. **Run Analysis**: Click **"Run Initial Analysis"**. The AI and Deterministic Rule Checker will process the evidence.
6. **Iterate**: 
   - The AI may diagnose the root cause immediately or pause with a **NEEDS_INFO** status, requesting a specific command (e.g., `show ip route`).
   - If more info is needed, run the command in your network environment, paste the new output into the text box, and click **"Submit Output to AI"**.
7. **Resolution**: The AI will process the new evidence and attempt to successfully diagnose the root cause!

---

<div align="center">
  <i>Built for efficient and intelligent network troubleshooting.</i>
</div>