# Defeitos em Aberto para Correção — Sprint 3 (SCRUM-191 e SCRUM-192)

Bugs identificados na auditoria pós-Sprint 2 e registrados no Jira em `SCRUM Sprint 3`.

| Chave | Título | Severidade / Prioridade | Story Points | Responsável | Critério de verificação (Regressão QA) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `SCRUM-192` | Bloqueio de edição em desafios com duração entre 5–9s ou 16–30s (`PUT /api/challenges/<id>` retorna `422`) | Alta / Média | `5` | Vitor Emanuel | Atualização parcial de `title` ou `is_active` retorna `200 OK` e regras entre `POST` e `PUT` consistentes |
| `SCRUM-191` | Persistência de `challengesMemoryCache` após logout (`handleLogout`) ou edição administrativa na mesma sessão SPA | Média / Média | `3` | Vinícius Araújo | Logout/novo login sem F5 invalida o cache e consulta `GET /api/challenges/active` |
