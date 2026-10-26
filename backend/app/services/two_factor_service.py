import pyotp

class TwoFactorService:
    @staticmethod
    def generate_secret() -> str:
        """Gera uma chave secreta Base32 para TOTP (compatível com Google Authenticator / Authy)."""
        return pyotp.random_base32()

    @staticmethod
    def get_provisioning_uri(username: str, secret: str, issuer_name: str = "Dictadle") -> str:
        """Retorna o URI otpauth:// que pode ser lido por aplicativos autenticadores via QR Code."""
        totp = pyotp.TOTP(secret)
        return totp.provisioning_uri(name=username, issuer_name=issuer_name)

    @staticmethod
    def verify_token(secret: str, token: str, valid_window: int = 1) -> bool:
        """
        Valida o token numérico de 6 dígitos.
        valid_window=1 permite uma tolerância de 30s antes/depois para compensar desvios de relógio.
        """
        if not secret or not token:
            return False
        totp = pyotp.TOTP(secret)
        return bool(totp.verify(str(token).strip(), valid_window=valid_window))

    @staticmethod
    def generate_current_token(secret: str) -> str:
        """Gera o token atual para o secret fornecido (utilizado em testes e validação)."""
        totp = pyotp.TOTP(secret)
        return totp.now()
