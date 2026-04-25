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
curl_close($ch);

$json = json_decode($resp, true);
$token = $json['data']['accessToken'] ?? null;
echo "Token: " . substr($token, 0, 30) . "...\n\n";

// Upload CSV
$file = 'C:\Users\ducan\Downloads\data01.csv';
$fileContent = file_get_contents($file);

$boundary = '----WebKitFormBoundary' . md5(mt_rand());
$body = "--$boundary\r\n";
$body .= "Content-Disposition: form-data; name=\"file\"; filename=\"data01.csv\"\r\n";
$body .= "Content-Type: text/csv\r\n\r\n";
$body .= $fileContent . "\r\n";
$body .= "--$boundary--\r\n";

// Test 1: WITH Content-Type multipart/form-data (the bug that was in code)
echo "=== TEST 1: With Content-Type: multipart/form-data (WRONG - no boundary) ===\n";
$ch = curl_init('https://tourista-production.up.railway.app/api/admin/hotels/import/parse');
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => $body,
    CURLOPT_HTTPHEADER => [
        'Content-Type: multipart/form-data',
        'Authorization: Bearer ' . $token,
    ],
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 60,
]);
$resp1 = curl_exec($ch);
$code1 = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);
echo "HTTP: $code1\n";
echo "Response: " . substr($resp1, 0, 500) . "\n\n";

// Test 2: Without Content-Type header (let server figure it out)
echo "=== TEST 2: Without Content-Type (let curl auto-detect) ===\n";
$ch = curl_init('https://tourista-production.up.railway.app/api/admin/hotels/import/parse');
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => $body,
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer ' . $token,
    ],
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 60,
]);
$resp2 = curl_exec($ch);
$code2 = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);
echo "HTTP: $code2\n";
echo "Response: " . substr($resp2, 0, 500) . "\n";
