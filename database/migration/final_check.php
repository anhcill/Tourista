<?php
$pdo = new PDO(
    'mysql:host=interchange.proxy.rlwy.net;port=38550;dbname=railway;charset=utf8mb4',
    'root',
    'SZhkpiaBKssdXIyGLhTxbLQzGVlOnZBD',
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
);

echo "=== FINAL DB VERIFICATION ===\n\n";

$issues = 0;

// 1. Hotels with valid coordinates
$stmt = $pdo->query('SELECT COUNT(*) FROM hotels WHERE latitude IS NOT NULL AND longitude IS NOT NULL AND latitude != 0 AND longitude != 0');
$validCoords = $stmt->fetchColumn();
echo "Hotels with valid coordinates: $validCoords\n";

// 2. Duplicate city names
$stmt = $pdo->query("SELECT name_vi, name_en, COUNT(*) as cnt FROM cities GROUP BY name_vi, name_en HAVING cnt > 1");
$dupCities = $stmt->fetchAll();
if (empty($dupCities)) {
    echo "Duplicate city names: NONE (OK)\n";
} else {
    echo "Duplicate city names: FOUND (" . count($dupCities) . " groups)\n";
    foreach ($dupCities as $d) { echo "  {$d['name_vi']}: {$d['cnt']}\n"; }
    $issues++;
}

// 3. Duplicate amenity names
$stmt = $pdo->query("SELECT name_vi, COUNT(*) as cnt FROM amenities GROUP BY name_vi HAVING cnt > 1");
$dupAmen = $stmt->fetchAll();
if (empty($dupAmen)) {
    echo "Duplicate amenity names: NONE (OK)\n";
} else {
    echo "Duplicate amenity names: FOUND (" . count($dupAmen) . " groups)\n";
    $issues++;
}

// 4. Orphan hotel_amenities
$stmt = $pdo->query("SELECT COUNT(*) FROM hotel_amenities ha LEFT JOIN amenities a ON a.id = ha.amenity_id WHERE a.id IS NULL");
$orphans = $stmt->fetchColumn();
if ($orphans == 0) {
    echo "Orphan hotel_amenities: NONE (OK)\n";
} else {
    echo "Orphan hotel_amenities: $orphans\n";
    $issues++;
}

// 5. Hotels with invalid city_id
$stmt = $pdo->query("SELECT COUNT(*) FROM hotels h LEFT JOIN cities c ON c.id = h.city_id WHERE c.id IS NULL");
$invalidCity = $stmt->fetchColumn();
if ($invalidCity == 0) {
    echo "Hotels with invalid city_id: NONE (OK)\n";
} else {
    echo "Hotels with invalid city_id: $invalidCity\n";
    $issues++;
}

// 6. Duplicate slugs
$stmt = $pdo->query("SELECT slug, COUNT(*) as cnt FROM hotels GROUP BY slug HAVING cnt > 1");
$dupSlugs = $stmt->fetchAll();
if (empty($dupSlugs)) {
    echo "Duplicate hotel slugs: NONE (OK)\n";
} else {
    echo "Duplicate hotel slugs: " . count($dupSlugs) . "\n";
    $issues++;
}

// 7. Hotels without room_types
$stmt = $pdo->query("SELECT COUNT(*) FROM hotels h LEFT JOIN room_types rt ON rt.hotel_id = h.id WHERE rt.id IS NULL");
$noRooms = $stmt->fetchColumn();
if ($noRooms == 0) {
    echo "Hotels without room_types: NONE (OK)\n";
} else {
    echo "Hotels without room_types: $noRooms\n";
}

// 8. Hotels without images
$stmt = $pdo->query("SELECT COUNT(*) FROM hotels h LEFT JOIN hotel_images hi ON hi.hotel_id = h.id WHERE hi.id IS NULL");
$noImages = $stmt->fetchColumn();
if ($noImages == 0) {
    echo "Hotels without images: NONE (OK)\n";
} else {
    echo "Hotels without images: $noImages\n";
}

// 9. Hotels with valid coords for map
$stmt = $pdo->query("SELECT COUNT(*) FROM hotels WHERE latitude IS NOT NULL AND longitude IS NOT NULL AND latitude != 0 AND longitude != 0 AND is_active = TRUE");
$mapReady = $stmt->fetchColumn();
echo "Hotels ready for map display: $mapReady\n";

// 10. Summary
echo "\n--- SUMMARY ---\n";
$stmt = $pdo->query('SELECT COUNT(*) FROM hotels');
$totalHotels = $stmt->fetchColumn();
$stmt = $pdo->query('SELECT COUNT(*) FROM cities');
$totalCities = $stmt->fetchColumn();
$stmt = $pdo->query('SELECT COUNT(*) FROM amenities');
$totalAmenities = $stmt->fetchColumn();
$stmt = $pdo->query('SELECT COUNT(*) FROM room_types');
$totalRooms = $stmt->fetchColumn();

echo "Total hotels: $totalHotels\n";
echo "Total cities: $totalCities\n";
echo "Total amenities: $totalAmenities\n";
echo "Total room_types: $totalRooms\n";

if ($issues == 0) {
    echo "\nALL CHECKS PASSED - No issues found.\n";
} else {
    echo "\nWARNING: $issues issue(s) found.\n";
}
