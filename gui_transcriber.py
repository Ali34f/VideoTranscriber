import tkinter as tk
from tkinter import filedialog, messagebox, scrolledtext
import whisper
import os

model = whisper.load_model("base")

def transcribe_video():
    file_path = filedialog.askopenfilename(filetypes=[("Video files", "*.mp4 *.mov *.mkv")])
    if not file_path:
        return

    try:
        result = model.transcribe(file_path)
        transcript = result["text"]

        base_name = os.path.splitext(os.path.basename(file_path))[0]
        output_path = os.path.join(os.path.dirname(file_path), f"{base_name}_transcript.txt")
        with open(output_path, "w") as f:
            f.write(transcript)

        text_area.delete("1.0", tk.END)
        text_area.insert(tk.END, transcript)
        messagebox.showinfo("Success", f"Transcript saved to:\n{output_path}")
    except Exception as e:
        messagebox.showerror("Error", str(e))

root = tk.Tk()
root.title("Video Transcriber")
root.geometry("700x500")

frame = tk.Frame(root)
frame.pack(pady=20)

btn = tk.Button(frame, text="Choose Video and Transcribe", command=transcribe_video)
btn.pack()

text_area = scrolledtext.ScrolledText(root, wrap=tk.WORD)
text_area.pack(expand=True, fill=tk.BOTH, padx=10, pady=10)

root.mainloop()

