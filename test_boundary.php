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

// Read file
$file = 'C:\Users\ducan\Downloads\data01.csv';
$fileContent = file_get_contents($file);
echo "File size: " . strlen($fileContent) . " bytes\n";

// Use the EXACT boundary pattern axios uses
$boundary = '----FormBoundary' . md5(mt_rand());

// Build body like axios does
$body = '';
$body .= "--$boundary\r\n";
$body .= 'Content-Disposition: form-data; name="file"; filename="data01.csv"' . "\r\n";
$body .= "Content-Type: text/csv\r\n\r\n";
$body .= $fileContent . "\r\n";
$body .= "--$boundary--\r\n";

// IMPORTANT: Include boundary in Content-Type header
$contentType = "multipart/form-data; boundary=$boundary";

echo "Content-Type: $contentType\n";
echo "Body length: " . strlen($body) . " bytes\n";
echo "First 100 body bytes: " . bin2hex(substr($body, 0, 100)) . "\n\n";

// Send request
$ch = curl_init('https://tourista-production.up.railway.app/api/admin/hotels/import/parse');
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => $body,
    CURLOPT_HTTPHEADER => [
        "Content-Type: $contentType",
        'Authorization: Bearer ' . $token,
    ],
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 60,
]);
$resp = curl_exec($ch);
$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP: $code\n";
$json = json_decode($resp, true);
echo "Success: " . ($json['success'] ?? 'N/A') . "\n";
echo "Message: " . ($json['message'] ?? 'N/A') . "\n";
$data = $json['data'] ?? $json['result'] ?? null;
if (is_array($data)) {
    echo "Rows: " . count($data) . "\n";
    if (count($data) > 0) {
        echo "First: " . ($data[0]['title'] ?? 'N/A') . "\n";
    }
} else {
    echo "Full response: " . substr($resp, 0, 300) . "\n";
}
