# Roteiro Planejado — Validação de Respostas e Normalização (SCRUM-93 e SCRUM-110)

Roteiro derivado dos critérios de aceite em Gherkin registrados no Jira para a Sprint 3 (`CT-38` a `CT-40` e `CT-47` a `CT-49` no `Plano-de-Teste.docx`).

## Critérios e casos planejados

| História | Critério (Gherkin) | Casos no Plano | Status |
| :--- | :--- | :--- | :--- |
| `SCRUM-93` | Correção 100% ignorando caixa e pontuação (`POST /api/challenges/<id>/submit`) | `CT-38` | Pendente |
| `SCRUM-93` | Classificação de palavras (`correct`, `incorrect`, `missing`) e cálculo de acurácia | `CT-39` | Pendente |
| `SCRUM-93` | Rejeição de payload vazio (`400`/`422`), desafio inexistente (`404`) e sem JWT (`401`) | `CT-40` | Pendente |
| `SCRUM-110` | Equivalência case-insensitive, remoção de pontuação e apóstrofos curvos (`’ -> '`) | `CT-47` | Pendente |
| `SCRUM-110` | Colapso de múltiplos espaços/quebras e preservação do texto bruto no banco | `CT-48` | Pendente |
| `SCRUM-110` | Submissão contendo apenas símbolos retorna `0%` sem crash | `CT-49` | Pendente |
