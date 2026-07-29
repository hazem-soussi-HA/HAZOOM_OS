import os
os.environ['DATABASE_URL'] = 'sqlite+aiosqlite:///./deepseek.db'
os.environ['SECRET_KEY'] = '09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7'
os.environ['ENCRYPTION_KEY'] = 'L6WQo4FvNg5fHjXpZ4x23Sm46TEhVJ1vP24vP8gmk9Q='
os.environ['DEBUG'] = 'true'

import asyncio
from app.core.database import init_db, AsyncSessionLocal
from app.core.security import get_password_hash
from app.models.user import User, UserRole
from app.models.video import VideoJob
from sqlalchemy import select

async def seed():
    await init_db()
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.email == 'admin@hazoom.com'))
        if result.scalar_one_or_none():
            print('User already exists')
            return
        user = User(
            email='admin@hazoom.com',
            hashed_password=get_password_hash('admin123'),
            full_name='Admin',
            role=UserRole.ADMIN,
        )
        db.add(user)
        await db.commit()
        print('Created: admin@hazoom.com / admin123')

asyncio.run(seed())
