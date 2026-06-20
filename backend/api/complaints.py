import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, File, UploadFile
from sqlalchemy.orm import Session
from typing import List, Optional
import models
import schemas
from database import get_db

router = APIRouter()

# Directory to save uploads
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/complaints/upload")
async def upload_file(file: UploadFile = File(...)):
    # Validate extension
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in [".jpg", ".jpeg", ".png", ".webp", ".gif"]:
        raise HTTPException(status_code=400, detail="Only JPG, PNG, WEBP, and GIF images are allowed.")
    
    # Generate unique filename
    unique_name = f"{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_name)
    
    # Save file
    try:
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not save file: {str(e)}")
        
    return {"photo_url": f"/uploads/{unique_name}"}

@router.post("/complaints", response_model=schemas.CustomerComplaintResponse)
def create_complaint(complaint: schemas.CustomerComplaintCreate, db: Session = Depends(get_db)):
    db_complaint = models.CustomerComplaint(**complaint.dict())
    db.add(db_complaint)
    db.commit()
    db.refresh(db_complaint)
    return db_complaint

@router.get("/complaints", response_model=List[schemas.CustomerComplaintResponse])
def get_complaints(customer_phone: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(models.CustomerComplaint)
    if customer_phone:
        query = query.filter(models.CustomerComplaint.customer_phone == customer_phone)
    return query.order_by(models.CustomerComplaint.created_at.desc()).all()

@router.put("/complaints/{complaint_id}/status", response_model=schemas.CustomerComplaintResponse)
def update_complaint_status(complaint_id: int, status_update: schemas.CustomerComplaintUpdate, db: Session = Depends(get_db)):
    db_complaint = db.query(models.CustomerComplaint).filter(models.CustomerComplaint.id == complaint_id).first()
    if not db_complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
        
    if status_update.refund_status is not None:
        db_complaint.refund_status = status_update.refund_status
        
        # Link refund approval to PosOrder status if applicable
        if status_update.refund_status == "Approved" and db_complaint.order_id:
            # Try to look up order by name (e.g. ORD-12345)
            db_order = db.query(models.PosOrder).filter(models.PosOrder.name == db_complaint.order_id).first()
            if db_order:
                db_order.state = "Refunded"
                db.commit()
                
    if status_update.refund_amount is not None:
        db_complaint.refund_amount = status_update.refund_amount
        
    db.commit()
    db.refresh(db_complaint)
    return db_complaint
