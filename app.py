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
        return redirect(url_for('dashboard'))
    else:
        return "Invalid email or password"


@app.route('/register', methods=['POST'])
def register():
    name = request.form.get('name')
    email = request.form.get('email')
    password = request.form.get('password')

    existing_user = User.query.filter_by(email=email).first()
    if existing_user:
        return "Email already registered"

    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')

    new_user = User(name=name, email=email, password=hashed_password)

    try:
        db.session.add(new_user)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        print("REGISTER ERROR:", e)
        return "Something went wrong"

    session['user_id'] = new_user.id
    return redirect(url_for('profile_setup'))


@app.route('/swipe')
def swipe():
    return render_template('swipe.html')


@app.route('/profile-setup', methods=['GET', 'POST'])
def profile_setup():
    if request.method == 'POST':

        user_id = session.get('user_id')
        if not user_id:
            return "User not logged in"

        user = User.query.get(user_id)

        github = request.form.get('github')
        availability = request.form.get('availability')
        commitment = request.form.get('commitment')

        if not availability:
            return "Please select availability"

        commitment = int(commitment) if commitment else None

        # ✅ Create or update profile
        existing_profile = Profile.query.get(user_id)

        if existing_profile:
            profile = existing_profile
            profile.github = github
            profile.commitment_level = commitment
            profile.availability = availability
        else:
            profile = Profile(
                user_id=user_id,
                github=github,
                commitment_level=commitment,
                availability=availability
            )
            db.session.add(profile)

        # =====================
        # Skills / Interests / Roles
        # =====================
        skills_input = request.form.get('skills')
        interests_input = request.form.get('interests')
        roles_input = request.form.get('roles')

        if skills_input:
            for s in skills_input.split(','):
                s = s.strip()
                if not s:
                    continue
                skill = Skill.query.filter_by(name=s).first()
                if not skill:
                    skill = Skill(name=s)
                    db.session.add(skill)
                if skill not in user.skills:
                    user.skills.append(skill)

        if interests_input:
            for i in interests_input.split(','):
                i = i.strip()
                if not i:
                    continue
                interest = Interest.query.filter_by(name=i).first()
                if not interest:
                    interest = Interest(name=i)
                    db.session.add(interest)
                if interest not in user.interests:
                    user.interests.append(interest)

        if roles_input:
            for r in roles_input.split(','):
                r = r.strip()
                if not r:
                    continue
                role = Role.query.filter_by(name=r).first()
                if not role:
                    role = Role(name=r)
                    db.session.add(role)
                if role not in user.roles:
                    user.roles.append(role)

        # ✅ Safe commit
        try:
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            print("PROFILE ERROR:", e)
            return "Something went wrong"

        return redirect(url_for('dashboard'))

    return render_template('profile_setup.html')


@app.route('/dashboard')
def dashboard():
    if 'user_id' not in session:
        return redirect(url_for('auth'))

    user = User.query.get(session['user_id'])

    return render_template('dashboard.html', user=user)


@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('auth'))


@app.route('/api/profiles')
def get_profiles():
    users = User.query.all()

    data = []
    for u in users:
        data.append({
            "id": u.id,
            "name": u.name,
            "skills": ", ".join([s.name for s in u.skills]) if u.skills else "No skills",
            "preferredRole": u.roles[0].name if u.roles else "Developer",
            "availability": u.profile.availability if u.profile else "Flexible",
            "year": "Year ?",
            "pic": "/static/images/default.png"
        })

    return {"profiles": data}

# =========================
# 🚀 RUN APP
# =========================
if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(debug=True)