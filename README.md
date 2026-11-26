# Dictadle

Projeto de plataforma gamificada **Dictadle**.

**Equipe de colaboradores:**
- Matheus Victor
- Vitor Emanuel
- Vinícius Araújo

**Stack Tecnológica:**
- **Backend:** Python
- **Frontend:** React
- **Banco de Dados:** PostgreSQL

---

## O Problema

O aprendizado de uma segunda língua possui uma lacuna entre o estudo e o mundo real. Estudantes com frequência relatam que, apesar de dominarem a leitura e a gramática, não compreendem falantes nativos devido à velocidade, sotaques, gírias e expressões. Ferramentas tradicionais oferecem áudios artificiais e lentos, que não preparam o aluno para o consumo de mídia nativa ou conversações reais.

---

## A Solução

A proposta é uma plataforma web interativa focada no aprimoramento da compreensão auditiva (*listening*) em inglês por meio da transcrição guiada. O sistema desafia os usuários a assistirem a clipes curtos (10 a 15 segundos) de mídias reais, expondo-os a sotaques, gírias e velocidades de fala autênticas que fogem do padrão engessado dos cursos tradicionais, incentivando ao estudo por meio de uma experiência gamificada.

---

## Funcionalidades Principais

- **Desafios de Transcrição:** Um ambiente prático com player de vídeo embutido, onde o aluno reproduz o trecho delimitado e digita exatamente o que compreendeu no campo de resposta.
- **Correção Inteligente e Feedback Visual:** O sistema avalia a resposta enviada comparando com o gabarito oficial. O algoritmo de validação é tolerante a variações de pontuação e letras maiúsculas, focando em destacar visualmente para o usuário (por meio de cores) quais palavras ele acertou, errou ou omitiu.
- **Gamificação (XP e Progressão de Nível):** O esforço e o desempenho do usuário são recompensados por um sistema de experiência (XP). A pontuação ganha escala com base na complexidade do áudio (sotaques específicos ou velocidade alta) e na precisão da transcrição, permitindo que o aluno suba de nível e acompanhe sua evolução de forma lúdica.
- **Dashboard do Estudante:** Um painel de acompanhamento de desempenho contendo o histórico de desafios realizados, além de apresentar estatísticas totais e percentuais de acertos e erros, tempo médio de conclusão por desafio e um mapeamento das palavras que o aluno mais tem dificuldade e costuma errar, permitindo um estudo mais direcionado.
- **Painel de Gestão de Conteúdo (Admin):** Área restrita para a curadoria do sistema, permitindo o cadastro de links de vídeos, definição dos intervalos de tempo exatos do recorte, configuração do nível de dificuldade e inserção das transcrições oficiais.

---

## Diretrizes de Mídia e Direitos Autorais

Para viabilizar o uso dessas mídias sem esbarrar em infrações de direitos autorais, o projeto foi pensado para não realizar a hospedagem (download e armazenamento) de nenhum arquivo de vídeo. O sistema funcionará exclusivamente via *embed* (incorporação), utilizando as APIs oficiais de plataformas públicas como o YouTube. O banco de dados guardará apenas "referências" (a URL do vídeo original, o segundo em que o trecho começa e o segundo em que termina). Como a aplicação apenas reproduz um recorte curto e atua com fins puramente educacionais e sem fins lucrativos, a prática é respaldada legalmente.

---

## Divisão Multiusuário (Perfis)

O sistema atenderá múltiplos usuários, divididos em dois perfis de acesso:

- **Estudante/Jogador:** Acessa a plataforma para realizar os desafios de transcrição, acumula pontos, visualiza o ranking e seu dashboard.
- **Administrador:** Acessa um painel restrito para cadastrar novos clipes de vídeo, definir o nível de dificuldade e inserir a transcrição oficial (gabarito).

---

## Divisão de Papéis em Cada Release

### Release 1
- **PO (Vinícius):** Redigir e priorizar o Product Backlog inicial detalhando as User Stories de autenticação e CRUD administrativo com critérios de aceite em Gherkin, formalizar a Definition of Done (DoD), estabelecer o Sprint Goal e preparar as notas da release ao final do ciclo.
- **Scrum Master (Matheus):** Configurar e manter o board no Jira/Azure com as colunas e labels exigidas, mediar a elaboração da planilha de riscos iniciais e acordos de trabalho da equipe, além de facilitar e documentar as atas de todas as cerimônias ágeis desta sprint.
- **DevOps (Vinícius):** Estruturar o repositório base no GitHub providenciando os templates e pull requests, redigir o README com as instruções para rodar o ambiente local e configurar o pipeline inicial de Integração Contínua (CI).
- **QA (Vitor):** Formular o Plano de Qualidade no Sprint 0 definindo as metas e métricas gerais, escrever os casos de teste específicos para validar os fluxos da Sprint 1, registrar as evidências de bugs encontrados e gerar o relatório de qualidade da release.

