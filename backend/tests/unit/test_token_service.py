import pytest
import jwt
from datetime import datetime, timedelta
from app.services.token_service import TokenService

def test_generate_and_decode_access_token(app):
    with app.app_context():
        token = TokenService.generate_access_token(user_id=42, role="student")
        assert isinstance(token, str)

        payload = TokenService.decode_token(token)
        assert payload is not None
        assert payload["sub"] == 42
        assert payload["role"] == "student"
        assert payload["type"] == "access"
        assert "exp" in payload
        assert "iat" in payload

def test_generate_and_decode_2fa_temp_token(app):
    with app.app_context():
        token = TokenService.generate_2fa_temp_token(user_id=99)
        assert isinstance(token, str)

        payload = TokenService.decode_token(token)
        assert payload is not None
        assert payload["sub"] == 99
        assert payload["type"] == "2fa_temp"

def test_decode_invalid_token_string(app):
    with app.app_context():
        result = TokenService.decode_token("token_invalido_qualquer")
        assert result is None

def test_decode_expired_token(app):
    with app.app_context():
        # Gera token já expirado (-10 minutos)
        expired_token = TokenService.generate_access_token(user_id=1, role="student", expires_in_minutes=-10)
        result = TokenService.decode_token(expired_token)
        assert result is None

def test_decode_tampered_token(app):
    with app.app_context():
        secret = "chave_totalmente_diferente"
        tampered_token = jwt.encode(
            {"sub": 1, "type": "access", "exp": datetime.utcnow() + timedelta(minutes=10)},
            secret,
            algorithm="HS256"
        )
        result = TokenService.decode_token(tampered_token)
        assert result is None
