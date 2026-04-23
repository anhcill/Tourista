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
echo "  FULL MIGRATION (v4)\n";
echo "========================================\n\n";

// Lay tat ca bang cua old DB
$oldTables = $oldPdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
echo "Old DB tables: " . count($oldTables) . "\n\n";

// Xoa tat ca bang trong new DB
echo "[1] Drop all tables in new DB...\n";
$newPdo->exec("SET FOREIGN_KEY_CHECKS = 0");
$existingTables = $newPdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
foreach ($existingTables as $t) {
    $newPdo->exec("DROP TABLE IF EXISTS `$t`");
}
$newPdo->exec("SET FOREIGN_KEY_CHECKS = 1");
echo "   Da xoa " . count($existingTables) . " bang\n\n";

// Lay CREATE TABLE tu old DB
echo "[2] Tao bang trong new DB...\n";
$created = 0;
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
        echo "  ! $table: " . substr($e->getMessage(), 0, 60) . "\n";
    }
}
echo "   Da tao $created bang\n\n";

// Lay thu tu bang (FK-safe) tu information_schema
echo "[3] Lay thu tu FK-safe...\n";
$fkOrder = $oldPdo->query("
    SELECT TABLE_NAME
    FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_SCHEMA = 'railway' AND TABLE_TYPE = 'BASE TABLE'
    ORDER BY TABLE_NAME
")->fetchAll(PDO::FETCH_COLUMN);
echo "   " . count($fkOrder) . " bang\n\n";

// Migrate du lieu
echo "[4] Migrate du lieu...\n\n";
$batchSize = 1000;
$totalCopied = 0;
$failed = [];

foreach ($fkOrder as $table) {
    try {
        $oldCount = $oldPdo->query("SELECT COUNT(*) FROM `$table`")->fetchColumn();
    } catch (Exception $e) {
        continue;
    }

    if ($oldCount == 0) continue;

    echo "=== $table ($oldCount rows) ===\n";

    try {
        $cols = $oldPdo->query("DESCRIBE `$table`")->fetchAll();
        $quotedCols = [];
        $rawCols = [];
        foreach ($cols as $col) {
            $quotedCols[] = "`{$col['Field']}`";
            $rawCols[] = $col['Field'];
        }
        $colList = implode(', ', $quotedCols);

        $offset = 0;
        $copied = 0;

        while (true) {
            $stmt = $oldPdo->prepare("SELECT $colList FROM `$table` LIMIT $batchSize OFFSET $offset");
            $stmt->execute();
            $rows = $stmt->fetchAll();

            if (empty($rows)) break;

            $placeholders = '(' . implode(', ', array_fill(0, count($rawCols), '?')) . ')';
            $allPlaceholders = implode(', ', array_fill(0, count($rows), $placeholders));

            $values = [];
            foreach ($rows as $row) {
                foreach ($rawCols as $c) {
                    $values[] = $row[$c] ?? null;
                }
            }

            $sql = "INSERT INTO `$table` ($colList) VALUES $allPlaceholders";
            $newPdo->prepare($sql)->execute($values);

            $copied += count($rows);
            $offset += $batchSize;

            if (count($rows) < $batchSize) break;
        }

        $totalCopied += $copied;
        echo "  ✅ $copied rows\n";

    } catch (Exception $e) {
        $failed[$table] = substr($e->getMessage(), 0, 100);
        echo "  ❌ " . substr($e->getMessage(), 0, 100) . "\n";
    }
    echo "\n";
}

echo "========================================\n";
echo "  KET QUA\n";
echo "  Da migrate: $totalCopied rows\n";
echo "  Loi: " . count($failed) . " bang\n";
if ($failed) {
    foreach ($failed as $t => $e) echo "    - $t: $e\n";
}
echo "========================================\n";
