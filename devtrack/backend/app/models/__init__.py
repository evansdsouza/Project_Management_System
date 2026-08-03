# Importing every model here ensures SQLAlchemy's registry is fully
# populated before mappers configure, so string-based relationship()
# references (e.g. "Requirement") always resolve. Alembic also imports
# this module to populate Base.metadata for autogenerate.
from app.models.project import Project  # noqa: F401
from app.models.requirement import Requirement  # noqa: F401
