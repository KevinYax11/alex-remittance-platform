from pathlib import Path

from alembic import command
from alembic.config import Config
from sqlalchemy import Connection, text


def upgrade_database(connection: Connection) -> None:
    # Only one API instance may update the schema at a time.
    connection.execute(text("SELECT pg_advisory_xact_lock(891423101)"))
    config = Config()
    config.set_main_option(
        "script_location", str(Path(__file__).resolve().parents[2] / "migrations")
    )
    config.attributes["connection"] = connection
    command.upgrade(config, "head")
