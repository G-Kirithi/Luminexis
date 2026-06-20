from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
import models, schemas, auth
from database import get_db

router = APIRouter()

# --- Schemas specifically for this route since we didn't add all in schemas.py ---
class RestaurantFloorBase(BaseModel):
    name: str
    pos_config_id: int

class RestaurantFloorResponse(RestaurantFloorBase):
    id: int
    class Config:
        orm_mode = True

class RestaurantTableBase(BaseModel):
    name: str
    floor_id: int
    seats: int
    active: bool = True

class RestaurantTableResponse(RestaurantTableBase):
    id: int
    current_order_id: int | None
    class Config:
        orm_mode = True

# --- Endpoints ---
@router.get("/floors", response_model=List[RestaurantFloorResponse])
def read_floors(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.RestaurantFloor).offset(skip).limit(limit).all()

@router.post("/floors", response_model=RestaurantFloorResponse)
def create_floor(floor: RestaurantFloorBase, db: Session = Depends(get_db), current_user: models.ResUsers = Depends(auth.get_current_active_user)):
    db_floor = models.RestaurantFloor(**floor.dict())
    db.add(db_floor)
    db.commit()
    db.refresh(db_floor)
    return db_floor

@router.get("/tables", response_model=List[RestaurantTableResponse])
def read_tables(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.RestaurantTable).offset(skip).limit(limit).all()

@router.post("/tables", response_model=RestaurantTableResponse)
def create_table(table: RestaurantTableBase, db: Session = Depends(get_db), current_user: models.ResUsers = Depends(auth.get_current_active_user)):
    db_table = models.RestaurantTable(**table.dict())
    db.add(db_table)
    db.commit()
    db.refresh(db_table)
    return db_table
