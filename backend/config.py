import configparser
import os
from dotenv import load_dotenv

# Load configuration from .ini file


class Config:
    def __init__(self, mode="DEVELOPMENT"):
        load_dotenv(f"backend/.env.{mode.lower()}")

        # Database configuration
        self.DATABASE_CONNECTION_STRING = os.getenv("DATABASE_CONNECTION_STRING")

        # Flask configuration
        self.DEBUG = os.getenv("DEBUG", "True").lower() in ("true", "1", "yes")
        self.SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key")

        # Server configuration
        self.HOST = os.getenv("HOST", "127.0.0.1")
        self.PORT = int(os.getenv("PORT", 5000))

        # CORS configuration
        self.CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*")
