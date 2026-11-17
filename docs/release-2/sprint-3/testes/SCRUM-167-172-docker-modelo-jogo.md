# Roteiro Planejado — Docker Compose e Refatoração do Modelo de Jogo (SCRUM-167 e SCRUM-172)

Casos planejados `CT-52` a `CT-55` no `Plano-de-Teste.docx`.

## Critérios e casos planejados

| História | Critério (Gherkin) | Casos no Plano | Status |
| :--- | :--- | :--- | :--- |
| `SCRUM-167` | Subida completa via `docker compose up -d --build`, migrações automáticas e `/api/health/ready` `200 OK` | `CT-52` | Pendente |
| `SCRUM-167` | Proxy `/api/*`, fallback SPA `try_files` no Nginx para F5 e persistência após `docker compose restart` | `CT-53` | Pendente |
| `SCRUM-172` | Ciclo de estados `playing -> submitting -> completed` e reinício limpo de replays/player/texto | `CT-54` | Pendente |
| `SCRUM-172` | Bloqueio ao atingir limite de replays mantendo input ativo e fallback gracioso em HTTP `404` | `CT-55` | Pendente |
