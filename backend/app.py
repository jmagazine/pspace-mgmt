import os
from dotenv import load_dotenv
from . import create_app
from .config import Config

# Load environment variables (optional, for overrides)
app = create_app()

if __name__ == "__main__":
    app.run(debug=Config.DEBUG, host=Config.HOST, port=Config.PORT)
