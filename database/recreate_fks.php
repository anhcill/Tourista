<?php
$pdo = new PDO(
    'mysql:host=interchange.proxy.rlwy.net;port=38550;dbname=railway;charset=utf8mb4',
    'root',
    'SZhkpiaBKssdXIyGLhTxbLQzGVlOnZBD',
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
);

try {
    // Check all tables for FKs
    $tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
    
    echo "Checking tables for FKs to conversations.id...\n\n";
    
    foreach ($tables as $table) {
        $stmt = $pdo->query("SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE 
            WHERE TABLE_SCHEMA = 'railway' AND TABLE_NAME = '$table' 
            AND REFERENCED_TABLE_NAME = 'conversations'");
        $fks = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        foreach ($fks as $fk) {
            echo "Found FK: $fk on table $table\n";
        }
    }
    
    // Recreate conversation_sessions FK
    echo "\nRecreating fk_cs_conv...\n";
    $pdo->exec("ALTER TABLE conversation_sessions
        ADD CONSTRAINT fk_cs_conv FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE");
    echo "  ✓ fk_cs_conv created\n";
    
    // Check session_recommendation_states
    echo "\nRecreating fk_rec_conv...\n";
    $pdo->exec("ALTER TABLE session_recommendation_states
        ADD CONSTRAINT fk_rec_conv FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE");
    echo "  ✓ fk_rec_conv created\n";
    
    echo "\n✓ All FKs recreated!\n";
    
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
