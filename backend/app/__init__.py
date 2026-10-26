import os
from flask import Flask
from app.config import config_by_name
from app.extensions import db, migrate, cors
from app.routes.auth_routes import auth_bp

def create_app(config_name=None):
    if config_name is None:
        config_name = os.getenv("FLASK_ENV", "development")

    app = Flask(__name__)
    app.config.from_object(config_by_name.get(config_name, config_by_name["development"]))

    # Inicialização das extensões
    db.init_app(app)
    migrate.init_app(app, db)
    cors.init_app(app, resources={r"/api/*": {"origins": "*"}})

    # Registro de Blueprints da Sprint
    app.register_blueprint(auth_bp)

    @app.route("/api/health", methods=["GET"])
    def health_check():
        return {"status": "ok", "message": "Dictadle API está online"}, 200

    return app
