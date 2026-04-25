<?php
$apiKey = 're_95JKF6EX_78Mkhz34tuc39ZFQeeEErrgo';

$ch = curl_init('https://api.resend.com/emails');
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer ' . $apiKey,
        'Content-Type: application/json',
    ],
    CURLOPT_POSTFIELDS => json_encode([
        'from' => 'onboarding@resend.dev',
        'to' => ['11220230@st.neu.edu.vn'],
        'subject' => 'Tourista - Test Email from Resend API',
        'html' => '<h1>Xin chao!</h1><p>Day la email test tu Resend API.</p><p>Neu ban nhan duoc email nay thi Resend da hoat dong tot!</p>',
        'text' => "Xin chao!\nDay la email test tu Resend API.\nNeu ban nhan duoc email nay thi Resend da hoat dong tot!",
    ]),
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

echo "HTTP Code: $httpCode\n";
echo "Response: $response\n";
if ($error) {
    echo "Error: $error\n";
}
