from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base
from app.api.routes import cases, diagnose, reviews, dashboard

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="NetSage AI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(cases.router, prefix="/api/cases", tags=["cases"])
app.include_router(diagnose.router, prefix="/api/diagnose", tags=["diagnose"])
app.include_router(reviews.router, prefix="/api/reviews", tags=["reviews"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["dashboard"])

@app.get("/")
def read_root():
    return {"status": "ok", "message": "NetSage AI API is running"}
