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
