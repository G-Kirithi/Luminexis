from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
import models
import schemas
from database import get_global_db, get_db_for_franchise, engines, Base
import sqlalchemy as sa

router = APIRouter()

@router.post("/franchises", response_model=schemas.FranchiseResponse)
def create_franchise(franchise: schemas.FranchiseCreate, db: Session = Depends(get_global_db)):
    # 1. Enforce a maximum of 3 franchises
    count = db.query(models.Franchise).count()
    if count >= 3:
        raise HTTPException(status_code=400, detail="Maximum limit of 3 franchises has been reached.")
        
    # Clean/validate name format (alphanumeric and underscores only)
    clean_name = "".join(c for c in franchise.name if c.isalnum() or c == "_").lower()
    if not clean_name:
        raise HTTPException(status_code=400, detail="Franchise name must contain alphanumeric characters.")
        
    # Check if exists
    db_franchise = db.query(models.Franchise).filter(models.Franchise.name == clean_name).first()
    if db_franchise:
        raise HTTPException(status_code=400, detail="Franchise name is already taken.")
        
    # Create franchise
    new_franchise = models.Franchise(name=clean_name, pin=franchise.pin)
    db.add(new_franchise)
    db.commit()
    db.refresh(new_franchise)
    
    # Trigger database creation and initialization immediately
    try:
        session = get_db_for_franchise(clean_name)
        session.close()
    except Exception as e:
        # Rollback franchise registry record if DB creation fails
        db.delete(new_franchise)
        db.commit()
        raise HTTPException(status_code=500, detail=f"Failed to provision database for franchise: {str(e)}")
        
    return new_franchise

@router.post("/franchises/login")
def login_franchise(payload: schemas.FranchiseCreate, db: Session = Depends(get_global_db)):
    clean_name = "".join(c for c in payload.name if c.isalnum() or c == "_").lower()
    db_franchise = db.query(models.Franchise).filter(models.Franchise.name == clean_name).first()
    if not db_franchise or db_franchise.pin != payload.pin:
        raise HTTPException(status_code=400, detail="Invalid franchise name or PIN.")
    return {"message": "Success", "franchise_name": clean_name}

@router.get("/franchises", response_model=List[schemas.FranchiseResponse])
def get_franchises(db: Session = Depends(get_global_db)):
    return db.query(models.Franchise).all()

@router.get("/franchises/stats")
def get_franchise_stats(db: Session = Depends(get_global_db)):
    franchises = db.query(models.Franchise).all()
    stats = []
    
    for f in franchises:
        orders_count = 0
        total_revenue = 0.0
        average_order = 0.0
        top_product_name = "N/A"
        top_category_name = "N/A"
        
        try:
            # Query the isolated database for this franchise
            f_db = get_db_for_franchise(f.name)
            # Count total orders (non-cancelled)
            orders_count = f_db.query(models.PosOrder).filter(models.PosOrder.state != "Cancelled").count()
            
            # Sum up total revenue for non-cancelled orders
            revenue_sum = f_db.query(sa.func.sum(models.PosOrder.amount_total)).filter(models.PosOrder.state != "Cancelled").scalar()
            total_revenue = float(revenue_sum or 0.0)
            
            # Average order value
            average_order = total_revenue / orders_count if orders_count > 0 else 0.0
            
            # Top product
            top_prod = f_db.query(models.ProductProduct.name)\
                .join(models.PosOrderLine, models.PosOrderLine.product_id == models.ProductProduct.id)\
                .join(models.PosOrder, models.PosOrder.id == models.PosOrderLine.order_id)\
                .filter(models.PosOrder.state != "Cancelled")\
                .group_by(models.ProductProduct.id, models.ProductProduct.name)\
                .order_by(sa.func.sum(models.PosOrderLine.price_subtotal).desc())\
                .first()
            if top_prod:
                top_product_name = top_prod[0]
                
            # Top category
            top_cat = f_db.query(models.ProductCategory.name)\
                .join(models.ProductProduct, models.ProductProduct.categ_id == models.ProductCategory.id)\
                .join(models.PosOrderLine, models.PosOrderLine.product_id == models.ProductProduct.id)\
                .join(models.PosOrder, models.PosOrder.id == models.PosOrderLine.order_id)\
                .filter(models.PosOrder.state != "Cancelled")\
                .group_by(models.ProductCategory.id, models.ProductCategory.name)\
                .order_by(sa.func.sum(models.PosOrderLine.price_subtotal).desc())\
                .first()
            if top_cat:
                top_category_name = top_cat[0]
                
            f_db.close()
        except Exception as e:
            print(f"Error querying database stats for {f.name}: {e}")
            
        stats.append({
            "name": f.name,
            "created_at": f.created_at,
            "orders_count": orders_count,
            "total_revenue": total_revenue,
            "average_order": average_order,
            "top_product": top_product_name,
            "top_category": top_category_name
        })
        
    return stats

