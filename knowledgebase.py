from fastapi import APIRouter, UploadFile, File
from app.services.pdf_service import extract_text_from_pdf

router = APIRouter(prefix="/knowledgebase")

@router.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    file_location = f"temp_{file.filename}"
    with open(file_location, "wb") as f:
        f.write(file.file.read())
    
    text = extract_text_from_pdf(file_location)
    
    return {"filename": file.filename, "text_preview": text[:500]}
