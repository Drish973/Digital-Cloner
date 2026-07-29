from sqlmodel import SQLModel, create_engine, Session
import os

# Default to SQLite for easy local setup, but customizable to PostgreSQL/MySQL via env variable
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./digital_clone.db")

# SQLAlchemy compatibility adjustments for Postgres
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# SQLite needs check_same_thread=False for FastAPI async endpoints
connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(DATABASE_URL, connect_args=connect_args)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session
