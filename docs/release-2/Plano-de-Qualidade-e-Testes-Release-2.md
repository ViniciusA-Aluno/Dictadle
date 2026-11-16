# Plano de Qualidade e Testes — Release 2

## Dictadle | Sprints 2 e 3 | QA: Matheus Victor Feitosa Pereira | Atualizado em 16/11/2026

Documento complementar às planilhas oficiais (`docs/qualidade/Plano-de-Qualidade.xlsx`, `DoD-Sprint-e-Release.xlsx` e `Plano-de-Teste.docx`), consolidando os controles de qualidade da Release 2.

## 1. Objetivo, papéis e escopo

Garantir qualidade verificável no ciclo completo da Release 2: curadoria de desafios, reprodução segura via YouTube IFrame API (Anti-Cheat), submissão e validação automática de transcrições e deploy local via Docker.
- **QA (Matheus Victor Feitosa Pereira):** planejamento, critérios BDD/Gherkin, rastreabilidade (`CT-12` a `CT-57`), benchmarks, relato de bugs e pareceres.
- **PO e DevOps (Vitor Emanuel Vidal):** priorização e aceite das USs, pipeline CI (`.github/workflows/ci.yml`), gate de cobertura e Docker Compose.
- **SM (Vinícius Araújo Cordeiro):** condução das cerimônias, atas e ações de melhoria contínua.

## 2. Metas da planilha oficial (`Plano-de-Qualidade.xlsx`) e situação

| ID | Item | Meta | Resultado R1 | Resultado S2 | Situação S3 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `Q-01` | Cobertura de testes | `>= 70%` (CI gate `80%`) | `64%` | `88%` (`241` backend + `20` front) | A consolidar na Review R2 (`26/11`) |
| `Q-02` | Taxa de aprovação | `>= 95%` | `100%` (`150` testes) | `100%` (`261` testes) | A consolidar |
| `Q-03` | Critérios de aceite Gherkin | `100%` | `100%` | `100%` | `100%` das 8 USs conferidas |
| `Q-04` | Revisão de código (PRs) | `100%` | `100%` | `100%` | Contínuo |
| `Q-05` | Tempo de CI | `<= 10 min` | `2 min` | `1.8 min` | A monitorar |
| `Q-06` | Frequência de deploy | `>= 1` por sprint | `1` | `1` (homologação contínua `develop`) | Docker local (`SCRUM-167`) |
| `Q-07` | Tempo de resposta p95 | `<= 2 s` | Não medido | `1.39 ms` (`test_performance_benchmarks.py`) | Incluir `/submit` |
| `Q-08` | Tratamento de erros | `100%` | `100%` | `100%` | Validar no fluxo completo |
| `Q-09` | Documentação / README | `100%` | `100%` | `100%` | Atualizado em `docs/` |

## 3. Rastreabilidade de Casos e Bugs

- **Sprint 2 (Concluída):** `CT-12` a `CT-37` registrados em `docs/qualidade/Plano-de-Teste.docx` e detalhados em `docs/release-2/sprint-2/testes/`.
- **Sprint 3 (Planejada):** `CT-38` a `CT-57` cobrindo as 8 USs (`SCRUM-93`, `94`, `109`, `110`, `162`, `167`, `172`, `177`) em `docs/release-2/sprint-3/testes/`.
- **Bugs:** `SCRUM-152` e `SCRUM-153` corrigidos e aprovados em regressão na S2; `SCRUM-191` e `SCRUM-192` abertos para correção na Sprint 3.
