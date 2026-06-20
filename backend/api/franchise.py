from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import models
import schemas
from database import get_global_db, get_db_for_franchise, engines, Base

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
        
        try:
            # Query the isolated database for this franchise
            f_db = get_db_for_franchise(f.name)
            # Count total orders
            orders_count = f_db.query(models.PosOrder).count()
            # Sum up total revenue for non-cancelled orders
            revenue_sum = f_db.query(models.PosOrder).filter(models.PosOrder.state != "Cancelled").all()
            total_revenue = sum(o.amount_total for o in revenue_sum)
            f_db.close()
        except Exception as e:
            print(f"Error querying database stats for {f.name}: {e}")
            
        stats.append({
            "name": f.name,
            "created_at": f.created_at,
            "orders_count": orders_count,
            "total_revenue": total_revenue
        })
        
    return stats

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
