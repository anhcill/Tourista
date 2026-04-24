<?php
/**
 * Fix duplicate cities - keep lowest ID, reassign hotels, delete duplicates
 *
 * Hotels are currently using IDs 64,65,66 (duplicates).
 * Strategy: reassign hotels to the FIRST city in each duplicate group,
 * then delete the duplicate city entries.
 */

$pdo = new PDO(
    'mysql:host=interchange.proxy.rlwy.net;port=38550;dbname=railway;charset=utf8mb4',
    'root',
    'SZhkpiaBKssdXIyGLhTxbLQzGVlOnZBD',
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
);

echo "=== Fix duplicate cities ===\n\n";

try {
    $pdo->beginTransaction();

    // Step 1: Find all duplicate city groups (same name_vi AND name_en)
    $stmt = $pdo->query("
        SELECT name_vi, name_en, COUNT(*) as cnt, GROUP_CONCAT(id ORDER BY id) as ids
        FROM cities
        GROUP BY name_vi, name_en
        HAVING COUNT(*) > 1
        ORDER BY name_vi
    ");
    $groups = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (empty($groups)) {
        echo "No duplicate cities found. Nothing to do.\n";
        $pdo->commit();
        exit(0);
    }

    echo "Found " . count($groups) . " duplicate city groups:\n";
    foreach ($groups as $g) {
        echo "  '{$g['name_vi']}': {$g['cnt']} copies (IDs: {$g['ids']})\n";
    }

    $totalReassigned = 0;
    $totalDeleted = 0;

    foreach ($groups as $g) {
        $ids = array_map('intval', explode(',', $g['ids']));
        sort($ids);
        $keepId = $ids[0];
        $deleteIds = array_slice($ids, 1);

        echo "\nProcessing '{$g['name_vi']}': keep ID=$keepId, delete " . implode(',', $deleteIds) . "\n";

        // Count hotels using each ID
        foreach ($ids as $id) {
            $stmt = $pdo->prepare("SELECT COUNT(*) FROM hotels WHERE city_id = ?");
            $stmt->execute([$id]);
            $cnt = $stmt->fetchColumn();
            echo "  hotels.city_id=$id: $cnt hotels\n";
        }

        // Update hotels to keepId
        if (!empty($deleteIds)) {
            $placeholders = implode(',', array_fill(0, count($deleteIds), '?'));
            $stmt = $pdo->prepare("
                UPDATE hotels SET city_id = ? WHERE city_id IN ($placeholders)
            ");
            $params = array_merge([$keepId], $deleteIds);
            $stmt->execute($params);
            $updated = $stmt->rowCount();
            echo "  Reassigned $updated hotels to city_id=$keepId\n";
            $totalReassigned += $updated;
        }

        // Delete duplicate cities
        foreach ($deleteIds as $delId) {
            // Check for tours using this city
            $stmt = $pdo->prepare("SELECT COUNT(*) FROM tours WHERE city_id = ?");
            $stmt->execute([$delId]);
            $tourCnt = $stmt->fetchColumn();

            if ($tourCnt > 0) {
                echo "  WARNING: $tourCnt tours still reference city_id=$delId. Skipping delete.\n";
                continue;
            }

            $stmt = $pdo->prepare("DELETE FROM cities WHERE id = ?");
            $stmt->execute([$delId]);
            echo "  Deleted city ID=$delId\n";
            $totalDeleted++;
        }
    }

    // Step 2: Verify remaining cities
    echo "\n--- Remaining cities after fix ---\n";
    $stmt = $pdo->query("SELECT id, name_vi, name_en, slug FROM cities ORDER BY id");
    foreach ($stmt as $row) {
        $stmt2 = $pdo->prepare("SELECT COUNT(*) FROM hotels WHERE city_id = ?");
        $stmt2->execute([$row['id']]);
        $hotelCnt = $stmt2->fetchColumn();
        echo "  {$row['id']}: {$row['name_vi']} / {$row['name_en']} - {$hotelCnt} hotels\n";
    }

    // Step 3: Check for remaining duplicates
    echo "\n--- Checking for remaining duplicates ---\n";
    $stmt = $pdo->query("
        SELECT name_vi, name_en, COUNT(*) as cnt
        FROM cities
        GROUP BY name_vi, name_en
        HAVING COUNT(*) > 1
    ");
    $remaining = $stmt->fetchAll();
    if (empty($remaining)) {
        echo "No duplicate cities remaining.\n";
    } else {
        echo "WARNING: Still have " . count($remaining) . " duplicate groups!\n";
        foreach ($remaining as $r) {
            echo "  '{$r['name_vi']}': {$r['cnt']} copies\n";
        }
    }

    // Step 4: Verify FK integrity
    echo "\n--- FK integrity check ---\n";
    $stmt = $pdo->query("
        SELECT COUNT(*) as broken
        FROM hotels h
        LEFT JOIN cities c ON c.id = h.city_id
        WHERE c.id IS NULL
    ");
    $broken = $stmt->fetchColumn();
    echo "Hotels with invalid city_id: $broken\n";

    echo "\nReassigned $totalReassigned hotel city_ids, deleted $totalDeleted duplicate cities.\n";
    $pdo->commit();
    echo "SUCCESS!\n";

} catch (Exception $e) {
    $pdo->rollBack();
    echo "ERROR: " . $e->getMessage() . "\n";
    exit(1);
}
