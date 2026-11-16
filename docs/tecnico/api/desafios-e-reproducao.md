# Contrato de API — Desafios e Reprodução (`/api/challenges`)

Implementado em `backend/app/routes/challenge_routes.py` em conformidade com a política **Anti-Cheat** e **Zero Hosting**.

## Endpoints

| Método | Rota | Permissão | Descrição |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/challenges` | Admin | Listagem paginada com busca (`search`) e filtros (`difficulty`, `accent`, `status`) |
| `POST` | `/api/challenges` | Admin | Criação de desafio com extração e validação de ID do YouTube |
| `GET` | `/api/challenges/<id>` | Admin | Visão administrativa completa (inclui `transcript_official`) |
| `PUT` | `/api/challenges/<id>` | Admin | Atualização de desafio (validação pedagógica 10–15s; bug aberto `SCRUM-192`) |
| `GET` | `/api/challenges/active` | JWT (Qualquer) | Lista desafios ativos para o estudante (`to_playback_dict`, **sem gabarito**) |
| `GET` | `/api/challenges/<id>/playback` | JWT (Qualquer) | Metadados de reprodução do clipe (`embed_url`, `start_time_seconds`, `end_time_seconds`) |
| `GET` | `/api/challenges/daily/playback` | JWT (Qualquer) | Reprodução do desafio diário ativo |

## Planejado para Sprint 3
- `POST /api/challenges/<id>/submit` (`SCRUM-93` / `SCRUM-109`): submissão da transcrição, normalização textual (`SCRUM-110`), cálculo de acurácia e retorno do diff + `transcript_official` somente após envio.
