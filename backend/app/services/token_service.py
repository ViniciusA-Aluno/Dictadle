import jwt
from datetime import datetime, timedelta
from flask import current_app

class TokenService:
    @staticmethod
    def generate_access_token(user_id: int, role: str, expires_in_minutes: int = 120) -> str:
        """Gera o token de autenticação JWT final após validação completa de credenciais."""
        secret = current_app.config.get("SECRET_KEY", "dictadle_default_secret_key")
        payload = {
            "sub": user_id,
            "role": role,
            "type": "access",
            "iat": datetime.utcnow(),
            "exp": datetime.utcnow() + timedelta(minutes=expires_in_minutes)
        }
        return jwt.encode(payload, secret, algorithm="HS256")

    @staticmethod
    def generate_2fa_temp_token(user_id: int, expires_in_minutes: int = 5) -> str:
        """Gera um token temporário de vida curta (5 min) exclusivamente para a etapa do desafio 2FA."""
        secret = current_app.config.get("SECRET_KEY", "dictadle_default_secret_key")
        payload = {
            "sub": user_id,
            "type": "2fa_temp",
            "iat": datetime.utcnow(),
            "exp": datetime.utcnow() + timedelta(minutes=expires_in_minutes)
        }
        return jwt.encode(payload, secret, algorithm="HS256")

    @staticmethod
    def decode_token(token: str) -> dict:
        """Decodifica e valida o token JWT."""
        secret = current_app.config.get("SECRET_KEY", "dictadle_default_secret_key")
        try:
            return jwt.decode(token, secret, algorithms=["HS256"])
        except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
            return None
