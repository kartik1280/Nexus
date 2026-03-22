from flask import Flask, render_template, request, redirect, url_for, session
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from dotenv import load_dotenv
import os

app = Flask(__name__)

load_dotenv()

app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')
app.config['SQLALCHEMY_DATABASE_URI'] = f"mysql+pymysql://root:{os.getenv('DB_PASSWORD')}@localhost/skillswipe"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
bcrypt = Bcrypt(app)


# 👤 User Model (This becomes a table in MySQL)
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)

    def __repr__(self):
        return f"User('{self.email}')"


@app.route('/')
def landing():
    return render_template('landing_page.html')


@app.route('/auth')
def auth():
    return render_template('auth.html')

@app.route('/login', methods=['POST'])
def login():
    print("LOGIN ROUTE HIT")

    email = request.form.get('email')
    password = request.form.get('password')

    user = User.query.filter_by(email=email).first()

    if user and bcrypt.check_password_hash(user.password, password):
        session['user_id'] = user.id
        return redirect(url_for('swipe'))   
    else:
        return "Invalid email or password"


@app.route('/register', methods = ['POST'])
def register():
    print("Register route hit")

    name = request.form.get('name')
    email = request.form.get('email')
    password = request.form.get('password')

    # Hash password
    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')

    # Create user object
    new_user = User(name=name, email=email, password=hashed_password)

    # Save to database
    db.session.add(new_user)
    db.session.commit()

    return redirect(url_for('profile_setup'))

@app.route('/swipe')
def swipe():
    return render_template('swipe.html')

@app.route('/profile-setup')
def profile_setup():
    return render_template('profile_setup.html')

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(debug=True)