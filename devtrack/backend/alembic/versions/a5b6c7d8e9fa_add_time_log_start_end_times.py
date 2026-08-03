"""add time_log start_time and end_time

Revision ID: a5b6c7d8e9fa
Revises: f4a5b6c7d8e9
Create Date: 2026-08-02 19:45:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a5b6c7d8e9fa'
down_revision: Union[str, Sequence[str], None] = 'f4a5b6c7d8e9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Added nullable first: you can't add a NOT NULL column to a populated
    # table, and no server_default can express "start + hours".
    op.add_column('time_logs', sa.Column('start_time', sa.Time(), nullable=True))
    op.add_column('time_logs', sa.Column('end_time', sa.Time(), nullable=True))

    # Backfill existing rows at 09:00, spanning their recorded hours.
    #
    # Two Postgres details this depends on:
    #   * make_interval(mins => ...) — `hours` is NUMERIC(5,2) and there is no
    #     numeric * interval operator, so `hours * INTERVAL '1 hour'` errors.
    #   * The CASE guard — `time + interval` WRAPS past midnight, so a 20-hour
    #     entry would land at 05:00 and violate the CHECK below. LEAST() can't
    #     fix this because the wrap happens before LEAST sees the value.
    op.execute(
        """
        UPDATE time_logs
        SET start_time = TIME '09:00',
            end_time = CASE
                WHEN hours >= 15 THEN TIME '23:59'
                ELSE TIME '09:00' + make_interval(mins => round(hours * 60)::int)
            END
        WHERE start_time IS NULL
        """
    )

    op.alter_column('time_logs', 'start_time', nullable=False)
    op.alter_column('time_logs', 'end_time', nullable=False)

    # Overnight spans are deliberately forbidden — rendering a midnight-crossing
    # block would mean splitting it across two day columns in the hour grid.
    # Split such work into two entries instead.
    op.create_check_constraint(
        'ck_time_logs_time_span_valid', 'time_logs', 'end_time > start_time'
    )


def downgrade() -> None:
    op.drop_constraint('ck_time_logs_time_span_valid', 'time_logs', type_='check')
    op.drop_column('time_logs', 'end_time')
    op.drop_column('time_logs', 'start_time')
