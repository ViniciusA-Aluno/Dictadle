from datetime import datetime, timezone
from app.extensions import db


class UserAttempt(db.Model):
    """
    Entidade de Tentativa de Transcrição de Desafio (SCRUM-109 / SCRUM-185).
    Armazena o texto bruto submetido pelo estudante (já sem espaços nas extremidades),
    vinculando-o ao usuário e ao desafio, além da acurácia percentual (quando calculada).
    """
    __tablename__ = "user_attempts"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    challenge_id = db.Column(
        db.Integer,
        db.ForeignKey("challenges.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    submitted_transcript = db.Column(db.Text, nullable=False)
    accuracy_percentage = db.Column(db.Float, nullable=True, default=None)
    created_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    user = db.relationship("User", backref=db.backref("attempts", lazy=True))
    challenge = db.relationship("Challenge", backref=db.backref("attempts", lazy=True))

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if self.created_at is None:
            self.created_at = datetime.now(timezone.utc)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "challenge_id": self.challenge_id,
            "submitted_transcript": self.submitted_transcript,
            "accuracy_percentage": self.accuracy_percentage,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
