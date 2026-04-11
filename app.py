from flask import Flask, render_template, request, redirect, url_for, session, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from dotenv import load_dotenv
from sqlalchemy import CheckConstraint
from sqlalchemy.exc import IntegrityError
import os


app = Flask(__name__)

load_dotenv()



VALID_HACKATHONS = [
    "devweek_2026",
    "hack_for_humanity_2026",
    "ghw_2026"
]

app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")

db_url = os.getenv("DATABASE_URL")

if not db_url:
    raise Exception("DATABASE_URL not set")

if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

app.config["SQLALCHEMY_DATABASE_URI"] = db_url
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False


db = SQLAlchemy(app)
bcrypt = Bcrypt(app)


def get_user_team(user_id, hackathon_id):
    return Team.query.join(TeamMember).filter(
        TeamMember.user_id == user_id,
        Team.hackathon_id == hackathon_id
    ).first()

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
        db.Enum(
            'weekends', 'evenings', 'flexible', 'full-time',
            name="availability_enum"
        ),
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
# 💌 INVITES MODEL
# =========================
class Invite(db.Model):
    __tablename__ = 'invites'

    id = db.Column(db.Integer, primary_key=True)

    sender_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    receiver_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

    hackathon_id = db.Column(db.String(100), nullable=False)

    status = db.Column(
        db.Enum(
            'pending', 'accepted', 'rejected',
            name="invite_status_enum"
        ),
        default='pending'
)

    sender = db.relationship('User', foreign_keys=[sender_id])
    receiver = db.relationship('User', foreign_keys=[receiver_id])



class Team(db.Model):
    __tablename__ = 'teams'

    id = db.Column(db.Integer, primary_key=True)
    hackathon_id = db.Column(db.String(100), nullable=False)

    leader_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    leader = db.relationship('User')

    members = db.relationship('TeamMember', backref='team', cascade="all, delete")

    __table_args__ = (
        db.UniqueConstraint('leader_id', 'hackathon_id', name='unique_team_per_hackathon'),
    )


class TeamMember(db.Model):
    __tablename__ = 'team_members'

    id = db.Column(db.Integer, primary_key=True)
    team_id = db.Column(db.Integer, db.ForeignKey('teams.id'))
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))

    user = db.relationship('User')

    __table_args__ = (
        db.UniqueConstraint('team_id', 'user_id', name='unique_team_member'),
    )



class Message(db.Model):
    __tablename__ = "messages"

    id = db.Column(db.Integer, primary_key=True)

    sender_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    receiver_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)

    content = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, server_default=db.func.now())

    sender = db.relationship("User", foreign_keys=[sender_id])
    receiver = db.relationship("User", foreign_keys=[receiver_id])



class TeamPost(db.Model):
    __tablename__ = "team_posts"

    id = db.Column(db.Integer, primary_key=True)

    team_id = db.Column(db.Integer, db.ForeignKey("teams.id"))
    leader_id = db.Column(db.Integer, db.ForeignKey("user.id"))

    hackathon_id = db.Column(db.String(100), nullable=False)

    role_needed = db.Column(db.String(100))
    description = db.Column(db.Text)
    commitment = db.Column(db.String(100))

    created_at = db.Column(db.DateTime, server_default=db.func.now())

    team = db.relationship("Team")
    leader = db.relationship("User")


class JoinRequest(db.Model):
    __tablename__ = "join_requests"
    
    id = db.Column(db.Integer, primary_key=True)

    sender_id = db.Column(db.Integer, db.ForeignKey("user.id"))
    team_id = db.Column(db.Integer, db.ForeignKey("teams.id"))

    status = db.Column(
        db.Enum(
            "pending", "accepted", "rejected",
            name="join_request_status_enum"
        ),
        default="pending"
    )

    __table_args__ = (
    db.UniqueConstraint('sender_id', 'team_id', name='unique_join_request'),
)
    sender = db.relationship("User")
    team = db.relationship("Team")

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
    hackathon_id = request.args.get('hackathon')
    return render_template('swipe.html', hackathon_id=hackathon_id)


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

