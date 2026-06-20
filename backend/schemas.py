from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

# --- Auth Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    login: Optional[str] = None

# --- User Schemas ---
class UserBase(BaseModel):
    name: str
    login: str
    groups_id: str

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int

    class Config:
        orm_mode = True

# --- Product Category ---
class ProductCategoryBase(BaseModel):
    name: str
    color: Optional[str] = None

class ProductCategoryCreate(ProductCategoryBase):
    pass

class ProductCategoryResponse(ProductCategoryBase):
    id: int

    class Config:
        orm_mode = True

# --- Product ---
class ProductBase(BaseModel):
    name: str
    list_price: float
    uom_id: str
    taxes_id: float = 0.0
    description: Optional[str] = None
    available_in_pos: bool = True
    show_in_kds: bool = True

class ProductCreate(ProductBase):
    categ_id: int

class ProductResponse(ProductBase):
    id: int
    categ_id: int
    category: ProductCategoryResponse

    class Config:
        orm_mode = True

# --- Customer (ResPartner) ---
class CustomerBase(BaseModel):
    name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None

class CustomerCreate(CustomerBase):
    pass

class CustomerResponse(CustomerBase):
    id: int

    class Config:
        orm_mode = True

# --- Payment Method ---
class PaymentMethodBase(BaseModel):
    name: str
    active: bool = True
    upi_id: Optional[str] = None

class PaymentMethodCreate(PaymentMethodBase):
    pass

class PaymentMethodResponse(PaymentMethodBase):
    id: int

    class Config:
        orm_mode = True
