from datetime import datetime, timezone
from app.extensions import db
from app.services.video_service import VideoService

class Challenge(db.Model):
    """
    Entidade de Desafio de Transcrição (Listening Challenge).
    Armazena apenas metadados e referências externas de vídeo (Zero Hosting),
    além dos recortes temporais e gabarito oficial.
    """
    __tablename__ = "challenges"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(150), nullable=False)
    video_url = db.Column(db.String(255), nullable=False)
    youtube_video_id = db.Column(db.String(32), nullable=False, index=True)
    start_time_seconds = db.Column(db.Integer, nullable=False)
    end_time_seconds = db.Column(db.Integer, nullable=False)
    difficulty = db.Column(db.String(20), default="medium", nullable=False)
    accent = db.Column(db.String(50), default="American", nullable=False)
    transcript_official = db.Column(db.Text, nullable=False)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=True
    )

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if self.difficulty is None:
            self.difficulty = "medium"
        if self.accent is None:
            self.accent = "American"
        if self.is_active is None:
            self.is_active = True
        if self.created_at is None:
            self.created_at = datetime.now(timezone.utc)
        if self.updated_at is None:
            self.updated_at = datetime.now(timezone.utc)
        if not self.youtube_video_id and self.video_url:
            self.youtube_video_id = VideoService.extract_youtube_video_id(self.video_url)

    @property
    def duration(self) -> int:
        """Duração do recorte em segundos."""
        return max(0, int(self.end_time_seconds) - int(self.start_time_seconds))

    @property
    def embed_url(self) -> str:
        """Gera a URL parametrizada para reprodução no player IFrame do YouTube."""
        return VideoService.build_embed_url(
            self.youtube_video_id,
            self.start_time_seconds,
            self.end_time_seconds,
            controls=0,
            rel=0
        )

    def to_playback_dict(self) -> dict:
        """
        Serializa os dados necessários para a sessão de reprodução do estudante.
        REGRA ANTI-CHEAT: O campo transcript_official JAMAIS deve ser incluído neste dicionário.
        """
        return {
            "id": self.id,
            "title": self.title,
            "youtube_video_id": self.youtube_video_id,
            "embed_url": self.embed_url,
            "start_time_seconds": self.start_time_seconds,
            "end_time_seconds": self.end_time_seconds,
            "duration": self.duration,
            "difficulty": self.difficulty,
            "accent": self.accent
        }

    def to_admin_dict(self) -> dict:
        """Serializa a visão completa do desafio para curadoria administrativa."""
        data = self.to_playback_dict()
        data["video_url"] = self.video_url
        data["transcript_official"] = self.transcript_official
        data["is_active"] = self.is_active
        data["created_at"] = self.created_at.isoformat() if self.created_at else None
        data["updated_at"] = self.updated_at.isoformat() if self.updated_at else None
        return data
