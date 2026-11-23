"""Record the intended beneficiary of a remittance."""

from alembic import op
import sqlalchemy as sa

revision = "0002"
down_revision = "0001"


def upgrade() -> None:
    op.add_column("transactions", sa.Column("beneficiary_id", sa.Integer(), nullable=True))
    op.create_foreign_key(
        "transactions_beneficiary_id_fkey", "transactions", "users", ["beneficiary_id"], ["id"]
    )
    op.create_index("ix_transactions_beneficiary_id", "transactions", ["beneficiary_id"])


def downgrade() -> None:
    op.drop_index("ix_transactions_beneficiary_id", table_name="transactions")
    op.drop_constraint("transactions_beneficiary_id_fkey", "transactions", type_="foreignkey")
    op.drop_column("transactions", "beneficiary_id")
