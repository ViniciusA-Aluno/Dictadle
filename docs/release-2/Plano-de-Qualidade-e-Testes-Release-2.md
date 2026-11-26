# Plano de Qualidade e Testes — Release 2 (Fechamento Final)

## Dictadle | Sprints 2 e 3 | QA: Matheus Victor Feitosa Pereira | Fechamento: 26/11/2026

Documento complementar às planilhas oficiais (`docs/qualidade/Plano-de-Qualidade.xlsx`, `DoD-Sprint-e-Release.xlsx` e `Plano-de-Teste.docx`), consolidando os resultados finais da Release 2 após o ciclo de regressão completo em `26/11/2026` (`develop @ 4291898`).

## 1. Objetivo, papéis e escopo

- **QA (Matheus Victor Feitosa Pereira):** planejamento, rastreabilidade (`CT-12` a `CT-57`), ciclo de regressão, benchmarks `Q-07`, relato/validação de bugs, verificação de DoD e relatórios finais da R2.
- **PO e DevOps (Vitor Emanuel Vidal):** priorização, aceite das USs, CI e Docker Compose (`SCRUM-167`).
- **SM (Vinícius Araújo Cordeiro):** cerimônias, atas e ações de melhoria contínua.

## 2. Metas da planilha oficial (`Plano-de-Qualidade.xlsx`) — Resultado Final R2

| ID | Item | Meta | Resultado R1 | Resultado S2 | Resultado R2 Final (26/11) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `Q-01` | Cobertura de testes | `>= 70%` (CI gate `80%`) | `64%` | `88%` | **`92%`** (`345` backend) |
| `Q-02` | Taxa de aprovação | `>= 95%` | `100%` (`150`) | `100%` (`261`) | **`100%`** (`392`: `345` back + `47` front) |
| `Q-03` | Critérios de aceite Gherkin | `100%` | `100%` | `100%` | **`100%`** |
| `Q-04` | Revisão de código (PRs) | `100%` | `100%` | `100%` | **`100%`** (`PRs #8` a `#31`) |
| `Q-05` | Tempo de CI | `<= 10 min` | `2 min` | `1.8 min` | **`1.8 min`** |
| `Q-06` | Frequência de deploy | `>= 1` por sprint | `1` | `1` | **`2`** (`S2` + `S3` Docker local) |
| `Q-07` | Tempo de resposta p95 | `<= 2 s` | Não medido | `1.39 ms` | **`1.85 ms`** (pior caso `2.84 ms`, `SCRUM-196 < 50 ms`) |
| `Q-08` | Tratamento de erros | `100%` | `100%` | `100%` | **`100%`** |
| `Q-09` | Documentação / README | `100%` | `100%` | `100%` | **`100%`** |

## 3. Rastreabilidade e Encerramento de Bugs

- **Sprint 2:** `CT-12` a `CT-37` aprovados; bugs `SCRUM-152` e `SCRUM-153` encerrados (`Done`).
- **Sprint 3:** `CT-38` a `CT-57` automatizados e aprovados; bugs `SCRUM-191` e `SCRUM-192` corrigidos e validados em regressão (`0` bugs abertos no fechamento da Release 2).
- **Relatórios finais de QA:** `docs/release-2/Relatorio-de-Qualidade-R2.docx` e `docs/release-2/Relatorio-de-Metricas-e-Riscos-R2.docx`.
