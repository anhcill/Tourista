<?php
/**
 * Fix 1: Delete duplicate amenities (IDs 34-48)
 * These are exact duplicates of IDs 11-25.
 * FK: hotel_amenities.amenity_id -> amenities.id ON DELETE CASCADE
 * So deleting from amenities will cascade-delete from hotel_amenities automatically.
 */

$pdo = new PDO(
    'mysql:host=interchange.proxy.rlwy.net;port=38550;dbname=railway;charset=utf8mb4',
    'root',
    'SZhkpiaBKssdXIyGLhTxbLQzGVlOnZBD',
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
);

echo "=== Fix 1: Delete duplicate amenities (IDs 34-48) ===\n\n";

try {
    $pdo->beginTransaction();

    // Check current state
    $stmt = $pdo->query('SELECT COUNT(*) FROM amenities WHERE id >= 34');
    $toDelete = $stmt->fetchColumn();
    echo "Amenities with IDs 34+: $toDelete\n";

    $stmt = $pdo->query('SELECT COUNT(*) FROM hotel_amenities WHERE amenity_id >= 34');
    $cascadeHa = $stmt->fetchColumn();
    echo "hotel_amenities entries referencing them: $cascadeHa\n";

    if ($cascadeHa > 0) {
        echo "These will be CASCADE deleted automatically.\n";
    }

    $stmt = $pdo->prepare('DELETE FROM amenities WHERE id >= 34');
    $stmt->execute();
    $deleted = $stmt->rowCount();
    echo "Deleted $deleted duplicate amenities.\n";

    // Verify
    $stmt = $pdo->query('SELECT id, name_vi FROM amenities ORDER BY id');
    echo "\nRemaining amenities:\n";
    foreach ($stmt as $row) {
        echo "  {$row['id']}: {$row['name_vi']}\n";
    }

    // Check integrity
    $stmt = $pdo->query('
        SELECT COUNT(*) as broken
        FROM hotel_amenities ha
        LEFT JOIN amenities a ON a.id = ha.amenity_id
        WHERE a.id IS NULL
    ');
    $broken = $stmt->fetchColumn();
    echo "\nOrphan hotel_amenities: $broken\n";

    $pdo->commit();
    echo "\nSUCCESS!\n";
} catch (Exception $e) {
    $pdo->rollBack();
    echo "ERROR: " . $e->getMessage() . "\n";
    exit(1);
}
