import os


class Config:
    def __init__(self):

        from dotenv import load_dotenv

        load_dotenv(f'backend/.env.{os.getenv("FLASK_ENV")}')

        # Database configuration
        self.DATABASE_CONNECTION_STRING = os.getenv("DATABASE_CONNECTION_STRING")

        self.DB_NAME = os.getenv("DB_NAME")

        # Flask configuration
        self.DEBUG = os.getenv("DEBUG", "True").lower() in ("true", "1", "yes")

        # CORS configuration
        self.CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*")