@app.route('/matches')
def matches():
    if 'user_id' not in session:
        return redirect(url_for('auth'))

    return render_template('match.html')


@app.route('/api/profiles')
def get_profiles():
    if 'user_id' not in session:
        return {"profiles": []}

    current_user = User.query.get(session['user_id'])
    current_skills = set([s.name for s in current_user.skills])

    users = User.query.filter(User.id != current_user.id).all()

    scored_users = []

    for u in users:
        other_skills = set([s.name for s in u.skills])

        if not other_skills:
            score = 0
        else:
            intersection = len(current_skills & other_skills)
            union = len(current_skills | other_skills)
            score = intersection / union if union else 0

        scored_users.append((u, score))

    # 🔥 sort by best match
    scored_users.sort(key=lambda x: x[1], reverse=True)

    data = []
    for u, score in scored_users:
        data.append({
            "id": u.id,
            "name": u.name,
            "skills": ", ".join([s.name for s in u.skills]) if u.skills else "No skills",
            "preferredRole": u.roles[0].name if u.roles else "Developer",
            "availability": u.profile.availability if u.profile else "Flexible",
            "matchScore": round(score * 100),
            "github": u.profile.github if u.profile else ""
        })

    return {"profiles": data}


@app.route('/api/swipe/right', methods=['POST'])
def swipe_right():
    if 'user_id' not in session:
        return {"error": "Not logged in"}, 401

    data = request.get_json()

    sender_id = session['user_id']
    receiver_id = data.get('target_user_id')
    hackathon_id = data.get('hackathon_id')

    if hackathon_id not in VALID_HACKATHONS:
        return {"error": "Invalid hackathon"}, 400

    if not receiver_id or not hackathon_id:
        return {"error": "Missing data"}, 400

    # ❌ Prevent self-invite
    if sender_id == receiver_id:
        return {"error": "Cannot invite yourself"}, 400

    # ❌ Prevent duplicate invite
    existing = Invite.query.filter(
        (
            (Invite.sender_id == sender_id) & (Invite.receiver_id == receiver_id)
        ) |
        (
            (Invite.sender_id == receiver_id) & (Invite.receiver_id == sender_id)
        ),
        Invite.hackathon_id == hackathon_id
    ).first()

    if existing:
        return {"status": "already_sent"}

    invite = Invite(
        sender_id=sender_id,
        receiver_id=receiver_id,
        hackathon_id=hackathon_id
    )

    db.session.add(invite)
    db.session.commit()

    return {"status": "invite_sent"}


@app.route("/api/team/create", methods=["POST"])
def create_team():
    if 'user_id' not in session:
        return {"error": "Not logged in"}, 401

    data = request.get_json()
    hackathon_id = data.get("hackathon_id")
    user_id = session["user_id"]

    if hackathon_id not in VALID_HACKATHONS:
        return {"error": "invalid_hackathon"}

    existing = get_user_team(user_id, hackathon_id)
    if existing:
        return {"status": "already_in_team"}

    try:
        team = Team(
            leader_id=user_id,
            hackathon_id=hackathon_id
        )
        db.session.add(team)
        db.session.flush()

        db.session.add(TeamMember(
            team_id=team.id,
            user_id=user_id
        ))

        db.session.commit()

        return {"status": "team_created"}

    except Exception as e:
        db.session.rollback()
        print("CREATE TEAM ERROR:", e)
        return {"error": "server_error"}

@app.route('/api/team/<hackathon_id>')
def get_team(hackathon_id):
    if 'user_id' not in session:
        return {"members": []}

    user_id = session['user_id']

    team = Team.query.join(TeamMember).filter(
        Team.hackathon_id == hackathon_id,
        TeamMember.user_id == user_id
    ).first()

    if not team:
        return {"members": []}

    members = TeamMember.query.filter_by(team_id=team.id).all()

    data = []
    for m in members:
        u = User.query.get(m.user_id)

        data.append({
            "name": u.name,
            "skills": [s.name for s in u.skills],
            "role": u.roles[0].name if u.roles else "Developer",
            "pic": "/static/images/default.png"
        })

    return {"members": data}

