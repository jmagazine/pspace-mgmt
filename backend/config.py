import os
from dotenv import load_dotenv


class Config:
    def __init__(self):
        load_dotenv()

        # Database configuration
        self.DATABASE_CONNECTION_STRING = os.getenv("DATABASE_CONNECTION_STRING")

        # Flask configuration
        self.DEBUG = os.getenv("DEBUG", "True").lower() in ("true", "1", "yes")

        # CORS configuration
        self.CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*")
