from flask import Flask, request, jsonify
from flask_cors import CORS
import whisper
import os
import tempfile

app = Flask(__name__)
CORS(app)  # Enable CORS

model = whisper.load_model("base")  # Load Whisper model

@app.route('/transcribe', methods=['POST'])
def transcribe():
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
    
    video = request.files['file']
    if video.filename == '':
        return jsonify({"error": "No file selected"}), 400

    try:
        # Save to temp file
        _, temp_path = tempfile.mkstemp(suffix=".mp4")
        video.save(temp_path)
        
        # Transcribe
        result = model.transcribe(temp_path)
        os.remove(temp_path)  # Clean up
        
        return jsonify({
            "text": result["text"],
            "language": result["language"]
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)