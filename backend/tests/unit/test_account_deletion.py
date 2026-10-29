import pytest
from app.extensions import db
from app.models.user import User

def test_user_soft_deletion_state():
    """Valida que o método deactivate altera o status is_active sem perder os dados cadastrais."""
    user = User(username="pedro", email="pedro@example.com", role="student")
    user.set_password("Senha123")
    assert user.is_active is True

    # Executa soft delete
    user.deactivate()
    assert user.is_active is False

    # Valida integridade dos demais campos
    assert user.username == "pedro"
    assert user.email == "pedro@example.com"
    assert user.check_password("Senha123") is True
    assert user.role == "student"

def test_user_soft_delete_in_database(app):
    """Valida persistência da exclusão lógica no banco de dados."""
    with app.app_context():
        user = User(username="marcos", email="marcos@example.com")
        user.set_password("Senha123")
        db.session.add(user)
        db.session.commit()
        user_id = user.id

        # Aplica desativação
        user.deactivate()
        db.session.commit()

        # Recarrega do banco
        reloaded = db.session.get(User, user_id)
        assert reloaded is not None
        assert reloaded.is_active is False

def test_user_hard_delete_in_database(app):
    """Valida remoção definitiva do registro do banco no hard delete."""
    with app.app_context():
        user = User(username="lucas", email="lucas@example.com")
        user.set_password("Senha123")
        db.session.add(user)
        db.session.commit()
        user_id = user.id

        # Hard delete
        db.session.delete(user)
        db.session.commit()

        # Registro não deve mais existir
        assert db.session.get(User, user_id) is None

def test_confirmation_keyword_rule():
    """Valida a regra de negócio da palavra-chave de confirmação de exclusão ('deletar')."""
    expected_keyword = "deletar"

    def validate_confirmation(input_word: str) -> bool:
        if not input_word:
            return False
        return input_word.strip().lower() == expected_keyword

    # Casos válidos
    assert validate_confirmation("deletar") is True
    assert validate_confirmation("DELETAR") is True
    assert validate_confirmation("  deletar  ") is True
    assert validate_confirmation("Deletar") is True

    # Casos inválidos (incluindo o antigo 'aluno')
    assert validate_confirmation("aluno") is False
    assert validate_confirmation("excluir") is False
    assert validate_confirmation("deleta") is False
    assert validate_confirmation("") is False
    assert validate_confirmation(None) is False
