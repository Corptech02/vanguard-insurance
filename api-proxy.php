<?php
// API Proxy for Database Connector
// This allows the HTTPS Vanguard to access the HTTP API

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Get the request path
$path = $_SERVER['REQUEST_URI'];
$path = str_replace('/api-proxy.php', '', $path);

// API base URL
$api_base = 'http://localhost:8001';

// Handle different endpoints
if ($path === '/api/stats/summary') {
    // Stats endpoint
    $response = file_get_contents($api_base . '/api/stats/summary');
    header('Content-Type: application/json');
    echo $response;
} elseif ($path === '/api/search') {
    // Search endpoint
    $data = json_decode(file_get_contents('php://input'), true);
    $options = [
        'http' => [
            'method' => 'POST',
            'header' => 'Content-Type: application/json',
            'content' => json_encode($data)
        ]
    ];
    $context = stream_context_create($options);
    $response = file_get_contents($api_base . '/api/search', false, $context);
    header('Content-Type: application/json');
    echo $response;
} else {
    // Default
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Invalid endpoint']);
}
?>