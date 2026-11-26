"""create user_attempts table

Revision ID: c9d8e7f6a5b4
Revises: a3e4b5c6d7e8
Create Date: 2026-11-19 20:20:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'c9d8e7f6a5b4'
down_revision = 'a3e4b5c6d7e8'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'user_attempts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('challenge_id', sa.Integer(), nullable=False),
        sa.Column('submitted_transcript', sa.Text(), nullable=False),
        sa.Column('accuracy_percentage', sa.Float(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['challenge_id'], ['challenges.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    with op.batch_alter_table('user_attempts', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_user_attempts_challenge_id'), ['challenge_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_user_attempts_user_id'), ['user_id'], unique=False)


def downgrade():
    with op.batch_alter_table('user_attempts', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_user_attempts_user_id'))
        batch_op.drop_index(batch_op.f('ix_user_attempts_challenge_id'))
    op.drop_table('user_attempts')
