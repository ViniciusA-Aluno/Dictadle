from flask import Blueprint
from app.routes.auth_routes import delete_user

user_bp = Blueprint("users", __name__, url_prefix="/api/users")

# Rota direta para deleção no padrão REST: DELETE /api/users/<user_id>
user_bp.add_url_rule("/<int:user_id>", view_func=delete_user, methods=["DELETE"])
