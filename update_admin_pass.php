<?php
$host = 'interchange.proxy.rlwy.net';
$port = 38550;
$db = 'railway';
$user = 'root';
$pass = 'SZhkpiaBKssdXIyGLhTxbLQzGVlOnZBD';

echo "=== Update Admin Password in Railway DB ===\n\n";

try {
    $pdo = new PDO("mysql:host=$host;port=$port;dbname=$db;charset=utf8mb4", $user, $pass);

    // Generate new bcrypt hash for Admin@12345
    $newHash = password_hash('Admin@12345', PASSWORD_BCRYPT, ['cost' => 10]);

    // Update admin@tourista.vn password
    $stmt = $pdo->prepare("UPDATE users SET password_hash = ? WHERE email = ?");
    $stmt->execute([$newHash, 'admin@tourista.vn']);

    echo "✓ Password updated for admin@tourista.vn\n";
    echo "  New password: Admin@12345\n\n";

    // Verify
    $stmt = $pdo->prepare("SELECT id, email, role_id FROM users WHERE email = ?");
    $stmt->execute(['admin@tourista.vn']);
    $admin = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "✓ User verified: {$admin['email']} (ID: {$admin['id']}, Role: {$admin['role_id']})\n";

} catch (PDOException $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
