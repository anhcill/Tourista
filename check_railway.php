<?php
$urls = [
    "https://tourista-backend.up.railway.app/api/home/stats",
    "https://tourista-backend.up.railway.app/actuator/health",
];

foreach ($urls as $url) {
    echo "Testing: $url\n";
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    echo "HTTP $httpCode\n";
    if ($httpCode == 200) {
        $data = json_decode($response, true);
        echo json_encode($data, JSON_PRETTY_PRINT) . "\n";
    } else {
        echo substr($response, 0, 500) . "\n";
    }
    echo "\n";
}
