from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.responses import JSONResponse
from typing import Dict
import tempfile
import os
try:
    from docling.document_converter import DocumentConverter
    DOCLING_AVAILABLE = True
except ImportError:
    DOCLING_AVAILABLE = False

from app.api.v1.endpoints.auth import get_current_active_user
from app.models.user import User

router = APIRouter()

@router.post("/extract_pdf/")
async def extract_pdf_content(
    pdf_path: str,
    current_user: User = Depends(get_current_active_user)
):
    """
    Extract content from a PDF file using Docling
    """
    try:
        if not DOCLING_AVAILABLE:
            raise HTTPException(status_code=503, detail="PDF processing service not available (Docling not installed)")

        if not os.path.exists(pdf_path):
            raise HTTPException(status_code=404, detail="PDF file not found")
        
        converter = DocumentConverter()
        result = converter.convert(pdf_path)
        markdown_content = result.document.export_to_markdown()
        
        return {"content": markdown_content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")


@router.post("/upload_pdf_extract/")
async def upload_and_extract_pdf(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user)
):
    """
    Upload a PDF file and extract its content using Docling
    """
    try:
        # Check if the uploaded file is a PDF
        if not file.content_type == "application/pdf":
            raise HTTPException(status_code=400, detail="Only PDF files are allowed")
        
        # Create a temporary file to save the uploaded PDF
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_file:
            content = await file.read()
            temp_file.write(content)
            temp_file_path = temp_file.name
        
        try:
            if not DOCLING_AVAILABLE:
                raise HTTPException(status_code=503, detail="PDF processing service not available (Docling not installed)")

            # Process the PDF with Docling
            converter = DocumentConverter()
            result = converter.convert(temp_file_path)
            markdown_content = result.document.export_to_markdown()
            
            return {"content": markdown_content}
        finally:
            # Clean up the temporary file
            os.unlink(temp_file_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")