<?php
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'https://tourista-backend.up.railway.app/api/admin/statistics/dashboard');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);
echo "HTTP $httpCode\n";
echo substr($response, 0, 1000);
