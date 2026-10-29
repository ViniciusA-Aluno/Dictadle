import os
import click
from flask import Flask
from app.config import config_by_name
from app.extensions import db, migrate, cors
from app.routes import auth_bp, user_bp

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
    app.register_blueprint(user_bp)

    @app.route("/api/health", methods=["GET"])
    def health_check():
        return {"status": "ok", "message": "Dictadle API está online"}, 200

    # Comandos CLI para gestão administrativa
    @app.cli.command("seed-admin")
    @click.option("--username", default="admin", help="Nome de usuário do admin.")
    @click.option("--email", default="admin@dictadle.com", help="E-mail do admin.")
    @click.option("--password", default="Admin12345", help="Senha do admin.")
    def seed_admin_command(username, email, password):
        """Cria ou atualiza uma conta de Administrador no banco."""
        from app.models.user import User
        db.create_all()
        user = User.query.filter((User.username == username) | (User.email == email)).first()
        if not user:
            user = User(username=username, email=email, role="admin", is_active=True)
            user.set_password(password)
            db.session.add(user)
            db.session.commit()
            click.echo(f"Administrador '{username}' criado com sucesso.")
        else:
            user.role = "admin"
            user.is_active = True
            user.set_password(password)
            db.session.commit()
            click.echo(f"Usuário '{username}' promovido a Administrador ativo.")

    return app
