<?php
$pdo = new PDO('mysql:host=interchange.proxy.rlwy.net;port=38550;dbname=railway;charset=utf8mb4', 'root', 'SZhkpiaBKssdXIyGLhTxbLQzGVlOnZBD');

// Check roles columns
echo "=== Roles table ===\n";
$rc = $pdo->query('DESCRIBE roles')->fetchAll(PDO::FETCH_ASSOC);
foreach ($rc as $c) echo "  - {$c['Field']}\n";
$r = $pdo->query('SELECT * FROM roles LIMIT 10')->fetchAll(PDO::FETCH_ASSOC);
print_r($r);

// Tour operators
echo "\n=== Tour Operators ===\n";
$tourOps = $pdo->query("
    SELECT u.id, u.email, u.full_name, u.role_id,
           t.id as tour_id, t.title as tour_title
    FROM users u
    JOIN tours t ON t.operator_id = u.id
    LIMIT 5
")->fetchAll(PDO::FETCH_ASSOC);
print_r($tourOps);

// Check conversations columns
echo "\n=== Conversations columns ===\n";
$cc = $pdo->query('DESCRIBE conversations')->fetchAll(PDO::FETCH_ASSOC);
foreach ($cc as $c) echo "  - {$c['Field']}\n";

// Check chat_messages columns
echo "\n=== Chat Messages columns ===\n";
$mc = $pdo->query('DESCRIBE chat_messages')->fetchAll(PDO::FETCH_ASSOC);
foreach ($mc as $c) echo "  - {$c['Field']}\n";

// Check conversations
echo "\n=== All Conversations ===\n";
$convs = $pdo->query("SELECT * FROM conversations LIMIT 10")->fetchAll(PDO::FETCH_ASSOC);
print_r($convs);

// Check chat_messages
echo "\n=== All Chat Messages ===\n";
$msgs = $pdo->query("SELECT * FROM chat_messages LIMIT 10")->fetchAll(PDO::FETCH_ASSOC);
print_r($msgs);

// API login test
echo "\n=== Test Railway API Login ===\n";
$ch = curl_init('https://tourista-production.up.railway.app/api/auth/login');
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
    CURLOPT_POSTFIELDS => json_encode(['email' => 'owner@tourista.vn', 'password' => '123456']),
    CURLOPT_TIMEOUT => 15,
]);
$resp = curl_exec($ch);
$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);
echo "HTTP $code\n";
$data = json_decode($resp, true);
if ($code === 200) {
    $token = $data['data']['accessToken'] ?? $data['accessToken'] ?? null;
    echo "Token: " . ($token ? substr($token, 0, 30) . '...' : 'null') . "\n";
} else {
    echo "Response: " . substr($resp, 0, 500) . "\n";
}
