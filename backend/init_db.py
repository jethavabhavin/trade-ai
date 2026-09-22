#!/usr/bin/env python3
"""
TradeAI Database Initialization & Seeding CLI Script
Usage: python backend/init_db.py
"""

import os
import sys

# Ensure UTF-8 output encoding on Windows console
if sys.platform.startswith("win"):
    sys.stdout.reconfigure(encoding="utf-8")

# Ensure backend directory is in path
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

from database import engine, db_dialect, SessionLocal
from db_models import Base, UserDB, AuditLogDB
from auth_utils import init_db_and_seed

def main():
    print("=========================================================")
    print("       TradeAI Database Provisioning & Setup CLI         ")
    print("=========================================================")
    print(f"Target Database Engine: {db_dialect.upper()}")
    print("Creating all tables and verifying constraints...")

    try:
        init_db_and_seed()
        print("\n[SUCCESS] Database tables verified & default users provisioned:")
        print("  - [ADMIN]  Email: admin@tradeai.app  | Password: AdminPassword@123  (Role: admin)")
        print("  - [TRADER] Email: trader@tradeai.app | Password: TraderPassword@123 (Role: user)")
        print("\nSQL Schema file is available at: backend/schema.sql")
        print("=========================================================")
    except Exception as e:
        print(f"\n[ERROR] Database initialization failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
