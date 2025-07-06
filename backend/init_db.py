"""
Database initialization script for the Sparkathon FastAPI application
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os
from app import Base, DATABASE_URL

def init_db():
    """Initialize the database with tables"""
    engine = create_engine(DATABASE_URL)
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully!")

if __name__ == "__main__":
    init_db()
