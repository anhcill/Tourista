<?php
// Try to find what password works by checking common patterns
// Or try to reset admin password in Railway DB

$host = 'interchange.proxy.rlwy.net';
$port = 38550;
$db = 'railway';
$user = 'root';
$pass = 'SZhkpiaBKssdXIyGLhTxbLQzGVlOnZBD';

echo "=== Try to understand the password issue ===\n\n";

try {
    $pdo = new PDO("mysql:host=$host;port=$port;dbname=$db;charset=utf8mb4", $user, $pass);

    // The bcrypt hash from admin@tourista.vn
    // $2y$10$MCuxule9cbDdKZqjJJEQq.LcjCVz6jmjFyNfhSGMBws...
    // Let's try to verify with common passwords

    $adminHash = '$2y$10$MCuxule9cbDdKZqjJJEQq.LcjCVz6jmjFyNfhSGMBwsQfV9lH7vXK';

    $testPasswords = [
        'Admin@12345',
        'admin123',
        'Admin@123',
        'admin@123',
        'password',
        '123456',
        'Tourista@2024',
        'Tourista@2025',
        'admin2024'
    ];

    echo "Testing passwords against admin@tourista.vn hash:\n";
    foreach ($testPasswords as $pwd) {
        if (password_verify($pwd, $adminHash)) {
            echo "   ✓ FOUND: '$pwd'\n";
        } else {
            echo "   ✗ '$pwd' - wrong\n";
        }
    }

    // Since Spring Boot BCryptPasswordEncoder uses $2a$ or $2b$ prefix
    // PHP uses $2y$ but they're compatible
    // Let's try $2a$ prefix
    $adminHash2a = str_replace('$2y$', '$2a$', $adminHash);
    echo "\nTrying with $2a$ prefix:\n";
    foreach ($testPasswords as $pwd) {
        if (password_verify($pwd, $adminHash2a)) {
            echo "   ✓ FOUND: '$pwd'\n";
        } else {
            echo "   ✗ '$pwd' - wrong\n";
        }
    }

    echo "\n=== We need to reset the password in Railway DB ===\n";
    echo "Generating new bcrypt hash for 'Admin@12345'...\n";
    $newHash = password_hash('Admin@12345', PASSWORD_BCRYPT, ['cost' => 10]);
    echo "New hash: $newHash\n";

    echo "\nDo you want me to update the admin password in Railway DB?\n";
    echo "This will allow you to login with Admin@12345\n";

} catch (PDOException $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
