# app/routes/workflow.py
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class WorkflowRequest(BaseModel):
    nodes: list
    edges: list
    query: str

@router.post("/run_workflow")  # MUST be POST
async def run_workflow(request: WorkflowRequest):
    # For testing, just echo back
    return {"result": f"Processed query: {request.query}"}