@app.route("/api/invites")
def get_invites():
    if "user_id" not in session:
        return jsonify({"invites": []})
    hackathon_id = request.args.get("hackathon_id")

    if not hackathon_id:
        return jsonify({"invites": []})

    invites = Invite.query.filter_by(
        receiver_id=session["user_id"],
        hackathon_id=hackathon_id
    ).all()

    return jsonify({
        "invites": [
            {
                "invite_id": i.id,
                "sender_name": i.sender.name,
                "hackathon_id": i.hackathon_id
            } for i in invites
        ]
    })

@app.route('/api/invite/respond', methods=['POST'])
def respond_invite():
    if 'user_id' not in session:
        return {"error": "Not logged in"}, 401

    data = request.get_json()
    invite_id = data.get("invite_id")
    action = data.get("action")

    invite = Invite.query.get(invite_id)

    if not invite:
        return {"error": "Invite not found"}, 404

    if invite.receiver_id != session['user_id']:
        return {"error": "Unauthorized"}, 403

    user_id = invite.receiver_id
    hackathon_id = invite.hackathon_id

    try:
        # ❌ already in team
        existing_team = get_user_team(user_id, hackathon_id)
        if existing_team:
            db.session.delete(invite)
            db.session.commit()
            return {"status": "already_in_team"}

        if action == "accept":

            # find sender team
            team = Team.query.filter_by(
                leader_id=invite.sender_id,
                hackathon_id=hackathon_id
            ).first()

            # create team if doesn't exist
            if not team:
                team = Team(
                    leader_id=invite.sender_id,
                    hackathon_id=hackathon_id
                )
                db.session.add(team)
                db.session.flush()

                db.session.add(TeamMember(
                    team_id=team.id,
                    user_id=invite.sender_id
                ))

            # add receiver
            db.session.add(TeamMember(
                team_id=team.id,
                user_id=user_id
            ))

        # delete invite in BOTH accept/reject
        db.session.delete(invite)
        db.session.commit()

        return {"status": "done"}

    except Exception as e:
        db.session.rollback()
        print("INVITE RESPOND ERROR:", e)
        return {"error": "server_error"}, 500

@app.route('/api/my-team')
def my_team():
    if 'user_id' not in session:
        return jsonify({"team": None})

    user_id = session['user_id']
    hackathon_id = request.args.get("hackathon_id")

    if not hackathon_id:
        return jsonify({"team": None})

    # 🔍 find team where user is member
    team = Team.query.filter_by(
        hackathon_id=hackathon_id
    ).join(TeamMember, Team.id == TeamMember.team_id)\
     .filter(TeamMember.user_id == user_id)\
     .first()

    # 👑 fallback: user is leader but no members yet
    if not team:
        team = Team.query.filter_by(
            leader_id=user_id,
            hackathon_id=hackathon_id
        ).first()

    if not team:
        return jsonify({"team": None})

    members = TeamMember.query.filter_by(team_id=team.id).all()

    users = []
    for m in members:
        u = User.query.get(m.user_id)
        users.append({
            "id": u.id,
            "name": u.name,
            "skills": [s.name for s in u.skills],
            "role": u.roles[0].name if u.roles else "Developer",
            "github": u.profile.github if u.profile else ""
        })

    return jsonify({
        "team": {
            "id": team.id,
            "hackathon_id": team.hackathon_id,
            "leader_id": team.leader_id,
            "members": users
        }
    })


