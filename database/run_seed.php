<?php
/**
 * Seed comprehensive data: cities, amenities, hotels, tours, images, itinerary, departures
 * Connects to Railway MySQL (from backend/.env)
 */

$host = 'maglev.proxy.rlwy.net';
$port = 44405;
$dbname = 'railway';
$user = 'root';
$pass = 'EcQvhZIyDypbORoVrkpUhlcRTzaJNGOq';

try {
    $pdo = @new PDO("mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4", $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_TIMEOUT => 30,
    ]);
    echo "Connected to Railway MySQL.\n";
} catch (Exception $e) {
    die("Connection failed: " . $e->getMessage() . "\n");
}

$sqlFile = __DIR__ . '/seed_comprehensive.sql';
if (!file_exists($sqlFile)) {
    die("ERROR: seed_comprehensive.sql not found in database folder.\n");
}

$sql = file_get_contents($sqlFile);

// Remove MySQL-specific USE statement (PDO already selects the DB)
$sql = preg_replace('/^USE\s+\w+;\s*$/m', '', $sql);

$statements = preg_split('/;\s*\n/', $sql);
$success = 0;
$errors = 0;

foreach ($statements as $i => $stmt) {
    $stmt = trim($stmt);
    if (empty($stmt) || strpos($stmt, '--') === 0 || preg_match('/^SELECT.*AS result/', $stmt)) {
        if (preg_match('/SELECT.*FROM hotels/', $stmt)) {
            try {
                $count = $pdo->query($stmt)->fetchColumn();
                echo "$stmt: $count\n";
            } catch (Exception $e) {}
        }
        continue;
    }
    try {
        $pdo->exec($stmt);
        $success++;
    } catch (Exception $e) {
        // Skip "duplicate entry" errors - they are expected due to IF NOT EXISTS
        if (strpos($e->getMessage(), 'Duplicate') === false &&
            strpos($e->getMessage(), '1062') === false) {
            $errors++;
            // Only show first few errors to avoid noise
            if ($errors <= 3) {
                echo "WARN ($i): " . substr($e->getMessage(), 0, 120) . "\n";
            }
        } else {
            $success++;
        }
    }
}

echo "\nSeed completed: $success statements executed, $errors errors.\n";

// Final counts
try {
    echo "Hotels: " . $pdo->query("SELECT COUNT(*) FROM hotels")->fetchColumn() . "\n";
    echo "Tours: " . $pdo->query("SELECT COUNT(*) FROM tours")->fetchColumn() . "\n";
    echo "Cities: " . $pdo->query("SELECT COUNT(*) FROM cities")->fetchColumn() . "\n";
    echo "Amenities: " . $pdo->query("SELECT COUNT(*) FROM amenities")->fetchColumn() . "\n";
    echo "Hotel images: " . $pdo->query("SELECT COUNT(*) FROM hotel_images")->fetchColumn() . "\n";
    echo "Tour images: " . $pdo->query("SELECT COUNT(*) FROM tour_images")->fetchColumn() . "\n";
    echo "Room types: " . $pdo->query("SELECT COUNT(*) FROM room_types")->fetchColumn() . "\n";
    echo "Tour departures: " . $pdo->query("SELECT COUNT(*) FROM tour_departures")->fetchColumn() . "\n";
} catch (Exception $e) {
    echo "Count error: " . $e->getMessage() . "\n";
}
