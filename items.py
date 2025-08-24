from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def get_items():
    return ["Item 1", "Item 2", "Item 3"]


