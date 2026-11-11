"""
Rotas para consumo de Desafios e Reprodução de Mídia (SCRUM-145 / US-91).
Disponibiliza os endpoints necessários para que o aluno receba os dados de reprodução
de forma segura e em estrita conformidade com a política Anti-Cheat (sem gabarito).
"""
from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models.challenge import Challenge
from app.routes.auth_routes import get_authenticated_user
from app.services.validators import validate_challenge_payload, sanitize_pagination_params

challenge_bp = Blueprint("challenges", __name__, url_prefix="/api/challenges")

@challenge_bp.route("", methods=["GET"])
@challenge_bp.route("/", methods=["GET"])
def list_challenges():
    """
    Listagem paginada de desafios com filtros e busca (SCRUM-137 / US-90).
    Acesso restrito para administradores (role == 'admin').
    Suporta paginação (page, per_page), busca textual por título (search)
    e filtros por dificuldade (difficulty), sotaque (accent) e status (status/is_active).
    """
    user, auth_error = get_authenticated_user()
    if auth_error:
        return auth_error

    if user.role != "admin":
        return jsonify({"error": "Acesso restrito para administradores."}), 403

    page_raw = request.args.get("page", 1)
    per_page_raw = request.args.get("per_page", 10)
    page, per_page = sanitize_pagination_params(page_raw, per_page_raw, default_per_page=10)

    search = request.args.get("search", "", type=str).strip()
    difficulty = request.args.get("difficulty", "", type=str).strip().lower()
    accent = request.args.get("accent", "", type=str).strip()
    status = request.args.get("status", "", type=str).strip().lower()
    is_active_raw = request.args.get("is_active", None)

    query = Challenge.query

    # Busca textual no título do desafio
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(Challenge.title.ilike(search_pattern))

    # Filtro por dificuldade
    if difficulty and difficulty != "all":
        query = query.filter(Challenge.difficulty == difficulty)

    # Filtro por sotaque
    if accent and accent.lower() != "all":
        accent_pattern = f"%{accent}%"
        query = query.filter(Challenge.accent.ilike(accent_pattern))

    # Filtro por status (ativo / inativo)
    if status == "active" or is_active_raw in ("true", "1", "True"):
        query = query.filter(Challenge.is_active.is_(True))
    elif status in ("inactive", "disabled") or is_active_raw in ("false", "0", "False"):
        query = query.filter(Challenge.is_active.is_(False))

    query = query.order_by(Challenge.created_at.desc(), Challenge.id.desc())
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    challenges_data = [c.to_admin_dict() for c in pagination.items]

    return jsonify({
        "challenges": challenges_data,
        "total": pagination.total,
        "page": pagination.page,
        "per_page": pagination.per_page,
        "pages": pagination.pages,
        "has_prev": pagination.has_prev,
        "has_next": pagination.has_next
    }), 200

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

@challenge_bp.route("/active", methods=["GET"])
def list_active_challenges():
    """
    Retorna a lista de desafios ativos para reprodução pelo estudante.
    Em estrita conformidade com a política Anti-Cheat (nunca expõe transcript_official).
    """
    user, auth_error = get_authenticated_user()
    if auth_error:
        return auth_error

    challenges = Challenge.query.filter_by(is_active=True).order_by(Challenge.id.asc()).all()
    return jsonify({
        "challenges": [c.to_playback_dict() for c in challenges],
        "total": len(challenges)
    }), 200
