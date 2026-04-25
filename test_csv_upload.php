<?php
$file = 'C:\Users\ducan\Downloads\data01.csv';

if (!file_exists($file)) {
    die("File not found: $file\n");
}

$loginData = [
    'email' => 'admin@tourista.vn',
    'password' => 'Admin@123'
];

$ch = curl_init('https://tourista-production.up.railway.app/api/auth/login');
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => json_encode($loginData),
    CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 30,
]);
$loginResponse = curl_exec($ch);
$loginHttpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "Login HTTP: $loginHttpCode\n";
$loginJson = json_decode($loginResponse, true);
$token = $loginJson['data']['accessToken'] ?? $loginJson['result']['accessToken'] ?? null;

if (!$token) {
    echo "No token! Response: " . substr($loginResponse, 0, 500) . "\n";
    exit(1);
}
echo "Got token: " . substr($token, 0, 20) . "...\n";

$fileContent = file_get_contents($file);
echo "File size: " . strlen($fileContent) . " bytes\n";

$boundary = '----WebKitFormBoundary' . md5(time());
$body = "--$boundary\r\n";
$body .= "Content-Disposition: form-data; name=\"file\"; filename=\"data01.csv\"\r\n";
$body .= "Content-Type: text/csv\r\n\r\n";
$body .= $fileContent . "\r\n";
$body .= "--$boundary--\r\n";

$ch = curl_init('https://tourista-production.up.railway.app/api/admin/hotels/import/parse');
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => $body,
    CURLOPT_HTTPHEADER => [
        'Content-Type: multipart/form-data; boundary=' . $boundary,
        'Authorization: Bearer ' . $token
    ],
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 60,
]);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

echo "Upload HTTP: $httpCode\n";
if ($error) echo "CURL Error: $error\n";

$json = json_decode($response, true);
echo "Response keys: " . implode(', ', array_keys($json ?? [])) . "\n";
echo "Success: " . ($json['success'] ?? 'N/A') . "\n";
echo "Message: " . ($json['message'] ?? 'N/A') . "\n";

$data = $json['data'] ?? $json['result'] ?? null;
if ($data) {
    echo "Data count: " . count($data) . "\n";
    if (count($data) > 0) {
        echo "First row title: " . ($data[0]['title'] ?? 'N/A') . "\n";
    }
} else {
    echo "NO DATA in response!\n";
    echo "Full response: " . substr($response, 0, 1000) . "\n";
}
