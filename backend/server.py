from flask import Flask, request, jsonify, session
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
import whisper
import os
import tempfile
import logging
import sqlite3
from datetime import datetime
import secrets

app = Flask(__name__)
app.secret_key = secrets.token_hex(32)  # Secure secret key

# Configure CORS with credentials support
CORS(app, supports_credentials=True, origins=["http://localhost:8000", "http://127.0.0.1:8000"])

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Database setup
DATABASE = 'transcriber.db'

def get_db():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initialize the database with users and transcriptions tables"""
    conn = get_db()
    cursor = conn.cursor()
    
    # Users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Transcriptions table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS transcriptions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            filename TEXT NOT NULL,
            transcript TEXT NOT NULL,
            language TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    conn.commit()
    conn.close()
    logger.info("Database initialized successfully")

# Initialize database on startup
init_db()

# Load Whisper model at startup
try:
    logger.info("Loading Whisper model...")
    model = whisper.load_model("base")
    logger.info("Whisper model loaded successfully")
except Exception as e:
    logger.error(f"Failed to load Whisper model: {str(e)}")
    raise

# ==================== AUTHENTICATION ROUTES ====================

@app.route('/api/signup', methods=['POST'])
def signup():
    data = request.get_json()
    username = data.get('username', '').strip()
    email = data.get('email', '').strip()
    password = data.get('password', '')
    
    if not username or not email or not password:
        return jsonify({"error": "All fields are required"}), 400
    
    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400
    
    if len(username) < 3:
        return jsonify({"error": "Username must be at least 3 characters"}), 400
    
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        # Check if username or email already exists
        cursor.execute("SELECT id FROM users WHERE username = ? OR email = ?", (username, email))
        if cursor.fetchone():
            return jsonify({"error": "Username or email already exists"}), 400
        
        # Hash password and create user
        password_hash = generate_password_hash(password)
        cursor.execute(
            "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)",
            (username, email, password_hash)
        )
        conn.commit()
        
        user_id = cursor.lastrowid
        session['user_id'] = user_id
        session['username'] = username
        
        logger.info(f"New user registered: {username}")
        return jsonify({
            "message": "Account created successfully",
            "user": {"id": user_id, "username": username, "email": email}
        }), 201
        
    except Exception as e:
        logger.error(f"Signup error: {str(e)}")
        return jsonify({"error": "Registration failed"}), 500
    finally:
        conn.close()

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username', '').strip()
    password = data.get('password', '')
    
    if not username or not password:
        return jsonify({"error": "Username and password are required"}), 400
    
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
        user = cursor.fetchone()
        
        if not user or not check_password_hash(user['password_hash'], password):
            return jsonify({"error": "Invalid username or password"}), 401
        
        session['user_id'] = user['id']
        session['username'] = user['username']
        
        logger.info(f"User logged in: {username}")
        return jsonify({
            "message": "Login successful",
            "user": {
                "id": user['id'],
                "username": user['username'],
                "email": user['email']
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        return jsonify({"error": "Login failed"}), 500
    finally:
        conn.close()

@app.route('/api/logout', methods=['POST'])
def logout():
    username = session.get('username')
    session.clear()
    logger.info(f"User logged out: {username}")
    return jsonify({"message": "Logged out successfully"}), 200

@app.route('/api/check-auth', methods=['GET'])
def check_auth():
    if 'user_id' in session:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT username, email FROM users WHERE id = ?", (session['user_id'],))
        user = cursor.fetchone()
        conn.close()
        
        if user:
            return jsonify({
                "authenticated": True,
                "user": {
                    "id": session['user_id'],
                    "username": user['username'],
                    "email": user['email']
                }
            }), 200
    
    return jsonify({"authenticated": False}), 200

# ==================== TRANSCRIPTION ROUTES ====================

@app.route('/transcribe', methods=['POST'])
def transcribe():
    # Check authentication
    if 'user_id' not in session:
        return jsonify({"error": "Please login to transcribe videos"}), 401
    
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
        
    video = request.files['file']
    if video.filename == '':
        return jsonify({"error": "No file selected"}), 400

    # Validate file extension
    allowed_extensions = {'.mp4', '.mov', '.mkv', '.webm', '.mp3', '.wav', '.m4a'}
    if not any(video.filename.lower().endswith(ext) for ext in allowed_extensions):
        return jsonify({"error": "Invalid file type"}), 400

    temp_path = None
    try:
        # Save to temp file
        fd, temp_path = tempfile.mkstemp(suffix=".mp4")
        os.close(fd)
        video.save(temp_path)
                
        if not os.path.exists(temp_path):
            return jsonify({"error": "Failed to save file"}), 500
                
        # Transcribe
        logger.info(f"Processing file: {video.filename} for user: {session['username']}")
        result = model.transcribe(temp_path)
        logger.info("Transcription completed")
        
        # Save transcription to database
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO transcriptions (user_id, filename, transcript, language) VALUES (?, ?, ?, ?)",
            (session['user_id'], video.filename, result["text"], result["language"])
        )
        conn.commit()
        transcription_id = cursor.lastrowid
        conn.close()
        
        return jsonify({
            "text": result["text"],
            "language": result["language"],
            "id": transcription_id
        })
            
    except Exception as e:
        logger.error(f"Transcription failed: {str(e)}")
        return jsonify({"error": f"Transcription error: {str(e)}"}), 500
            
    finally:
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)

@app.route('/api/history', methods=['GET'])
def get_history():
    if 'user_id' not in session:
        return jsonify({"error": "Authentication required"}), 401
    
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        cursor.execute(
            """SELECT id, filename, transcript, language, created_at 
               FROM transcriptions 
               WHERE user_id = ? 
               ORDER BY created_at DESC 
               LIMIT 50""",
            (session['user_id'],)
        )
        transcriptions = cursor.fetchall()
        
        history = [{
            "id": t['id'],
            "filename": t['filename'],
            "transcript": t['transcript'][:200] + "..." if len(t['transcript']) > 200 else t['transcript'],
            "language": t['language'],
            "created_at": t['created_at']
        } for t in transcriptions]
        
        return jsonify({"history": history}), 200
        
    except Exception as e:
        logger.error(f"History fetch error: {str(e)}")
        return jsonify({"error": "Failed to fetch history"}), 500
    finally:
        conn.close()

@app.route('/api/transcription/<int:trans_id>', methods=['GET'])
def get_transcription(trans_id):
    if 'user_id' not in session:
        return jsonify({"error": "Authentication required"}), 401
    
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        cursor.execute(
            "SELECT * FROM transcriptions WHERE id = ? AND user_id = ?",
            (trans_id, session['user_id'])
        )
        transcription = cursor.fetchone()
        
        if not transcription:
            return jsonify({"error": "Transcription not found"}), 404
        
        return jsonify({
            "id": transcription['id'],
            "filename": transcription['filename'],
            "transcript": transcription['transcript'],
            "language": transcription['language'],
            "created_at": transcription['created_at']
        }), 200
        
    except Exception as e:
        logger.error(f"Transcription fetch error: {str(e)}")
        return jsonify({"error": "Failed to fetch transcription"}), 500
    finally:
        conn.close()

@app.route('/api/profile', methods=['GET'])
def get_profile():
    if 'user_id' not in session:
        return jsonify({"error": "Authentication required"}), 401
    
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        cursor.execute("SELECT username, email, created_at FROM users WHERE id = ?", (session['user_id'],))
        user = cursor.fetchone()
        
        cursor.execute("SELECT COUNT(*) as count FROM transcriptions WHERE user_id = ?", (session['user_id'],))
        trans_count = cursor.fetchone()['count']
        
        return jsonify({
            "username": user['username'],
            "email": user['email'],
            "member_since": user['created_at'],
            "total_transcriptions": trans_count
        }), 200
        
    except Exception as e:
        logger.error(f"Profile fetch error: {str(e)}")
        return jsonify({"error": "Failed to fetch profile"}), 500
    finally:
        conn.close()

if __name__ == '__main__':
    app.run(
        debug=True,
        host='0.0.0.0', 
        port=5001,
        threaded=True  
    )