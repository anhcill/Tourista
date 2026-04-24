<?php
/**
 * Fix: Add AUTO_INCREMENT to conversations.id on Railway
 * Run: php database/migration/m03_fix_conversations_auto_increment.php
 */
$pdo = new PDO(
    'mysql:host=interchange.proxy.rlwy.net;port=38550;dbname=railway;charset=utf8mb4',
    'root',
    'SZhkpiaBKssdXIyGLhTxbLQzGVlOnZBD',
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
);

try {
    // Step 1: Check current state
    echo "Step 1: Checking current state...\n";
    
    $stmt = $pdo->query("DESCRIBE conversations");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($columns as $col) {
        if ($col['Field'] === 'id') {
            echo "  - conversations.id Extra: '" . $col['Extra'] . "'\n";
            echo "  - conversations.id Type: '" . $col['Type'] . "'\n";
            if (strpos($col['Extra'], 'auto_increment') !== false) {
                echo "\n✓ Already has AUTO_INCREMENT, nothing to do!\n";
                exit(0);
            }
            break;
        }
    }
    
    // Step 2: Drop FKs
    echo "\nStep 2: Dropping foreign keys...\n";
    
    $stmt = $pdo->query("SELECT CONSTRAINT_NAME, TABLE_NAME FROM information_schema.KEY_COLUMN_USAGE 
        WHERE REFERENCED_TABLE_NAME = 'conversations' AND TABLE_SCHEMA = 'railway'");
    $fks = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($fks as $fk) {
        echo "  - Dropping {$fk['CONSTRAINT_NAME']} from {$fk['TABLE_NAME']}\n";
        $pdo->exec("ALTER TABLE `{$fk['TABLE_NAME']}` DROP FOREIGN KEY `{$fk['CONSTRAINT_NAME']}`");
    }
    
    // Step 3: Modify column
    echo "\nStep 3: Modifying conversations.id...\n";
    $pdo->exec("ALTER TABLE conversations MODIFY COLUMN id BIGINT NOT NULL AUTO_INCREMENT");
    echo "  ✓ Done\n";
    
    // Step 4: Recreate FKs
    echo "\nStep 4: Recreating foreign keys...\n";
    $pdo->exec("ALTER TABLE chat_messages 
        ADD CONSTRAINT fk_cm_conv FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE");
    echo "  ✓ fk_cm_conv created\n";
    
    $tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
    if (in_array('recommendations', $tables)) {
        $pdo->exec("ALTER TABLE recommendations 
            ADD CONSTRAINT fk_rec_conv FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE");
        echo "  ✓ fk_rec_conv created\n";
    }
    
    echo "\n✓ SUCCESS! conversations.id now has AUTO_INCREMENT.\n";
    
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