@app.route('/api/team/leave', methods=['POST'])
def leave_team():
    if 'user_id' not in session:
        return {"error": "Not logged in"}, 401

    user_id = session['user_id']
    data = request.get_json()
    hackathon_id = data.get("hackathon_id")

    if not hackathon_id:
        return {"error": "Missing hackathon_id"}, 400

    try:
        # find team
        team = Team.query.join(TeamMember).filter(
            Team.hackathon_id == hackathon_id,
            TeamMember.user_id == user_id
        ).first()

        if not team:
            return {"status": "not_in_team"}

        # 👑 leader deletes entire team
        if team.leader_id == user_id:
            TeamMember.query.filter_by(team_id=team.id).delete()
            db.session.delete(team)
            db.session.commit()
            return {"status": "team_deleted"}

        # 👇 member leaves
        member = TeamMember.query.filter_by(
            team_id=team.id,
            user_id=user_id
        ).first()

        if member:
            db.session.delete(member)
            db.session.commit()
            return {"status": "left"}

        return {"status": "not_found"}

    except Exception as e:
        db.session.rollback()
        print("LEAVE TEAM ERROR:", e)
        return {"error": "server_error"}, 500
    


@app.route('/api/stats')
def stats():
    if 'user_id' not in session:
        return {}

    user_id = session['user_id']

    invites_sent = Invite.query.filter_by(sender_id=user_id).count()
    invites_received = Invite.query.filter_by(receiver_id=user_id).count()

    # ✅ count teams user is part of
    teams_joined = db.session.query(TeamMember)\
        .filter_by(user_id=user_id)\
        .count()

    # ✅ count teams created
    teams_created = Team.query.filter_by(leader_id=user_id).count()

    return {
        "matches": invites_received,
        "likes": invites_sent,
        "team": teams_joined,
        "events": teams_created
    }


@app.route('/api/invite/manual', methods=['POST'])
def manual_invite():
    data = request.get_json()

    if "user_id" not in session:
        return {"error": "Not logged in"}, 401

    sender_id = session["user_id"]
    target = data.get("target")
    hackathon_id = data.get("hackathon_id")

    if not hackathon_id:
        return {"error": "Missing hackathon_id"}, 400

    if hackathon_id not in VALID_HACKATHONS:
        return {"error": "Invalid hackathon"}, 400

    # find user
    if str(target).isdigit():
        user = User.query.get(int(target))
    else:
        user = User.query.filter_by(name=target).first()

    if not user:
        return {"error": "User not found"}, 404

    # prevent self invite (NOW SAFE)
    if sender_id == user.id:
        return {"error": "Cannot invite yourself"}, 400

    # check duplicate
    existing = Invite.query.filter(
        (
            (Invite.sender_id == sender_id) & (Invite.receiver_id == user.id)
        ) |
        (
            (Invite.sender_id == user.id) & (Invite.receiver_id == sender_id)
        ),
        Invite.hackathon_id == hackathon_id
    ).first()

    if existing:
        return {"status": "already_sent"}

    # create invite
    invite = Invite(
        sender_id=sender_id,
        receiver_id=user.id,
        hackathon_id=hackathon_id
    )

    db.session.add(invite)
    db.session.commit()

    return {"status": "sent"}


@app.route("/chat")
def chat_page():
    if "user_id" not in session:
        return redirect(url_for("auth"))

    return render_template("personal_chat.html")


@app.route("/api/chat/send", methods=["POST"])
def send_message():
    if "user_id" not in session:
        return {"error": "Not logged in"}, 401

    data = request.get_json()

    receiver_id = data.get("receiver_id")
    content = data.get("content")

    if receiver_id == session["user_id"]:
        return {"error": "Cannot message yourself"}, 400

    if not receiver_id or not content:
        return {"error": "Missing data"}, 400

    msg = Message(
        sender_id=session["user_id"],
        receiver_id=receiver_id,
        content=content
    )

    db.session.add(msg)
    db.session.commit()

    return {"status": "sent"}


@app.route("/api/chat/<int:user_id>")
def get_messages(user_id):
    if "user_id" not in session:
        return {"messages": []}

    current_user = session["user_id"]

    messages = Message.query.filter(
        ((Message.sender_id == current_user) & (Message.receiver_id == user_id)) |
        ((Message.sender_id == user_id) & (Message.receiver_id == current_user))
    ).order_by(Message.timestamp.asc()).all()

    return {
        "messages": [
            {
                "sender_id": m.sender_id,
                "content": m.content,
                "time": m.timestamp.strftime("%I:%M %p")
            } for m in messages
        ]
    }


