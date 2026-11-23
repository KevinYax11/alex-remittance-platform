"""Adopt the original schema on new and existing databases."""

from alembic import op
import sqlalchemy as sa

revision = "0001"
down_revision = None


def upgrade() -> None:
    inspector = sa.inspect(op.get_bind())
    # Earlier versions created these tables at API startup.
    if not inspector.has_table("users"):
        op.create_table(
            "users",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("full_name", sa.String(), nullable=False),
            sa.Column("email", sa.String(), nullable=False),
            sa.Column("hashed_password", sa.String(), nullable=False),
            sa.Column("role", sa.Enum("emisor", "receptor", name="roleenum"), nullable=False),
        )
        op.create_index("ix_users_id", "users", ["id"])
        op.create_index("ix_users_email", "users", ["email"], unique=True)

    if not inspector.has_table("transactions"):
        op.create_table(
            "transactions",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
            sa.Column("type", sa.Enum("envio", "solicitud", name="transactiontype"), nullable=False),
            sa.Column("status", sa.Enum("pendiente", "confirmado", name="transactionstatus")),
            sa.Column("amount_usd", sa.Float(), nullable=False),
            sa.Column("amount_gtq", sa.Float(), nullable=False),
            sa.Column("exchange_rate", sa.Float(), nullable=False),
            sa.Column("note", sa.String()),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        )
        op.create_index("ix_transactions_id", "transactions", ["id"])
