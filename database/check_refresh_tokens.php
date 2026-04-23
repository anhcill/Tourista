<?php
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

    // Check full table structure
    echo "=== refresh_tokens table structure ===\n";
    $result = $conn->query("SHOW CREATE TABLE refresh_tokens");
    $row = $result->fetch_assoc();
    echo $row['Create Table'] . "\n\n";

    // Check all columns
    echo "=== All columns ===\n";
    $result = $conn->query("SHOW COLUMNS FROM refresh_tokens");
    while ($row = $result->fetch_assoc()) {
        echo sprintf("  %-12s %-30s Extra: %s\n", $row['Field'], $row['Type'], $row['Extra'] ?? '');
    }
    echo "\n";

    $conn->close();

} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    exit(1);
}
