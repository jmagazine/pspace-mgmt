import os
import sys
from dotenv import load_dotenv
from . import create_app
from .config import Config

# Load environment variables (optional, for overrides)
load_dotenv()

# Determine config mode from environment variable or command line argument
mode = os.environ.get("PSPACE_CONFIG_MODE", "DEVELOPMENT")
if len(sys.argv) == 1:
    print("Please specify a mode: DEVELOPMENT/PRODUCTION/TESTING. \nQuitting...")
    sys.exit(1)

mode = sys.argv[1].upper()

app = create_app(mode)

if __name__ == "__main__":
    config_obj = Config(mode)
    print(app.config)
    app.run(debug=config_obj.DEBUG, host=config_obj.HOST, port=os.getenv("PORT", 5000))
