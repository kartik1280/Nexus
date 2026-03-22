# SkillSwipe - Intelligent Teammate Matching System

SkillSwipe is a full-stack web application that helps students form effective teams 
for hackathons and projects using data-driven matchmaking.
Users create structured profiles with skills, interests, and availability, which are 
processed by a backend matching engine to compute compatibility scores using techniques 
like cosine similarity and Jaccard index. The platform features a swipe-based interface 
for exploring and connecting with potential teammates.

## Setup Instructions

### 1. Clone the repo
git clone https://github.com/kartik1280/Nexus.git
cd Nexus
### 2. Create a virtual environment
python -m venv env
### 3. Activate virtual environment
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
