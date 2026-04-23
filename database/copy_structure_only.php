<?php
$oldPdo = new PDO('mysql:host=interchange.proxy.rlwy.net;port=38550;dbname=railway', 'root', 'SZhkpiaBKssdXIyGLhTxbLQzGVlOnZBD', [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
]);

$newPdo = new PDO('mysql:host=interchange.proxy.rlwy.net;port=38550;dbname=railway', 'root', 'SZhkpiaBKssdXIyGLhTxbLQzGVlOnZBD', [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
]);

echo "========================================\n";
echo "  CHI COPY STRUCTURE SANG DB MOI\n";
echo "========================================\n\n";

// Xoa tat ca bang trong new DB
echo "[1] Drop all tables in new DB...\n";
$newPdo->exec("SET FOREIGN_KEY_CHECKS = 0");
$existingTables = $newPdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
foreach ($existingTables as $t) {
    $newPdo->exec("DROP TABLE IF EXISTS `$t`");
}
$newPdo->exec("SET FOREIGN_KEY_CHECKS = 1");
echo "   Da xoa " . count($existingTables) . " bang cu\n\n";

// Lay tat ca bang tu old DB
$oldTables = $oldPdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
echo "[2] Tao " . count($oldTables) . " bang moi...\n\n";

$created = 0;
$failed = [];

foreach ($oldTables as $table) {
    try {
        $create = $oldPdo->query("SHOW CREATE TABLE `$table`")->fetch(PDO::FETCH_ASSOC);
        $sql = $create['Create Table'];
        // Remove AUTOEXTEND for compatibility
        $sql = preg_replace('/AUTOEXTEND_SIZE=\d+/', '', $sql);
        $newPdo->exec($sql);
        $created++;
        echo "  + $table\n";
    } catch (Exception $e) {
        $failed[$table] = substr($e->getMessage(), 0, 80);
        echo "  ! $table: " . substr($e->getMessage(), 0, 80) . "\n";
    }
}

echo "\n========================================\n";
echo "  KET QUA\n";
echo "  Da tao: $created bang\n";
echo "  Loi: " . count($failed) . " bang\n";
if ($failed) {
    foreach ($failed as $t => $e) echo "    - $t: $e\n";
}
echo "========================================\n";

// Kiem tra
echo "\n[3] Kiem tra new DB...\n";
$newTables = $newPdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
echo "   Tong bang: " . count($newTables) . "\n";

$sample = ['users', 'hotels', 'reviews', 'hotel_images', 'cities', 'tours'];
foreach ($sample as $t) {
    $cols = $newPdo->query("DESCRIBE `$t`")->fetchAll();
    echo "   $t: " . count($cols) . " cot\n";
}
echo "\n✅ XONG! DB moi sac, chua du lieu.\n";
