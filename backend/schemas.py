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
    uom_id: Optional[str] = None
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

# --- Order Lines ---
class PosOrderLineBase(BaseModel):
    product_id: int
    qty: float = 1.0
    price_unit: float
    price_subtotal: float
    discount: float = 0.0
    state_kitchen: str = "To Cook"

class PosOrderLineCreate(PosOrderLineBase):
    pass

class PosOrderLineResponse(PosOrderLineBase):
    id: int
    order_id: int
    product: ProductResponse

    class Config:
        orm_mode = True

# --- Orders ---
class PosOrderBase(BaseModel):
    name: str
    table_id: Optional[int] = None
    partner_id: Optional[int] = None
    state: str = "Draft"
    amount_total: float = 0.0
    amount_tax: float = 0.0
    discount_amount: float = 0.0
    payment_method: Optional[str] = None
    generated_coupon: Optional[str] = None

class PosOrderCreate(PosOrderBase):
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    lines: List[PosOrderLineCreate]

class SimpleTableResponse(BaseModel):
    id: int
    name: str

    class Config:
        orm_mode = True

class SimplePartnerResponse(BaseModel):
    id: int
    name: str
    phone: Optional[str] = None

    class Config:
        orm_mode = True

class PosOrderResponse(PosOrderBase):
    id: int
    session_id: Optional[int] = None
    user_id: Optional[int] = None
    date_order: datetime
    lines: List[PosOrderLineResponse]
    table: Optional[SimpleTableResponse] = None
    partner: Optional[SimplePartnerResponse] = None

    class Config:
        orm_mode = True

# --- Coupons ---
class CafeCouponBase(BaseModel):
    code: str
    discount_type: str = "percentage"
    discount_value: float
    active: bool = True

class CafeCouponCreate(CafeCouponBase):
    pass

class CafeCouponResponse(CafeCouponBase):
    id: int

    class Config:
        orm_mode = True

# --- Kitchen Inventory ---
class KitchenInventoryBase(BaseModel):
    name: str
    quantity: float = 0.0
    unit: Optional[str] = None
    is_scarce: bool = False
    expiry_date: Optional[datetime] = None
    notes: Optional[str] = None

class KitchenInventoryCreate(KitchenInventoryBase):
    pass

class KitchenInventoryUpdate(BaseModel):
    name: Optional[str] = None
    quantity: Optional[float] = None
    unit: Optional[str] = None
    is_scarce: Optional[bool] = None
    expiry_date: Optional[datetime] = None
    notes: Optional[str] = None

class KitchenInventoryResponse(KitchenInventoryBase):
    id: int
    last_updated: datetime

    class Config:
        orm_mode = True

# --- Customer Complaints ---
class CustomerComplaintBase(BaseModel):
    customer_phone: str
    customer_name: str
    message: str
    photo_url: Optional[str] = None
    is_refund_request: bool = False
    order_id: Optional[str] = None
    refund_status: str = "Pending"
    refund_amount: float = 0.0

class CustomerComplaintCreate(CustomerComplaintBase):
    pass

class CustomerComplaintUpdate(BaseModel):
    refund_status: Optional[str] = None
    refund_amount: Optional[float] = None

class CustomerComplaintResponse(CustomerComplaintBase):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True

# --- Franchise ---
class FranchiseBase(BaseModel):
    name: str
    pin: str

class FranchiseCreate(FranchiseBase):
    pass

class FranchiseResponse(BaseModel):
    id: int
    name: str
    created_at: datetime

    class Config:
        orm_mode = True


