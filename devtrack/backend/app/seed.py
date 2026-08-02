from app.database import SessionLocal
from app.models.project import Project


def seed():
    db = SessionLocal()
    project = Project(name="Sample Project", description="Seeded for local testing")
    db.add(project)
    db.commit()
    db.close()


if __name__ == "__main__":
    seed()
