# ==============================================================================
# Estágio 1: Build da Aplicação React / Vite (Node 20 Alpine)
# ==============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Instala dependências aproveitando o cache de camadas do Docker
COPY package*.json ./
RUN npm ci

# Copia o código-fonte e compila os estáticos otimizados de produção
COPY . .

ARG VITE_API_URL=/api
ENV VITE_API_URL=${VITE_API_URL}

RUN npm run build

# ==============================================================================
# Estágio 2: Servidor Web de Produção com Proxy Reverso (Nginx Alpine)
# ==============================================================================
FROM nginx:1.27-alpine AS production

# Remove configuração padrão e aplica configuração customizada com suporte a SPA e proxy /api
RUN rm -f /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia artefatos estáticos compilados no estágio de build
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=10s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -qO- http://127.0.0.1/healthz > /dev/null || exit 1

CMD ["nginx", "-g", "daemon off;"]
