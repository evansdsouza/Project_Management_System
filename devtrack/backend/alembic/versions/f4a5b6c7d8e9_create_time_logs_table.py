"""create time_logs table

Revision ID: f4a5b6c7d8e9
Revises: e3f4a5b6c7d8
Create Date: 2026-08-02 19:20:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f4a5b6c7d8e9'
down_revision: Union[str, Sequence[str], None] = 'e3f4a5b6c7d8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Every FK here is SET NULL, not CASCADE — time logs record hours
    # actually worked and must survive deletion of anything they
    # reference (PRD §8 rule 7). project_id is nullable for the same
    # reason, even though the API requires it on create.
    op.create_table(
        'time_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('project_id', sa.Integer(), nullable=True),
        sa.Column('requirement_id', sa.Integer(), nullable=True),
        sa.Column('bug_id', sa.Integer(), nullable=True),
        sa.Column('client', sa.Text(), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('hours', sa.Numeric(precision=5, scale=2), nullable=False),
        sa.Column('logged_date', sa.Date(), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.CheckConstraint('hours > 0', name='ck_time_logs_hours_positive'),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['requirement_id'], ['requirements.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['bug_id'], ['bugs.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_time_logs_project_id'), 'time_logs', ['project_id'], unique=False)
    op.create_index(op.f('ix_time_logs_logged_date'), 'time_logs', ['logged_date'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_time_logs_logged_date'), table_name='time_logs')
    op.drop_index(op.f('ix_time_logs_project_id'), table_name='time_logs')
    op.drop_table('time_logs')
