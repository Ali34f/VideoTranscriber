const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('videoUpload');
const transcribeBtn = document.getElementById('transcribeBtn');
const resultDiv = document.getElementById('result');
const loadingDiv = document.getElementById('loading');
const downloadBtn = document.getElementById('downloadBtn');
const themeToggle = document.getElementById('themeToggle');
const fileInfoDiv = document.getElementById('fileInfo'); // new element for feedback

// Handle drag-and-drop functionality
dropZone.addEventListener('click', () => fileInput.click());

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    if (e.dataTransfer.files.length) {
        fileInput.files = e.dataTransfer.files;
        updateFileInfo(fileInput.files[0]);
    }
});

// Manual file selection
fileInput.addEventListener('change', () => {
    if (fileInput.files.length) {
        updateFileInfo(fileInput.files[0]);
    }
});

// Transcribe button logic
transcribeBtn.addEventListener('click', async () => {
    if (!fileInput.files[0]) {
        alert("Please select a video or audio file first!");
        return;
    }

    loadingDiv.classList.remove('hidden');
    resultDiv.textContent = '';
    downloadBtn.classList.add('hidden');

    const formData = new FormData();
    formData.append('file', fileInput.files[0]);

    try {
        const response = await fetch('http://localhost:5001/transcribe', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (data.error) {
            resultDiv.textContent = `Error: ${data.error}`;
        } else {
            resultDiv.textContent = `${data.text}\n\n(Detected language: ${data.language})`;

            // Enable download button
            downloadBtn.classList.remove('hidden');
            downloadBtn.onclick = () => {
                const blob = new Blob([data.text], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'transcript.txt';
                a.click();
                URL.revokeObjectURL(url);
            };

            // Auto-scroll to result
            resultDiv.scrollIntoView({ behavior: 'smooth' });

            showToast("✅ Transcription complete!");
        }
    } catch (error) {
        resultDiv.textContent = `Network Error: ${error.message}`;
    } finally {
        loadingDiv.classList.add('hidden');
    }
});

// Theme toggle + save preference
themeToggle.addEventListener('click', () => {
    const dark = document.body.classList.toggle('dark-mode');
    localStorage.setItem("theme", dark ? "dark" : "light");
});

// Load theme preference on page load
window.addEventListener("DOMContentLoaded", () => {
    if (localStorage.getItem("theme") === "dark") {
        document.body.classList.add("dark-mode");
    }
});

// Toast helper
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// File info feedback
function updateFileInfo(file) {
    fileInfoDiv.textContent = `✅ Selected: ${file.name}`;
    fileInfoDiv.classList.remove('hidden');
}