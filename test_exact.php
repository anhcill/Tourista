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

// Test with exact axios pattern: FormData with NO explicit Content-Type header
// (axios auto-adds multipart/form-data with boundary when sending FormData)

$file = 'C:\Users\ducan\Downloads\data01.csv';
$fileContent = file_get_contents($file);

// Build multipart with axios-style boundary (WebKitFormBoundary)
$boundary = '----WebKitFormBoundary' . md5(mt_rand());
$body = '';
$body .= "--$boundary\r\n";
$body .= 'Content-Disposition: form-data; name="file"; filename="data01.csv"' . "\r\n";
$body .= "Content-Type: text/csv\r\n\r\n";
$body .= $fileContent . "\r\n";
$body .= "--$boundary--\r\n";

echo "=== Sending to Railway (like axios does) ===\n";
echo "Content-Type will be: multipart/form-data; boundary=$boundary\n\n";

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
    // Follow redirects
    CURLOPT_FOLLOWLOCATION => true,
]);
$resp = curl_exec($ch);
$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

$json = json_decode($resp, true);
echo "HTTP: $code\n";
echo "Success: " . ($json['success'] ?? 'N/A') . "\n";
echo "Message: " . ($json['message'] ?? substr($resp, 0, 200)) . "\n";
$data = $json['data'] ?? $json['result'] ?? null;
if (is_array($data)) {
    echo "Rows: " . count($data) . "\n";
} else {
    echo "Full: " . substr($resp, 0, 300) . "\n";
}
