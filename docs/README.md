# Documentos do Dictadle

A versão colaborativa de trabalho da equipe fica no Google Drive / Jira, e as cópias consolidadas desta pasta (`.docx`, `.xlsx`, `.dbml`, `.md` e `.txt`) são versionadas no repositório ao fim de cada sprint.

## Como a pasta está organizada

| Pasta | O que guarda |
| :--- | :--- |
| `projeto/` | Documentos transversais do projeto: proposta (`Proposta-Dictadle.docx`), acordos de trabalho, ambiente de desenvolvimento, calendário de cerimônias, priorização do backlog e registro de riscos |
| `qualidade/` | Planos e planilhas oficiais que evoluem a cada release: `Plano-de-Teste.docx`, `Plano-de-Qualidade.xlsx`, `DoD-Sprint-e-Release.xlsx` e `Analise-de-Riscos-Baseada-em-Defeitos.xlsx` |
| `tecnico/api/` | Contratos dos endpoints REST do backend Flask (`auth-e-usuarios.md`, `desafios-e-reproducao.md`) |
| `tecnico/banco/` | DER do banco em formato editável DBML (`DER-Dictadle-v1.0.dbml` da R1 e `DER-Dictadle-v1.1.dbml` da R2) |
| `release-1/` | Relatórios (`Relatorio-de-Metricas-R1.docx`, `Relatorio-de-Qualidade-R1.docx`, `Relatorio-do-Pipeline-R1.docx`) e `Release-Notes-R1.docx` |
| `release-1/sprint-1/` | Plano, atas (Planning, Review e Retrospectiva no padrão oficial da equipe), acompanhamento e roteiro de testes da Sprint 1 |
| `release-2/` | `Plano-da-Release-2.docx`, `Plano-de-Qualidade-e-Testes-Release-2.md`, `Relatorio-de-Qualidade-R2.docx`, `Relatorio-de-Metricas-e-Riscos-R2.docx` e `Relatorio-do-Pipeline-R2.docx` |
| `release-2/sprint-2/` | Atas da Sprint 2, acompanhamento, roteiro da Review, `Relatorio-de-Qualidade-Sprint-2.txt` e evidências em `testes/` |
| `release-2/sprint-3/` | Atas da Sprint 3, acompanhamento, `Relatorio-de-Qualidade-Sprint-3.txt` e evidências de regressão em `testes/` |

## Onde colocar um documento novo

- Vale para o projeto inteiro e quase não muda: `projeto/`.
- Plano ou planilha mantida pelo QA a cada release: `qualidade/`.
- Contrato de API ou DER: `tecnico/`.
- Relatório ou Release Notes de uma release: `release-N/`.
- Ata, acompanhamento, roteiro ou evidência de uma sprint: `release-N/sprint-N/`.

Para a Release 3, crie `release-3/` com `sprint-4/` e `sprint-5/` dentro, seguindo o padrão `Tipo-do-Documento-Sprint-N.docx` ou `Tipo-do-Documento-RN.docx`.
