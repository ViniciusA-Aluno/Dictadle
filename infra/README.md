# Infraestrutura e Banco de Dados - Dictadle

Esta pasta documenta as diretrizes de infraestrutura da aplicação **Dictadle**.

---

## Arquitetura de Infraestrutura (Release 2)

Conforme os requisitos da disciplina, a aplicação opera com **PostgreSQL Nativo** (executado diretamente como serviço do sistema operacional da máquina/servidor host), sem o uso de contêineres Docker para o banco de dados.

### Componentes:
* **Banco de Dados:** PostgreSQL 14+ (Porta padrão: `5432`).
* **Backend:** Python / Flask (executado via `wsgi.py` ou Gunicorn em homologação).
* **Frontend:** React / Vite (compilado estaticamente via `npm run build` e servido via Nginx ou servidor estático).
* **Integração Contínua (CI):** GitHub Actions (`.github/workflows/ci.yml`) com serviço de PostgreSQL temporário para validação automatizada de migrações (`flask db upgrade`) e cobertura de testes (`coverage.py`).

---

## Configuração do PostgreSQL Nativo

1. **Instalação do Serviço:**
   * Certifique-se de que o PostgreSQL está instalado e com o serviço em execução (`localhost:5432`).

2. **Criação do Banco de Dados:**
   No terminal `psql` ou pgAdmin, execute:
   ```sql
   CREATE DATABASE dictadle_db;
   ```

3. **Parametrização das Variáveis de Ambiente:**
   Configure no arquivo `backend/.env`:
   ```env
   DB_USER=postgres
   DB_PASSWORD=sua_senha_do_postgres
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=dictadle_db
   ```

4. **Aplicação das Migrações:**
   No diretório `backend/`, aplique o versionamento estrutural do banco:
   ```bash
   flask db upgrade
   ```

---

## Driver Arquitetural `DA-DIS-DEV-002` — Disponibilidade Contínua Durante Atualizações (`SCRUM-22`)

Para atender ao requisito de **Disponibilidade Contínua (Zero-Downtime Deployment)** na Release 2 (SLA de uptime $\ge 99,9\%$ e $0\%$ de erros `502`/`503` durante atualizações em horário de pico), a arquitetura implementa:

1. **Readiness & Liveness Gate (`/api/health` e `/api/health/ready`):**
   * Valida ativamente a prontidão da instância (`INSTANCE_READY`) e a conectividade com o banco PostgreSQL (`SELECT 1` via SQLAlchemy).
   * Retorna `200 OK` (`ready: true`, `database: "connected"`) apenas quando a instância está apta a receber tráfego de estudantes, ou `503 Service Unavailable` durante o aquecimento (`warming_up`), impedindo a migração prematura de tráfego pelo Load Balancer.
   * Injeta cabeçalhos de observabilidade `X-Deployment-Slot` (`blue` / `green`) e `X-App-Version` em todas as respostas HTTP.

2. **Orquestração Blue/Green (`BlueGreenLoadBalancer`):**
   * Mantém o tráfego dos usuários ativos na instância `blue` enquanto a nova versão (`green`) é provisionada em paralelo.
   * Realiza a comutação atômica de tráfego somente após aprovação integral no Readiness Gate (`/api/health/ready`), preservando sessões JWT stateless sem derrubar conexões.

3. **Verificação Automatizada (Pytest + k6):**
   * **Suíte de Integração BDD (CI/CD):**
     ```bash
     pytest backend/tests/integration/test_availability_driver.py -v
     ```
   * **Teste de Carga Contínua com k6:**
     ```bash
     k6 run -e BASE_URL=http://localhost:5000 infra/k6/availability_driver_002.js
     ```

---

## Driver Arquitetural `DA-USA-I1-003` — Usabilidade: Controle de Mídia via Atalhos de Teclado (`SCRUM-20`)

Para atender ao requisito de **Usabilidade** na Release 2 (controle de mídia com 0 perdas de foco/cursor durante a digitação de transcrições):

