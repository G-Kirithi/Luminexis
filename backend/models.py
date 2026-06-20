from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class PosConfig(Base):
    __tablename__ = "pos_config"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    module_pos_restaurant = Column(Boolean, default=True)
    is_pos_box = Column(Boolean, default=False)  # Customer Display

    floors = relationship("RestaurantFloor", back_populates="pos_config")
    sessions = relationship("PosSession", back_populates="config")

class RestaurantFloor(Base):
    __tablename__ = "restaurant_floor"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    pos_config_id = Column(Integer, ForeignKey("pos_config.id"))

    pos_config = relationship("PosConfig", back_populates="floors")
    tables = relationship("RestaurantTable", back_populates="floor")

class RestaurantTable(Base):
    __tablename__ = "restaurant_table"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)  # Table Number
    floor_id = Column(Integer, ForeignKey("restaurant_floor.id"))
    seats = Column(Integer)
    active = Column(Boolean, default=True)
    current_order_id = Column(Integer, ForeignKey("pos_order.id"), nullable=True)

    floor = relationship("RestaurantFloor", back_populates="tables")
    orders = relationship("PosOrder", back_populates="table", foreign_keys="[PosOrder.table_id]")

class ProductCategory(Base):
    __tablename__ = "product_category"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    color = Column(String, nullable=True)

    products = relationship("ProductProduct", back_populates="category")

class ProductProduct(Base):
    __tablename__ = "product_product"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    categ_id = Column(Integer, ForeignKey("product_category.id"))
    list_price = Column(Float)
    uom_id = Column(String)  # Unit of measure
    taxes_id = Column(Float, default=0.0)
    description = Column(Text, nullable=True)
    available_in_pos = Column(Boolean, default=True)
    show_in_kds = Column(Boolean, default=True)

    category = relationship("ProductCategory", back_populates="products")

class ResUsers(Base):
    __tablename__ = "res_users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    login = Column(String, unique=True, index=True) # Email typically
    password = Column(String)
    groups_id = Column(String) # roles: Admin/Employee

    sessions = relationship("PosSession", back_populates="user")
    orders = relationship("PosOrder", back_populates="user")

class ResPartner(Base): # CUSTOMER
    __tablename__ = "res_partner"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    email = Column(String, unique=True, index=True, nullable=True)
    phone = Column(String, nullable=True)
    password = Column(String, nullable=True)

    orders = relationship("PosOrder", back_populates="partner")

class PosSession(Base):
    __tablename__ = "pos_session"
    id = Column(Integer, primary_key=True, index=True)
    config_id = Column(Integer, ForeignKey("pos_config.id"))
    user_id = Column(Integer, ForeignKey("res_users.id"))
    start_at = Column(DateTime, default=datetime.utcnow)
    stop_at = Column(DateTime, nullable=True)
    state = Column(String) # opened/closed
    cash_register_total_entry_encoding = Column(Float, default=0.0)

    config = relationship("PosConfig", back_populates="sessions")
    user = relationship("ResUsers", back_populates="sessions")
    orders = relationship("PosOrder", back_populates="session")

class PosOrder(Base):
    __tablename__ = "pos_order"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True) # Order Number
    session_id = Column(Integer, ForeignKey("pos_session.id"), nullable=True)
    table_id = Column(Integer, ForeignKey("restaurant_table.id"), nullable=True)
    partner_id = Column(Integer, ForeignKey("res_partner.id"), nullable=True)
    user_id = Column(Integer, ForeignKey("res_users.id"), nullable=True)
    date_order = Column(DateTime, default=datetime.utcnow)
    state = Column(String) # Draft/Paid/Cancelled
    amount_total = Column(Float, default=0.0)
    amount_tax = Column(Float, default=0.0)
    discount_amount = Column(Float, default=0.0)
    payment_method = Column(String, nullable=True)
    generated_coupon = Column(String, nullable=True)

    session = relationship("PosSession", back_populates="orders")
    table = relationship("RestaurantTable", back_populates="orders", foreign_keys=[table_id])
    partner = relationship("ResPartner", back_populates="orders")
    user = relationship("ResUsers", back_populates="orders")
    lines = relationship("PosOrderLine", back_populates="order")

class PosOrderLine(Base):
    __tablename__ = "pos_order_line"
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("pos_order.id"))
    product_id = Column(Integer, ForeignKey("product_product.id"))
    qty = Column(Float, default=1.0)
    price_unit = Column(Float)
    price_subtotal = Column(Float)
    discount = Column(Float, default=0.0)
    state_kitchen = Column(String, default="To Cook") # To Cook/Preparing/Completed

    order = relationship("PosOrder", back_populates="lines")
    product = relationship("ProductProduct")

class CafeCoupon(Base):
    __tablename__ = "cafe_coupon"
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, index=True)
    discount_type = Column(String) # percentage/fixed
    discount_value = Column(Float)
    active = Column(Boolean, default=True)

class CafePromotion(Base):
    __tablename__ = "cafe_promotion"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    apply_to = Column(String) # product/order
    min_qty = Column(Integer, nullable=True)
    min_amount = Column(Float, nullable=True)
    discount_type = Column(String) # percentage/fixed
    discount_value = Column(Float)

class PosPaymentMethod(Base):
    __tablename__ = "pos_payment_method"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String) # Cash/Digital/UPI QR
    active = Column(Boolean, default=True)
    upi_id = Column(String, nullable=True)

class KitchenInventory(Base):
    __tablename__ = "kitchen_inventory"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    quantity = Column(Float, default=0.0)
    unit = Column(String, nullable=True)
    is_scarce = Column(Boolean, default=False)
    expiry_date = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class CustomerComplaint(Base):
    __tablename__ = "customer_complaint"
    id = Column(Integer, primary_key=True, index=True)
    customer_phone = Column(String, index=True)
    customer_name = Column(String)
    message = Column(Text)
    photo_url = Column(String, nullable=True)
    is_refund_request = Column(Boolean, default=False)
    order_id = Column(String, nullable=True)
    refund_status = Column(String, default="Pending") # Pending / Approved / Rejected
    refund_amount = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)

