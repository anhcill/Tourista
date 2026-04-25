<?php
// Full flow test: login -> upload CSV -> check response

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
echo "Step 1 - Login: " . ($token ? "OK (token: " . substr($token, 0, 20) . "...)" : "FAIL") . "\n\n";

if (!$token) {
    echo "Cannot proceed without token\n";
    exit(1);
}

// Test parse endpoint
$file = 'C:\Users\ducan\Downloads\data01.csv';
$fileContent = file_get_contents($file);

// axios-style multipart (FormData auto-sets Content-Type with boundary)
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
$resp = curl_exec($ch);
$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "Step 2 - Upload CSV:\n";
echo "  HTTP Status: $code\n";

$json = json_decode($resp, true);
if ($json) {
    echo "  success: " . ($json['success'] ?? 'N/A') . "\n";
    echo "  message: " . ($json['message'] ?? 'N/A') . "\n";
    $data = $json['data'] ?? $json['result'] ?? null;
    if (is_array($data)) {
        echo "  rows count: " . count($data) . "\n";
        echo "  first row title: " . ($data[0]['title'] ?? 'N/A') . "\n";
    } else {
        echo "  data type: " . gettype($data) . "\n";
        echo "  data value: " . json_encode($data) . "\n";
    }
} else {
    echo "  RAW RESPONSE: " . substr($resp, 0, 500) . "\n";
}

echo "\n=== Simulating FRONTEND parseHotelsParse call ===\n";
echo "axiosClient.post('/admin/hotels/import/parse', formData)\n";
echo "  -> returns: axios response object\n";
echo "safeRequest() passes it through (no wrapping)\n";
echo "  -> frontend receives same JSON structure\n";
echo "handleParseCsv reads: response?.data?.data || response?.result || []\n";
$frontendData = $json['data'] ?? [];
echo "  -> extracted rows: " . count($frontendData) . "\n";
if (count($frontendData) === 0) {
    echo "  => ERROR: rows === 0 -> shows 'Không tìm thấy dữ liệu trong file CSV'\n";
} else {
    echo "  => OK: rows > 0 -> proceeds to step 2\n";
}
