import pytest
from app.extensions import db
from app.models.user import User
from app.services.token_service import TokenService

@pytest.fixture
def admin_user(app):
    admin = User(username="admin_gestor", email="gestor@dictadle.com", role="admin", is_active=True)
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
    student = User(username="aluno_comum", email="aluno@dictadle.com", role="student", is_active=True)
    student.set_password("SenhaAluno123")
    db.session.add(student)
    db.session.commit()
    return student

@pytest.fixture
def student_headers(student_user):
    token = TokenService.generate_access_token(student_user.id, student_user.role)
    return {"Authorization": f"Bearer {token}"}

def test_admin_get_user_details_success(client, admin_headers, student_user):
    """Admin consegue visualizar os detalhes de qualquer usuário."""
    res = client.get(f"/api/users/{student_user.id}", headers=admin_headers)
    assert res.status_code == 200
    data = res.get_json()
    assert "user" in data
    assert data["user"]["id"] == student_user.id
    assert data["user"]["username"] == "aluno_comum"
    assert data["user"]["email"] == "aluno@dictadle.com"
    assert data["user"]["role"] == "student"

def test_student_cannot_get_other_user_details(client, student_headers, admin_user):
    """Estudante comum não pode acessar os dados de outro usuário."""
    res = client.get(f"/api/users/{admin_user.id}", headers=student_headers)
    assert res.status_code == 403
    assert "Acesso restrito para administradores" in res.get_json()["error"]

def test_admin_update_user_basic_data(client, admin_headers, student_user):
    """Admin atualiza nome de usuário, e-mail e perfil com sucesso."""
    payload = {
        "username": "aluno_atualizado",
        "email": "atualizado@dictadle.com",
        "role": "admin"
    }
    res = client.put(f"/api/users/{student_user.id}", json=payload, headers=admin_headers)
    assert res.status_code == 200
    data = res.get_json()
    assert data["user"]["username"] == "aluno_atualizado"
    assert data["user"]["email"] == "atualizado@dictadle.com"
    assert data["user"]["role"] == "admin"

def test_admin_update_user_deactivate_and_reactivate(client, admin_headers, student_user):
    """Admin desativa e reativa o status do usuário."""
    # Desativar
    res_deactivate = client.put(f"/api/users/{student_user.id}", json={"is_active": False}, headers=admin_headers)
    assert res_deactivate.status_code == 200
    assert res_deactivate.get_json()["user"]["is_active"] is False

    # Reativar
    res_reactivate = client.put(f"/api/users/{student_user.id}", json={"is_active": True}, headers=admin_headers)
    assert res_reactivate.status_code == 200
    assert res_reactivate.get_json()["user"]["is_active"] is True

def test_admin_update_user_reset_password(client, admin_headers, student_user):
    """Admin redefine a senha do usuário com sucesso."""
    res = client.put(
        f"/api/users/{student_user.id}",
        json={"password": "NovaSenhaForte999"},
        headers=admin_headers
    )
    assert res.status_code == 200

    # Confirma que a nova senha funciona no login
    login_res = client.post("/api/auth/login", json={
        "email": student_user.email,
        "password": "NovaSenhaForte999"
    })
    assert login_res.status_code == 200

def test_admin_update_user_email_conflict(client, admin_headers, app, student_user):
    """Tentativa de atualizar para um e-mail já existente gera erro 409."""
    with app.app_context():
        u2 = User(username="outro_aluno", email="existente@dictadle.com", role="student")
        u2.set_password("Senha123")
        db.session.add(u2)
        db.session.commit()

    res = client.put(
        f"/api/users/{student_user.id}",
        json={"email": "existente@dictadle.com"},
        headers=admin_headers
    )
    assert res.status_code == 409
    assert "já está cadastrado" in res.get_json()["error"]

def test_admin_cannot_demote_only_admin(client, admin_headers, admin_user):
    """Impede rebaixar para 'student' o único administrador ativo do sistema."""
    res = client.put(
        f"/api/users/{admin_user.id}",
        json={"role": "student"},
        headers=admin_headers
    )
    assert res.status_code == 400
    assert "único administrador" in res.get_json()["error"]

def test_admin_cannot_deactivate_only_admin(client, admin_headers, admin_user):
    """Impede desativar o único administrador ativo do sistema."""
    res = client.put(
        f"/api/users/{admin_user.id}",
        json={"is_active": False},
        headers=admin_headers
    )
    assert res.status_code == 400
    assert "único administrador" in res.get_json()["error"]

def test_admin_cannot_delete_only_admin(client, admin_headers, admin_user):
    """Impede exclusão do único administrador ativo do sistema."""
    res = client.delete(f"/api/users/{admin_user.id}", headers=admin_headers)
    assert res.status_code == 400
    assert "único administrador" in res.get_json()["error"]

def test_admin_can_delete_admin_if_another_exists(client, admin_headers, app):
    """Permite exclusão de um admin se houver outro administrador ativo."""
    with app.app_context():
        second_admin = User(username="admin_segundo", email="admin2@dictadle.com", role="admin", is_active=True)
        second_admin.set_password("AdminSenha123")
        db.session.add(second_admin)
        db.session.commit()
        second_id = second_admin.id

    res = client.delete(f"/api/users/{second_id}", headers=admin_headers)
    assert res.status_code == 200
    assert "excluída com sucesso" in res.get_json()["message"]

def test_list_users_filter_by_status(client, admin_headers, app):
    """Filtra usuários ativos e inativos na listagem de usuários."""
    with app.app_context():
        u_active = User(username="user_ativo", email="ativo@dictadle.com", role="student", is_active=True)
        u_active.set_password("Senha123")
        u_inactive = User(username="user_inativo", email="inativo@dictadle.com", role="student", is_active=False)
        u_inactive.set_password("Senha123")
        db.session.add_all([u_active, u_inactive])
        db.session.commit()

    # Listar apenas ativos
    res_act = client.get("/api/users?status=active", headers=admin_headers)
    assert res_act.status_code == 200
    act_users = res_act.get_json()["users"]
    assert any(u["username"] == "user_ativo" for u in act_users)
    assert not any(u["username"] == "user_inativo" for u in act_users)

    # Listar apenas inativos
    res_inact = client.get("/api/users?status=inactive", headers=admin_headers)
    assert res_inact.status_code == 200
    inact_users = res_inact.get_json()["users"]
    assert any(u["username"] == "user_inativo" for u in inact_users)
    assert not any(u["username"] == "user_ativo" for u in inact_users)
