<?php
$pdo = new PDO(
    'mysql:host=interchange.proxy.rlwy.net;port=38550;dbname=railway;charset=utf8mb4',
    'root',
    'SZhkpiaBKssdXIyGLhTxbLQzGVlOnZBD',
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
);

$stmt = $pdo->prepare("SELECT h.id, h.name, h.owner_id, u.email as owner_email, r.name as owner_role
    FROM hotels h LEFT JOIN users u ON u.id = h.owner_id LEFT JOIN roles r ON r.id = u.role_id
    WHERE h.id = ?");
$stmt->execute([2054]);
$hotel = $stmt->fetch(PDO::FETCH_ASSOC);

echo "Hotel 2054:\n";
print_r($hotel);

if (!$hotel['owner_id']) {
    // Update owner to ducanhle28072003@gmail.com
    $pdo->exec("UPDATE hotels SET owner_id = (SELECT id FROM users WHERE email = 'ducanhle28072003@gmail.com' LIMIT 1) WHERE id = 2054");
    echo "\n✅ Đã gán owner cho hotel 2054\n";
} else {
    echo "\nHotel đã có owner: {$hotel['owner_email']}\n";
}
