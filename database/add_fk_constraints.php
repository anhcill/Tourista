<?php
$pdo = new PDO('mysql:host=interchange.proxy.rlwy.net;port=38550;dbname=railway;charset=utf8mb4', 'root', 'SZhkpiaBKssdXIyGLhTxbLQzGVlOnZBD', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);

echo "Adding FK constraints to conversation_sessions and session_recommendation_states\n\n";

$pdo->exec("SET FOREIGN_KEY_CHECKS = 0");

// Table 1 - add FK
try {
    $pdo->exec("ALTER TABLE conversation_sessions
        ADD CONSTRAINT fk_cs_conv FOREIGN KEY (conversation_id)
        REFERENCES conversations(id) ON DELETE CASCADE ON UPDATE CASCADE");
    echo "SUCCESS: FK added to conversation_sessions.conversation_id\n";
} catch (PDOException $e) {
    if (strpos($e->getMessage(), 'Duplicate') !== false || strpos($e->getMessage(), 'already exists') !== false) {
        echo "SKIP: FK already exists on conversation_sessions\n";
    } else {
        echo "Error: " . $e->getMessage() . "\n";
    }
}

// Table 2 - add FK
try {
    $pdo->exec("ALTER TABLE session_recommendation_states
        ADD CONSTRAINT fk_rec_conv FOREIGN KEY (conversation_id)
        REFERENCES conversations(id) ON DELETE CASCADE ON UPDATE CASCADE");
    echo "SUCCESS: FK added to session_recommendation_states.conversation_id\n";
} catch (PDOException $e) {
    if (strpos($e->getMessage(), 'Duplicate') !== false || strpos($e->getMessage(), 'already exists') !== false) {
        echo "SKIP: FK already exists on session_recommendation_states\n";
    } else {
        echo "Error: " . $e->getMessage() . "\n";
    }
}

$pdo->exec("SET FOREIGN_KEY_CHECKS = 1");

// Verify
echo "\nVerifying all FKs:\n";
$tables = ['conversation_sessions', 'session_recommendation_states', 'conversations', 'chat_messages'];
foreach ($tables as $t) {
    try {
        $fks = $pdo->query("SELECT CONSTRAINT_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME
                            FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
                            WHERE TABLE_SCHEMA = 'railway' AND TABLE_NAME = '$t'
                            AND REFERENCED_TABLE_NAME IS NOT NULL")->fetchAll();
        foreach ($fks as $fk) {
            echo "  $t: {$fk['CONSTRAINT_NAME']} ({$fk['COLUMN_NAME']} -> {$fk['REFERENCED_TABLE_NAME']})\n";
        }
    } catch (PDOException $e) {
        echo "  $t: error - " . $e->getMessage() . "\n";
    }
}
