<?php
$pdo = new PDO(
    'mysql:host=interchange.proxy.rlwy.net;port=38550;dbname=railway;charset=utf8mb4',
    'root',
    'SZhkpiaBKssdXIyGLhTxbLQzGVlOnZBD',
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
);

try {
    echo "Step 1: Modify conversations.id to bigint unsigned...\n";
    $pdo->exec("ALTER TABLE conversations MODIFY COLUMN id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT");
    echo "  ✓ Done\n";
    
    echo "\nStep 2: Recreate FK...\n";
    $pdo->exec("ALTER TABLE chat_messages
        ADD CONSTRAINT fk_cm_conv FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE");
    echo "  ✓ fk_cm_conv created\n";
    
    echo "\n✓ SUCCESS!\n";
    
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
