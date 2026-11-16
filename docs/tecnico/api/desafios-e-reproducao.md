# Desafios e Reprodução — Contrato da API (`/api/challenges`)

Contrato baseado na implementação real de `backend/app/routes/challenge_routes.py` e `backend/app/services/validators.py` (Sprint 2) e no planejamento da Sprint 3 (`SCRUM-93`, `SCRUM-109`, `SCRUM-110`). Em estrita conformidade com as políticas **Zero Hosting** e **Anti-Cheat**.

## Cabeçalhos padrão

Todas as rotas exigem `Authorization: Bearer <access_token>`. Rotas administrativas exigem ainda `role == 'admin'` (caso contrário retornam `403 Forbidden`).

## Endpoints Implementados (Sprint 2)

| Método | Rota | Permissão | Descrição e Regras |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/challenges` | `admin` | Lista paginada (`page`, `per_page`, `search`, `difficulty`, `accent`, `status`/`is_active`). Retorna `to_admin_dict()`. |
| `POST` | `/api/challenges` | `admin` | Cria desafio extraindo `youtube_video_id` via `VideoService`. Aceita duração entre 5s e 30s (`SCRUM-192` aberto para alinhar com `PUT`). |
| `GET` | `/api/challenges/<int:challenge_id>` | `admin` | Retorna visão completa administrativa (`to_admin_dict()`). |
| `PUT` | `/api/challenges/<int:challenge_id>` | `admin` | Atualiza desafio validando janela estrita 10s–15s e gabarito `<= 500` chars (422 em violações semânticas). |
| `GET` | `/api/challenges/active` | JWT (Estudante/Admin) | Lista desafios ativos usando `to_playback_dict()` (**jamais** expõe `transcript_official`). |
| `GET` | `/api/challenges/<int:challenge_id>/playback` | JWT (Estudante/Admin) | Retorna `{ id, title, youtube_video_id, embed_url, start_time_seconds, end_time_seconds, duration, difficulty, accent }`. |
| `GET` | `/api/challenges/daily/playback` | JWT (Estudante/Admin) | Retorna o primeiro desafio ativo em `to_playback_dict()`. |

## Endpoint Planejado (Sprint 3 — SCRUM-93 / SCRUM-109)

- `POST /api/challenges/<int:challenge_id>/submit`
  - Corpo: `{ "transcript": "<texto do estudante>" }` (rejeita vazio com `400`/`422`; sem JWT retorna `401`; desafio inexistente/inativo retorna `404`).
  - Resposta `200 OK`: `{ accuracy_percentage, words_total, words_correct, diff: [...], transcript_official }` — o gabarito só é liberado após o processamento da submissão.
