document.getElementById('transcribeBtn').addEventListener('click', async () => {
    const fileInput = document.getElementById('videoUpload');
    const resultDiv = document.getElementById('result');
    const loadingDiv = document.getElementById('loading');

    if (!fileInput.files[0]) {
        alert("Please select a video file first!");
        return;
    }

    loadingDiv.classList.remove('hidden');
    resultDiv.textContent = '';

    const formData = new FormData();
    formData.append('file', fileInput.files[0]);

    try {
        const response = await fetch('http://localhost:5000/transcribe', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.error) {
            resultDiv.textContent = `Error: ${data.error}`;
        } else {
            resultDiv.textContent = `${data.text}\n\n(Detected language: ${data.language})`;
        }
    } catch (error) {
        resultDiv.textContent = `Network Error: ${error.message}`;
    } finally {
        loadingDiv.classList.add('hidden');
    }
});