@app.route("/api/team/post", methods=["POST"])
def create_post():
    if "user_id" not in session:
        return {"error": "Not logged in"}, 401

    data = request.get_json()

    user_id = session["user_id"]
    hackathon_id = data.get("hackathon_id")

    team = get_user_team(user_id, hackathon_id)

    if not team or team.leader_id != user_id:
        return {"error": "Only leader can post"}
    
    if hackathon_id not in VALID_HACKATHONS:
        return {"error": "invalid_hackathon"}

    post = TeamPost(
        team_id=team.id,
        leader_id=user_id,
        hackathon_id=hackathon_id,
        role_needed=data.get("role"),
        description=data.get("description"),
        commitment=data.get("commitment")
    )

    db.session.add(post)
    db.session.commit()

    return {"status": "posted"}



@app.route("/api/team/posts")
def get_posts():
    if "user_id" not in session:
        return {"posts": []}

    hackathon_id = request.args.get("hackathon_id")

    if hackathon_id not in VALID_HACKATHONS:
        return {"error": "invalid_hackathon"}

    posts = TeamPost.query.filter_by(hackathon_id=hackathon_id)\
    .filter(TeamPost.leader_id != session["user_id"])\
    .all()

    
    return {
        "posts": [
            {
                "id": p.id,
                "team_id": p.team_id,
                "leader_name": p.leader.name,
                "role": p.role_needed,
                "desc": p.description,
                "commitment": p.commitment
            } for p in posts
        ]
    }


@app.route("/api/team/request", methods=["POST"])
def request_join():
    if "user_id" not in session:
        return {"error": "Not logged in"}, 401

    data = request.get_json()
    team_id = data.get("team_id")

    # ✅ check duplicate
    existing = JoinRequest.query.filter_by(
        sender_id=session["user_id"],
        team_id=team_id
    ).first()

    if existing:
        return {"status": "already_requested"}

    req = JoinRequest(
        sender_id=session["user_id"],
        team_id=team_id
    )

    db.session.add(req)
    db.session.commit()

    return {"status": "requested"}

@app.route("/api/team/requests")
def get_requests():
    if "user_id" not in session:
        return {"requests": []}

    user_id = session["user_id"]

    teams = Team.query.filter_by(leader_id=user_id).all()
    team_ids = [t.id for t in teams]

    requests = JoinRequest.query.filter(
        JoinRequest.team_id.in_(team_ids)
    ).all()

    return {
        "requests": [
            {
                "id": r.id,
                "name": r.sender.name,
                "team_id": r.team_id
            } for r in requests
        ]
    }


@app.route("/api/team/request/respond", methods=["POST"])
def respond_request():
    data = request.get_json()
    req = JoinRequest.query.get(data.get("request_id"))

    if not req:
        return {"error": "not found"}

    try:
        if data.get("action") == "accept":
            existing_member = TeamMember.query.filter_by(
                team_id=req.team_id,
                user_id=req.sender_id
            ).first()

            if not existing_member:
                db.session.add(TeamMember(
                    team_id=req.team_id,
                    user_id=req.sender_id
                ))

        # ✅ ALWAYS delete request
        db.session.delete(req)

        # ✅ IMPORTANT
        db.session.commit()

        return {"status": "done"}

    except Exception as e:
        db.session.rollback()
        print("REQUEST RESPOND ERROR:", e)
        return {"error": "server_error"}, 500
    

@app.route("/init-db")
def init_db():
    db.create_all()
    return "DB initialized"

# =========================
# 🚀 RUN APP
# =========================

if __name__ == "__main__":
    with app.app_context():
        try:
            db.create_all()
        except Exception as e:
            print("DB INIT ERROR:", e)

    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
    