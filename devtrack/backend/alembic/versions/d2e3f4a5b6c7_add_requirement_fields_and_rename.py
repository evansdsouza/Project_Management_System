"""add requirement fields and rename recommended_approach

Revision ID: d2e3f4a5b6c7
Revises: c1d2e3f4a5b6
Create Date: 2026-08-02 19:15:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd2e3f4a5b6c7'
down_revision: Union[str, Sequence[str], None] = 'c1d2e3f4a5b6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('requirements', sa.Column('implementation', sa.Text(), nullable=True))
    op.add_column('requirements', sa.Column('remarks', sa.Text(), nullable=True))
    op.add_column('requirements', sa.Column('deadline', sa.Date(), nullable=True))
    # Hand-written alter_column, not autogenerate — autogenerate cannot
    # detect renames and would emit drop+add, destroying existing data.
    # This is a metadata-only rename in Postgres: no table rewrite, no
    # data loss, every existing recommended_approach value is preserved
    # under the new name.
    op.alter_column('requirements', 'recommended_approach', new_column_name='recom_appr')


def downgrade() -> None:
    op.alter_column('requirements', 'recom_appr', new_column_name='recommended_approach')
    op.drop_column('requirements', 'deadline')
    op.drop_column('requirements', 'remarks')
    op.drop_column('requirements', 'implementation')
