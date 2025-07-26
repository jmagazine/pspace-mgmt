import configparser
import os

# Load configuration from .ini file
config = configparser.ConfigParser()
config.read(os.path.join(os.path.dirname(__file__), "config.ini"))


class Config:
    # Database configuration
    DATABASE_CONNECTION_STRING = config.get(
        "DEFAULT", "DATABASE_CONNECTION_STRING", fallback="mongodb://localhost:27017/"
    )

    # Flask configuration
    DEBUG = config.getboolean("DEFAULT", "DEBUG", fallback=True)
    SECRET_KEY = config.get("DEFAULT", "SECRET_KEY", fallback="dev-secret-key")

    # Server configuration
    HOST = config.get("DEFAULT", "HOST", fallback="127.0.0.1")
    PORT = config.getint("DEFAULT", "PORT", fallback=5000)

    # CORS configuration
    CORS_ORIGINS = config.get("DEFAULT", "CORS_ORIGINS", fallback="*")
