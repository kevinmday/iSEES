from fastapi import FastAPI
from typing import Dict
from isees_uap.analysis.cluster_engine import run_cluster_engine

app = FastAPI()

@app.get("/")
def root():
    return {"status": "iSEES UAP API LIVE"}

@app.get("/run")
def run() -> Dict:
    return run_cluster_engine()
