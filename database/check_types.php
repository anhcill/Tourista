<?php
$pdo = new PDO(
    'mysql:host=interchange.proxy.rlwy.net;port=38550;dbname=railway;charset=utf8mb4',
    'root',
    'SZhkpiaBKssdXIyGLhTxbLQzGVlOnZBD',
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
);

echo "chat_messages.conversation_id:\n";
$stmt = $pdo->query("DESCRIBE chat_messages");
foreach ($stmt->fetchAll() as $col) {
    if ($col['Field'] === 'conversation_id') {
        echo "  Type: " . $col['Type'] . "\n";
        echo "  Null: " . $col['Null'] . "\n";
        echo "  Key: " . $col['Key'] . "\n";
        echo "  Extra: " . $col['Extra'] . "\n";
    }
}

echo "\nconversations.id:\n";
$stmt = $pdo->query("DESCRIBE conversations");
foreach ($stmt->fetchAll() as $col) {
    if ($col['Field'] === 'id') {
        echo "  Type: " . $col['Type'] . "\n";
        echo "  Null: " . $col['Null'] . "\n";
        echo "  Key: " . $col['Key'] . "\n";
        echo "  Extra: " . $col['Extra'] . "\n";
    }
}
