import whisper
import os
import sys

def transcribe_video(video_path):
    if not os.path.exists(video_path):
        print("Video file not found.")
        return

    print(f"Transcribing: {video_path}")
    model = whisper.load_model("base")  # Options: tiny, base, small, medium, large

    result = model.transcribe(video_path)

    print("\n--- TRANSCRIPT ---\n")
    print(result["text"])

    with open("transcript.txt", "w") as f:
        f.write(result["text"])
    print("Transcript saved to transcript.txt")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python transcribe_video.py path_to_video.mp4")
    else:
        transcribe_video(sys.argv[1])
