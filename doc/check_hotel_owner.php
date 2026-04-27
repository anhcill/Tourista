<?php
$pdo = new PDO(
    'mysql:host=interchange.proxy.rlwy.net;port=38550;dbname=railway;charset=utf8mb4',
    'root',
    'SZhkpiaBKssdXIyGLhTxbLQzGVlOnZBD',
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
);

echo "=== TUYET DOI PHAI LAM ===\n\n";

echo "1. DEBUG TOKEN:\n";
echo "   Mo Chrome > F12 > Application > Session Storage > tim 'tourista_token'\n";
echo "   Copy token, decode base64 phan giua (payload) tai https://jwt.io\n";
echo "   Kiem tra truong 'role' co gia tri gi?\n\n";

echo "2. RESET TOKEN:\n";
echo "   - Dang xuat\n";
echo "   - Xoa Session Storage (F12 > Application > Session Storage > clear)\n";
echo "   - Xoa Local Storage (F12 > Application > Local Storage > clear)\n";
echo "   - Xoa cookies\n";
echo "   - Dang nhap lai\n\n";

echo "3. NEU VAN LOI, CHECK NETWORK TAB:\n";
echo "   - Vao /partner\n";
echo "   - F12 > Network tab\n";
echo "   - Tim /api/partner/hotels\n";
echo "   - Xem response: 200? 403? 401?\n";
echo "   - Neu 403: token role khong co quyen\n";
echo "   - Neu 200: frontend van chua fix\n\n";

$email = 'ducanhle28072003@gmail.com';

echo "4. TOKEN TRONG DB (neu co refresh token):\n";
$stmt = $pdo->prepare("SELECT * FROM refresh_tokens WHERE user_id = (SELECT id FROM users WHERE email = ?) LIMIT 1");
$stmt->execute([$email]);
$token = $stmt->fetch(PDO::FETCH_ASSOC);
if ($token) {
    echo "Co refresh token, chua het han\n";
    echo "Expires: {$token['expires_at']}\n";
} else {
    echo "Khong co refresh token hoac da het han\n";
}

echo "\n5. CHECK ROLES TABLE:\n";
$stmt2 = $pdo->query("SELECT * FROM roles");
$roles = $stmt2->fetchAll(PDO::FETCH_ASSOC);
print_r($roles);
?>
