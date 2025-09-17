<?php
// Enable CORS for all origins
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Set JSON response type
header('Content-Type: application/json');

// Configuration
$uploadDir = '/home/corp06/uploaded_files/';
$maxFileSize = 5 * 1024 * 1024 * 1024; // 5GB

// Create upload directory if it doesn't exist
if (!file_exists($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}

// Handle POST upload request
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        // Check if file was uploaded
        if (!isset($_FILES['file'])) {
            throw new Exception('No file uploaded');
        }

        $file = $_FILES['file'];

        // Check for upload errors
        if ($file['error'] !== UPLOAD_ERR_OK) {
            throw new Exception('Upload failed with error code: ' . $file['error']);
        }

        // Validate file size
        if ($file['size'] > $maxFileSize) {
            throw new Exception('File too large. Maximum size is 5GB');
        }

        // Generate unique filename
        $timestamp = date('Ymd_His');
        $originalName = basename($file['name']);
        $safeFilename = $timestamp . '_' . preg_replace('/[^a-zA-Z0-9._-]/', '', $originalName);
        $uploadPath = $uploadDir . $safeFilename;

        // Move uploaded file
        if (!move_uploaded_file($file['tmp_name'], $uploadPath)) {
            throw new Exception('Failed to save uploaded file');
        }

        // Return success response
        echo json_encode([
            'success' => true,
            'data' => [
                'filename' => $safeFilename,
                'originalName' => $originalName,
                'size' => $file['size'],
                'url' => 'https://vigagency.com/uploads/' . $safeFilename,
                'message' => 'File uploaded successfully'
            ]
        ]);

    } catch (Exception $e) {
        // Return error response
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => $e->getMessage()
        ]);
    }
} else {
    // Return info for GET requests
    echo json_encode([
        'success' => true,
        'message' => 'Upload server ready',
        'maxFileSize' => $maxFileSize,
        'uploadDir' => $uploadDir
    ]);
}
?>