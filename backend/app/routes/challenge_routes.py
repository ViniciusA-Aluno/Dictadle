"""
Rotas para consumo de Desafios e Reprodução de Mídia (SCRUM-145 / US-91).
Disponibiliza os endpoints necessários para que o aluno receba os dados de reprodução
de forma segura e em estrita conformidade com a política Anti-Cheat (sem gabarito).
"""
from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models.challenge import Challenge
from app.routes.auth_routes import get_authenticated_user
from app.services.validators import validate_challenge_payload

challenge_bp = Blueprint("challenges", __name__, url_prefix="/api/challenges")

@challenge_bp.route("", methods=["POST"])
@challenge_bp.route("/", methods=["POST"])
def create_challenge():
    """
    Criação de novos desafios de transcrição (SCRUM-129 / SCRUM-130 / US-87).
    Acesso estritamente restrito para administradores (role == 'admin').
    Recebe os metadados do vídeo, recortes temporais e gabarito oficial,
    validando estritamente os campos e a integridade da URL do YouTube.
    """
    user, auth_error = get_authenticated_user()
    if auth_error:
        return auth_error

    if user.role != "admin":
        return jsonify({"error": "Acesso restrito para administradores."}), 403

    data = request.get_json(silent=True) or {}
    is_valid, error_msg, clean_data = validate_challenge_payload(data)
    if not is_valid:
        return jsonify({"error": error_msg}), 400

    challenge = Challenge(
        title=clean_data["title"],
        video_url=clean_data["video_url"],
        youtube_video_id=clean_data["youtube_video_id"],
        start_time_seconds=clean_data["start_time_seconds"],
        end_time_seconds=clean_data["end_time_seconds"],
        difficulty=clean_data["difficulty"],
        accent=clean_data["accent"],
        transcript_official=clean_data["transcript_official"],
        is_active=True
    )

    db.session.add(challenge)
    db.session.commit()

    return jsonify({
        "message": "Desafio cadastrado com sucesso!",
        "challenge": challenge.to_admin_dict()
    }), 201

@challenge_bp.route("/<int:challenge_id>/playback", methods=["GET"])
def get_challenge_playback(challenge_id: int):
    """
    Cenários 1, 3 e 4:
    Retorna os metadados necessários para o player IFrame reproduzir o recorte de mídia.
    Exige autenticação JWT válida e nunca expõe a transcrição oficial (transcript_official).
    """
    user, auth_error = get_authenticated_user()
    if auth_error:
        return auth_error

    challenge = db.session.get(Challenge, challenge_id) if hasattr(db.session, "get") else Challenge.query.get(challenge_id)
    if not challenge or not challenge.is_active:
        return jsonify({"error": "Desafio não encontrado"}), 404

    if not challenge.youtube_video_id:
        return jsonify({"error": "Mídia do desafio corrompida ou inválida"}), 422

    return jsonify(challenge.to_playback_dict()), 200

@challenge_bp.route("/daily/playback", methods=["GET"])
def get_daily_challenge_playback():
    """
    Endpoint de conveniência para obter a reprodução do desafio diário ativo.
    """
    user, auth_error = get_authenticated_user()
    if auth_error:
        return auth_error

    challenge = Challenge.query.filter_by(is_active=True).order_by(Challenge.id.asc()).first()
    if not challenge:
        return jsonify({"error": "Desafio não encontrado"}), 404

    return jsonify(challenge.to_playback_dict()), 200
