import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from routers import analytics

load_dotenv()

app = FastAPI(
    title="FleetFlow Analytics API",
    description="ROI calculations, fuel efficiency, and fleet reporting",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL", "http://localhost:5173")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
 
app.include_router(analytics.router)


@app.get("/health")
def health():
    return {"status": "ok", "service": "FleetFlow Analytics API", "port": 8000}
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
