"""add project status and deadline

Revision ID: c1d2e3f4a5b6
Revises: 6a3a0eada009
Create Date: 2026-08-02 19:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c1d2e3f4a5b6'
down_revision: Union[str, Sequence[str], None] = '6a3a0eada009'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Plain TEXT, not an enum — status is a freeform label on Project,
    # unlike Requirement/Bug's constrained status enums. server_default
    # backfills existing rows and stays permanently, since Project.status
    # is server-defaulted on every create too (mirrors Requirement/Bug).
    op.add_column(
        'projects',
        sa.Column('status', sa.Text(), nullable=False, server_default='Not Started'),
    )
    op.add_column('projects', sa.Column('deadline', sa.Date(), nullable=True))


def downgrade() -> None:
    op.drop_column('projects', 'deadline')
    op.drop_column('projects', 'status')
