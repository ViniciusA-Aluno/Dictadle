import pytest
from app.services.two_factor_service import TwoFactorService

def test_generate_secret():
    secret = TwoFactorService.generate_secret()
    assert isinstance(secret, str)
    assert len(secret) == 32 # Base32 padrão gerado pelo pyotp

def test_get_provisioning_uri():
    secret = "JBSWY3DPEHPK3PXP"
    uri = TwoFactorService.get_provisioning_uri(username="usuario@teste.com", secret=secret)
    assert uri.startswith("otpauth://totp/Dictadle:usuario%40teste.com") or uri.startswith("otpauth://totp/Dictadle:usuario@teste.com")
    assert "secret=JBSWY3DPEHPK3PXP" in uri
    assert "issuer=Dictadle" in uri

def test_verify_valid_and_invalid_token():
    secret = TwoFactorService.generate_secret()
    token = TwoFactorService.generate_current_token(secret)
    
    # Token correto deve ser aceito
    assert TwoFactorService.verify_token(secret, token) is True
    
    # Token incorreto deve ser rejeitado
    assert TwoFactorService.verify_token(secret, "000000") is False
    assert TwoFactorService.verify_token("", token) is False
    assert TwoFactorService.verify_token(secret, "") is False
