<?php
$host = 'interchange.proxy.rlwy.net';
$port = 38550;
$db = 'railway';
$user = 'root';
$pass = 'SZhkpiaBKssdXIyGLhTxbLQzGVlOnZBD';

echo "=== Check/Create Admin User ===\n\n";

try {
    $pdo = new PDO("mysql:host=$host;port=$port;dbname=$db;charset=utf8mb4", $user, $pass);

    // Check admin user
    $stmt = $pdo->prepare("SELECT id, email, role_id, password_hash FROM users WHERE email = ?");
    $stmt->execute(['admin@tourista.vn']);
    $admin = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($admin) {
        echo "✓ Admin user exists:\n";
        echo "   ID: {$admin['id']}\n";
        echo "   Email: {$admin['email']}\n";
        echo "   Role ID: {$admin['role_id']}\n";
        echo "   Password Hash: " . substr($admin['password_hash'], 0, 50) . "...\n";

        // Check roles table
        $roles = $pdo->query("SELECT * FROM roles")->fetchAll(PDO::FETCH_ASSOC);
        echo "\n   Roles:\n";
        foreach ($roles as $role) {
            echo "   - ID {$role['id']}: {$role['name']}\n";
        }

        // Check if role is admin (usually id 1 or 2)
        echo "\n   Current role_id: {$admin['role_id']}\n";

        // Check all users with admin role
        echo "\n   Users with role_id = 1 or 2:\n";
        $admins = $pdo->query("SELECT id, email, role_id FROM users WHERE role_id IN (1, 2) LIMIT 10");
        foreach ($admins as $a) {
            echo "   - ID {$a['id']}: {$a['email']} (role {$a['role_id']})\n";
        }
    } else {
        echo "✗ Admin user not found!\n";

        // Show some users to find admin
        echo "\n   First 5 users:\n";
        $users = $pdo->query("SELECT id, email, role_id FROM users LIMIT 5");
        foreach ($users as $u) {
            echo "   - ID {$u['id']}: {$u['email']} (role {$u['role_id']})\n";
        }
    }

} catch (PDOException $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
