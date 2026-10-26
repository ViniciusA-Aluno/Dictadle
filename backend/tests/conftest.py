import pytest
from app import create_app
from app.extensions import db
from app.models.user import User

@pytest.fixture
def app():
    app = create_app("testing")
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()

@pytest.fixture
def client(app):
    return app.test_client()

@pytest.fixture
def sample_user(app):
    user = User(username="joaosilva", email="joao@example.com", role="student")
    user.set_password("SenhaSegura123")
    db.session.add(user)
    db.session.commit()
    return user
