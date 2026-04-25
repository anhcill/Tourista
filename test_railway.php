<?php
// Test Railway backend directly
$domains = [
    'tourista-backend.up.railway.app',
    'tourista-backend.railway.app',
    'tourista-backend-production.up.railway.app',
];

foreach ($domains as $domain) {
    echo "=== Testing: https://$domain ===\n";
    
    // Test root
    $ch = curl_init("https://$domain/");
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 5,
        CURLOPT_NOBODY => true,
        CURLOPT_SSL_VERIFYPEER => false,
    ]);
    curl_exec($ch);
    echo "Root: " . curl_getinfo($ch, CURLINFO_HTTP_CODE) . "\n";
    curl_close($ch);

    // Test /api
    $ch = curl_init("https://$domain/api");
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 5,
        CURLOPT_NOBODY => true,
        CURLOPT_SSL_VERIFYPEER => false,
    ]);
    curl_exec($ch);
    echo "API: " . curl_getinfo($ch, CURLINFO_HTTP_CODE) . "\n";
    curl_close($ch);

    // Test /api/home/stats
    $ch = curl_init("https://$domain/api/home/stats");
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 10,
        CURLOPT_SSL_VERIFYPEER => false,
    ]);
    $resp = curl_exec($ch);
    echo "Stats: " . curl_getinfo($ch, CURLINFO_HTTP_CODE) . " | ";
    echo substr($resp, 0, 300) . "\n";
    curl_close($ch);
    
    echo "\n";
}
