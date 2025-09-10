import configparser
import os

# Load configuration from .ini file
config = configparser.ConfigParser()
config.read(os.path.join(os.path.dirname(__file__), "config.ini"))


class Config:
    def __init__(self, mode="DEVELOPMENT"):
        MODE = mode

        # Database configuration
        self.DATABASE_CONNECTION_STRING = config.get(
            MODE,
            "DATABASE_CONNECTION_STRING",
            fallback="mongodb://localhost:27017/",
        )

        # Flask configuration
        self.DEBUG = config.getboolean(MODE, "DEBUG", fallback=True)
        self.SECRET_KEY = config.get(MODE, "SECRET_KEY", fallback="dev-secret-key")

        # Server configuration
        self.HOST = config.get(MODE, "HOST", fallback="127.0.0.1")
        self.PORT = config.getint(MODE, "PORT", fallback=5000)

        # CORS configuration
        self.CORS_ORIGINS = config.get(MODE, "CORS_ORIGINS", fallback="*")
