<?php
// Check if backend is accessible
$urls = [
    'https://tourista-production.up.railway.app/api',
    'https://tourista-production.up.railway.app/ws/info',
    'https://tourista-production.up.railway.app/api/auth/me',
];

foreach ($urls as $url) {
    echo "Testing: $url\n";
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_NOBODY, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    echo "  HTTP Code: $httpCode\n\n";
}
