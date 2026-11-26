# Autenticação e Usuários — Contrato da API (`/api/auth` e `/api/users`)

Contrato baseado nas implementações reais de `backend/app/routes/auth_routes.py` e `backend/app/routes/user_routes.py` (Release 1 + correção `SCRUM-152` na Sprint 2).

## Cabeçalhos padrão

Rotas autenticadas exigem `Authorization: Bearer <access_token>` e `Content-Type: application/json`.

## Endpoints de Autenticação (`/api/auth`)

| Método | Rota | Acesso | Corpo esperado / Retorno principal |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Público | `{ username, email, password, role? }` -> `201 Created` |
| `POST` | `/api/auth/login` | Público | `{ email, password }` -> `200 OK` com `access_token` e `user`, ou `requires_2fa` + `temp_token` |
| `POST` | `/api/auth/login/2fa` | `temp_token` | `{ temp_token, code }` -> `200 OK` com `access_token` |
| `POST` | `/api/auth/2fa/setup` | JWT | Gera `secret` TOTP e URL/QR de ativação |
| `POST` | `/api/auth/2fa/confirm-setup` | JWT | Confirma código de 6 dígitos e ativa 2FA no usuário |
| `GET` | `/api/auth/me` | JWT | Retorna `{ user }` autenticado (usado na hidratação de sessão `SCRUM-153`) |
| `PUT` | `/api/auth/profile` | JWT | `{ username, email }` -> atualiza perfil próprio |
| `PUT` | `/api/auth/change-password` | JWT | `{ current_password, new_password }` -> valida senha atual e complexidade |
| `DELETE` | `/api/auth/account` | JWT | Exclui/desativa a própria conta autenticada |

## Endpoints de Gestão de Usuários (`/api/users`)

| Método | Rota | Permissão | Retornos principais |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/users` | `admin` | `200 OK` (paginação e filtros) / `403` |
| `GET` | `/api/users/<int:user_id>` | `admin` ou próprio | `200 OK` / `403` / `404` |
| `PUT` | `/api/users/<int:user_id>` | `admin` | `200 OK` / `400` / `403` / `404` |
| `DELETE` | `/api/users/<int:user_id>` | `admin` ou próprio (`SCRUM-152`) | `200 OK` (`?hard=true` opcional) / `401` (sem token) / `403` (terceiro não admin) |
