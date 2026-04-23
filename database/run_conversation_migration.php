<?php
$pdo = new PDO('mysql:host=interchange.proxy.rlwy.net;port=38550;dbname=railway;charset=utf8mb4', 'root', 'SZhkpiaBKssdXIyGLhTxbLQzGVlOnZBD', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);

echo "Running migration: conversation_sessions + session_recommendation_states\n\n";

$pdo->exec("SET FOREIGN_KEY_CHECKS = 0");

// Table 1
try {
    $pdo->exec("CREATE TABLE IF NOT EXISTS conversation_sessions (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        conversation_id BIGINT UNSIGNED NOT NULL,
        session_started_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL,
        context_summary TEXT,
        message_count INT UNSIGNED NOT NULL DEFAULT 0,
        current_intent_tag VARCHAR(50),
        last_context_at DATETIME,
        UNIQUE KEY uk_cs_conversation (conversation_id),
        INDEX idx_cs_updated (updated_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    echo "SUCCESS: conversation_sessions table created.\n";
} catch (PDOException $e) {
    if (strpos($e->getMessage(), 'already exists') !== false) {
        echo "SKIP: conversation_sessions already exists.\n";
    } else {
        echo "Error creating conversation_sessions: " . $e->getMessage() . "\n";
    }
}

// Table 2
try {
    $pdo->exec("CREATE TABLE IF NOT EXISTS session_recommendation_states (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        conversation_id BIGINT UNSIGNED NOT NULL,
        budget_vnd INT,
        travelers INT,
        city_query VARCHAR(100),
        city_display VARCHAR(100),
        max_duration_days INT,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL,
        UNIQUE KEY uk_rec_conversation (conversation_id),
        INDEX idx_rec_updated (updated_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    echo "SUCCESS: session_recommendation_states table created.\n";
} catch (PDOException $e) {
    if (strpos($e->getMessage(), 'already exists') !== false) {
        echo "SKIP: session_recommendation_states already exists.\n";
    } else {
        echo "Error creating session_recommendation_states: " . $e->getMessage() . "\n";
    }
}

$pdo->exec("SET FOREIGN_KEY_CHECKS = 1");

echo "\nVerifying:\n";
try {
    $tables = $pdo->query("SHOW TABLES LIKE '%conversation%'")->fetchAll(PDO::FETCH_COLUMN);
    foreach ($tables as $t) {
        echo "  - $t\n";
        $cols = $pdo->query("DESCRIBE $t")->fetchAll(PDO::FETCH_ASSOC);
        foreach ($cols as $c) {
            echo "    {$c['Field']}: {$c['Type']}\n";
        }
    }
} catch (PDOException $e) {
    echo "Verification error: " . $e->getMessage() . "\n";
}
