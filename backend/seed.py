"""
Script de inicialização (Seed) para o banco de dados do Dictadle.
Cria as tabelas caso não existam e garante a existência de um usuário Administrador padrão
e de um desafio inicial para testes de reprodução.
Uso: python seed.py [username] [email] [password]
"""
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app import create_app, db
from app.models.user import User
from app.models.challenge import Challenge

def seed_admin(
    username=os.getenv("ADMIN_DEFAULT_USER", "admin"),
    email=os.getenv("ADMIN_DEFAULT_EMAIL", "admin@dictadle.com"),
    password=os.getenv("ADMIN_DEFAULT_PASSWORD", "Admin12345"),
    app=None
):
    if app is None:
        app = create_app()

    with app.app_context():
        db.create_all()

        existing_user = User.query.filter((User.username == username) | (User.email == email)).first()
        if not existing_user:
            admin = User(username=username, email=email, role="admin", is_active=True)
            admin.set_password(password)
            db.session.add(admin)
            db.session.commit()
            admin_id = admin.id
            print(f"[SUCESSO] Administrador '{username}' ({email}) criado com sucesso!")
            print(f"Credenciais padrão -> E-mail: {email} | Senha: {password}")
        else:
            existing_user.role = "admin"
            existing_user.is_active = True
            existing_user.set_password(password)
            db.session.commit()
            admin_id = existing_user.id
            print(f"[ATUALIZADO] Usuário '{existing_user.username}' ({existing_user.email}) atualizado para Administrador ativo!")
            print(f"Credenciais atualizadas -> E-mail: {existing_user.email} | Senha: {password}")

        # Seed de desafio inicial para testes locais
        if not Challenge.query.first():
            demo_challenge = Challenge(
                id=20,
                title="The Office - Fire Drill (Clipe Demo)",
                video_url="https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                youtube_video_id="dQw4w9WgXcQ",
                start_time_seconds=45,
                end_time_seconds=57,
                difficulty="medium",
                accent="American",
                transcript_official="Stay calm! Everyone stay calm!",
                is_active=True
            )
            db.session.add(demo_challenge)
            db.session.commit()
            print("[SUCESSO] Desafio inicial (id: 20) criado com sucesso para testes de playback!")

        return admin_id

if __name__ == "__main__":
    u = sys.argv[1] if len(sys.argv) > 1 else "admin"
    e = sys.argv[2] if len(sys.argv) > 2 else "admin@dictadle.com"
    p = sys.argv[3] if len(sys.argv) > 3 else "Admin12345"
    seed_admin(u, e, p)
