from flask import Flask, render_template, request, redirect, url_for, session
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from dotenv import load_dotenv
from sqlalchemy import CheckConstraint
import os

app = Flask(__name__)

load_dotenv()

app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')
app.config['SQLALCHEMY_DATABASE_URI'] = f"mysql+pymysql://root:{os.getenv('DB_PASSWORD')}@localhost/skillswipe"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
bcrypt = Bcrypt(app)

# =========================
# 👤 USER MODEL
# =========================
class User(db.Model):
    __tablename__ = 'user'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)

    def __repr__(self):
        return f"User('{self.email}')"


# =========================
# 🔗 ASSOCIATION TABLES
# =========================
user_skills = db.Table('user_skills',
    db.Column('user_id', db.Integer, db.ForeignKey('user.id'), primary_key=True),
    db.Column('skill_id', db.Integer, db.ForeignKey('skills.id'), primary_key=True)
)

user_interests = db.Table('user_interests',
    db.Column('user_id', db.Integer, db.ForeignKey('user.id'), primary_key=True),
    db.Column('interest_id', db.Integer, db.ForeignKey('interests.id'), primary_key=True)
)

user_roles = db.Table('user_roles',
    db.Column('user_id', db.Integer, db.ForeignKey('user.id'), primary_key=True),
    db.Column('role_id', db.Integer, db.ForeignKey('roles.id'), primary_key=True)
)


# =========================
# 👤 PROFILE MODEL
# =========================
class Profile(db.Model):
    __tablename__ = 'profile'

    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), primary_key=True)

    github = db.Column(db.String(255))

    commitment_level = db.Column(db.Integer)

    availability = db.Column(
        db.Enum('weekends', 'evenings', 'flexible', 'full-time'),
        nullable=False
    )

    gender = db.Column(
        db.Enum('male', 'female', 'non-binary', 'prefer_not_to_say')
    )

    __table_args__ = (
        CheckConstraint('commitment_level BETWEEN 1 AND 10', name='check_commitment'),
    )

    user = db.relationship('User', backref=db.backref('profile', uselist=False))


# =========================
# 🧠 SKILLS MODEL
# =========================
class Skill(db.Model):
    __tablename__ = 'skills'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)

    users = db.relationship('User', secondary=user_skills, backref='skills')


# =========================
# 🎯 INTERESTS MODEL
# =========================
class Interest(db.Model):
    __tablename__ = 'interests'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)

    users = db.relationship('User', secondary=user_interests, backref='interests')


# =========================
# 🧑‍💻 ROLES MODEL
# =========================
class Role(db.Model):
    __tablename__ = 'roles'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)

    users = db.relationship('User', secondary=user_roles, backref='roles')


# =========================
# 🌐 ROUTES
# =========================

@app.route('/')
def landing():
    return render_template('landing_page.html')


@app.route('/auth')
def auth():
    return render_template('auth.html')


@app.route('/login', methods=['POST'])
def login():
    email = request.form.get('email')
    password = request.form.get('password')

    user = User.query.filter_by(email=email).first()

    if user and bcrypt.check_password_hash(user.password, password):
        session['user_id'] = user.id
        return redirect(url_for('swipe'))
    else:
        return "Invalid email or password"


@app.route('/register', methods=['POST'])
def register():
    name = request.form.get('name')
    email = request.form.get('email')
    password = request.form.get('password')

    # 🚫 Prevent duplicate emails
    existing_user = User.query.filter_by(email=email).first()
    if existing_user:
        return "Email already registered"

    # 🔐 Hash password
    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')

    # 👤 Create user
    new_user = User(name=name, email=email, password=hashed_password)

    db.session.add(new_user)
    db.session.commit()

    return redirect(url_for('profile_setup'))


@app.route('/swipe')
def swipe():
    return render_template('swipe.html')


@app.route('/profile-setup')
def profile_setup():
    return render_template('profile_setup.html')


# =========================
# 🚀 RUN APP
# =========================
if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(debug=True)