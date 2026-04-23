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
echo "  SO SANH CAU TRUC DB CU vs DB MOI\n";
echo "========================================\n\n";

// Lay danh sach bang
$oldTables = $oldPdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
$newTables = $newPdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);

$oldTables = array_values($oldTables);
$newTables = array_values($newTables);

echo "Old DB: " . count($oldTables) . " bang\n";
echo "New DB: " . count($newTables) . " bang\n\n";

// Bang thieu
$missingInNew = array_diff($oldTables, $newTables);
// Bang thua
$extraInNew = array_diff($newTables, $oldTables);

echo "--- Bang thieu trong DB moi ---\n";
if (empty($missingInNew)) {
    echo "  Khong co (OK)\n";
} else {
    foreach ($missingInNew as $t) echo "  ✗ $t\n";
}

echo "\n--- Bang thua trong DB moi ---\n";
if (empty($extraInNew)) {
    echo "  Khong co (OK)\n";
} else {
    foreach ($extraInNew as $t) echo "  ○ $t\n";
}

echo "\n--- Kiem tra cau truc chi tiet ---\n\n";

$issues = 0;
$okTables = [];

foreach ($oldTables as $tbl) {
    if (!in_array($tbl, $newTables)) continue;

    // Lay cau truc
    $oldCols = $oldPdo->query("DESCRIBE `$tbl`")->fetchAll(PDO::FETCH_ASSOC);
    $newCols = $newPdo->query("DESCRIBE `$tbl`")->fetchAll(PDO::FETCH_ASSOC);

    $oldColMap = [];
    foreach ($oldCols as $c) $oldColMap[$c['Field']] = $c;
    $newColMap = [];
    foreach ($newCols as $c) $newColMap[$c['Field']] = $c;

    $tableIssues = [];

    // Cot thieu
    foreach ($oldColMap as $col => $def) {
        if (!isset($newColMap[$col])) {
            $tableIssues[] = "  ✗ Cot thieu: $col ({$def['Type']})";
        } else {
            // So sanh type
            $oldType = strtoupper($oldColMap[$col]['Type']);
            $newType = strtoupper($newColMap[$col]['Type']);
            if ($oldType != $newType) {
                $tableIssues[] = "  ⚠ $col: type khac - cu='{$oldColMap[$col]['Type']}' moi='{$newColMap[$col]['Type']}'";
            }
            // Null
            if ($oldColMap[$col]['Null'] != $newColMap[$col]['Null']) {
                $tableIssues[] = "  ⚠ $col: Null khac - cu='{$oldColMap[$col]['Null']}' moi='{$newColMap[$col]['Null']}'";
            }
            // Default
            $oldDef = $oldColMap[$col]['Default'] ?? '';
            $newDef = $newColMap[$col]['Default'] ?? '';
            if ($oldDef !== $newDef) {
                $tableIssues[] = "  ⚠ $col: Default khac - cu='$oldDef' moi='$newDef'";
            }
        }
    }

    // Cot thua
    foreach ($newColMap as $col => $def) {
        if (!isset($oldColMap[$col])) {
            $tableIssues[] = "  ○ Cot thua: $col ({$def['Type']})";
        }
    }

    if (empty($tableIssues)) {
        $okTables[] = $tbl;
    } else {
        $issues++;
        echo "=== $tbl (" . count($oldCols) . " cot -> " . count($newCols) . " cot) ===\n";
        foreach ($tableIssues as $iss) echo "$iss\n";
    }
}

echo "\n--- Kiem tra Foreign Keys ---\n\n";

$fkIssues = 0;
foreach ($oldTables as $tbl) {
    if (!in_array($tbl, $newTables)) continue;

    $oldFks = $oldPdo->query("
        SELECT CONSTRAINT_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
        WHERE TABLE_SCHEMA = 'railway' AND TABLE_NAME = '$tbl' AND REFERENCED_TABLE_NAME IS NOT NULL
    ")->fetchAll();

    $newFks = $newPdo->query("
        SELECT CONSTRAINT_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
        WHERE TABLE_SCHEMA = 'railway' AND TABLE_NAME = '$tbl' AND REFERENCED_TABLE_NAME IS NOT NULL
    ")->fetchAll();

    $oldFkMap = [];
    foreach ($oldFks as $fk) $oldFkMap[$fk['CONSTRAINT_NAME']] = $fk;
    $newFkMap = [];
    foreach ($newFks as $fk) $newFkMap[$fk['CONSTRAINT_NAME']] = $fk;

    $tblFkIssues = [];

    foreach ($oldFkMap as $name => $fk) {
        $key = "{$fk['REFERENCED_TABLE_NAME']}.{$fk['REFERENCED_COLUMN_NAME']}";
        if (!isset($newFkMap[$name])) {
            $tblFkIssues[] = "  ✗ FK thieu: {$fk['COLUMN_NAME']} -> {$fk['REFERENCED_TABLE_NAME']}({$fk['REFERENCED_COLUMN_NAME']})";
        } elseif ($newFkMap[$name]['COLUMN_NAME'] != $fk['COLUMN_NAME'] || $newFkMap[$name]['REFERENCED_TABLE_NAME'] != $fk['REFERENCED_TABLE_NAME']) {
            $tblFkIssues[] = "  ⚠ FK khac: {$fk['COLUMN_NAME']} -> {$fk['REFERENCED_TABLE_NAME']}";
        }
    }

    foreach ($newFkMap as $name => $fk) {
        if (!isset($oldFkMap[$name])) {
            $tblFkIssues[] = "  ○ FK thua: {$fk['COLUMN_NAME']} -> {$fk['REFERENCED_TABLE_NAME']}";
        }
    }

    if (!empty($tblFkIssues)) {
        $fkIssues++;
        echo "=== $tbl ===\n";
        foreach ($tblFkIssues as $iss) echo "$iss\n";
    }
}

echo "========================================\n";
echo "  TONG KET\n";
echo "========================================\n";
echo "  Bang OK: " . count($okTables) . " / " . count($oldTables) . "\n";
echo "  Bang co van de cau truc: $issues\n";
echo "  Bang co van de FK: $fkIssues\n";

if ($issues == 0 && $fkIssues == 0 && empty($missingInNew) && empty($extraInNew)) {
    echo "\n  ✅ CAU TRUC GIONG NHAU 100%!\n";
} else {
    echo "\n  ⚠ CO VAN DE - Can sua lai!\n";
}
echo "========================================\n";
