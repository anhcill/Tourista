<?php
$pdo = new PDO('mysql:host=interchange.proxy.rlwy.net;port=38550;dbname=railway;charset=utf8mb4', 'root', 'SZhkpiaBKssdXIyGLhTxbLQzGVlOnZBD', [PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);

echo "=== CHECKING SQL FILES vs ACTUAL DB ===\n\n";

// Check hotels table columns
echo "--- hotels table columns ---\n";
$cols = $pdo->query('DESCRIBE hotels')->fetchAll(PDO::FETCH_ASSOC);
$dbCols = [];
foreach($cols as $c) { $dbCols[$c['Field']] = $c; echo "  {$c['Field']}: {$c['Type']} null={$c['Null']} default={$c['Default']}\n"; }

// Check room_types
echo "\n--- room_types table columns ---\n";
$cols = $pdo->query('DESCRIBE room_types')->fetchAll(PDO::FETCH_ASSOC);
$rtCols = [];
foreach($cols as $c) { $rtCols[$c['Field']] = $c; echo "  {$c['Field']}: {$c['Type']} null={$c['Null']} default={$c['Default']}\n"; }

// Check hotel_images
echo "\n--- hotel_images table columns ---\n";
$cols = $pdo->query('DESCRIBE hotel_images')->fetchAll(PDO::FETCH_ASSOC);
foreach($cols as $c) { echo "  {$c['Field']}: {$c['Type']} null={$c['Null']} default={$c['Default']}\n"; }

// Check hotel_amenities
echo "\n--- hotel_amenities table columns ---\n";
$cols = $pdo->query('DESCRIBE hotel_amenities')->fetchAll(PDO::FETCH_ASSOC);
foreach($cols as $c) { echo "  {$c['Field']}: {$c['Type']} null={$c['Null']} default={$c['Default']}\n"; }

// Check cities
echo "\n--- cities table columns ---\n";
$cols = $pdo->query('DESCRIBE cities')->fetchAll(PDO::FETCH_ASSOC);
foreach($cols as $c) { echo "  {$c['Field']}: {$c['Type']} null={$c['Null']} default={$c['Default']}\n"; }

// Check pricing_rules
echo "\n--- pricing_rules table columns ---\n";
try {
    $cols = $pdo->query('DESCRIBE pricing_rules')->fetchAll(PDO::FETCH_ASSOC);
    foreach($cols as $c) { echo "  {$c['Field']}: {$c['Type']} null={$c['Null']} default={$c['Default']}\n"; }
} catch(PDOException $e) {
    echo "  Table does not exist: " . $e->getMessage() . "\n";
}

// Sample data check
echo "\n--- hotels sample (first 3) ---\n";
$stmt = $pdo->query('SELECT id, name, city_id, star_rating, avg_rating, review_count, latitude, longitude, is_active, admin_status FROM hotels LIMIT 3');
foreach($stmt as $row) { echo "  ID={$row['id']} | city_id={$row['city_id']} | stars={$row['star_rating']} | rating={$row['avg_rating']} | reviews={$row['review_count']} | lat={$row['latitude']} | lng={$row['longitude']} | active={$row['is_active']} | status={$row['admin_status']}\n"; }

echo "\n--- room_types sample (first 3) ---\n";
$stmt = $pdo->query('SELECT id, hotel_id, name, base_price_per_night, total_rooms, is_active FROM room_types LIMIT 3');
foreach($stmt as $row) { echo "  ID={$row['id']} | hotel_id={$row['hotel_id']} | name={$row['name']} | price={$row['base_price_per_night']} | rooms={$row['total_rooms']} | active={$row['is_active']}\n"; }

echo "\n--- hotel_images sample (first 3) ---\n";
$stmt = $pdo->query('SELECT id, hotel_id, url, is_cover, sort_order FROM hotel_images LIMIT 3');
foreach($stmt as $row) { echo "  ID={$row['id']} | hotel_id={$row['hotel_id']} | url={$row['url']} | cover={$row['is_cover']} | sort={$row['sort_order']}\n"; }

// FK check
echo "\n--- Foreign Key checks ---\n";

// Check cities FK
try {
    $stmt = $pdo->query('SELECT COUNT(*) as cnt FROM hotels h JOIN cities c ON c.id = h.city_id WHERE h.city_id IS NOT NULL LIMIT 1');
    $r = $stmt->fetch();
    echo "  hotels -> cities FK: OK ({$r['cnt']} matched)\n";
} catch(PDOException $e) {
    echo "  hotels -> cities FK: ERROR - " . $e->getMessage() . "\n";
}

// Check hotels -> room_types
try {
    $stmt = $pdo->query('SELECT COUNT(*) as cnt FROM room_types rt JOIN hotels h ON h.id = rt.hotel_id WHERE rt.hotel_id IS NOT NULL LIMIT 1');
    $r = $stmt->fetch();
    echo "  room_types -> hotels FK: OK ({$r['cnt']} matched)\n";
} catch(PDOException $e) {
    echo "  room_types -> hotels FK: ERROR - " . $e->getMessage() . "\n";
}

// Check hotel_images -> hotels
try {
    $stmt = $pdo->query('SELECT COUNT(*) as cnt FROM hotel_images hi JOIN hotels h ON h.id = hi.hotel_id WHERE hi.hotel_id IS NOT NULL LIMIT 1');
    $r = $stmt->fetch();
    echo "  hotel_images -> hotels FK: OK ({$r['cnt']} matched)\n";
} catch(PDOException $e) {
    echo "  hotel_images -> hotels FK: ERROR - " . $e->getMessage() . "\n";
}

// Check hotel_amenities FK
try {
    $stmt = $pdo->query('SELECT COUNT(*) as cnt FROM hotel_amenities ha JOIN hotels h ON h.id = ha.hotel_id WHERE ha.hotel_id IS NOT NULL LIMIT 1');
    $r = $stmt->fetch();
    echo "  hotel_amenities -> hotels FK: OK ({$r['cnt']} matched)\n";
} catch(PDOException $e) {
    echo "  hotel_amenities -> hotels FK: ERROR - " . $e->getMessage() . "\n";
}

echo "\n--- Sample data with full fields ---\n";
$stmt = $pdo->query('SELECT * FROM hotels LIMIT 1');
$cols = $stmt->fetch(PDO::FETCH_ASSOC);
if ($cols) {
    echo "All hotels columns: " . implode(', ', array_keys($cols)) . "\n";
}

$stmt = $pdo->query('SELECT * FROM room_types LIMIT 1');
$cols = $stmt->fetch(PDO::FETCH_ASSOC);
if ($cols) {
    echo "All room_types columns: " . implode(', ', array_keys($cols)) . "\n";
}

$stmt = $pdo->query('SELECT * FROM hotel_images LIMIT 1');
$cols = $stmt->fetch(PDO::FETCH_ASSOC);
if ($cols) {
    echo "All hotel_images columns: " . implode(', ', array_keys($cols)) . "\n";
}
