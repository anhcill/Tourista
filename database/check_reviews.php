<?php
$pdo = new PDO('mysql:host=maglev.proxy.rlwy.net;port=44405;dbname=railway;charset=utf8mb4', 'root', 'EcQvhZIyDypbORoVrkpUhlcRTzaJNGOq', [PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);
echo "=== Reviews Table Schema ===\n";
$cols = $pdo->query('DESCRIBE reviews')->fetchAll();
foreach ($cols as $c) echo "{$c['Field']} {$c['Type']} NULL={$c['Null']} Default={$c['Default']}\n";
echo "\n=== Review Counts ===\n";
$cnt = $pdo->query('SELECT COUNT(*) FROM reviews')->fetchColumn();
echo "Total reviews: $cnt\n";
$published = $pdo->query('SELECT COUNT(*) FROM reviews WHERE is_published = 1')->fetchColumn();
$unpublished = $pdo->query('SELECT COUNT(*) FROM reviews WHERE is_published = 0')->fetchColumn();
echo "Published: $published\n";
echo "Unpublished: $unpublished\n";
echo "\n=== Sample Unpublished Reviews ===\n";
$sample = $pdo->query('SELECT r.id, r.overall_rating, r.comment, r.is_verified, r.is_published, r.created_at FROM reviews r WHERE is_published = 0 ORDER BY r.created_at DESC LIMIT 5')->fetchAll(PDO::FETCH_ASSOC);
foreach ($sample as $r) {
    $comment = substr($r['comment'], 0, 80);
    echo "  ID={$r['id']} rating={$r['overall_rating']} verified={$r['is_verified']} published={$r['is_published']} comment=$comment\n";
}
