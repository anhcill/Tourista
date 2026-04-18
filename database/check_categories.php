<?php
$pdo = new PDO('mysql:host=maglev.proxy.rlwy.net;port=44405;dbname=railway;charset=utf8mb4', 'root', 'EcQvhZIyDypbORoVrkpUhlcRTzaJNGOq', [PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);
$s = $pdo->query('SELECT id, slug, name_vi FROM tour_categories');
while ($r = $s->fetch(PDO::FETCH_ASSOC)) {
    echo "{$r['id']} {$r['slug']} - {$r['name_vi']}\n";
}
