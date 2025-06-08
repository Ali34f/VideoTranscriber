from flask import Flask, request, jsonify
from flask_cors import CORS
import whisper
import os
import tempfile
import logging  # Added for logging

app = Flask(__name__)
CORS(app)  # Enable CORS

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load model at startup (with error handling)
try:
    logger.info("Loading Whisper model...")
    model = whisper.load_model("base")
    logger.info("Whisper model loaded successfully")
except Exception as e:
    logger.error(f"Failed to load Whisper model: {str(e)}")
    raise  # Crash early if model can't load

@app.route('/transcribe', methods=['POST'])
def transcribe():
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
    
    video = request.files['file']
    if video.filename == '':
        return jsonify({"error": "No file selected"}), 400

    # Validate file extension
    allowed_extensions = {'.mp4', '.mov', '.mkv', '.webm'}
    if not any(video.filename.lower().endswith(ext) for ext in allowed_extensions):
        return jsonify({"error": "Invalid file type"}), 400

    temp_path = None
    try:
        # Save to temp file
        fd, temp_path = tempfile.mkstemp(suffix=".mp4")
        os.close(fd)  # Close the file descriptor
        video.save(temp_path)
        
        # Verify file was saved
        if not os.path.exists(temp_path):
            return jsonify({"error": "Failed to save file"}), 500
        
        # Transcribe with progress feedback
        logger.info(f"Processing file: {video.filename}")
        result = model.transcribe(temp_path)
        logger.info("Transcription completed")
        
        return jsonify({
            "text": result["text"],
            "language": result["language"]
        })
        
    except Exception as e:
        logger.error(f"Transcription failed: {str(e)}")
        return jsonify({"error": f"Transcription error: {str(e)}"}), 500
        
    finally:
        # Cleanup temp file
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)

if __name__ == '__main__':
    app.run(
        debug=True,
        host='0.0.0.0',  
        port=5001,
        threaded=True  
    )