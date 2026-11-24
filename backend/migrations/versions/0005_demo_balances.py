"""Store demo balances and reconcile them against existing remittances."""

from alembic import op
import sqlalchemy as sa

revision = "0005"
down_revision = "0004"


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("available_usd", sa.Numeric(20, 2), nullable=False, server_default="1000.00"),
    )
    op.add_column(
        "users",
        sa.Column("available_gtq", sa.Numeric(20, 2), nullable=False, server_default="0.00"),
    )
    op.execute("""
        WITH debits AS (
            SELECT user_id, SUM(ROUND(amount_usd::numeric, 2)) AS usd
            FROM transactions WHERE type = 'envio' GROUP BY user_id
        ), credits AS (
            SELECT beneficiary_id, SUM(ROUND(amount_gtq::numeric, 2)) AS gtq
            FROM transactions
            WHERE type = 'envio' AND status = 'confirmado' AND beneficiary_id IS NOT NULL
            GROUP BY beneficiary_id
        ), totals AS (
            SELECT u.id, COALESCE(d.usd, 0) AS sent, COALESCE(c.gtq, 0) AS received
            FROM users u
            LEFT JOIN debits d ON d.user_id = u.id
            LEFT JOIN credits c ON c.beneficiary_id = u.id
        )
        UPDATE users AS u
        SET available_usd = GREATEST(1000.00 - t.sent, 0),
            available_gtq = t.received
        FROM totals AS t WHERE u.id = t.id
    """)
    op.create_check_constraint("ck_users_available_usd_nonnegative", "users", "available_usd >= 0")
    op.create_check_constraint("ck_users_available_gtq_nonnegative", "users", "available_gtq >= 0")


def downgrade() -> None:
    op.drop_constraint("ck_users_available_gtq_nonnegative", "users", type_="check")
    op.drop_constraint("ck_users_available_usd_nonnegative", "users", type_="check")
    op.drop_column("users", "available_gtq")
    op.drop_column("users", "available_usd")