### Release 2
- **PO (Vitor):** Refinar e repriorizar o Product Backlog detalhando as User Stories do CRUD de desafios, página de desafios, integração da API de vídeos, além de definir os Sprint Goals e redigir as notas da release.
- **Scrum Master (Vinícius):** Gerenciar e remover impedimentos técnicos (especialmente na integração da API de vídeos), facilitar as cerimônias ágeis e documentar atas e planos de ação das retrospectivas.
- **DevOps (Vitor):** Configurar o deploy automatizado em ambiente de homologação, garantir a estabilidade do pipeline de Integração Contínua (CI) para as novas funcionalidades e gerenciar o versionamento da release.
- **QA (Matheus):** Elaborar e executar os casos de teste para a API de vídeos e o envio de respostas, registrar os novos bugs com evidências e gerar o relatório de qualidade da release.

---

## Como Executar o Projeto Localmente (PostgreSQL Nativo)

### 1. Pré-requisitos
* **Python 3.10+** (compatível com 3.10 a 3.13)
* **Node.js 20+** e npm
* **PostgreSQL 14+** instalado nativamente e em execução na máquina local (porta padrão `5432`)
* **Git**

---

### 2. Configuração do PostgreSQL Nativo
1. Certifique-se de que o serviço do PostgreSQL está ativo localmente.
2. Acesse o terminal `psql` (ou utilize o pgAdmin / DBeaver) e crie o banco de dados da aplicação:
   ```sql
   CREATE DATABASE dictadle_db;
   ```

---

### 3. Configuração e Execução do Backend

1. Navegue até o diretório do backend:
   ```bash
   cd backend
   ```

2. Crie e ative o ambiente virtual:
   * **Windows (PowerShell):**
     ```powershell
     python -m venv venv
     .\venv\Scripts\Activate.ps1
     ```
   * **Linux / macOS:**
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```

3. Instale as dependências:
   ```bash
   pip install --upgrade pip
   pip install -r requirements.txt
   ```

4. Configure as variáveis de ambiente:
   * Crie o arquivo `backend/.env` baseado no `.env.example`:
     ```bash
     cp .env.example .env
     ```
   * Edite o arquivo `backend/.env` informando a sua senha do PostgreSQL local:
     ```env
     FLASK_ENV=development
     FLASK_APP=wsgi.py
     SECRET_KEY=sua_chave_secreta_local

     # PostgreSQL Nativo
     DB_USER=postgres
     DB_PASSWORD=sua_senha_do_postgres
     DB_HOST=localhost
     DB_PORT=5432
     DB_NAME=dictadle_db

     FRONTEND_URL=http://localhost:5173
     ```
     *(Nota: Certifique-se de que a linha de fallback `DATABASE_URL=sqlite...` esteja comentada para conectar ao PostgreSQL).*

5. Aplique as migrações estruturais no banco de dados:
   ```bash
   flask db upgrade
   ```

6. *(Opcional)* Crie a conta de Administrador inicial para testes e curadoria:
   ```bash
   flask seed-admin --username admin --email admin@dictadle.com --password Admin12345
   ```

7. Inicie o servidor da API:
   ```bash
   python wsgi.py
   ```
   A API estará disponível em: `http://localhost:5000` (Healthcheck: `http://localhost:5000/api/health`).

---

### 4. Configuração e Execução do Frontend

1. Em um novo terminal, navegue até a pasta do frontend:
   ```bash
   cd frontend
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
   Acesse a aplicação no navegador em: `http://localhost:5173`.

---

### 5. Execução dos Testes Automatizados e Cobertura

Para rodar toda a suíte de testes do backend:
```bash
cd backend
pytest tests -v
```

Para gerar o relatório detalhado de cobertura com o `coverage.py`:
```bash
cd backend
python -m coverage run --source=app -m pytest tests -v
python -m coverage report -m
```
*(A pipeline de CI do GitHub Actions exige uma cobertura mínima de 80% para aprovação de Pull Requests).*
