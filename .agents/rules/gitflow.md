# Git Flow Routine

Esta regra automatiza o fluxo de entrega de features utilizando o Git Flow.

## Gatilho
Quando o usuário solicitar o fluxo via comando:
- `/gitflow <task-id> "<mensagem>"`
- Ou pedir: "finalize a tarefa <task-id> com a mensagem <mensagem>" / "execute o gitflow para a task <task-id>"

## Procedimento de Execução
Execute a sequência de comandos abaixo no terminal, passo a passo. Se qualquer comando falhar, **interrompa a execução imediatamente** e relate o erro ao usuário.

1. **Iniciar Feature**:
   ```powershell
   git flow feature start <task-id>
   ```
   *(Caso a branch `feature/<task-id>` já exista, mude para ela com `git checkout feature/<task-id>`)*

2. **Adicionar arquivos**:
   ```powershell
   git add *
   ```

3. **Criar commit**:
   ```powershell
   git commit -m "<mensagem>"
   ```

4. **Publicar a feature no repositório remoto**:
   ```powershell
   git push origin feature/<task-id>
   ```

5. **Finalizar a feature**:
   *Nota: utilize o parâmetro `-m` para definir a mensagem de merge e evitar que o terminal trave abrindo um editor interativo.*
   ```powershell
   git flow feature finish -m "Merge feature/<task-id> into develop" <task-id>
   ```

6. **Atualizar a develop remota**:
   ```powershell
   git push origin develop
   ```

7. **Confirmação**:
   Confirme ao usuário que a tarefa `<task-id>` foi integrada à `develop` e enviada à `origin` com sucesso.
