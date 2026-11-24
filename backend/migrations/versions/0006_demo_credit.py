"""Give exhausted legacy demo senders a single recorded test credit."""

from alembic import op
import sqlalchemy as sa

revision = "0006"
down_revision = "0005"


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("demo_credit_usd", sa.Numeric(20, 2), nullable=False, server_default="0.00"),
    )
    op.execute("""
        UPDATE users
        SET available_usd = available_usd + 1000.00, demo_credit_usd = 1000.00
        WHERE email = 'sender@sendapayments.com'
          AND role = 'emisor' AND terms_accepted_at IS NULL AND available_usd = 0
    """)


def downgrade() -> None:
    op.execute("UPDATE users SET available_usd = GREATEST(available_usd - demo_credit_usd, 0) WHERE demo_credit_usd > 0")
    op.drop_column("users", "demo_credit_usd")
