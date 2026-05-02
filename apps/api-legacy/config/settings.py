import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    MONGO_URI: str = os.getenv("MONGODB_URI")
    POSTGRES_URI: str = os.getenv("POSTGRES_URI")
    PORT: int = int(os.getenv("PORT", 8000))
    
    _origins_raw = os.getenv("ALLOWED_ORIGINS", "http://localhost:5174,http://127.0.0.1:5174")
    ALLOWED_ORIGINS: list = [origin.strip() for origin in _origins_raw.split(",")]

settings = Settings()