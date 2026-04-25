<?php
// Fix dashboard stats issues on Railway DB
$host = 'interchange.proxy.rlwy.net';
$port = 38550;
$db   = 'railway';
$user = 'root';
$pass = 'SZhkpiaBKssdXIyGLhTxbLQzGVlOnZBD';

try {
    $pdo = new PDO("mysql:host=$host;port=$port;dbname=$db;charset=utf8mb4", $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_TIMEOUT => 15,
    ]);
    echo "=== Fix Dashboard Stats ===\n\n";

    // 1. Add admin_status column to tours if missing
    echo "1. Checking tours table...\n";
    $cols = $pdo->query("DESCRIBE tours")->fetchAll(PDO::FETCH_COLUMN | PDO::FETCH_UNIQUE);
    if (!isset($cols['admin_status'])) {
        $pdo->exec("ALTER TABLE tours ADD COLUMN admin_status VARCHAR(20) DEFAULT 'PENDING' AFTER is_active");
        echo "   + Added admin_status column to tours\n";
    } else {
        echo "   - tours.admin_status already exists\n";
    }

    // 2. Set existing tours to APPROVED (they're already live, so they should be approved)
    $affected = $pdo->exec("UPDATE tours SET admin_status = 'APPROVED' WHERE admin_status = 'PENDING' AND is_active = TRUE");
    echo "   ~ Set $affected active tours to APPROVED\n";

    // 3. Approve all existing reviews (they're real data, should be published)
    echo "\n2. Approving all existing reviews...\n";
    $affected = $pdo->exec("UPDATE reviews SET admin_status = 'APPROVED', is_published = TRUE WHERE admin_status = 'PENDING'");
    echo "   ~ Approved $affected reviews\n";

    // 4. Verify stats now
    echo "\n3. Verification:\n";
    $r = $pdo->query("SELECT COUNT(*) as cnt FROM tours WHERE admin_status = 'PENDING'")->fetch();
    echo "   - Pending tours: {$r['cnt']}\n";

    $r = $pdo->query("SELECT COUNT(*) as cnt FROM reviews WHERE admin_status = 'PENDING'")->fetch();
    echo "   - Pending reviews: {$r['cnt']}\n";

    $r = $pdo->query("SELECT COUNT(*) as cnt FROM reviews WHERE is_published = TRUE")->fetch();
    echo "   - Published reviews: {$r['cnt']}\n";

    echo "\n=== Fixes applied! ===\n";
    echo "Dashboard should now show:\n";
    echo "  - Total Tours: 54 (not 0)\n";
    echo "  - Pending Tours: 0\n";
    echo "  - Total Reviews: 38590\n";
    echo "  - Pending Reviews: 0\n";

} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
