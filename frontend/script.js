const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('videoUpload');
const transcribeBtn = document.getElementById('transcribeBtn');
const resultDiv = document.getElementById('result');
const loadingDiv = document.getElementById('loading');
const downloadBtn = document.getElementById('downloadBtn');
const themeToggle = document.getElementById('themeToggle');
const fileInfoDiv = document.getElementById('fileInfo');

const mediaPreview = document.getElementById('mediaPreview');
const videoPlayer = document.getElementById('videoPlayer');
const audioPlayer = document.getElementById('audioPlayer');

// === Drag & Drop Setup ===
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
        handleFileSelected(fileInput.files[0]);
    }
});

// === Manual File Selection ===
fileInput.addEventListener('change', () => {
    if (fileInput.files.length) {
        handleFileSelected(fileInput.files[0]);
    }
});

// === File Handling & Preview ===
function handleFileSelected(file) {
    updateFileInfo(file);
    showPreview(file);
}

function updateFileInfo(file) {
    fileInfoDiv.textContent = `✅ Selected: ${file.name}`;
    fileInfoDiv.classList.remove('hidden');
}

function showPreview(file) {
    const url = URL.createObjectURL(file);
    const type = file.type;

    // Stop and reset both players
    videoPlayer.pause();
    audioPlayer.pause();
    videoPlayer.removeAttribute('src');
    audioPlayer.removeAttribute('src');
    videoPlayer.load();
    audioPlayer.load();

    videoPlayer.classList.add('hidden');
    audioPlayer.classList.add('hidden');
    mediaPreview.classList.remove('hidden');

    if (type.startsWith('video/')) {
        videoPlayer.src = url;
        videoPlayer.classList.remove('hidden');
    } else if (type.startsWith('audio/')) {
        audioPlayer.src = url;
        audioPlayer.classList.remove('hidden');
    }
}

// === Transcription Logic ===
transcribeBtn.addEventListener('click', async () => {
    const file = fileInput.files[0];
    if (!file) {
        alert("Please select a video or audio file first!");
        return;
    }

    loadingDiv.classList.remove('hidden');
    resultDiv.textContent = '';
    downloadBtn.classList.add('hidden');

    const formData = new FormData();
    formData.append('file', file);

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

            resultDiv.scrollIntoView({ behavior: 'smooth' });
            showToast("✅ Transcription complete!");
        }
    } catch (error) {
        resultDiv.textContent = `Network Error: ${error.message}`;
    } finally {
        loadingDiv.classList.add('hidden');
    }
});

// === Theme Toggle ===
themeToggle.addEventListener('click', () => {
    const isDark = document.body.classList.toggle('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
});

// === Load Theme on Start ===
window.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-mode');
    }
});

// === Toast Notification ===
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}