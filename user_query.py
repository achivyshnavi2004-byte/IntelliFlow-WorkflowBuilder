# app/routes/user_query.py
from fastapi import APIRouter

router = APIRouter(
    prefix="/user_query",
    tags=["User Query"]
)

@router.post("/")
def receive_query(query: str):
    # Dummy response
    return {"received_query": query, "next_step": "send to KnowledgeBase or LLM"}
