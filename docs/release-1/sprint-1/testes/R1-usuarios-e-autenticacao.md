# Verificação da Release 1 — Usuários, Autenticação e Configurações

Casos de teste `CT-01` a `CT-11` registrados em `docs/qualidade/Plano-de-Teste.docx` (QA responsável na R1: Vitor Emanuel Vidal).

## Rastreabilidade

| História (Jira) | Comportamento verificado | Evidência automatizada |
| :--- | :--- | :--- |
| `SCRUM-10` | Cadastro válido, bloqueio de e-mail duplicado e campos obrigatórios | `backend/tests/integration/test_register_routes.py`, `backend/tests/unit/test_validators_registration.py` |
| `SCRUM-39` | Login válido com JWT e tratamento de senha incorreta / usuário inexistente | `backend/tests/integration/test_login_routes.py`, `backend/tests/unit/test_token_service.py` |
| `SCRUM-56` | Configurações de username/e-mail/senha e Verificação em Duas Etapas (2FA TOTP) | `backend/tests/integration/test_settings_routes.py`, `backend/tests/unit/test_validators_settings.py`, `backend/tests/unit/test_two_factor_service.py` |
| `SCRUM-57` | Exclusão da própria conta com confirmação | `backend/tests/integration/test_delete_user_route.py`, `backend/tests/unit/test_account_deletion.py` |
| `SCRUM-9`, `11`, `12` | Listagem paginada, controle de acesso admin, edição e exclusão de usuários | `backend/tests/integration/test_user_list_routes.py`, `backend/tests/integration/test_admin_user_management.py`, `backend/tests/unit/test_user_list_security_unit.py`, `backend/tests/unit/test_admin_user_rules_unit.py` |
