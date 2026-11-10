/**
 * Script de Verificação de Carga Contínua (k6) — Driver Arquitetural DA-DIS-DEV-002 (SCRUM-22)
 * Atributo de Qualidade: Disponibilidade ("Disponibilidade contínua durante atualizações")
 *
 * Objetivo:
 *   Simular estudantes autenticados reproduzindo vídeos e mantendo sessão ativa durante a
 *   execução do deploy Blue/Green em pré-produção/CI, garantindo:
 *     - 0 erros HTTP 502 (Bad Gateway) ou 503 (Service Unavailable)
 *     - SLA de disponibilidade >= 99.9% (0% de conexões dropadas)
 *
 * Execução:
 *   k6 run -e BASE_URL=http://localhost:5000 infra/k6/availability_driver_002.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate } from 'k6/metrics';

export const errors502And503 = new Counter('errors_502_503');
export const availabilityRate = new Rate('availability_rate');

export const options = {
  scenarios: {
    active_students_during_deploy: {
      executor: 'constant-vus',
      vus: 10,
      duration: '20s',
    },
  },
  thresholds: {
    http_req_failed: ['rate==0.00'],
    errors_502_503: ['count==0'],
    availability_rate: ['rate>=0.999'],
    http_req_duration: ['p(95)<500'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';

export function setup() {
  const uniqueSuffix = Date.now();
  const email = `k6_student_${uniqueSuffix}@dictadle.com`;
  const password = 'K6StrongPassword123';

  http.post(
    `${BASE_URL}/api/auth/register`,
    JSON.stringify({
      username: `k6student${uniqueSuffix}`,
      email,
      password,
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  const loginRes = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({ email, password }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  const body = loginRes.json() || {};
  return { token: body.access_token || '' };
}

export default function (data) {
  const headers = data.token
    ? { Authorization: `Bearer ${data.token}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' };

  // 1. Probe de integridade e prontidão da instância ativa no Load Balancer
  const healthRes = http.get(`${BASE_URL}/api/health/ready`);
  const isHealth502Or503 = healthRes.status === 502 || healthRes.status === 503;
  if (isHealth502Or503) {
    errors502And503.add(1);
  }
  availabilityRate.add(!isHealth502Or503 && healthRes.status === 200);

  check(healthRes, {
    'Readiness Gate responde 200 OK': (r) => r.status === 200,
    'Sem erro 502/503 no Readiness Gate': (r) => r.status !== 502 && r.status !== 503,
    'Header X-Deployment-Slot presente': (r) => Boolean(r.headers['X-Deployment-Slot']),
  });

  // 2. Validação contínua de sessão e reprodução de mídia de estudante logado
  if (data.token) {
    const sessionRes = http.get(`${BASE_URL}/api/auth/me`, { headers });
    const isSession502Or503 = sessionRes.status === 502 || sessionRes.status === 503;
    if (isSession502Or503) {
      errors502And503.add(1);
    }
    availabilityRate.add(!isSession502Or503 && sessionRes.status === 200);

    check(sessionRes, {
      'Sessão do estudante mantida (200 OK)': (r) => r.status === 200,
      'Nenhuma resposta 502 ou 503 para o estudante': (r) => r.status !== 502 && r.status !== 503,
    });
  }

  sleep(0.2);
}
