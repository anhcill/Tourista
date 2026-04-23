<?php
$pdo = new PDO('mysql:host=interchange.proxy.rlwy.net;port=38550;dbname=railway', 'root', 'SZhkpiaBKssdXIyGLhTxbLQzGVlOnZBD');
echo "Current reviews count: ";
echo $pdo->query("SELECT COUNT(*) FROM reviews")->fetchColumn() . "\n";

echo "Altering reviews table...\n";
try {
    $pdo->exec("ALTER TABLE reviews ROW_FORMAT=DYNAMIC");
    echo "ROW_FORMAT=DYNAMIC - OK\n";
} catch (Exception $e) {
    echo "ROW_FORMAT: " . $e->getMessage() . "\n";
}

try {
    $pdo->exec("ALTER TABLE reviews MAX_ROWS=100000000");
    echo "MAX_ROWS - OK\n";
} catch (Exception $e) {
    echo "MAX_ROWS: " . $e->getMessage() . "\n";
}

echo "New reviews count: ";
echo $pdo->query("SELECT COUNT(*) FROM reviews")->fetchColumn() . "\n";
