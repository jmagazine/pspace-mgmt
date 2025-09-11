from flask import Flask
from flask_cors import CORS
from .config import Config


def create_app():
    config_obj = Config()
    app = Flask(__name__)
    CORS(app)
    app.config.from_object(config_obj)
    app.debug = getattr(config_obj, "DEBUG", True)

    # Register blueprints
    from .routes import api

    app.register_blueprint(api)

    return app
