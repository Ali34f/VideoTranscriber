import tkinter as tk
from tkinter import filedialog, messagebox, scrolledtext, ttk
import whisper
import os
from threading import Thread


class VideoTranscriberApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Video Transcriber")
        self.root.geometry("800x600")
        self.root.minsize(600, 400)

        # Load model once at startup
        self.model = whisper.load_model("base")
        self.transcribing = False

        self.create_widgets()

    def create_widgets(self):
        # Main container frame
        main_frame = tk.Frame(self.root, padx=20, pady=20)
        main_frame.pack(expand=True, fill=tk.BOTH)

        # Header
        header_frame = tk.Frame(main_frame)
        header_frame.pack(fill=tk.X, pady=(0, 20))

        tk.Label(header_frame,
                 text="Video Transcriber",
                 font=("Helvetica", 16, "bold")).pack(side=tk.LEFT)

        # Button frame
        button_frame = tk.Frame(main_frame)
        button_frame.pack(fill=tk.X, pady=(0, 20))

        self.transcribe_btn = ttk.Button(
            button_frame,
            text="Choose Video and Transcribe",
            command=self.start_transcription_thread,
            style="Accent.TButton"
        )
        self.transcribe_btn.pack(fill=tk.X)

        # Progress bar
        self.progress = ttk.Progressbar(
            main_frame,
            orient=tk.HORIZONTAL,
            mode='indeterminate'
        )

        # Text area for transcript
        text_frame = tk.Frame(main_frame)
        text_frame.pack(expand=True, fill=tk.BOTH)

        tk.Label(text_frame, text="Transcript:", font=("Helvetica", 11)).pack(anchor=tk.W)

        self.text_area = scrolledtext.ScrolledText(
            text_frame,
            wrap=tk.WORD,
            font=("Helvetica", 11),
            padx=10,
            pady=10
        )
        self.text_area.pack(expand=True, fill=tk.BOTH)

        # Status bar
        self.status_var = tk.StringVar()
        self.status_var.set("Ready")
        status_bar = ttk.Label(
            self.root,
            textvariable=self.status_var,
            relief=tk.SUNKEN,
            anchor=tk.W
        )
        status_bar.pack(side=tk.BOTTOM, fill=tk.X)

        # Configure styles
        self.configure_styles()

    def configure_styles(self):
        style = ttk.Style()
        style.configure("Accent.TButton", font=("Helvetica", 11), padding=6)

    def start_transcription_thread(self):
        if self.transcribing:
            return

        file_path = filedialog.askopenfilename(
            filetypes=[
                ("Video files", "*.mp4 *.mov *.mkv *.avi"),
                ("All files", "*.*")
            ]
        )

        if not file_path:
            return

        self.transcribing = True
        self.progress.pack(fill=tk.X, pady=(0, 20))
        self.progress.start()
        self.status_var.set(f"Transcribing: {os.path.basename(file_path)}...")
        self.transcribe_btn.config(state=tk.DISABLED)

        Thread(target=self.transcribe_video, args=(file_path,), daemon=True).start()

    def transcribe_video(self, file_path):
        try:
            result = self.model.transcribe(file_path)
            transcript = result["text"]

            base_name = os.path.splitext(os.path.basename(file_path))[0]
            output_path = os.path.join(
                os.path.dirname(file_path),
                f"{base_name}_transcript.txt"
            )

            with open(output_path, "w", encoding="utf-8") as f:
                f.write(transcript)

            self.root.after(0, self.show_result, transcript, output_path)

        except Exception as e:
            self.root.after(0, self.show_error, str(e))

        finally:
            self.root.after(0, self.reset_ui)

    def show_result(self, transcript, output_path):
        self.text_area.delete("1.0", tk.END)
        self.text_area.insert(tk.END, transcript)
        messagebox.showinfo(
            "Success",
            f"Transcript saved to:\n{output_path}"
        )

    def show_error(self, error_msg):
        messagebox.showerror("Error", error_msg)

    def reset_ui(self):
        self.progress.stop()
        self.progress.pack_forget()
        self.transcribe_btn.config(state=tk.NORMAL)
        self.status_var.set("Ready")
        self.transcribing = False


if __name__ == "__main__":
    root = tk.Tk()

    # Set theme (requires ttkthemes or sun-valley-ttk-theme)
    try:
        from ttkthemes import ThemedStyle

        style = ThemedStyle(root)
        style.set_theme("arc")
    except ImportError:
        pass

    app = VideoTranscriberApp(root)
    root.mainloop()