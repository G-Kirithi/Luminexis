from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import socketio

from database import global_engine, Base
import models
from api import auth, products, tables, orders, customers, inventory, complaints, franchise
from socket_server import sio
from fastapi.staticfiles import StaticFiles
import os

# Create all global tables in the global database (cafe_pos_global)
Base.metadata.create_all(bind=global_engine)

app = FastAPI(title="Cafe POS Backend API")

# Ensure the uploads directory exists
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(products.router, prefix="/api", tags=["products"])
app.include_router(tables.router, prefix="/api", tags=["tables"])
app.include_router(orders.router, prefix="/api", tags=["orders"])
app.include_router(customers.router, prefix="/api", tags=["customers"])
app.include_router(inventory.router, prefix="/api", tags=["inventory"])
app.include_router(complaints.router, prefix="/api", tags=["complaints"])
app.include_router(franchise.router, prefix="/api", tags=["franchise"])

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

import socketio
sio_app = socketio.ASGIApp(sio, other_asgi_app=app)

@app.get("/")
def read_root():
    return {"message": "Cafe POS API is running"}

# --- Socket.io Events ---
@sio.event
async def connect(sid, environ):
    print(f"Client connected: {sid}")

@sio.event
async def disconnect(sid):
    print(f"Client disconnected: {sid}")

@sio.event
async def send_to_kitchen(sid, data):
    print(f"Order received for kitchen: {data}")
    await sio.emit("new_kitchen_order", data)

@sio.event
async def order_status_update(sid, data):
    print(f"Order status updated: {data}")
    await sio.emit("order_updated", data)

# To run: uvicorn main:sio_app --reload
