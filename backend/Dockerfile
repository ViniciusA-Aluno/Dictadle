FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    FLASK_APP=wsgi.py \
    FLASK_ENV=production \
    PORT=5000

WORKDIR /app

# Instala dependências Python de forma determinística
COPY requirements.txt /app/requirements.txt
RUN python -m pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r /app/requirements.txt

# Copia código-fonte da API e script de inicialização
COPY . /app

# Normaliza quebras de linha (CRLF -> LF para ambientes Windows) e garante permissão de execução
RUN sed -i 's/\r$//' /app/entrypoint.sh && \
    chmod +x /app/entrypoint.sh

EXPOSE 5000

# Readiness Probe nativo em Python consultando o Readiness Gate (DA-DIS-DEV-002 / SCRUM-22 / SCRUM-168)
HEALTHCHECK --interval=10s --timeout=5s --start-period=15s --retries=5 \
    CMD python -c "import urllib.request, sys; resp = urllib.request.urlopen('http://localhost:5000/api/health/ready', timeout=4); sys.exit(0 if resp.status == 200 else 1)"

ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "2", "--timeout", "60", "wsgi:app"]
