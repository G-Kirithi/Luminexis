import os
from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from fastapi import Request, HTTPException

# Expects DATABASE_URL from environment or uses default fallback
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:AADHIL%4012@localhost:5432/cafe_pos")

# Parse DATABASE_URL to derive base and global URLs
parsed_url = SQLALCHEMY_DATABASE_URL.rsplit("/", 1)
base_connection_url = parsed_url[0] + "/postgres"
global_db_name = "cafe_pos_global"
global_db_url = parsed_url[0] + "/" + global_db_name

# Ensure global database exists
default_engine = create_engine(base_connection_url, isolation_level="AUTOCOMMIT")
with default_engine.connect() as conn:
    result = conn.execute(text(f"SELECT 1 FROM pg_database WHERE datname = '{global_db_name}'"))
    exists = result.scalar()
    if not exists:
        conn.execute(text(f"CREATE DATABASE {global_db_name}"))
default_engine.dispose()

# Global/Admin DB engine
global_engine = create_engine(global_db_url)
GlobalSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=global_engine)

# Keep aliases for backward compatibility with migrations/scripts
engine = global_engine
SessionLocal = GlobalSessionLocal

Base = declarative_base()

# Cache for engines and sessionmakers per franchise
engines = {}
sessionmakers = {}

def get_global_db():
    db = GlobalSessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_db_for_franchise(franchise_name: str):
    """
    Get a database session for a specific franchise.
    Will dynamically check if a database engine exists, and automatically create
    the database and all tables if it doesn't.
    """
    if not franchise_name:
        raise ValueError("Franchise name is required")
        
    # Clean the franchise name to prevent sql injection and assure compatibility
    clean_name = "".join(c for c in franchise_name if c.isalnum() or c == "_").lower()
    if not clean_name:
        raise ValueError("Invalid franchise name")
        
    db_name = f"cafe_pos_{clean_name}"
    
    if db_name not in sessionmakers:
        # Create database in postgres if not exists
        parsed_url = SQLALCHEMY_DATABASE_URL.rsplit("/", 1)
        base_connection_url = parsed_url[0] + "/postgres"
        
        # Connect to default postgres DB to check and create database
        default_engine = create_engine(base_connection_url, isolation_level="AUTOCOMMIT")
        with default_engine.connect() as conn:
            result = conn.execute(text(f"SELECT 1 FROM pg_database WHERE datname = '{db_name}'"))
            exists = result.scalar()
            if not exists:
                conn.execute(text(f"CREATE DATABASE {db_name}"))
        default_engine.dispose()
        
        # Establish connection to the new franchise-specific database
        franchise_url = parsed_url[0] + "/" + db_name
        franchise_engine = create_engine(franchise_url)
        
        # Dynamically create all tables declared in models using metadata
        Base.metadata.create_all(bind=franchise_engine)
        
        engines[db_name] = franchise_engine
        sessionmakers[db_name] = sessionmaker(autocommit=False, autoflush=False, bind=franchise_engine)
        
        # Seed the franchise database with default categories, products, floors, tables
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
    """
    Dependency to obtain database session isolated for the active franchise.
    Requires header X-Franchise-Name to be supplied.
    """
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

