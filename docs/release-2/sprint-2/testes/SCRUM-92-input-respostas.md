# Aceite e Evidências — Input de Respostas e Drivers de Usabilidade (SCRUM-92, SCRUM-17, SCRUM-20)

Casos `CT-18` a `CT-21` e `CT-34` a `CT-35` do `Plano-de-Teste.docx`.

## Critérios e evidências

| Item | Comportamento | Automação |
| :--- | :--- | :--- |
| `SCRUM-92` | Caixa de digitação focada com limite de 500 caracteres e submissão | `frontend/tests/usability_driver_001.test.js`, `frontend/tests/usability_driver_003.test.js` |
| `SCRUM-17` (`DA-USA-I1-001`) | Navegação sequencial via teclado e atributos ARIA de acessibilidade | `frontend/tests/usability_driver_001.test.js` |
| `SCRUM-20` (`DA-USA-I1-003`) | Atalhos de teclado globais (`Ctrl+Espaço` etc.) mantendo foco no textarea | `frontend/tests/usability_driver_003.test.js` |
