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
