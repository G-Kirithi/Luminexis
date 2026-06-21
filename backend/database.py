import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from fastapi import Request, HTTPException

# Use SQLite by default for easy running
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./cafe_pos_global.db")

global_db_url = SQLALCHEMY_DATABASE_URL

global_engine = create_engine(global_db_url, connect_args={"check_same_thread": False})
GlobalSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=global_engine)

engine = global_engine
SessionLocal = GlobalSessionLocal

Base = declarative_base()

engines = {}
sessionmakers = {}

def get_global_db():
    # Make sure the global database has tables
    Base.metadata.create_all(bind=global_engine)
    db = GlobalSessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_db_for_franchise(franchise_name: str):
    if not franchise_name:
        raise ValueError("Franchise name is required")
        
    clean_name = "".join(c for c in franchise_name if c.isalnum() or c == "_").lower()
    if not clean_name:
        raise ValueError("Invalid franchise name")
        
    db_name = f"cafe_pos_{clean_name}"
    db_file = f"sqlite:///./{db_name}.db"
    
    if db_name not in sessionmakers:
        franchise_engine = create_engine(db_file, connect_args={"check_same_thread": False})
        
        # Dynamically create all tables
        Base.metadata.create_all(bind=franchise_engine)
        
        engines[db_name] = franchise_engine
        sessionmakers[db_name] = sessionmaker(autocommit=False, autoflush=False, bind=franchise_engine)
        
        from seed_db import seed
        session = sessionmakers[db_name]()
        try:
            seed(session)
        except Exception as e:
            print(f"Error seeding database {db_name}: {e}")
        finally:
            session.close()
        
    return sessionmakers[db_name]()

def get_db(request: Request):
    franchise_name = request.headers.get("X-Franchise-Name")
    print(f"DEBUG: get_db received X-Franchise-Name: '{franchise_name}'", flush=True)
    if not franchise_name:
        raise HTTPException(status_code=400, detail="X-Franchise-Name header is missing")
        
    try:
        db = get_db_for_franchise(franchise_name)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database initialization failed: {str(e)}")
        
    try:
        yield db
    finally:
        db.close()

