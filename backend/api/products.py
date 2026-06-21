from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List
import models, schemas, auth
from database import get_db

router = APIRouter()

# --- Categories ---
@router.get("/categories", response_model=List[schemas.ProductCategoryResponse])
def read_categories(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.ProductCategory).offset(skip).limit(limit).all()

@router.post("/categories", response_model=schemas.ProductCategoryResponse)
def create_category(category: schemas.ProductCategoryCreate, db: Session = Depends(get_db)):
    db_category = models.ProductCategory(**category.dict())
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category

# --- Products ---
@router.get("/products", response_model=List[schemas.ProductResponse])
def read_products(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.ProductProduct).offset(skip).limit(limit).all()

@router.post("/products", response_model=schemas.ProductResponse)
def create_product(product: schemas.ProductCreate, db: Session = Depends(get_db)):
    db_product = models.ProductProduct(**product.dict())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

@router.delete("/products/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db)):
    db_product = db.query(models.ProductProduct).filter(models.ProductProduct.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    try:
        db.delete(db_product)
        db.commit()
        return {"message": "Product physically deleted successfully"}
    except IntegrityError:
        db.rollback()
        # Fallback to soft-deleting (making unavailable in POS) to preserve order history
        db_product.available_in_pos = False
        db.commit()
        return {"message": "Product has order history. It was successfully deactivated and removed from POS menu."}
