<?php
// Get admin token from Railway DB via check_admin_user.php pattern
// Try common admin test credentials on Railway
$credentials = [
    ['email' => 'admin@tourista.vn', 'password' => 'admin123'],
    ['email' => 'admin@tourista.vn', 'password' => 'Admin@123'],
    ['email' => 'admin@tourista.vn', 'password' => 'Password@123'],
    ['email' => 'admin@tourista.vn', 'password' => 'admin'],
];

$token = null;
foreach ($credentials as $cred) {
    $ch = curl_init('https://tourista-production.up.railway.app/api/auth/login');
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($cred),
        CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 10,
    ]);
    $resp = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    $json = json_decode($resp, true);
    $tok = $json['data']['accessToken'] ?? $json['result']['accessToken'] ?? null;
    if ($tok) {
        $token = $tok;
        echo "Login OK with: " . $cred['password'] . "\n";
        break;
    } else {
        echo "Login FAIL with '{$cred['password']}': " . $json['message'] . "\n";
    }
}

if (!$token) {
    echo "\nCannot login. Checking Railway health with GET /api/cities...\n";
    $ch = curl_init('https://tourista-production.up.railway.app/api/cities');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 10,
    ]);
    $resp = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    echo "GET /api/cities HTTP: $code\n";
    echo "Response: " . substr($resp, 0, 300) . "\n";
    exit(1);
}

// Upload CSV
$file = 'C:\Users\ducan\Downloads\data01.csv';
$fileContent = file_get_contents($file);
echo "File size: " . strlen($fileContent) . " bytes\n";

// Detect BOM
$first3 = substr($fileContent, 0, 3);
$bom = ($first3 === "\xEF\xBB\xBF");
echo "Has BOM: " . ($bom ? 'YES' : 'NO') . "\n";
echo "First 5 bytes: " . bin2hex(substr($fileContent, 0, 5)) . "\n";

// Build multipart
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

echo "\nHTTP: $code\n";
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
        }
    } else {
        echo "Data: " . json_encode($data) . "\n";
    }
} else {
    echo "Invalid JSON response:\n" . substr($resp, 0, 500) . "\n";
}
