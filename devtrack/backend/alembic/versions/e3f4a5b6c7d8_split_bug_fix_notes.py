"""split bug fix_notes into recomm_fix, fix, remark

Revision ID: e3f4a5b6c7d8
Revises: d2e3f4a5b6c7
Create Date: 2026-08-02 19:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e3f4a5b6c7d8'
down_revision: Union[str, Sequence[str], None] = 'd2e3f4a5b6c7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('bugs', sa.Column('recomm_fix', sa.Text(), nullable=True))
    op.add_column('bugs', sa.Column('fix', sa.Text(), nullable=True))
    op.add_column('bugs', sa.Column('remark', sa.Text(), nullable=True))
    # Best-effort carry-forward, confirmed with user: no lossless 1:1
    # mapping exists from one legacy field to three, but "fix" (actual
    # fix applied) is the closest semantic match to what fix_notes held.
    op.execute("UPDATE bugs SET fix = fix_notes WHERE fix_notes IS NOT NULL")
    op.drop_column('bugs', 'fix_notes')


def downgrade() -> None:
    op.add_column('bugs', sa.Column('fix_notes', sa.Text(), nullable=True))
    op.execute("UPDATE bugs SET fix_notes = fix WHERE fix IS NOT NULL")
    op.drop_column('bugs', 'remark')
    op.drop_column('bugs', 'fix')
    op.drop_column('bugs', 'recomm_fix')
