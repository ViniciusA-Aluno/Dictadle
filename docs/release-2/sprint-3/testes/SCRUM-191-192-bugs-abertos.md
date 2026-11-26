# Evidências de Regressão — Bugs da Sprint 3 (SCRUM-191 e SCRUM-192)

Ambos os bugs identificados pós-Sprint 2 foram corrigidos, mesclados em `develop` e validados no ciclo de regressão em `26/11/2026` (**0 bugs em aberto no fechamento da Release 2**).

| Chave | Título | Severidade | Evidência de Regressão | Status Final |
| :--- | :--- | :--- | :--- | :--- |
| `SCRUM-192` | Bloqueio HTTP 422 na edição de desafios com duração 5–9s ou 16–30s | Alta | PR #27 · `test_update_challenge_route.py`, `test_validators_challenge.py` | **Done (Aprovado QA)** |
| `SCRUM-191` | Persistência de `challengesMemoryCache` após logout ou edição admin | Média | `frontend/tests/cache_invalidation_scrum191.test.js` (`5/5 passed`) | **Done (Aprovado QA)** |
