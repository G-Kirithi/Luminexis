from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database import get_db
import models
import schemas

router = APIRouter()

class CustomerSignup(BaseModel):
    name: str
    phone: str
    password: str

class CustomerLogin(BaseModel):
    phone: str
    password: str

@router.post("/customers/signup", response_model=schemas.CustomerResponse)
def signup_customer(customer: CustomerSignup, db: Session = Depends(get_db)):
    existing = db.query(models.ResPartner).filter(models.ResPartner.phone == customer.phone).first()
    if existing:
        raise HTTPException(status_code=400, detail="Phone number already registered")
    
    new_customer = models.ResPartner(
        name=customer.name,
        phone=customer.phone,
        password=customer.password
    )
    db.add(new_customer)
    db.commit()
    db.refresh(new_customer)
    return new_customer

@router.post("/customers/login", response_model=schemas.CustomerResponse)
def login_customer(customer: CustomerLogin, db: Session = Depends(get_db)):
    db_customer = db.query(models.ResPartner).filter(models.ResPartner.phone == customer.phone).first()
    if not db_customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    if db_customer.password != customer.password:
        raise HTTPException(status_code=401, detail="Incorrect password")
        
    return db_customer
