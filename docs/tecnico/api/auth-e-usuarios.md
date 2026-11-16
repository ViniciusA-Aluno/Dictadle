# Contrato de API — Autenticação e Usuários

Implementado em `backend/app/routes/auth_routes.py` e `backend/app/routes/user_routes.py`.

## Autenticação (`/api/auth`)

| Método | Rota | Autenticação | Descrição |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Pública | Cadastro de usuário (`username`, `email`, `password`, `role`) |
| `POST` | `/api/auth/login` | Pública | Autenticação; retorna `access_token` JWT ou `requires_2fa` + `temp_token` |
| `POST` | `/api/auth/login/2fa` | `temp_token` | Validação do código TOTP de 6 dígitos |
| `POST` | `/api/auth/2fa/setup` | JWT | Geração de segredo TOTP e QR Code |
| `POST` | `/api/auth/2fa/confirm-setup` | JWT | Confirmação e ativação do 2FA |
| `GET` | `/api/auth/me` | JWT | Retorna perfil do usuário autenticado |
| `PUT` | `/api/auth/profile` | JWT | Atualiza `username` e `email` do usuário autenticado |
| `PUT` | `/api/auth/change-password` | JWT | Altera senha validando senha atual e complexidade |
| `DELETE` | `/api/auth/account` | JWT | Exclusão da própria conta |

## Gestão de Usuários (`/api/users`)

| Método | Rota | Permissão | Descrição |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/users` | Admin | Listagem paginada com filtros |
| `GET` | `/api/users/<id>` | Admin / Próprio | Detalhes do usuário |
| `PUT` | `/api/users/<id>` | Admin | Atualização cadastral/papel (`student` / `admin`) |
| `DELETE` | `/api/users/<id>` | Admin ou Próprio | Soft delete (padrão) ou hard delete (`?hard=true`); retorna `403` se BOLA |
