# Documentos do Dictadle

A versão de trabalho em tempo real da equipe fica no Google Drive / Jira, e as cópias consolidadas desta pasta (`.docx`, `.xlsx` e `.md`) são versionadas no repositório ao fim de cada sprint.

## Como a pasta está organizada

| Pasta | O que guarda |
| :--- | :--- |
| `projeto/` | Documentos transversais do projeto: proposta, acordos de trabalho, ambiente de desenvolvimento, calendário de cerimônias, priorização do backlog e registro de riscos |
| `qualidade/` | Planos e planilhas que evoluem a cada release: Plano de Teste, Plano de Qualidade, Análise de Riscos Baseada em Defeitos e DoD de sprint e release |
| `tecnico/api/` | Contratos dos endpoints REST do backend Flask (`/api/auth`, `/api/users`, `/api/challenges`) |
| `tecnico/banco/` | DER do banco em formato editável (`DBML`) refletindo os modelos SQLAlchemy |
| `release-1/` | Relatórios (Métricas, Qualidade, Pipeline) e Release Notes da Release 1 |
| `release-1/sprint-1/` | Plano, atas (Planning, Review e Retrospectiva), acompanhamento e roteiros de teste da Sprint 1 |
| `release-2/` | Plano da Release 2, Plano de Qualidade e Testes da R2 e Relatório do Pipeline R2 |
| `release-2/sprint-2/` | Atas, acompanhamento, roteiro da Review e relatório de métricas da Sprint 2 |
| `release-2/sprint-2/testes/` | Roteiros e evidências de teste da Sprint 2 (`SCRUM-87`, `88`, `90`, `91`, `92`, `107`, `152`, `153`, `Q-07`) |
| `release-2/sprint-3/` | Pauta da Planning (17/11/2026), acompanhamento e modelos das atas da Review e Retrospectiva (26/11/2026) |
| `release-2/sprint-3/testes/` | Roteiros de teste planejados para as USs da Sprint 3 (`SCRUM-93`, `94`, `109`, `110`, `162`, `167`, `172`, `177`) e bugs (`SCRUM-191`, `192`) |

## Onde colocar um documento novo

- Vale para o projeto inteiro e quase não muda: `projeto/`.
- Plano ou planilha que o QA atualiza a cada release: `qualidade/`.
- Contrato de API ou DER: `tecnico/`.
- Relatório ou Release Notes de uma release: `release-N/`.
- Ata, acompanhamento, roteiro ou evidência de uma sprint: `release-N/sprint-N/`.

Para a Release 3, crie `release-3/` com `sprint-4/` e `sprint-5/` dentro, seguindo o mesmo padrão `Tipo-do-Documento-Sprint-N.docx` ou `Tipo-do-Documento-RN.docx`.
