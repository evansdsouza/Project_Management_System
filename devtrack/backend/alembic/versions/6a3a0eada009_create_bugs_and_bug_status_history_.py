"""create bugs and bug_status_history tables

Revision ID: 6a3a0eada009
Revises: b067c2bda1f3
Create Date: 2026-08-02 18:02:32.423079

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '6a3a0eada009'
down_revision: Union[str, Sequence[str], None] = 'b067c2bda1f3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# `priority` and `backlog_status` were already created by the requirements
# migration — reference them with create_type=False so this migration
# doesn't try to CREATE TYPE a second time. `bug_type` and `bug_status` are
# new here, so they're created explicitly up front and dropped on downgrade.
bug_type = postgresql.ENUM(
    'Logic Error', 'System Error', 'Both', name='bug_type', create_type=False
)
bug_status = postgresql.ENUM(
    'Open', 'In Progress', 'Partial Fix', 'Fixed', name='bug_status', create_type=False
)
priority = postgresql.ENUM(
    'Critical', 'High', 'Medium', 'Low', name='priority', create_type=False
)
backlog_status = postgresql.ENUM(
    'In Backlog', 'Active', name='backlog_status', create_type=False
)


def upgrade() -> None:
    """Upgrade schema."""
    bind = op.get_bind()
    bug_type.create(bind, checkfirst=True)
    bug_status.create(bind, checkfirst=True)

    op.create_table('bugs',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('project_id', sa.Integer(), nullable=False),
    sa.Column('requirement_id', sa.Integer(), nullable=True),
    sa.Column('title', sa.String(length=200), nullable=False),
    sa.Column('description', sa.Text(), nullable=True),
    sa.Column('type', bug_type, nullable=False),
    sa.Column('status', bug_status, nullable=False),
    sa.Column('priority', priority, nullable=False),
    sa.Column('backlog_status', backlog_status, nullable=True),
    sa.Column('fix_notes', sa.Text(), nullable=True),
    sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['requirement_id'], ['requirements.id'], ondelete='SET NULL'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_bugs_project_id'), 'bugs', ['project_id'], unique=False)
    op.create_index(op.f('ix_bugs_requirement_id'), 'bugs', ['requirement_id'], unique=False)
    op.create_table('bug_status_history',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('bug_id', sa.Integer(), nullable=False),
    sa.Column('status', bug_status, nullable=False),
    sa.Column('note', sa.Text(), nullable=True),
    sa.Column('changed_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['bug_id'], ['bugs.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_bug_status_history_bug_id'), 'bug_status_history', ['bug_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_bug_status_history_bug_id'), table_name='bug_status_history')
    op.drop_table('bug_status_history')
    op.drop_index(op.f('ix_bugs_requirement_id'), table_name='bugs')
    op.drop_index(op.f('ix_bugs_project_id'), table_name='bugs')
    op.drop_table('bugs')

    bind = op.get_bind()
    bug_status.drop(bind, checkfirst=True)
    bug_type.drop(bind, checkfirst=True)
