"""add updated_at to challenges

Revision ID: a3e4b5c6d7e8
Revises: 1956bafbb896
Create Date: 2026-11-11 16:30:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'a3e4b5c6d7e8'
down_revision = '1956bafbb896'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('challenges', schema=None) as batch_op:
        batch_op.add_column(sa.Column('updated_at', sa.DateTime(), nullable=True))


def downgrade():
    with op.batch_alter_table('challenges', schema=None) as batch_op:
        batch_op.drop_column('updated_at')
