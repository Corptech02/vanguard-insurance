<?php
// Local ViciDial Proxy - runs within the same domain to avoid mixed content
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Get parameters
$params = $_GET;

// Proxy to ViciDial
$vicidial_url = 'http://localhost/vicidial/non_agent_api.php';
$query = http_build_query($params);
$full_url = $vicidial_url . '?' . $query;

// Make request
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $full_url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);

$response = curl_exec($ch);
$error = curl_error($ch);
curl_close($ch);

if ($error) {
    echo "ERROR: " . $error;
} else {
    echo $response;
}
?>