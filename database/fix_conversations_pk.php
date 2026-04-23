<?php
$pdo = new PDO('mysql:host=interchange.proxy.rlwy.net;port=38550;dbname=railway;charset=utf8mb4', 'root', 'SZhkpiaBKssdXIyGLhTxbLQzGVlOnZBD', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);

echo "Migration: Add PRIMARY KEY to conversations + sync schema-chat.sql\n\n";

// Step 1: Check current state of conversations table
echo "--- Step 1: Checking conversations table ---\n";
$cols = $pdo->query("SHOW COLUMNS FROM conversations")->fetchAll(PDO::FETCH_ASSOC);
$hasPk = false;
$hasId = false;
$idNullable = false;
foreach ($cols as $c) {
    if ($c['Key'] === 'PRI') $hasPk = true;
    if ($c['Field'] === 'id') {
        $hasId = true;
        if ($c['Null'] === 'YES') $idNullable = true;
        echo "  id: {$c['Type']} | Null: {$c['Null']} | Key: {$c['Key']}\n";
    }
}

// Step 2: Check for null/duplicate id values
echo "\n--- Step 2: Checking id data quality ---\n";
$nullCount = $pdo->query("SELECT COUNT(*) FROM conversations WHERE id IS NULL")->fetchColumn();
echo "  NULL ids: $nullCount\n";

$dupCount = $pdo->query("SELECT COUNT(*) FROM (SELECT id FROM conversations WHERE id IS NOT NULL GROUP BY id HAVING COUNT(*) > 1) AS t")->fetchColumn();
echo "  Duplicate ids: $dupCount\n";

$totalCount = $pdo->query("SELECT COUNT(*) FROM conversations")->fetchColumn();
echo "  Total rows: $totalCount\n";

// Step 3: Add PRIMARY KEY if missing
echo "\n--- Step 3: Adding PRIMARY KEY ---\n";
if ($hasId && !$hasPk) {
    if ($nullCount == 0 && $dupCount == 0) {
        try {
            $pdo->exec("ALTER TABLE conversations ADD PRIMARY KEY (id)");
            echo "SUCCESS: PRIMARY KEY added to conversations.id\n";
        } catch (PDOException $e) {
            if (strpos($e->getMessage(), 'Duplicate') !== false) {
                echo "SKIP: PRIMARY KEY already exists.\n";
            } else {
                echo "Error: " . $e->getMessage() . "\n";
            }
        }
    } else {
        echo "WARN: Cannot add PK - NULL ids: $nullCount, Duplicate ids: $dupCount\n";
        echo "  Action needed: clean up data before adding PK\n";
    }
} else if ($hasPk) {
    echo "SKIP: PRIMARY KEY already exists.\n";
} else {
    echo "WARN: id column not found.\n";
}

// Step 4: Verify
echo "\n--- Step 4: Verification ---\n";
$cols = $pdo->query("SHOW COLUMNS FROM conversations")->fetchAll(PDO::FETCH_ASSOC);
foreach ($cols as $c) {
    echo "  {$c['Field']}: {$c['Type']} | {$c['Key']}\n";
}

// Step 5: Check existing foreign keys
echo "\n--- Step 5: Foreign keys on conversations ---\n";
try {
    $fks = $pdo->query("SELECT CONSTRAINT_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
                        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
                        WHERE TABLE_SCHEMA = 'railway' AND TABLE_NAME = 'conversations'
                        AND REFERENCED_TABLE_NAME IS NOT NULL")->fetchAll();
    foreach ($fks as $fk) {
        echo "  {$fk['CONSTRAINT_NAME']}: {$fk['COLUMN_NAME']} -> {$fk['REFERENCED_TABLE_NAME']}.{$fk['REFERENCED_COLUMN_NAME']}\n";
    }
} catch (PDOException $e) {
    echo "  FK check error: " . $e->getMessage() . "\n";
}

// Step 6: Check if 2 new tables have FK
echo "\n--- Step 6: FK status on new tables ---\n";
foreach (['conversation_sessions', 'session_recommendation_states'] as $t) {
    try {
        $fks = $pdo->query("SELECT CONSTRAINT_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME
                            FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
                            WHERE TABLE_SCHEMA = 'railway' AND TABLE_NAME = '$t'
                            AND REFERENCED_TABLE_NAME IS NOT NULL")->fetchAll();
        foreach ($fks as $fk) {
            echo "  $t: {$fk['CONSTRAINT_NAME']} ({$fk['COLUMN_NAME']} -> {$fk['REFERENCED_TABLE_NAME']})\n";
        }
        if (count($fks) == 0) echo "  $t: no FK constraints\n";
    } catch (PDOException $e) {
        echo "  $t: error - " . $e->getMessage() . "\n";
    }
}
