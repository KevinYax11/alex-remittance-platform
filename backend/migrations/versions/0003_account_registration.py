"""Allow registered accounts to use both views and record consent."""

from alembic import op
import sqlalchemy as sa

revision = "0003"
down_revision = "0002"


def upgrade() -> None:
    op.execute("ALTER TYPE roleenum ADD VALUE IF NOT EXISTS 'ambos'")
    op.add_column("users", sa.Column("terms_accepted_at", sa.DateTime(timezone=True)))
    op.add_column("users", sa.Column("terms_version", sa.Integer()))


def downgrade() -> None:
    op.execute("UPDATE users SET role = 'emisor' WHERE role = 'ambos'")
    op.execute("CREATE TYPE roleenum_previous AS ENUM ('emisor', 'receptor')")
    op.execute("ALTER TABLE users ALTER COLUMN role TYPE roleenum_previous USING role::text::roleenum_previous")
    op.execute("DROP TYPE roleenum")
    op.execute("ALTER TYPE roleenum_previous RENAME TO roleenum")
    op.drop_column("users", "terms_version")
    op.drop_column("users", "terms_accepted_at")
