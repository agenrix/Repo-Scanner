import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    MONGO_URI: str = os.getenv("MONGODB_URI")
    POSTGRES_URI: str = os.getenv("POSTGRES_URI")
    PORT: int = int(os.getenv("PORT", "8000"))
    _origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000")
    ALLOWED_ORIGINS: list = [origin.strip() for origin in _origins.split(",") if origin.strip()]
    

settings = Settings()