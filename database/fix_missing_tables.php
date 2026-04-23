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
echo "  TAO LAI 4 BANG BI LOI FK\n";
echo "========================================\n\n";

$problemTables = ['hotels', 'reviews', 'hotel_images', 'conversation_sessions'];

foreach ($problemTables as $table) {
    echo "=== $table ===\n";

    // Xoa bang cu
    $newPdo->exec("DROP TABLE IF EXISTS `$table`");

    // Lay CREATE TABLE, loai bo FK
    $create = $oldPdo->query("SHOW CREATE TABLE `$table`")->fetch(PDO::FETCH_ASSOC);
    $sql = $create['Create Table'];

    // Loai bo cac CONSTRAINT va FOREIGN KEY
    $sql = preg_replace('/,\s*CONSTRAINT\s+\w+\s+FOREIGN KEY\s*\([^)]+\)\s*\([^)]+\)[^,)]*/i', '', $sql);
    $sql = preg_replace('/,\s*KEY\s+`?\w+`?\s*\([^)]+\)[^,)]*/i', '', $sql); // loai bo index cua FK
    $sql = preg_replace('/AUTOEXTEND_SIZE=\d+/', '', $sql);

    // Loai bo dau phay cuoi cung neu co
    $sql = preg_replace('/,\s*\)/', ')', $sql);

    try {
        $newPdo->exec($sql);
        echo "  + Tao bang (khong FK)\n";
    } catch (Exception $e) {
        echo "  ! Loi tao: " . substr($e->getMessage(), 0, 80) . "\n";
        echo "  SQL: " . substr($sql, 0, 100) . "\n";
    }

    // Lay FK tu old DB
    $fks = $oldPdo->query("
        SELECT CONSTRAINT_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
        WHERE TABLE_SCHEMA = 'railway' AND TABLE_NAME = '$table' AND REFERENCED_TABLE_NAME IS NOT NULL
    ")->fetchAll();

    foreach ($fks as $fk) {
        $addSql = "ALTER TABLE `$table` ADD CONSTRAINT `{$fk['CONSTRAINT_NAME']}` 
            FOREIGN KEY (`{$fk['COLUMN_NAME']}`) 
            REFERENCES `{$fk['REFERENCED_TABLE_NAME']}`(`{$fk['REFERENCED_COLUMN_NAME']}`)";
        try {
            $newPdo->exec($addSql);
            echo "  + FK: {$fk['COLUMN_NAME']} -> {$fk['REFERENCED_TABLE_NAME']}({$fk['REFERENCED_COLUMN_NAME']})\n";
        } catch (Exception $e) {
            echo "  ! FK loi: " . substr($e->getMessage(), 0, 80) . "\n";
        }
    }
    echo "\n";
}

echo "========================================\n";
echo "  KET QUA\n";
echo "========================================\n";

$checkTables = ['users', 'hotels', 'reviews', 'hotel_images', 'cities', 'conversation_sessions'];
foreach ($checkTables as $t) {
    try {
        $cols = $newPdo->query("DESCRIBE `$t`")->fetchAll();
        $fks = $newPdo->query("
            SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
            WHERE TABLE_SCHEMA='railway' AND TABLE_NAME='$t' AND REFERENCED_TABLE_NAME IS NOT NULL
        ")->fetchColumn();
        echo "  $t: " . count($cols) . " cot, $fks FK\n";
    } catch (Exception $e) {
        echo "  $t: KHONG TON TAI\n";
    }
}

echo "\n✅ XONG!\n";
