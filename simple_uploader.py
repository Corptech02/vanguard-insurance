#!/usr/bin/env python3
"""
Simple File Upload Server with Progress Tracking
"""

from flask import Flask, request, render_template_string, jsonify
from werkzeug.utils import secure_filename
import os
from datetime import datetime
from pathlib import Path

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 500 * 1024 * 1024  # 500MB max file size
UPLOAD_FOLDER = '/home/corp06/uploaded_files'
Path(UPLOAD_FOLDER).mkdir(exist_ok=True)

HTML_TEMPLATE = '''
<!DOCTYPE html>
<html>
<head>
    <title>📤 File Upload Portal</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        h1 {
            color: #333;
            margin-bottom: 30px;
            text-align: center;
        }
        .upload-area {
            border: 3px dashed #ddd;
            border-radius: 15px;
            padding: 60px 20px;
            text-align: center;
            transition: all 0.3s ease;
            cursor: pointer;
            background: #fafafa;
        }
        .upload-area:hover {
            border-color: #667eea;
            background: #f0f0ff;
        }
        .upload-area.dragover {
            border-color: #667eea;
            background: #e6e6ff;
        }
        #fileInput { display: none; }
        .file-list {
            margin-top: 30px;
        }
        .file-item {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 10px;
            margin-bottom: 10px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .upload-stats {
            background: #f0f4ff;
            padding: 25px;
            border-radius: 15px;
            margin-top: 30px;
            display: none;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }
        .stat-item {
            text-align: center;
            padding: 15px;
            background: white;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        }
        .stat-value {
            font-size: 24px;
            font-weight: bold;
            color: #667eea;
            margin-bottom: 5px;
        }
        .stat-label {
            font-size: 11px;
            color: #666;
            text-transform: uppercase;
        }
        .progress-bar {
            width: 100%;
            height: 8px;
            background: #e0e0e0;
            border-radius: 4px;
            overflow: hidden;
            margin-top: 20px;
        }
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #667eea, #764ba2);
            transition: width 0.3s ease;
        }
        .upload-button {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 15px 40px;
            border-radius: 30px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            width: 100%;
            margin-top: 20px;
            transition: transform 0.2s;
        }
        .upload-button:hover { transform: translateY(-2px); }
        .upload-button:disabled { opacity: 0.5; cursor: not-allowed; }
        .success { color: #28a745; }
        .error { color: #dc3545; }
        .server-status {
            position: fixed;
            top: 20px;
            right: 20px;
            background: white;
            padding: 10px 20px;
            border-radius: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .status-dot {
            display: inline-block;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: #28a745;
            margin-right: 10px;
            animation: pulse 2s infinite;
        }
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
    </style>
</head>
<body>
    <div class="server-status">
        <span class="status-dot"></span>
        <span>Server Online</span>
    </div>

    <div class="container">
        <h1>📤 File Upload Portal</h1>

        <div class="upload-area" id="uploadArea">
            <h2>📁 Drop files here or click to browse</h2>
            <p style="margin-top: 10px; color: #666;">Maximum file size: 500MB</p>
            <input type="file" id="fileInput" multiple>
        </div>

        <div id="fileList" class="file-list"></div>

        <div class="upload-stats" id="uploadStats">
            <h3>📊 Upload Progress</h3>
            <div class="stats-grid">
                <div class="stat-item">
                    <div class="stat-value" id="totalSize">0 MB</div>
                    <div class="stat-label">Total Size</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value" id="uploaded">0 MB</div>
                    <div class="stat-label">Uploaded</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value" id="remaining">0 MB</div>
                    <div class="stat-label">Remaining</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value" id="speed">0 KB/s</div>
                    <div class="stat-label">Speed</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value" id="percent">0%</div>
                    <div class="stat-label">Complete</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value" id="fileCount">0/0</div>
                    <div class="stat-label">Files</div>
                </div>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" id="progressBar"></div>
            </div>
            <div style="margin-top: 10px; text-align: center; color: #666; font-size: 14px;" id="progressText">
                Uploading...
            </div>
        </div>

        <button class="upload-button" id="uploadBtn" style="display: none;">Upload Files</button>
    </div>

    <script>
        let selectedFiles = [];
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        const fileList = document.getElementById('fileList');
        const uploadBtn = document.getElementById('uploadBtn');
        const uploadStats = document.getElementById('uploadStats');

        // Click to browse
        uploadArea.onclick = () => fileInput.click();

        // Drag and drop
        uploadArea.ondragover = (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        };

        uploadArea.ondragleave = () => {
            uploadArea.classList.remove('dragover');
        };

        uploadArea.ondrop = (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            handleFiles(e.dataTransfer.files);
        };

        fileInput.onchange = (e) => handleFiles(e.target.files);

        function handleFiles(files) {
            selectedFiles = Array.from(files);
            displayFiles();
            uploadBtn.style.display = selectedFiles.length > 0 ? 'block' : 'none';
        }

        function formatSize(bytes) {
            if (bytes === 0) return '0 B';
            const k = 1024;
            const sizes = ['B', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
        }

        function displayFiles() {
            fileList.innerHTML = '';
            selectedFiles.forEach((file, i) => {
                const item = document.createElement('div');
                item.className = 'file-item';
                item.innerHTML = `
                    <div>
                        <strong>${file.name}</strong>
                        <span style="color: #666; margin-left: 10px;">${formatSize(file.size)}</span>
                    </div>
                    <span id="status-${i}">Ready</span>
                `;
                fileList.appendChild(item);
            });
        }

        uploadBtn.onclick = async () => {
            uploadBtn.disabled = true;
            uploadStats.style.display = 'block';

            const totalBytes = selectedFiles.reduce((sum, f) => sum + f.size, 0);
            let uploadedBytes = 0;
            let completedFiles = 0;
            const startTime = Date.now();

            document.getElementById('totalSize').textContent = formatSize(totalBytes);
            document.getElementById('fileCount').textContent = `0/${selectedFiles.length}`;

            for (let i = 0; i < selectedFiles.length; i++) {
                const file = selectedFiles[i];
                const statusEl = document.getElementById(`status-${i}`);
                statusEl.textContent = 'Uploading...';
                statusEl.style.color = '#007bff';

                const formData = new FormData();
                formData.append('file', file);

                try {
                    const xhr = new XMLHttpRequest();

                    xhr.upload.onprogress = (e) => {
                        if (e.lengthComputable) {
                            const fileProgress = e.loaded;
                            const totalUploaded = uploadedBytes + fileProgress;
                            const percent = (totalUploaded / totalBytes * 100).toFixed(1);
                            const speed = totalUploaded / ((Date.now() - startTime) / 1000);

                            document.getElementById('uploaded').textContent = formatSize(totalUploaded);
                            document.getElementById('remaining').textContent = formatSize(totalBytes - totalUploaded);
                            document.getElementById('percent').textContent = percent + '%';
                            document.getElementById('speed').textContent = formatSize(speed) + '/s';
                            document.getElementById('progressBar').style.width = percent + '%';
                            document.getElementById('progressText').textContent =
                                `${formatSize(totalUploaded)} of ${formatSize(totalBytes)} uploaded`;
                        }
                    };

                    await new Promise((resolve, reject) => {
                        xhr.onload = () => {
                            if (xhr.status === 200) {
                                uploadedBytes += file.size;
                                completedFiles++;
                                statusEl.textContent = '✓ Complete';
                                statusEl.className = 'success';
                                document.getElementById('fileCount').textContent =
                                    `${completedFiles}/${selectedFiles.length}`;
                                resolve();
                            } else {
                                statusEl.textContent = '✗ Failed';
                                statusEl.className = 'error';
                                reject();
                            }
                        };
                        xhr.onerror = () => {
                            statusEl.textContent = '✗ Error';
                            statusEl.className = 'error';
                            reject();
                        };
                        xhr.open('POST', '/upload');
                        xhr.send(formData);
                    });
                } catch (error) {
                    console.error('Upload error:', error);
                }
            }

            document.getElementById('progressText').textContent = 'Upload Complete!';
            setTimeout(() => {
                uploadBtn.disabled = false;
                uploadBtn.textContent = 'Upload More Files';
                selectedFiles = [];
                fileInput.value = '';
            }, 3000);
        };
    </script>
</body>
</html>
'''

@app.route('/')
def index():
    return render_template_string(HTML_TEMPLATE)

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    if file:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = secure_filename(file.filename)
        filename = f"{timestamp}_{filename}"
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)

        return jsonify({
            'message': 'File uploaded successfully',
            'filename': filename,
            'size': os.path.getsize(filepath),
            'path': filepath
        })

if __name__ == '__main__':
    print("\n" + "="*60)
    print("📤 FILE UPLOAD SERVER STARTED")
    print("="*60)
    print(f"Local URL: http://localhost:8999")
    print(f"Network URL: http://192.168.40.232:8999")
    print(f"Upload folder: {UPLOAD_FOLDER}")
    print("="*60 + "\n")

    app.run(host='0.0.0.0', port=8999, debug=False)