@router.get("/franchises/{name}/analytics")
def get_franchise_analytics(
    name: str,
    period: Optional[str] = "all",
    user_id: Optional[int] = None,
    session_id: Optional[int] = None,
    product_id: Optional[int] = None,
    db: Session = Depends(get_global_db)
):
    clean_name = "".join(c for c in name if c.isalnum() or c == "_").lower()
    db_franchise = db.query(models.Franchise).filter(models.Franchise.name == clean_name).first()
    if not db_franchise:
        raise HTTPException(status_code=404, detail="Franchise not found")
        
    try:
        f_db = get_db_for_franchise(clean_name)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to connect to franchise database: {str(e)}")
        
    try:
        from datetime import datetime, timedelta
        now = datetime.utcnow()
        start_date = None
        end_date = None
        prev_start_date = None
        prev_end_date = None
        
        # Calculate periods
        if period == "today":
            start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
            prev_start_date = start_date - timedelta(days=1)
            prev_end_date = start_date
        elif period == "7d":
            start_date = now - timedelta(days=7)
            prev_start_date = start_date - timedelta(days=7)
            prev_end_date = start_date
        elif period == "30d":
            start_date = now - timedelta(days=30)
            prev_start_date = start_date - timedelta(days=30)
            prev_end_date = start_date
        
        # Helper to apply query filters
        def apply_filters(query, s_date=None, e_date=None):
            if s_date:
                query = query.filter(models.PosOrder.date_order >= s_date)
            if e_date:
                query = query.filter(models.PosOrder.date_order < e_date)
            if user_id:
                query = query.filter(models.PosOrder.user_id == user_id)
            if session_id:
                query = query.filter(models.PosOrder.session_id == session_id)
            if product_id:
                order_ids_subquery = (
                    f_db.query(models.PosOrderLine.order_id)
                    .filter(models.PosOrderLine.product_id == product_id)
                    .subquery()
                )
                query = query.filter(models.PosOrder.id.in_(order_ids_subquery))
            return query
            
        # 1. Current Period Metrics
        revenue_query = f_db.query(models.PosOrder).filter(models.PosOrder.state != "Cancelled")
        revenue_query = apply_filters(revenue_query, start_date, end_date)
        orders_data = revenue_query.with_entities(
            sa.func.count(models.PosOrder.id),
            sa.func.sum(models.PosOrder.amount_total)
        ).first()
        
        total_orders = orders_data[0] or 0
        total_revenue = float(orders_data[1] or 0.0)
        average_order = total_revenue / total_orders if total_orders > 0 else 0.0
        
        # 2. Previous Period Metrics (to calculate % changes)
        prev_total_orders = 0
        prev_total_revenue = 0.0
        prev_average_order = 0.0
        
        if prev_start_date:
            prev_revenue_query = f_db.query(models.PosOrder).filter(models.PosOrder.state != "Cancelled")
            prev_revenue_query = apply_filters(prev_revenue_query, prev_start_date, prev_end_date)
            prev_orders_data = prev_revenue_query.with_entities(
                sa.func.count(models.PosOrder.id),
                sa.func.sum(models.PosOrder.amount_total)
            ).first()
            prev_total_orders = prev_orders_data[0] or 0
            prev_total_revenue = float(prev_orders_data[1] or 0.0)
            prev_average_order = prev_total_revenue / prev_total_orders if prev_total_orders > 0 else 0.0
            
        # Calculate percentage changes
        orders_pct = 0.0
        if prev_total_orders > 0:
            orders_pct = ((total_orders - prev_total_orders) / prev_total_orders) * 100
        elif total_orders > 0 and prev_start_date:
            orders_pct = 100.0
            
        revenue_pct = 0.0
        if prev_total_revenue > 0:
            revenue_pct = ((total_revenue - prev_total_revenue) / prev_total_revenue) * 100
        elif total_revenue > 0 and prev_start_date:
            revenue_pct = 100.0
            
        aov_pct = 0.0
        if prev_average_order > 0:
            aov_pct = ((average_order - prev_average_order) / prev_average_order) * 100
        elif average_order > 0 and prev_start_date:
            aov_pct = 100.0
            
        # 3. Sales over time (Line Chart)
        chart_data = []
        if period == "today":
            sales_by_time = f_db.query(
                sa.func.extract('hour', models.PosOrder.date_order).label('hour'),
                sa.func.sum(models.PosOrder.amount_total).label('revenue')
            ).filter(models.PosOrder.state != "Cancelled")
            sales_by_time = apply_filters(sales_by_time, start_date, end_date)
            time_data = sales_by_time.group_by(sa.func.extract('hour', models.PosOrder.date_order)).all()
            
            hour_map = {int(row.hour): float(row.revenue or 0.0) for row in time_data}
            for h in range(9, 24):
                ampm = "AM" if h < 12 else "PM"
                hr_label = h if h <= 12 else h - 12
                if hr_label == 0: hr_label = 12
                chart_data.append({
                    "label": f"{hr_label}{ampm}",
                    "value": hour_map.get(h, 0.0)
                })
        else:
            sales_by_time = f_db.query(
                sa.func.cast(models.PosOrder.date_order, sa.Date).label('date'),
                sa.func.sum(models.PosOrder.amount_total).label('revenue')
            ).filter(models.PosOrder.state != "Cancelled")
            sales_by_time = apply_filters(sales_by_time, start_date, end_date)
            time_data = sales_by_time.group_by(sa.func.cast(models.PosOrder.date_order, sa.Date)).order_by(sa.func.cast(models.PosOrder.date_order, sa.Date)).all()
            
            for row in time_data:
                chart_data.append({
                    "label": row.date.strftime("%b %d"),
                    "value": float(row.revenue or 0.0)
                })
                
        # 4. Top selling Category (Pie Chart)
        cat_query = f_db.query(
            models.ProductCategory.name.label('category_name'),
            models.ProductCategory.color.label('category_color'),
            sa.func.sum(models.PosOrderLine.price_subtotal).label('revenue')
        ).select_from(models.PosOrder)\
         .join(models.PosOrderLine, models.PosOrderLine.order_id == models.PosOrder.id)\
         .join(models.ProductProduct, models.ProductProduct.id == models.PosOrderLine.product_id)\
         .join(models.ProductCategory, models.ProductCategory.id == models.ProductProduct.categ_id)\
         .filter(models.PosOrder.state != "Cancelled")
        
        cat_query = apply_filters(cat_query, start_date, end_date)
        cat_data = cat_query.group_by(models.ProductCategory.id, models.ProductCategory.name, models.ProductCategory.color).all()
        
        total_cat_revenue = sum(float(row.revenue or 0.0) for row in cat_data)
        top_categories = []
        for row in cat_data:
            rev = float(row.revenue or 0.0)
            pct = (rev / total_cat_revenue * 100) if total_cat_revenue > 0 else 0.0
            top_categories.append({
                "name": row.category_name,
                "color": row.category_color or "#CCCCCC",
                "revenue": rev,
                "percentage": round(pct, 1)
            })
        top_categories = sorted(top_categories, key=lambda x: x["revenue"], reverse=True)
            
        # 5. Top Orders List
        orders_list_query = f_db.query(
            models.PosOrder.name.label('order_name'),
            models.PosOrder.session_id.label('session_id'),
            models.RestaurantTable.name.label('table_name'),
            models.PosOrder.date_order.label('date_order'),
            models.ResPartner.name.label('customer_name'),
            models.ResUsers.name.label('employee_name'),
            models.PosOrder.amount_total.label('amount_total')
        ).outerjoin(models.RestaurantTable, models.RestaurantTable.id == models.PosOrder.table_id)\
         .outerjoin(models.ResPartner, models.ResPartner.id == models.PosOrder.partner_id)\
         .outerjoin(models.ResUsers, models.ResUsers.id == models.PosOrder.user_id)\
         .filter(models.PosOrder.state != "Cancelled")
        
        orders_list_query = apply_filters(orders_list_query, start_date, end_date)
        orders_list_data = orders_list_query.order_by(models.PosOrder.amount_total.desc()).limit(5).all()
        
        top_orders = []
        for row in orders_list_data:
            top_orders.append({
                "order_name": row.order_name,
                "session": f"POS/{row.session_id:05d}" if row.session_id else "N/A",
                "pos": f"Table {row.table_name}" if row.table_name else "Takeaway",
                "date": row.date_order.strftime("%m/%d/%Y") if row.date_order else "N/A",
                "customer": row.customer_name or "Walk-in Customer",
                "employee": row.employee_name or "Admin",
                "total": float(row.amount_total or 0.0)
            })
            
        # 6. Top Products List
        prod_query = f_db.query(
            models.ProductProduct.name.label('product_name'),
            sa.func.sum(models.PosOrderLine.qty).label('quantity'),
            sa.func.sum(models.PosOrderLine.price_subtotal).label('revenue')
        ).select_from(models.PosOrder)\
         .join(models.PosOrderLine, models.PosOrderLine.order_id == models.PosOrder.id)\
         .join(models.ProductProduct, models.ProductProduct.id == models.PosOrderLine.product_id)\
         .filter(models.PosOrder.state != "Cancelled")
         
        prod_query = apply_filters(prod_query, start_date, end_date)
        prod_data = prod_query.group_by(models.ProductProduct.id, models.ProductProduct.name).order_by(sa.func.sum(models.PosOrderLine.price_subtotal).desc()).limit(5).all()
        
        top_products = []
        for row in prod_data:
            top_products.append({
                "name": row.product_name,
                "qty": float(row.quantity or 0.0),
                "revenue": float(row.revenue or 0.0)
            })
            
        # 7. Dropdown Lists for Filters
        users_data = f_db.query(models.ResUsers.id, models.ResUsers.name).all()
        filter_users = [{"id": u.id, "name": u.name} for u in users_data]
        
        sessions_data = f_db.query(models.PosSession.id).order_by(models.PosSession.id.desc()).all()
        filter_sessions = [{"id": s.id, "name": f"POS/{s.id:05d}"} for s in sessions_data]
        
        products_data = f_db.query(models.ProductProduct.id, models.ProductProduct.name).all()
        filter_products = [{"id": p.id, "name": p.name} for p in products_data]
        
        f_db.close()
        
        return {
            "metrics": {
                "total_orders": total_orders,
                "orders_pct": round(orders_pct, 1),
                "total_revenue": round(total_revenue, 2),
                "revenue_pct": round(revenue_pct, 1),
                "average_order": round(average_order, 2),
                "aov_pct": round(aov_pct, 1)
            },
            "chart_data": chart_data,
            "top_categories": top_categories,
            "top_orders": top_orders,
            "top_products": top_products,
            "filters": {
                "users": filter_users,
                "sessions": filter_sessions,
                "products": filter_products
            }
        }
    except Exception as e:
        if 'f_db' in locals():
            f_db.close()
        raise HTTPException(status_code=500, detail=f"Analytics failed: {str(e)}")

@router.post("/franchises/{name}/reset")
def reset_franchise_database(name: str, db: Session = Depends(get_global_db)):
    clean_name = "".join(c for c in name if c.isalnum() or c == "_").lower()
    db_franchise = db.query(models.Franchise).filter(models.Franchise.name == clean_name).first()
    if not db_franchise:
        raise HTTPException(status_code=404, detail="Franchise not found")
        
    db_name = f"cafe_pos_{clean_name}"
    
    # Obtain engine, drop and recreate tables
    try:
        # Pre-initialize engine cache if it wasn't connected yet
        temp_session = get_db_for_franchise(clean_name)
        temp_session.close()
        
        engine = engines[db_name]
        engine.dispose() # Release current connections
        
        # Reset schema
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)
        
        # Seed the database again with default configurations
        from seed_db import seed
        from sqlalchemy.orm import sessionmaker
        session = sessionmaker(autocommit=False, autoflush=False, bind=engine)()
        try:
            seed(session)
        finally:
            session.close()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to reset franchise database: {str(e)}")
            
    return {"message": f"Database for franchise '{clean_name}' has been reset successfully."}
