<?php
// Get token
$ch = curl_init('https://tourista-production.up.railway.app/api/auth/login');
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => json_encode(['email' => 'admin@tourista.vn', 'password' => 'Admin@12345']),
    CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 15,
]);
$resp = curl_exec($ch);
curl_close($ch);
$token = json_decode($resp, true)['data']['accessToken'] ?? null;
echo "Token OK\n";

// Build multipart with correct boundary (like axios does)
$boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
$file = 'C:\Users\ducan\Downloads\data01.csv';
$fileContent = file_get_contents($file);

$body = '';
$body .= "--$boundary\r\n";
$body .= 'Content-Disposition: form-data; name="file"; filename="data01.csv"' . "\r\n";
$body .= "Content-Type: text/csv\r\n\r\n";
$body .= $fileContent . "\r\n";
$body .= "--$boundary--\r\n";

// Send request
$ch = curl_init('https://tourista-production.up.railway.app/api/admin/hotels/import/parse');
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => $body,
    CURLOPT_HTTPHEADER => [
        "Content-Type: multipart/form-data; boundary=$boundary",
        'Authorization: Bearer ' . $token,
    ],
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 60,
    CURLOPT_VERBOSE => false,
]);
$resp = curl_exec($ch);
$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$err = curl_error($ch);
curl_close($ch);

echo "HTTP: $code\n";
echo "CURL_ERR: $err\n";

$json = json_decode($resp, true);
echo "Full JSON:\n" . json_encode($json, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n";
