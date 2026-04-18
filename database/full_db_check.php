<?php
$pdo = new PDO('mysql:host=maglev.proxy.rlwy.net;port=44405;dbname=railway;charset=utf8mb4', 'root', 'EcQvhZIyDypbORoVrkpUhlcRTzaJNGOq', [PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);

echo "=== ALL TABLES ===\n";
$tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
foreach ($tables as $t) {
    $cnt = $pdo->query("SELECT COUNT(*) FROM `$t`")->fetchColumn();
    echo "  $t: $cnt rows\n";
}

echo "\n=== Sample Hotels ===\n";
$hotels = $pdo->query("SELECT id, name, slug, star_rating, city_id FROM hotels LIMIT 5")->fetchAll(PDO::FETCH_ASSOC);
foreach ($hotels as $h) { echo "  {$h['id']}: {$h['name']} ({$h['slug']}) star={$h['star_rating']}\n"; }

echo "\n=== Hotel images ===\n";
$imgs = $pdo->query("SELECT hi.id, hi.hotel_id, hi.url, h.name FROM hotel_images hi JOIN hotels h ON hi.hotel_id = h.id LIMIT 5")->fetchAll(PDO::FETCH_ASSOC);
foreach ($imgs as $i) { echo "  {$i['id']}: Hotel {$i['hotel_id']} - {$i['name']}\n"; }

echo "\n=== Room types ===\n";
$rts = $pdo->query("SELECT rt.id, rt.hotel_id, rt.name, rt.base_price_per_night, h.name FROM room_types rt JOIN hotels h ON rt.hotel_id = h.id LIMIT 5")->fetchAll(PDO::FETCH_ASSOC);
foreach ($rts as $r) { echo "  {$r['id']}: {$r['name']} - " . number_format($r['base_price_per_night'],0) . " VND (Hotel {$r['hotel_id']})\n"; }

echo "\n=== Tour categories ===\n";
$cats = $pdo->query("SELECT id, slug, name_vi, name_en FROM tour_categories")->fetchAll(PDO::FETCH_ASSOC);
foreach ($cats as $c) { echo "  {$c['id']}: {$c['slug']} - {$c['name_vi']} / {$c['name_en']}\n"; }

echo "\n=== Amenities (hotel) ===\n";
$am = $pdo->query("SELECT id, code, name_vi FROM amenities WHERE category IN ('HOTEL','BOTH') LIMIT 10")->fetchAll(PDO::FETCH_ASSOC);
foreach ($am as $a) { echo "  {$a['id']}: {$a['code']} - {$a['name_vi']}\n"; }

echo "\n=== Users (sample) ===\n";
$users = $pdo->query("SELECT id, email, name, role FROM users LIMIT 5")->fetchAll(PDO::FETCH_ASSOC);
foreach ($users as $u) { echo "  {$u['id']}: {$u['email']} - {$u['name']} ({$u['role']})\n"; }

echo "\n=== Articles ===\n";
$arts = $pdo->query("SELECT id, title, slug, published FROM articles LIMIT 5")->fetchAll(PDO::FETCH_ASSOC);
foreach ($arts as $a) { echo "  {$a['id']}: {$a['title']} ({$a['slug']}) published={$a['published']}\n"; }
