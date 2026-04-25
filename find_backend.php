<?php
// Thử nhiều domain khác nhau
$domains = [
    'tourista-backend.up.railway.app',
    'tourista-backend.railway.app',
    'tourista-backend-production.up.railway.app',
    'strong-beauty-production.up.railway.app',
    'strong-beauty.up.railway.app',
];

foreach ($domains as $domain) {
    echo "Testing: https://$domain/api/home/stats\n";
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, "https://$domain/api/home/stats");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 5);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_NOBODY, true);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $finalUrl = curl_getinfo($ch, CURLINFO_EFFECTIVE_URL);
    curl_close($ch);
    echo "   HTTP $httpCode | URL: $finalUrl\n";
    if ($httpCode == 200) {
        echo "   FOUND WORKING DOMAIN!\n";
        break;
    }
    echo "\n";
}
