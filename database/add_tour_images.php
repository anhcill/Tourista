<?php
// Quick fix: add tour_images for 15 new tours
$pdo = new PDO('mysql:host=interchange.proxy.rlwy.net;port=38550;dbname=railway;charset=utf8mb4', 'root', 'SZhkpiaBKssdXIyGLhTxbLQzGVlOnZBD', [PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);

$images = [
    8 => ['https://images.unsplash.com/photo-1564507592333-c60657eea523?w=1600&q=80', 'Hanoi Old Quarter'],
    9 => ['https://images.unsplash.com/photo-1509002236388-990aab93d798?w=1600&q=80', 'Trang An boats'],
    10 => ['https://images.unsplash.com/photo-1583394964284-8dd09d3f6e9e?w=1600&q=80', 'Hanoi pho'],
    11 => ['https://images.unsplash.com/photo-1559599238-308793637427?w=1600&q=80', 'Nha Trang islands'],
    12 => ['https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1600&q=80', 'Nha Trang diving'],
    13 => ['https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=1600&q=80', 'Cu Chi tunnels'],
    14 => ['https://images.unsplash.com/photo-1528164344705-47542687000d?w=1600&q=80', 'Mekong Delta'],
    15 => ['https://images.unsplash.com/photo-1555126634-323283e090fa?w=1600&q=80', 'Saigon street food'],
    16 => ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&q=80', 'Phu Quoc islands'],
    17 => ['https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=1600&q=80', 'Phu Quoc exploration'],
    18 => ['https://images.unsplash.com/photo-1502175353174-a7a70e73b362?w=1600&q=80', 'Ha Long Bay'],
    19 => ['https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1600&q=80', 'Da Lat landscape'],
    20 => ['https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1600&q=80', 'Da Lat coffee'],
    21 => ['https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=1600&q=80', 'Hue Imperial City'],
    22 => ['https://images.unsplash.com/photo-1584976781699-48db8c1c8744?w=1600&q=80', 'Hue DMZ'],
];

$now = date('Y-m-d H:i:s');
$added = 0;

foreach ($images as $tourId => $img) {
    // Check if image already exists
    $exists = $pdo->query("SELECT COUNT(*) FROM tour_images WHERE tour_id = $tourId")->fetchColumn();
    if ($exists > 0) {
        echo "SKIP: Tour $tourId already has images\n";
        continue;
    }
    $maxId = (int)$pdo->query("SELECT COALESCE(MAX(id), 0) FROM tour_images")->fetchColumn() + 1;
    $pdo->prepare("INSERT INTO tour_images (id, tour_id, url, alt_text, is_cover, sort_order) VALUES (?, ?, ?, ?, TRUE, 1)")
        ->execute([$maxId, $tourId, $img[0], $img[1]]);
    echo "Added image for tour $tourId\n";
    $added++;
}

echo "\nAdded $added images.\n";
echo "Total tour_images: " . $pdo->query("SELECT COUNT(*) FROM tour_images")->fetchColumn() . "\n";
