<?php
// Simulate EXACTLY what axios sends when using FormData (without explicit Content-Type)

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
echo "Token: " . ($token ? "OK" : "FAIL") . "\n\n";

// Simulate axios FormData - NO explicit Content-Type header
// axios lets libcurl auto-detect and set Content-Type with boundary
$file = 'C:\Users\ducan\Downloads\data01.csv';

// Method 1: Let curl handle it (like axios does with FormData, no explicit Content-Type)
echo "=== METHOD 1: No Content-Type header (axios FormData behavior) ===\n";
$ch = curl_init('https://tourista-production.up.railway.app/api/admin/hotels/import/parse');
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => ['file' => new CURLFile($file, 'text/csv', 'data01.csv')],
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer ' . $token,
    ],
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 60,
]);
$resp1 = curl_exec($ch);
$code1 = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);
echo "HTTP: $code1\n";
$json1 = json_decode($resp1, true);
echo "Success: " . ($json1['success'] ?? 'N/A') . "\n";
echo "Message: " . ($json1['message'] ?? substr($resp1, 0, 200)) . "\n\n";

// Method 2: Explicit multipart/form-data WITH boundary (what SHOULD work)
echo "=== METHOD 2: With boundary in Content-Type ===\n";
$fileContent = file_get_contents($file);
$boundary = '----WebKitFormBoundary' . md5(mt_rand());
$body = "--$boundary\r\n";
$body .= 'Content-Disposition: form-data; name="file"; filename="data01.csv"' . "\r\n";
$body .= "Content-Type: text/csv\r\n\r\n";
$body .= $fileContent . "\r\n";
$body .= "--$boundary--\r\n";

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
]);
$resp2 = curl_exec($ch);
$code2 = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);
echo "HTTP: $code2\n";
$json2 = json_decode($resp2, true);
echo "Success: " . ($json2['success'] ?? 'N/A') . "\n";
echo "Message: " . ($json2['message'] ?? substr($resp2, 0, 200)) . "\n";
