// API Base URL
const API_URL = 'http://localhost:5001';

// DOM Elements
const authModal = document.getElementById('authModal');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const showSignupBtn = document.getElementById('showSignup');
const showLoginBtn = document.getElementById('showLogin');
const authTitle = document.getElementById('authTitle');
const appContainer = document.getElementById('appContainer');
const userMenu = document.getElementById('userMenu');
const usernameDisplay = document.getElementById('usernameDisplay');
const logoutBtn = document.getElementById('logoutBtn');
const profileBtn = document.getElementById('profileBtn');
const historyBtn = document.getElementById('historyBtn');

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

// Profile Modal
const profileModal = document.getElementById('profileModal');
const closeProfileModal = document.getElementById('closeProfileModal');
const profileUsername = document.getElementById('profileUsername');
const profileEmail = document.getElementById('profileEmail');
const profileMemberSince = document.getElementById('profileMemberSince');
const profileTransCount = document.getElementById('profileTransCount');

// History Modal
const historyModal = document.getElementById('historyModal');
const closeHistoryModal = document.getElementById('closeHistoryModal');
const historyContent = document.getElementById('historyContent');

let currentTranscript = '';
let currentUser = null;

// ==================== AUTHENTICATION ====================

// Check if user is already authenticated
async function checkAuth() {
    try {
        const response = await fetch(`${API_URL}/api/check-auth`, {
            credentials: 'include'
        });
        const data = await response.json();
        
        if (data.authenticated) {
            currentUser = data.user;
            showApp();
        } else {
            showAuthModal();
        }
    } catch (error) {
        console.error('Auth check failed:', error);
        showAuthModal();
    }
}

function showAuthModal() {
    authModal.classList.remove('hidden');
    authModal.style.display = 'flex';
    appContainer.style.display = 'none';
    userMenu.classList.add('hidden');
}

function showApp() {
    authModal.classList.add('hidden');
    authModal.style.display = 'none';
    appContainer.style.display = 'flex';
    userMenu.classList.remove('hidden');
    usernameDisplay.textContent = currentUser.username;
}

// Switch between login and signup forms
showSignupBtn.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.classList.add('hidden');
    signupForm.classList.remove('hidden');
    authTitle.textContent = 'Create Account';
});

showLoginBtn.addEventListener('click', (e) => {
    e.preventDefault();
    signupForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
    authTitle.textContent = 'Welcome Back';
});

// Login Form Handler
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const response = await fetch(`${API_URL}/api/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            currentUser = data.user;
            showToast('Login successful!', 'success');
            showApp();
            loginForm.reset();
        } else {
            showToast(data.error || 'Login failed', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showToast('Network error. Please try again.', 'error');
    }
});

// Signup Form Handler
signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('signupUsername').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    
    try {
        const response = await fetch(`${API_URL}/api/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ username, email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            currentUser = data.user;
            showToast('Account created successfully!', 'success');
            showApp();
            signupForm.reset();
        } else {
            showToast(data.error || 'Signup failed', 'error');
        }
    } catch (error) {
        console.error('Signup error:', error);
        showToast('Network error. Please try again.', 'error');
    }
});

// Logout Handler
logoutBtn.addEventListener('click', async () => {
    try {
        await fetch(`${API_URL}/api/logout`, {
            method: 'POST',
            credentials: 'include'
        });
        
        currentUser = null;
        showToast('Logged out successfully', 'success');
        showAuthModal();
        
        // Clear app state
        resultDiv.textContent = 'Your transcription will appear here...';
        downloadBtn.classList.add('hidden');
        copyBtn.classList.add('hidden');
        fileInfoDiv.classList.add('hidden');
        mediaPreview.classList.add('hidden');
        
    } catch (error) {
        console.error('Logout error:', error);
        showToast('Logout failed', 'error');
    }
});

// ==================== PROFILE ====================

profileBtn.addEventListener('click', async () => {
    profileModal.classList.remove('hidden');
    profileModal.style.display = 'flex';
    
    try {
        const response = await fetch(`${API_URL}/api/profile`, {
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (response.ok) {
            profileUsername.textContent = data.username;
            profileEmail.textContent = data.email;
            profileMemberSince.textContent = new Date(data.member_since).toLocaleDateString();
            profileTransCount.textContent = data.total_transcriptions;
        } else {
            showToast('Failed to load profile', 'error');
        }
    } catch (error) {
        console.error('Profile error:', error);
        showToast('Network error', 'error');
    }
});

closeProfileModal.addEventListener('click', () => {
    profileModal.classList.add('hidden');
    profileModal.style.display = 'none';
});

// ==================== HISTORY ====================

historyBtn.addEventListener('click', async () => {
    historyModal.classList.remove('hidden');
    historyModal.style.display = 'flex';
    historyContent.innerHTML = '<p class="loading-text">Loading history...</p>';
    
    try {
        const response = await fetch(`${API_URL}/api/history`, {
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (response.ok) {
            if (data.history.length === 0) {
                historyContent.innerHTML = '<p class="empty-state">No transcriptions yet. Start by uploading a video!</p>';
            } else {
                historyContent.innerHTML = data.history.map(item => `
                    <div class="history-item">
                        <div class="history-header">
                            <div class="history-filename">
                                <i class="fas fa-file-video"></i>
                                ${item.filename}
                            </div>
                            <div class="history-date">
                                ${new Date(item.created_at).toLocaleDateString()}
                            </div>
                        </div>
                        <div class="history-preview">${item.transcript}</div>
                        <div class="history-meta">
                            <span class="history-language">
                                <i class="fas fa-language"></i>
                                ${item.language.toUpperCase()}
                            </span>
                        </div>
                    </div>
                `).join('');
            }
        } else {
            historyContent.innerHTML = '<p class="error-text">Failed to load history</p>';
        }
    } catch (error) {
        console.error('History error:', error);
        historyContent.innerHTML = '<p class="error-text">Network error</p>';
    }
});

closeHistoryModal.addEventListener('click', () => {
    historyModal.classList.add('hidden');
    historyModal.style.display = 'none';
});

// Close modals when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === profileModal) {
        profileModal.classList.add('hidden');
        profileModal.style.display = 'none';
    }
    if (e.target === historyModal) {
        historyModal.classList.add('hidden');
        historyModal.style.display = 'none';
    }
});

// ==================== THEME ====================

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

// ==================== FILE UPLOAD ====================

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

// ==================== TRANSCRIPTION ====================

transcribeBtn.addEventListener('click', async () => {
    const file = fileInput.files[0];
    if (!file) {
        showToast('Please select a media file first!', 'error');
        return;
    }

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
        const response = await fetch(`${API_URL}/transcribe`, {
            method: 'POST',
            credentials: 'include',
            body: formData
        });

        const data = await response.json();

        if (response.ok) {
            currentTranscript = data.text;
            resultDiv.textContent = data.text;
            languageInfo.innerHTML = `<i class="fas fa-language"></i> ${data.language.toUpperCase()}`;
            languageInfo.classList.remove('hidden');
            
            downloadBtn.classList.remove('hidden');
            copyBtn.classList.remove('hidden');
            
            showToast('Transcription completed successfully!', 'success');
            resultDiv.scrollIntoView({ behavior: 'smooth' });
        } else {
            resultDiv.textContent = `Error: ${data.error}`;
            showToast(data.error || 'Transcription failed!', 'error');
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
        const textArea = document.createElement('textarea');
        textArea.value = currentTranscript;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showToast('Copied to clipboard!', 'success');
    }
});

// ==================== TOAST ====================

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

// ==================== INITIALIZE ====================

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    checkAuth();
});