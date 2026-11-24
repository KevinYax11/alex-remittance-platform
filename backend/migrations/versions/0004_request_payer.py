"""Assign new money requests to a payer."""

from alembic import op
import sqlalchemy as sa

revision = "0004"
down_revision = "0003"


def upgrade() -> None:
    op.add_column("transactions", sa.Column("requested_from_id", sa.Integer()))
    op.create_foreign_key(
        "transactions_requested_from_id_fkey", "transactions", "users", ["requested_from_id"], ["id"]
    )
    op.create_index("ix_transactions_requested_from_id", "transactions", ["requested_from_id"])


def downgrade() -> None:
    op.drop_index("ix_transactions_requested_from_id", table_name="transactions")
    op.drop_constraint("transactions_requested_from_id_fkey", "transactions", type_="foreignkey")
    op.drop_column("transactions", "requested_from_id")
