<?php
// Restore old table and fix refresh_tokens structure on Railway
$host = 'interchange.proxy.rlwy.net';
$port = 38550;
$user = 'root';
$pass = 'SZhkpiaBKssdXIyGLhTxbLQzGVlOnZBD';
$db   = 'railway';

try {
    $conn = new mysqli($host, $user, $pass, $db, $port);
    if ($conn->connect_error) {
        throw new Exception("Connection failed: " . $conn->connect_error);
    }
    echo "Connected OK\n\n";

    // Step 1: Restore from backup if needed
    $result = $conn->query("SHOW TABLES LIKE 'refresh_tokens_old%'");
    if ($result->num_rows > 0) {
        $oldName = $result->fetch_row()[0];
        echo "Found backup: `$oldName`\n";
        $check = $conn->query("SHOW TABLES LIKE 'refresh_tokens'");
        if ($check->num_rows == 0) {
            echo "Restoring `$oldName` -> refresh_tokens...\n";
            $conn->query("RENAME TABLE `$oldName` TO refresh_tokens");
            echo "Restored OK\n\n";
        } else {
            echo "refresh_tokens exists, backup not needed\n\n";
        }
    }

    // Step 2: Show current structure
    echo "=== Current structure ===\n";
    $result = $conn->query("SHOW COLUMNS FROM refresh_tokens");
    while ($r = $result->fetch_assoc()) {
        echo sprintf("  %-12s %-30s Extra: %s\n", $r['Field'], $r['Type'], $r['Extra'] ?? '');
    }
    echo "\n";

    // Step 3: Add auto_increment column and primary key
    echo "=== Adding AUTO_INCREMENT column ===\n";
    // Add a new auto_increment column (keep old id column temporarily)
    $conn->query("ALTER TABLE refresh_tokens ADD COLUMN new_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT FIRST, ADD PRIMARY KEY (new_id)");
    echo "new_id column with AUTO_INCREMENT added\n";

    // Copy values from old id to new_id
    $conn->query("UPDATE refresh_tokens SET new_id = id");
    echo "Values copied\n";

    // Drop old id column
    $conn->query("ALTER TABLE refresh_tokens DROP COLUMN id");
    echo "Old id column dropped\n";

    // Rename new_id to id
    $conn->query("ALTER TABLE refresh_tokens CHANGE COLUMN new_id id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT");
    echo "Renamed to id\n\n";

    // Step 4: Fix token column
    echo "=== Fixing token column ===\n";
    $conn->query("ALTER TABLE refresh_tokens MODIFY COLUMN token VARCHAR(512) NOT NULL UNIQUE");
    echo "Token UNIQUE added\n\n";

    // Step 5: Fix revoked column
    echo "=== Fixing revoked column ===\n";
    $conn->query("ALTER TABLE refresh_tokens MODIFY COLUMN revoked BOOLEAN NOT NULL DEFAULT FALSE");
    echo "Revoked BOOLEAN DEFAULT FALSE OK\n\n";

    // Final verify
    echo "=== FINAL structure ===\n";
    $result = $conn->query("SHOW CREATE TABLE refresh_tokens");
    $r = $result->fetch_assoc();
    echo $r['Create Table'] . "\n\n";

    echo "=== Columns ===\n";
    $result = $conn->query("SHOW COLUMNS FROM refresh_tokens");
    while ($r = $result->fetch_assoc()) {
        echo sprintf("  %-12s %-30s Extra: %s\n", $r['Field'], $r['Type'], $r['Extra'] ?? '');
    }
    echo "\n";

    // Show row count
    $result = $conn->query("SELECT COUNT(*) as cnt FROM refresh_tokens");
    $r = $result->fetch_assoc();
    echo "Rows preserved: " . $r['cnt'] . "\n\n";

    echo "=== ALL DONE ===\n";
    $conn->close();

} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    exit(1);
}
