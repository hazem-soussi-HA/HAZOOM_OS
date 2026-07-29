from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.api.v1.auth import router as auth_router
from app.api.v1.videos import router as videos_router
from app.core.config import get_settings

app = FastAPI(
    title="The History of the Internet",
    description="AI-powered documentary video generation about internet history",
    version="1.0.0",
)

settings = get_settings()

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(videos_router)

app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/")
async def root():
    return {
        "app": "The History of the Internet",
        "version": "1.0.0",
        "description": "AI-powered documentary video generation about internet history",
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}