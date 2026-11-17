# Aceite e Evidências — CRUD Administrativo de Desafios (SCRUM-87, SCRUM-88, SCRUM-90)

Entrega do gerenciamento administrativo de desafios (criação, edição e listagem paginada com filtros). Casos `CT-22` a `CT-27` no `Plano-de-Teste.docx`.

## Critérios e evidências

| História / Regra | Casos do plano | Automação |
| :--- | :--- | :--- |
| `SCRUM-87`: Criação com ID do YouTube válido e proteção apenas para `admin` | `CT-22`, `CT-23` | `backend/tests/integration/test_create_challenge_route.py`, `backend/tests/unit/test_validators_challenge.py` |
| `SCRUM-88`: Edição de metadados e validação pedagógica na atualização | `CT-24`, `CT-25` | `backend/tests/integration/test_update_challenge_route.py` |
| `SCRUM-90`: Listagem paginada com filtros (`difficulty`, `accent`, `status`, `search`) | `CT-26`, `CT-27` | `backend/tests/integration/test_list_challenges_route.py`, `backend/tests/unit/test_pagination_and_query_unit.py` |

> **Observação pós-Sprint 2:** Identificada divergência de validação de duração entre `POST` (5–30s) e `PUT` (10–15s), registrada no bug `SCRUM-192` para correção na Sprint 3.
