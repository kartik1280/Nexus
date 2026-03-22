# SkillSwipe!

## Setup Instructions

### 1. Clone the repo
git clone https://github.com/kartik1280/Nexus.git
cd Nexus

### 2. Create a virtual environment
python -m venv env

### 3. Activate virtual environment
# Windows
env\Scripts\activate

### 4. Install dependencies
pip install -r requirements.txt

### 5. Create a .env file
Create a `.env` file in the root folder and add:
SECRET_KEY=your_secret_key
DB_PASSWORD=your_mysql_password

### 6. Create the database in MySQL
CREATE DATABASE skillswipe;

### 7. Run the app
python app.py
