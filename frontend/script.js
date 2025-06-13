// DOM Elements
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('videoUpload');
const transcribeBtn = document.getElementById('transcribeBtn');
const resultDiv = document.getElementById('result');
const loadingDiv = document.getElementById('loading');
const downloadBtn = document.getElementById('downloadBtn');
const copyBtn = document.getElementById('copyBtn');
const themeToggle = document.getElementById('themeToggle');
const fileInfoDiv = document.getElementById('fileInfo');
const fileInfoText = document.getElementById('fileInfoText');
const languageInfo = document.getElementById('languageInfo');
const mediaPreview = document.getElementById('mediaPreview');
const videoPlayer = document.getElementById('videoPlayer');
const audioPlayer = document.getElementById('audioPlayer');

let currentTranscript = '';

// Theme Management
const initTheme = () => {
    const savedTheme = localStorage.getItem('theme');
    const isDark = savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    if (isDark) {
        document.body.classList.add('dark-mode');
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
        themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    }
};

themeToggle.addEventListener('click', () => {
    const isDark = document.body.classList.toggle('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    themeToggle.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
});

// File Upload Handlers
dropZone.addEventListener('click', () => fileInput.click());

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    if (!dropZone.contains(e.relatedTarget)) {
        dropZone.classList.remove('dragover');
    }
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    if (e.dataTransfer.files.length) {
        fileInput.files = e.dataTransfer.files;
        handleFileSelected(fileInput.files[0]);
    }
});

fileInput.addEventListener('change', () => {
    if (fileInput.files.length) {
        handleFileSelected(fileInput.files[0]);
    }
});

// File Handling
function handleFileSelected(file) {
    updateFileInfo(file);
    showPreview(file);
    transcribeBtn.disabled = false;
}

function updateFileInfo(file) {
    const fileSize = (file.size / (1024 * 1024)).toFixed(2);
    fileInfoText.textContent = `${file.name} (${fileSize} MB)`;
    fileInfoDiv.classList.remove('hidden');
    fileInfoDiv.classList.add('fade-in');
}

function showPreview(file) {
    const url = URL.createObjectURL(file);
    const type = file.type;

    // Reset players
    videoPlayer.pause();
    audioPlayer.pause();
    videoPlayer.removeAttribute('src');
    audioPlayer.removeAttribute('src');
    videoPlayer.load();
    audioPlayer.load();

    videoPlayer.classList.add('hidden');
    audioPlayer.classList.add('hidden');

    if (type.startsWith('video/')) {
        videoPlayer.src = url;
        videoPlayer.classList.remove('hidden');
        mediaPreview.classList.remove('hidden');
        mediaPreview.classList.add('fade-in');
    } else if (type.startsWith('audio/')) {
        audioPlayer.src = url;
        audioPlayer.classList.remove('hidden');
        mediaPreview.classList.remove('hidden');
        mediaPreview.classList.add('fade-in');
    }
}

// Transcription
transcribeBtn.addEventListener('click', async () => {
    const file = fileInput.files[0];
    if (!file) {
        showToast('Please select a media file first!', 'error');
        return;
    }

    // Update UI
    loadingDiv.classList.remove('hidden');
    loadingDiv.classList.add('fade-in');
    resultDiv.textContent = '';
    downloadBtn.classList.add('hidden');
    copyBtn.classList.add('hidden');
    languageInfo.classList.add('hidden');
    transcribeBtn.disabled = true;

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
            showToast('Transcription failed!', 'error');
        } else {
            currentTranscript = data.text;
            resultDiv.textContent = data.text;
            languageInfo.textContent = `Detected language: ${data.language.toUpperCase()}`;
            languageInfo.classList.remove('hidden');
            
            downloadBtn.classList.remove('hidden');
            copyBtn.classList.remove('hidden');
            
            showToast('Transcription completed successfully!', 'success');
            resultDiv.scrollIntoView({ behavior: 'smooth' });
        }
    } catch (error) {
        resultDiv.textContent = `Network Error: ${error.message}`;
        showToast('Network error occurred!', 'error');
    } finally {
        loadingDiv.classList.add('hidden');
        transcribeBtn.disabled = false;
    }
});

// Download Handler
downloadBtn.addEventListener('click', () => {
    if (!currentTranscript) return;
    
    const blob = new Blob([currentTranscript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Transcript downloaded!', 'success');
});

// Copy Handler
copyBtn.addEventListener('click', async () => {
    if (!currentTranscript) return;
    
    try {
        await navigator.clipboard.writeText(currentTranscript);
        showToast('Copied to clipboard!', 'success');
    } catch (err) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = currentTranscript;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showToast('Copied to clipboard!', 'success');
    }
});

// Toast Notification
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = 'toast';
    
    const icon = type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-triangle';
    toast.innerHTML = `<i class="${icon}"></i> ${message}`;
    
    if (type === 'error') {
        toast.style.background = 'var(--danger-color)';
    }
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'toastIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
});