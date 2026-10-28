from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from app.extensions import db

class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), default="student", nullable=False)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    
    # Campos de Verificação em Duas Etapas (2FA)
    is_2fa_enabled = db.Column(db.Boolean, default=False, nullable=False)
    two_factor_secret = db.Column(db.String(64), nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if self.role is None:
            self.role = "student"
        if self.is_active is None:
            self.is_active = True
        if self.is_2fa_enabled is None:
            self.is_2fa_enabled = False
        if self.created_at is None:
            self.created_at = datetime.utcnow()

    def set_password(self, password: str):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)

    def enable_2fa(self, secret: str):
        self.two_factor_secret = secret
        self.is_2fa_enabled = True

    def disable_2fa(self):
        self.two_factor_secret = None
        self.is_2fa_enabled = False

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "role": self.role,
            "is_active": self.is_active,
            "is_2fa_enabled": self.is_2fa_enabled,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
