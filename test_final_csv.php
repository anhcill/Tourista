<?php
$ch = curl_init('https://tourista-production.up.railway.app/api/auth/login');
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => json_encode(['email' => 'admin@tourista.vn', 'password' => 'Admin@12345']),
    CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 15,
]);
$resp = curl_exec($ch);
$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "Login HTTP: $code\n";
$json = json_decode($resp, true);
$token = $json['data']['accessToken'] ?? $json['result']['accessToken'] ?? null;

if (!$token) {
    echo "Login failed: " . substr($resp, 0, 300) . "\n";
    exit(1);
}
echo "Token: " . substr($token, 0, 30) . "...\n";

// Upload CSV
$file = 'C:\Users\ducan\Downloads\data01.csv';
$fileContent = file_get_contents($file);

$boundary = '----WebKitFormBoundary' . md5(mt_rand());
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
        'Authorization: Bearer ' . $token,
    ],
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 60,
]);
$resp = curl_exec($ch);
$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$err = curl_error($ch);
curl_close($ch);

echo "\nUpload HTTP: $code\n";
if ($err) echo "CURL ERROR: $err\n";

$json = json_decode($resp, true);
if ($json) {
    echo "Success: " . ($json['success'] ?? 'N/A') . "\n";
    echo "Message: " . ($json['message'] ?? 'N/A') . "\n";
    $data = $json['data'] ?? $json['result'] ?? null;
    if (is_array($data)) {
        echo "Rows returned: " . count($data) . "\n";
        if (count($data) > 0) {
            echo "First row title: " . ($data[0]['title'] ?? 'N/A') . "\n";
            echo "Second row title: " . ($data[1]['title'] ?? 'N/A') . "\n";
        }
    } else {
        echo "Data is: " . json_encode($data) . "\n";
    }
} else {
    echo "INVALID JSON:\n" . substr($resp, 0, 500) . "\n";
}
