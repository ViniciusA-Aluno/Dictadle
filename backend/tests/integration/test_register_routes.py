import pytest
from app.models.user import User

def test_register_success_student_role(client):
    """Cenário 1: Cadastro realizado com sucesso com perfil 'student'."""
    res = client.post("/api/auth/register", json={
        "username": "novousuario",
        "email": "novo@dictadle.com",
        "password": "SenhaForte123"
    })
    assert res.status_code == 201
    data = res.get_json()
    assert data["message"] == "Cadastro realizado com sucesso"
    assert data["user"]["username"] == "novousuario"
    assert data["user"]["email"] == "novo@dictadle.com"
    assert data["user"]["role"] == "student"

def test_register_duplicate_email(client, sample_user):
    """Cenário 2: Tentativa de cadastro com e-mail já existente."""
    res = client.post("/api/auth/register", json={
        "username": "outro_usuario",
        "email": sample_user.email,  # joao@example.com
        "password": "SenhaForte123"
    })
    assert res.status_code == 409
    data = res.get_json()
    assert "Este e-mail já está cadastrado." in data["error"]

def test_register_duplicate_username(client, sample_user):
    """Tentativa de cadastro com username já existente."""
    res = client.post("/api/auth/register", json={
        "username": sample_user.username,  # joaosilva
        "email": "diferente@teste.com",
        "password": "SenhaForte123"
    })
    assert res.status_code == 409
    data = res.get_json()
    assert "Este nome de usuário já está cadastrado." in data["error"]

def test_register_invalid_email_format(client):
    """Cenário 3: Validação de formato de e-mail inválido."""
    invalid_emails = ["invalido", "invalido@", "invalido@com", "@dominio.com"]
    for email in invalid_emails:
        res = client.post("/api/auth/register", json={
            "username": f"user_{email.replace('@', '_').replace('.', '_')}",
            "email": email,
            "password": "SenhaForte123"
        })
        assert res.status_code == 400
        assert "Informe um e-mail válido." in res.get_json()["error"]

def test_register_password_complexity(client):
    """Cenário 4: Senha fora dos padrões de complexidade (< 8 chars, sem letra ou sem número)."""
    weak_passwords = [
        "curta1",          # < 8 caracteres
        "senhasemnumero",  # apenas letras
        "123456789",       # apenas números
    ]
    for pwd in weak_passwords:
        res = client.post("/api/auth/register", json={
            "username": f"user_pwd_{len(pwd)}",
            "email": f"pwd_{len(pwd)}@dictadle.com",
            "password": pwd
        })
        assert res.status_code == 400
        assert "mínimo 8 caracteres" in res.get_json()["error"]

def test_register_empty_required_fields(client):
    """Cenário 6: Submissão com campos obrigatórios vazios."""
    payloads = [
        {"username": "", "email": "teste@email.com", "password": "Senha123"},
        {"username": "usuario", "email": "", "password": "Senha123"},
        {"username": "usuario", "email": "teste@email.com", "password": ""},
        {}
    ]
    for p in payloads:
        res = client.post("/api/auth/register", json=p)
        assert res.status_code == 400
        assert "Campo obrigatório" in res.get_json()["error"]

def test_register_privilege_escalation_blocked(client):
    """Cenário 7: Bloqueio de autoatribuição de perfil privilegiado via requisição (deve forçar 'student')."""
    res = client.post("/api/auth/register", json={
        "username": "tentativa_admin",
        "email": "hacker@dictadle.com",
        "password": "SenhaForte123",
        "role": "admin"  # tentativa maliciosa de forçar papel admin
    })
    assert res.status_code == 201
    data = res.get_json()
    assert data["user"]["role"] == "student"
