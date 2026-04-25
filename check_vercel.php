<?php
// Test Vercel API response for the import page
$ch = curl_init('https://tourista-frontend.vercel.app/admin/hotels/import/1');
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 10,
    CURLOPT_FOLLOWLOCATION => true,
]);
$resp = curl_exec($ch);
$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);
echo "Vercel frontend: HTTP $code\n";
echo "Response length: " . strlen($resp) . " bytes\n";
echo "Contains adminApi: " . (strpos($resp, 'importHotelsParse') !== false ? 'YES' : 'NO') . "\n";
echo "Contains multipart/form-data hardcoded: " . (strpos($resp, "'Content-Type': 'multipart/form-data'") !== false ? 'YES (OLD CODE)' : 'NO (GOOD)') . "\n";

// Also check the API directly to see if backend is still working
$ch = curl_init('https://tourista-production.up.railway.app/api/auth/login');
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => json_encode(['email' => 'admin@tourista.vn', 'password' => 'Admin@12345']),
    CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 10,
]);
$resp = curl_exec($ch);
$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);
$json = json_decode($resp, true);
$token = $json['data']['accessToken'] ?? null;
echo "\nRailway backend auth: HTTP $code\n";
echo "Token present: " . ($token ? 'YES' : 'NO') . "\n";

// Test parse endpoint
if ($token) {
    $file = 'C:\Users\ducan\Downloads\data01.csv';
    if (!file_exists($file)) {
        echo "\nCSV file not found at: $file\n";
    } else {
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
        $resp = curl_exec($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        $json = json_decode($resp, true);
        echo "\nRailway parse endpoint: HTTP $code\n";
        echo "Success: " . ($json['success'] ?? 'N/A') . "\n";
        echo "Message: " . ($json['message'] ?? 'N/A') . "\n";
    }
}
