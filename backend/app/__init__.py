import os
import click
from flask import Flask
from app.config import config_by_name
from app.extensions import db, migrate, cors
from app.routes import auth_bp, user_bp, challenge_bp
from app.services.deployment_service import HealthCheckService

def create_app(config_name=None, config_overrides=None):
    if config_name is None:
        config_name = os.getenv("FLASK_ENV", "development")

    app = Flask(__name__)
    app.config.from_object(config_by_name.get(config_name, config_by_name["development"]))
    if config_overrides:
        app.config.update(config_overrides)

    # Inicialização das extensões
    db.init_app(app)
    migrate.init_app(app, db)
    cors.init_app(app, resources={r"/api/*": {"origins": "*"}})

    # Registro de Blueprints da Sprint
    app.register_blueprint(auth_bp)
    app.register_blueprint(user_bp)
    app.register_blueprint(challenge_bp)

    @app.after_request
    def inject_deployment_headers(response):
        response.headers["X-Deployment-Slot"] = app.config.get("DEPLOYMENT_SLOT", "blue")
        response.headers["X-App-Version"] = app.config.get("APP_VERSION", "2.0.0")
        return response

    @app.route("/api/health", methods=["GET"])
    @app.route("/api/health/ready", methods=["GET"])
    def health_check():
        _, payload, status_code = HealthCheckService.evaluate_readiness()
        return payload, status_code

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

    @app.cli.command("seed-challenges")
    def seed_challenges_command():
        """Popula desafios de transcrição iniciais para estudo e testes de reprodução."""
        from app.models.challenge import Challenge
        db.create_all()
        if Challenge.query.count() == 0:
            challenges = [
                Challenge(
                    id=1,
                    title="Steve Jobs - Stanford Speech",
                    video_url="https://www.youtube.com/watch?v=UF8uR6Z6KLc",
                    youtube_video_id="UF8uR6Z6KLc",
                    start_time_seconds=25,
                    end_time_seconds=32,
                    difficulty="medium",
                    accent="American",
                    transcript_official="I am honored to be with you today at your commencement from one of the finest universities in the world.",
                    is_active=True
                ),
                Challenge(
                    id=2,
                    title="Brené Brown - The Power of Vulnerability (TED)",
                    video_url="https://www.youtube.com/watch?v=iCvmsMzlF7o",
                    youtube_video_id="iCvmsMzlF7o",
                    start_time_seconds=16,
                    end_time_seconds=22,
                    difficulty="easy",
                    accent="American",
                    transcript_official="I want to start with this: a couple of years ago, an event planner called me because I was going to do a speaking event.",
                    is_active=True
                ),
                Challenge(
                    id=20,
                    title="How to stay calm when you know you'll be stressed",
                    video_url="https://www.youtube.com/watch?v=8jPQjjsBbIc",
                    youtube_video_id="8jPQjjsBbIc",
                    start_time_seconds=12,
                    end_time_seconds=23,
                    difficulty="hard",
                    accent="American",
                    transcript_official="A few years ago, I broke into my own house. I had just driven home, it was around midnight in the dead of winter. I had been visiting my friend Jeff, across town.",
                    is_active=True
                )
            ]
            db.session.add_all(challenges)
            db.session.commit()
            click.echo(f"{len(challenges)} desafios de teste semeados com sucesso.")
        else:
            click.echo(f"Desafios já cadastrados (total: {Challenge.query.count()}).")

    return app