1. **Listener Global de Atalhos (`useMediaKeyboardShortcuts`):**
   * Captura combinações prioritárias:
     * `Ctrl + Espaço`: Alterna Play / Pause instantaneamente.
     * `Ctrl + Seta Esquerda`: Retrocede 5 segundos mantendo o piso `start_time_seconds`.
     * `Ctrl + Seta Abaixo`: Reinicia o trecho a partir do início (Replay).
   * Aplica `event.preventDefault()` e `event.stopPropagation()` para suprimir efeitos colaterais no navegador (como inserção de espaços ou quebras de linha).
   * Restaura atipicamente e assegura o foco no `textarea` ativo via `requestAnimationFrame` e `setSelectionRange`, garantindo que o cursor de texto permaneça ativo e piscando na exata posição em que estava.

2. **Verificação Automatizada no Frontend (CI/CD):**
   ```bash
   npm --prefix frontend test
   ```

---

## Containerização (Docker & Docker Compose) e Primeiro Deploy Local (`US-167` / `SCRUM-167`)

Na Sprint 3, a plataforma **Dictadle** conta com uma estrutura completa de containerização e orquestração via **Docker Compose** para provisionamento padronizado e deploy local com um único comando.

### 1. Arquitetura de Contêineres
* **`dictadle-db` (`postgres:16-alpine`):** Banco de dados relacional com volume persistente `dictadle_postgres_data` e *healthcheck* ativo via `pg_isready` (exposto no host na porta `5433` por padrão para coexistir sem conflito com instalações nativas do PostgreSQL na porta `5432`).
* **`dictadle-backend` (`backend/Dockerfile`):** Imagem Python 3.11 com servidor WSGI **Gunicorn**, script [`entrypoint.sh`](../backend/entrypoint.sh) que aguarda o banco, aplica automaticamente as migrações Alembic (`flask db upgrade`) e garante o usuário administrador inicial (`flask seed-admin`), além de `HEALTHCHECK` consultando `/api/health/ready`.
* **`dictadle-frontend` (`frontend/Dockerfile` + `frontend/nginx.conf`):** Build *multi-stage* (Node 20 Alpine $\rightarrow$ Nginx 1.27 Alpine) servindo o bundle React em produção na porta `8080`, com suporte a rotas SPA (`try_files $uri $uri/ /index.html`), compressão Gzip e **Proxy Reverso (`/api/`)** direcionado para `http://backend:5000/api/`.
* **Rede Isolada:** Todos os serviços comunicam-se internamente pela rede bridge `dictadle-net`.

### 2. Guia Passo a Passo para o Deploy Local

1. **(Opcional) Customizar Variáveis de Ambiente:**
   Copie o arquivo `.env.example` na raiz do projeto para `.env` caso deseje alterar portas ou credenciais padrão:
   ```bash
   cp .env.example .env
   ```

2. **Construir as Imagens e Iniciar o Deploy Local:**
   Na raiz do repositório, execute:
   ```bash
   docker compose up -d --build
   ```

3. **Verificar o Status e Healthchecks dos Contêineres:**
   ```bash
   docker compose ps
   ```
   * Endpoints disponíveis após a subida:
     * **Aplicação Web (Frontend + Proxy Nginx):** `http://localhost:8080`
     * **API Backend Direta:** `http://localhost:5000/api/health/ready`
     * **Credenciais Administrativas Padrão (Seed Automático):** `admin@dictadle.com` / `Admin12345`

4. **Consultar Logs em Tempo Real:**
   ```bash
   docker compose logs -f
   ```

5. **Reiniciar ou Encerrar o Ambiente:**
   ```bash
   # Reiniciar preservando os dados no volume dictadle_postgres_data
   docker compose restart

   # Parar e remover os contêineres mantendo o volume de dados
   docker compose down
   ```

6. **Verificação Automatizada da Configuração de Deploy (Pytest):**
   ```bash
   pytest backend/tests/integration/test_docker_deployment_config.py -v
   ```

