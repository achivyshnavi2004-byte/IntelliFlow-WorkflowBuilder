# app/routes/output.py
from fastapi import APIRouter

router = APIRouter(
    prefix="/output",
    tags=["Output"]
)

@router.get("/")
def show_output():
    return {"output": "This is where the final response will appear"}
