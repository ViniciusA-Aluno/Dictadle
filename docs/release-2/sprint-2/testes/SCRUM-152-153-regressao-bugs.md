# Regressão de Defeitos — SCRUM-152 e SCRUM-153 (Sprint 2)

Validação das correções dos 2 bugs herdados da Release 1, homologados pelo QA (Matheus Victor) em 11/11/2026.

## Rastreabilidade

| Bug (Jira) | Causa raiz e correção | Evidência automatizada |
| :--- | :--- | :--- |
| `SCRUM-152` (PR #8) | Validação estrita na rota `DELETE /api/users/<id>` exigindo JWT e retornando `403` para usuário comum tentando excluir conta de terceiro (BOLA) | `backend/tests/integration/test_delete_user_route.py`, `backend/tests/unit/test_account_deletion.py` |
| `SCRUM-153` (PR #11) | Hidratação da sessão via `localStorage` (`dictadle_token`) e `GET /api/auth/me` no `App.jsx` com interceptores Axios no `api.js` | `backend/tests/integration/test_auth_session_validation.py` |
