from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List

from database import get_db
import models
import schemas
from socket_server import sio

router = APIRouter()

@router.post("/orders", response_model=schemas.PosOrderResponse)
async def create_order(order: schemas.PosOrderCreate, db: Session = Depends(get_db)):
    # 0. Handle customer (partner) creation if needed
    partner_id = order.partner_id
    if order.customer_phone and order.customer_name:
        partner = db.query(models.ResPartner).filter(models.ResPartner.phone == order.customer_phone).first()
        if not partner:
            partner = models.ResPartner(name=order.customer_name, phone=order.customer_phone)
            db.add(partner)
            db.commit()
            db.refresh(partner)
        partner_id = partner.id

    # 1. Create order
    db_order = models.PosOrder(
        name=order.name,
        table_id=order.table_id,
        partner_id=partner_id,
        state=order.state,
        amount_total=order.amount_total,
        amount_tax=order.amount_tax,
        discount_amount=order.discount_amount,
        payment_method=order.payment_method,
        generated_coupon=order.generated_coupon
    )
    db.add(db_order)
    db.commit()
    db.refresh(db_order)

    # 2. Create order lines
    for line in order.lines:
        db_line = models.PosOrderLine(
            order_id=db_order.id,
            product_id=line.product_id,
            qty=line.qty,
            price_unit=line.price_unit,
            price_subtotal=line.price_subtotal,
            discount=line.discount,
            state_kitchen=line.state_kitchen
        )
        db.add(db_line)
    
    db.commit()
    db.refresh(db_order)

    # 3. If there is a generated coupon, save it
    if order.generated_coupon:
        db_coupon = models.CafeCoupon(
            code=order.generated_coupon,
            discount_type="percentage",
            discount_value=10.0,
            active=True
        )
        db.add(db_coupon)
        db.commit()

    # 4. Notify kitchen via Socket.IO
    # We serialize it roughly to match what the frontend expects
    order_data = {
        "id": db_order.id,
        "name": db_order.name,
        "table_id": db_order.table_id,
        "amount_total": db_order.amount_total,
        "state": db_order.state
    }
    await sio.emit("new_kitchen_order", order_data)

    # Re-query with eager loading for proper serialization
    db_order = db.query(models.PosOrder).options(
        joinedload(models.PosOrder.lines).joinedload(models.PosOrderLine.product).joinedload(models.ProductProduct.category),
        joinedload(models.PosOrder.table),
        joinedload(models.PosOrder.partner)
    ).filter(models.PosOrder.id == db_order.id).first()

    return db_order

@router.get("/orders", response_model=List[schemas.PosOrderResponse])
def get_orders(db: Session = Depends(get_db)):
    return db.query(models.PosOrder).options(
        joinedload(models.PosOrder.lines).joinedload(models.PosOrderLine.product).joinedload(models.ProductProduct.category),
        joinedload(models.PosOrder.table),
        joinedload(models.PosOrder.partner)
    ).all()

@router.put("/orders/{order_id}/status", response_model=schemas.PosOrderResponse)
async def update_order_status(order_id: int, status: str, db: Session = Depends(get_db)):
    db_order = db.query(models.PosOrder).filter(models.PosOrder.id == order_id).first()
    if not db_order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    db_order.state = status
    db.commit()
    db.refresh(db_order)

    # Notify via Socket.IO
    await sio.emit("order_updated", {"id": db_order.id, "state": status})

    # Re-query with eager loading for proper serialization
    db_order = db.query(models.PosOrder).options(
        joinedload(models.PosOrder.lines).joinedload(models.PosOrderLine.product).joinedload(models.ProductProduct.category),
        joinedload(models.PosOrder.table),
        joinedload(models.PosOrder.partner)
    ).filter(models.PosOrder.id == db_order.id).first()

    return db_order
