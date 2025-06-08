document.getElementById('transcribeBtn').addEventListener('click', async () => {
    const fileInput = document.getElementById('videoUpload');
    const resultDiv = document.getElementById('result');
    const loadingDiv = document.getElementById('loading');
    const downloadBtn = document.getElementById('downloadBtn');

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

            showToast("✅ Transcription complete!");
        }
    } catch (error) {
        resultDiv.textContent = `Network Error: ${error.message}`;
    } finally {
        loadingDiv.classList.add('hidden');
    }
});

document.getElementById('themeToggle').addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
});

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}