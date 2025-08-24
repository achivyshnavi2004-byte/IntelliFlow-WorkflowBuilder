from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def get_users():
    return ["User 1", "User 2", "User 3"]


