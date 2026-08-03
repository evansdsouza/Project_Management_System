"""add time_log title

Revision ID: b6c7d8e9fa0b
Revises: a5b6c7d8e9fa
Create Date: 2026-08-02 22:50:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b6c7d8e9fa0b'
down_revision: Union[str, Sequence[str], None] = 'a5b6c7d8e9fa'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('time_logs', sa.Column('title', sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column('time_logs', 'title')
