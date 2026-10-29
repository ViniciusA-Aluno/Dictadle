"""
Script de inicialização (Seed) para o banco de dados do Dictadle.
Cria as tabelas caso não existam e garante a existência de um usuário Administrador padrão.
Uso: python seed.py [username] [email] [password]
"""
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app import create_app, db
from app.models.user import User

def seed_admin(
    username=os.getenv("ADMIN_DEFAULT_USER", "admin"),
    email=os.getenv("ADMIN_DEFAULT_EMAIL", "admin@dictadle.com"),
    password=os.getenv("ADMIN_DEFAULT_PASSWORD", "Admin12345")
):
    app = create_app()
    with app.app_context():
        db.create_all()

        existing_user = User.query.filter((User.username == username) | (User.email == email)).first()
        if not existing_user:
            admin = User(username=username, email=email, role="admin", is_active=True)
            admin.set_password(password)
            db.session.add(admin)
            db.session.commit()
            print(f"[SUCESSO] Administrador '{username}' ({email}) criado com sucesso!")
            print(f"Credenciais padrão -> E-mail: {email} | Senha: {password}")
            return admin
        else:
            existing_user.role = "admin"
            existing_user.is_active = True
            existing_user.set_password(password)
            db.session.commit()
            print(f"[ATUALIZADO] Usuário '{existing_user.username}' ({existing_user.email}) atualizado para Administrador ativo!")
            print(f"Credenciais atualizadas -> E-mail: {existing_user.email} | Senha: {password}")
            return existing_user

if __name__ == "__main__":
    u = sys.argv[1] if len(sys.argv) > 1 else "admin"
    e = sys.argv[2] if len(sys.argv) > 2 else "admin@dictadle.com"
    p = sys.argv[3] if len(sys.argv) > 3 else "Admin12345"
    seed_admin(u, e, p)
