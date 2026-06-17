#!/usr/bin/env python3
"""
Create Test Users for Hazoom Authentication System
This script creates test accounts with different roles for testing the authentication system.
"""

import sys
import os

# Set UTF-8 encoding for Windows compatibility
if sys.platform.startswith('win'):
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

# Add the app directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine
from app.core.security import get_password_hash
from app.models.user import User
from app.models import user, agenda, quiz, progress  # Import all models
from app.core.config import settings

def create_test_users():
    """Create test users in the database"""
    # Create tables if they don't exist
    from app.models import user
    user.Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    # Test users data
    test_users = [
        {
            "email": "student@hazoom.com",
            "password": "student123",
            "full_name": "Student Test",
            "role": "student"
        },
        {
            "email": "teacher@hazoom.com",
            "password": "teacher123",
            "full_name": "Teacher Test",
            "role": "teacher"
        },
        {
            "email": "admin@hazoom.com",
            "password": "admin123",
            "full_name": "Admin Hazoom",
            "role": "admin",
            "is_superuser": True
        }
    ]

    print("\n" + "=" * 70)
    print("🔐 CREATING TEST USERS FOR HAZOOM")
    print("=" * 70 + "\n")

    for user_data in test_users:
        # Check if user already exists
        existing_user = db.query(User).filter(User.email == user_data["email"]).first()

        if existing_user:
            print(f"⚠️  User {user_data['email']} already exists - skipping")
            continue

        # Create new user
        try:
            user = User(
                email=user_data["email"],
                hashed_password=get_password_hash(user_data["password"]),
                full_name=user_data["full_name"],
                role=user_data["role"],
                is_active=True,
                is_superuser=user_data.get("is_superuser", False)
            )

            db.add(user)
            db.commit()
            db.refresh(user)

            print(f"✅ Created user: {user_data['email']}")
            print(f"   Role: {user_data['role']}")
            print(f"   Password: {user_data['password']}")
            print()

        except Exception as e:
            print(f"❌ Error creating user {user_data['email']}: {str(e)}")
            db.rollback()

    # Close the database connection
    db.close()

    print("=" * 70)
    print("✅ TEST USERS CREATION COMPLETED!")
    print("=" * 70)
    print("\n📋 Test Accounts:")
    print("   1. Student: student@hazoom.com / student123")
    print("   2. Teacher: teacher@hazoom.com / teacher123")
    print("   3. Admin:   admin@hazoom.com / admin123")
    print("\n🚀 You can now test the authentication system!")
    print("=" * 70 + "\n")

if __name__ == "__main__":
    create_test_users()
