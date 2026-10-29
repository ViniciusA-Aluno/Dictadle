import pytest
from app.extensions import db
from app.models.user import User
from app.services.token_service import TokenService

@pytest.fixture
def admin_user(app):
    admin = User(username="admin_chefe", email="chefe@dictadle.com", role="admin")
    admin.set_password("SenhaAdmin123")
    db.session.add(admin)
    db.session.commit()
    return admin

@pytest.fixture
def admin_headers(admin_user):
    token = TokenService.generate_access_token(admin_user.id, admin_user.role)
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def student_user(app):
    student = User(username="aluno_comum", email="comum@dictadle.com", role="student")
    student.set_password("SenhaAluno123")
    db.session.add(student)
    db.session.commit()
    return student

@pytest.fixture
def student_headers(student_user):
    token = TokenService.generate_access_token(student_user.id, student_user.role)
    return {"Authorization": f"Bearer {token}"}

def test_list_users_as_admin_success(client, admin_headers, admin_user, student_user):
    """Cenário 1: Visualizar a lista de usuários com sucesso (caminho feliz)."""
    res = client.get("/api/auth/users", headers=admin_headers)
    assert res.status_code == 200
    data = res.get_json()
    assert "users" in data
    assert data["total"] >= 2
    users = data["users"]
    first = users[0]
    assert "username" in first
    assert "email" in first
    assert "role" in first
    assert "created_at" in first
    assert "is_active" in first

def test_list_users_pagination_exact_10(client, admin_headers, app):
    """Cenário 2: Paginação da lista de usuários com exatamente 10 registros por página."""
    with app.app_context():
        # Adiciona 15 usuários adicionais
        for i in range(1, 16):
            u = User(username=f"user_batch_{i}", email=f"user_{i}@teste.com", role="student")
            u.set_password("Senha12345")
            db.session.add(u)
        db.session.commit()

    # Página 1
    res1 = client.get("/api/auth/users?page=1&per_page=10", headers=admin_headers)
    assert res1.status_code == 200
    data1 = res1.get_json()
    assert len(data1["users"]) == 10
    assert data1["page"] == 1
    assert data1["has_next"] is True

    # Página 2
    res2 = client.get("/api/auth/users?page=2&per_page=10", headers=admin_headers)
    assert res2.status_code == 200
    data2 = res2.get_json()
    assert len(data2["users"]) >= 5
    assert data2["page"] == 2

def test_list_users_search_filter(client, admin_headers, app):
    """Cenário 3: Filtrar usuários por termo de busca em username ou email."""
    with app.app_context():
        u1 = User(username="carlos_silva", email="carlos@empresa.com", role="student")
        u1.set_password("Senha123")
        u2 = User(username="ana_paula", email="ana@provedor.com", role="student")
        u2.set_password("Senha123")
        db.session.add_all([u1, u2])
        db.session.commit()

    # Busca por 'carlos'
    res = client.get("/api/auth/users?search=carlos", headers=admin_headers)
    assert res.status_code == 200
    data = res.get_json()
    assert any(u["username"] == "carlos_silva" for u in data["users"])
    assert not any(u["username"] == "ana_paula" for u in data["users"])

    # Busca por email 'provedor'
    res_email = client.get("/api/auth/users?search=provedor", headers=admin_headers)
    assert res_email.status_code == 200
    data_email = res_email.get_json()
    assert any(u["email"] == "ana@provedor.com" for u in data_email["users"])

def test_list_users_role_filter(client, admin_headers, admin_user, student_user):
    """Cenário 4: Filtrar usuários por perfil de acesso (student vs admin)."""
    # Filtro apenas 'admin'
    res_admin = client.get("/api/auth/users?role=admin", headers=admin_headers)
    assert res_admin.status_code == 200
    for u in res_admin.get_json()["users"]:
        assert u["role"] == "admin"

    # Filtro apenas 'student'
    res_student = client.get("/api/auth/users?role=student", headers=admin_headers)
    assert res_student.status_code == 200
    for u in res_student.get_json()["users"]:
        assert u["role"] == "student"

def test_list_users_empty_search_result(client, admin_headers):
    """Cenário 5: Nenhum usuário localizado na busca."""
    res = client.get("/api/auth/users?search=termo_completamente_inexistente_xyz_999", headers=admin_headers)
    assert res.status_code == 200
    data = res.get_json()
    assert len(data["users"]) == 0
    assert data["total"] == 0

def test_list_users_forbidden_for_student(client, student_headers):
    """Cenário 6: Tentativa de acesso por perfil de Estudante (deve retornar 403)."""
    res = client.get("/api/auth/users", headers=student_headers)
    assert res.status_code == 403
    assert "Acesso restrito para administradores" in res.get_json()["error"]

def test_list_users_unauthorized(client):
    """Cenário 7: Tentativa de acesso sem autenticação (deve retornar 401)."""
    res = client.get("/api/auth/users")
    assert res.status_code == 401

def test_list_users_no_sensitive_data(client, admin_headers, admin_user):
    """Cenário 8: Proteção de dados sensíveis na resposta da API."""
    res = client.get("/api/auth/users", headers=admin_headers)
    assert res.status_code == 200
    for u in res.get_json()["users"]:
        assert "password" not in u
        assert "password_hash" not in u
        assert "two_factor_secret" not in u
        assert "secret" not in u
