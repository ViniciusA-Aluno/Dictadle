"""
Serviço de Disponibilidade e Orquestração Blue/Green (DA-DIS-DEV-002 / SCRUM-22).

Garante disponibilidade contínua durante atualizações em produção por meio de:
1. Probes de Liveness e Readiness com verificação ativa de conectividade ao banco de dados.
2. Comutação atômica de tráfego (Blue/Green Cutover Gate) condicionada à integridade total
   da nova versão antes de migrar as requisições dos estudantes ativos.
"""

from flask import current_app
from sqlalchemy import text
from app.extensions import db


class HealthCheckService:
    """Executa verificações de integridade e prontidão (Readiness Gate) da instância."""

    @staticmethod
    def evaluate_readiness():
        """
        Verifica se a instância da aplicação está pronta para receber tráfego de usuários.
        Valida tanto a flag operacional INSTANCE_READY quanto a conectividade ativa com o PostgreSQL/DB.
        """
        slot = current_app.config.get("DEPLOYMENT_SLOT", "blue")
        version = current_app.config.get("APP_VERSION", "2.0.0")
        instance_ready = current_app.config.get("INSTANCE_READY", True)

        if not instance_ready:
            return False, {
                "status": "warming_up",
                "ready": False,
                "database": "initializing",
                "slot": slot,
                "version": version,
                "message": "Instância em aquecimento (aguardando término de inicialização).",
            }, 503

        try:
            db.session.execute(text("SELECT 1"))
            return True, {
                "status": "ok",
                "ready": True,
                "database": "connected",
                "slot": slot,
                "version": version,
                "message": "Dictadle API está online",
            }, 200
        except Exception:
            return False, {
                "status": "unavailable",
                "ready": False,
                "database": "disconnected",
                "slot": slot,
                "version": version,
                "message": "Banco de dados indisponível para recebimento de tráfego.",
            }, 503


class BlueGreenLoadBalancer:
    """
    Orquestrador de tráfego Blue/Green para deploys sem tempo de inatividade (Zero-Downtime).
    Mantém o tráfego dos estudantes na instância ativa (Blue) até que a nova versão (Green)
    passe integralmente no Readiness Gate (/api/health/ready), evitando erros 502 ou 503.
    """

    def __init__(self, initial_app, initial_slot="blue"):
        self._slots = {initial_slot: initial_app}
        self._active_slot = initial_slot
        self._cutover_history = []

    @property
    def active_slot(self):
        return self._active_slot

    @property
    def active_app(self):
        return self._slots[self._active_slot]

    @property
    def cutover_history(self):
        return list(self._cutover_history)

    def register_standby(self, slot_name, candidate_app):
        """Registra uma nova versão (ex: Green) paralelamente ao ambiente ativo."""
        self._slots[slot_name] = candidate_app

    def verify_slot_readiness(self, slot_name):
        """Executa o Readiness Probe (/api/health/ready) na instância candidata antes de migrar tráfego."""
        candidate_app = self._slots.get(slot_name)
        if candidate_app is None:
            return False, 503, {"error": f"Slot '{slot_name}' não registrado."}

        client = candidate_app.test_client()
        response = client.get("/api/health/ready")
        data = response.get_json(silent=True) or {}
        is_ready = response.status_code == 200 and data.get("ready") is True
        return is_ready, response.status_code, data

    def cutover_to(self, target_slot):
        """
        Realiza a comutação atômica de tráfego para `target_slot` somente se o Readiness Gate
        reportar integridade total (HTTP 200 e ready=True). Caso contrário, mantém o tráfego
        no slot atual sem interromper as sessões ativas.
        """
        is_ready, status_code, payload = self.verify_slot_readiness(target_slot)
        if not is_ready:
            self._cutover_history.append({
                "from_slot": self._active_slot,
                "to_slot": target_slot,
                "switched": False,
                "probe_status": status_code,
                "reason": payload.get("message", "Readiness check failed"),
            })
            return False, payload

        previous_slot = self._active_slot
        self._active_slot = target_slot
        self._cutover_history.append({
            "from_slot": previous_slot,
            "to_slot": target_slot,
            "switched": True,
            "probe_status": status_code,
            "version": payload.get("version"),
        })
        return True, payload

    def request(self, method, path, **kwargs):
        """Encaminha uma requisição de usuário para a instância ativa no momento."""
        client = self.active_app.test_client()
        return client.open(path, method=method.upper(), **kwargs)
