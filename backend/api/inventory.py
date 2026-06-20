from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import models
import schemas
from database import get_db

router = APIRouter()

@router.get("/inventory", response_model=List[schemas.KitchenInventoryResponse])
def get_inventory(db: Session = Depends(get_db)):
    return db.query(models.KitchenInventory).all()

@router.post("/inventory", response_model=schemas.KitchenInventoryResponse)
def create_inventory_item(item: schemas.KitchenInventoryCreate, db: Session = Depends(get_db)):
    # Check if item name already exists (case-insensitive or exact, let's do exact like SQL unique index)
    existing = db.query(models.KitchenInventory).filter(models.KitchenInventory.name == item.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Inventory item with this name already exists")
    
    db_item = models.KitchenInventory(**item.dict())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@router.put("/inventory/{item_id}", response_model=schemas.KitchenInventoryResponse)
def update_inventory_item(item_id: int, item: schemas.KitchenInventoryUpdate, db: Session = Depends(get_db)):
    db_item = db.query(models.KitchenInventory).filter(models.KitchenInventory.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    
    update_data = item.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_item, key, value)
        
    db.commit()
    db.refresh(db_item)
    return db_item

@router.delete("/inventory/{item_id}")
def delete_inventory_item(item_id: int, db: Session = Depends(get_db)):
    db_item = db.query(models.KitchenInventory).filter(models.KitchenInventory.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    
    db.delete(db_item)
    db.commit()
    return {"message": "Inventory item deleted successfully"}
