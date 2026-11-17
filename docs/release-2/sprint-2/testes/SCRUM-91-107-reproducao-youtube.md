# Aceite e Evidências — Reprodução Segura e Player YouTube (SCRUM-91, SCRUM-107)

Garante extração segura do ID do YouTube, reprodução delimitada entre `start_time_seconds` e `end_time_seconds` e estrita conformidade com a política Anti-Cheat (`to_playback_dict` sem `transcript_official`). Casos `CT-30` a `CT-33`.

## Critérios e evidências

| História / Critério | Casos do plano | Automação |
| :--- | :--- | :--- |
| `SCRUM-91`: Extração de URL/ID do YouTube e payload sem gabarito | `CT-30`, `CT-31` | `backend/tests/integration/test_challenge_playback_routes.py`, `backend/tests/unit/test_video_service.py`, `backend/tests/unit/test_challenge_model.py` |
| `SCRUM-107`: Player embed com contenção temporal, loop e controles customizados | `CT-32`, `CT-33` | `frontend/tests/media_playback_scrum107.test.js` |

> **Observação pós-Sprint 2:** Identificado que `challengesMemoryCache` em `ChallengeResolutionPage.jsx` não é limpo no logout/edição administrativa em navegação SPA; registrado no bug `SCRUM-191`.
