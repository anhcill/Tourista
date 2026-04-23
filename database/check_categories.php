<?php
$pdo = new PDO('mysql:host=interchange.proxy.rlwy.net;port=38550;dbname=railway;charset=utf8mb4', 'root', 'SZhkpiaBKssdXIyGLhTxbLQzGVlOnZBD', [PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);
$s = $pdo->query('SELECT id, slug, name_vi FROM tour_categories');
while ($r = $s->fetch(PDO::FETCH_ASSOC)) {
    echo "{$r['id']} {$r['slug']} - {$r['name_vi']}\n";
}
