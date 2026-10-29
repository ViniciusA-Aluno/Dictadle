from flask import Blueprint
from app.routes.auth_routes import list_users, get_user_by_id, update_user, delete_user

user_bp = Blueprint("users", __name__, url_prefix="/api/users")

# Rotas no padrão RESTful sob /api/users
user_bp.add_url_rule("", view_func=list_users, methods=["GET"])
user_bp.add_url_rule("/<int:user_id>", view_func=get_user_by_id, methods=["GET"])
user_bp.add_url_rule("/<int:user_id>", view_func=update_user, methods=["PUT"])
user_bp.add_url_rule("/<int:user_id>", view_func=delete_user, methods=["DELETE"])
