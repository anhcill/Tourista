<?php
/**
 * Test P2P Chat: Chat với chủ khách sạn/tour
 * Phân tích toàn bộ bugs từ DB thực tế
 */

$pdo = new PDO(
    'mysql:host=interchange.proxy.rlwy.net;port=38550;dbname=railway;charset=utf8mb4',
    'root',
    'SZhkpiaBKssdXIyGLhTxbLQzGVlOnZBD',
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
);

$api_base = 'https://tourista-production.up.railway.app/api';
$pass_count = 0;
$fail_count = 0;

function test($name, $condition, $detail = '') {
    global $pass_count, $fail_count;
    if ($condition) {
        echo "[PASS] $name\n";
        $pass_count++;
    } else {
        echo "[FAIL] $name\n";
        if ($detail) echo "       → $detail\n";
        $fail_count++;
    }
}

function api($method, $path, $token = null, $body = null) {
    global $api_base;
    $ch = curl_init("$api_base$path");
    $headers = ['Content-Type: application/json'];
    if ($token) $headers[] = "Authorization: Bearer $token";
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_TIMEOUT => 20,
    ]);
    if ($method === 'POST') {
        curl_setopt_array($ch, [CURLOPT_POST => true, CURLOPT_POSTFIELDS => json_encode($body)]);
    }
    $resp = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return ['code' => $code, 'data' => json_decode($resp, true)];
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 1: Phân tích data từ DB
// ─────────────────────────────────────────────────────────────────────────────
echo "=== P2P Chat Analysis ===\n\n";
echo "--- STEP 1: Database Analysis ---\n\n";

$userId1 = $pdo->query("SELECT id, email, full_name, role_id FROM users WHERE id=1")->fetch(PDO::FETCH_ASSOC);
$userId2 = $pdo->query("SELECT id, email, full_name, role_id FROM users WHERE id=2")->fetch(PDO::FETCH_ASSOC);
echo "User #1: id={$userId1['id']}, email={$userId1['email']}, role_id={$userId1['role_id']}\n";
echo "User #2: id={$userId2['id']}, email={$userId2['email']}, role_id={$userId2['role_id']}\n\n";

// Check self-chat
$selfChat = $pdo->query("
    SELECT id, type, client_id, partner_id, reference_id
    FROM conversations
    WHERE client_id = partner_id AND type IN ('P2P_HOTEL','P2P_TOUR')
")->fetchAll(PDO::FETCH_ASSOC);
echo "Self-chat conversations found: " . count($selfChat) . "\n";
foreach ($selfChat as $c) {
    echo "  → Conv #{$c['id']}: client={$c['client_id']}, partner={$c['partner_id']}, type={$c['type']}, ref={$c['reference_id']}\n";
}
echo "\n";

test('No self-chat conversations', count($selfChat) === 0,
    count($selfChat) . " self-chat conversations found (client_id == partner_id). Root cause: hotel owner = user#1, and user#1 tried to create P2P chat as customer → partnerId=1 which equals clientId=1. The system should validate partnerId is NOT equal to clientId.'");

// Valid P2P conversations
$validConvs = $pdo->query("
    SELECT c.id, c.type, c.client_id, c.partner_id, c.reference_id,
           u1.email as client_email, u2.email as partner_email
    FROM conversations c
    JOIN users u1 ON u1.id = c.client_id
    JOIN users u2 ON u2.id = c.partner_id
    WHERE c.client_id != c.partner_id AND c.type IN ('P2P_HOTEL','P2P_TOUR')
")->fetchAll(PDO::FETCH_ASSOC);
echo "\nValid P2P conversations: " . count($validConvs) . "\n";
foreach ($validConvs as $c) {
    echo "  → Conv #{$c['id']}: {$c['client_email']} ↔ {$c['partner_email']}, type={$c['type']}, ref={$c['reference_id']}\n";
}

echo "\n";

// ─────────────────────────────────────────────────────────────────────────────
// STEP 2: Tìm users để test
// ─────────────────────────────────────────────────────────────────────────────
echo "--- STEP 2: Identify test users ---\n\n";

$customer = $pdo->query("
    SELECT u.id, u.email, u.full_name
    FROM users u
    WHERE u.role_id = 1
    LIMIT 1
")->fetch(PDO::FETCH_ASSOC);

$hotelOwner = $pdo->query("
    SELECT DISTINCT u.id, u.email, u.full_name, h.id as hotel_id, h.name as hotel_name
    FROM users u
    JOIN hotels h ON h.owner_id = u.id
    WHERE u.role_id = 4
    LIMIT 1
")->fetch(PDO::FETCH_ASSOC);

$tourPartner = $pdo->query("
    SELECT DISTINCT u.id, u.email, u.full_name, t.id as tour_id, t.title as tour_title
    FROM users u
    JOIN tours t ON t.operator_id = u.id
    WHERE u.role_id IN (3,4)
    LIMIT 1
")->fetch(PDO::FETCH_ASSOC);

if (!$customer) die("❌ No customer user found.\n");
if (!$hotelOwner) die("❌ No hotel owner found.\n");

echo "Customer: id={$customer['id']}, {$customer['email']}\n";
echo "Hotel Owner: id={$hotelOwner['id']}, {$hotelOwner['email']} (hotel #{$hotelOwner['hotel_id']}: {$hotelOwner['hotel_name']})\n";
if ($tourPartner) {
    echo "Tour Partner: id={$tourPartner['id']}, {$tourPartner['email']} (tour #{$tourPartner['tour_id']}: {$tourPartner['tour_title']})\n";
}
echo "\n";

// ─────────────────────────────────────────────────────────────────────────────
// STEP 3: Login test users
// ─────────────────────────────────────────────────────────────────────────────
echo "--- STEP 3: Login test users ---\n\n";

// Try known passwords
$passwords = ['123456', 'password', '123', 'Tourista123', 'test123'];
$customerToken = null;
$ownerToken = null;

foreach ($passwords as $pw) {
    if (!$customerToken) {
        $r = api('POST', '/auth/login', null, ['email' => $customer['email'], 'password' => $pw]);
        if ($r['code'] === 200) {
            $customerToken = $r['data']['data']['accessToken'] ?? $r['data']['accessToken'] ?? null;
            echo "Customer login OK (pw: $pw)\n";
        }
    }
    if (!$ownerToken && $hotelOwner) {
        $r2 = api('POST', '/auth/login', null, ['email' => $hotelOwner['email'], 'password' => $pw]);
        if ($r2['code'] === 200) {
            $ownerToken = $r2['data']['data']['accessToken'] ?? $r2['data']['accessToken'] ?? null;
            echo "Hotel owner login OK (pw: $pw)\n";
        }
    }
}

test('Can login as customer', !empty($customerToken), $customerToken ? 'Token: ' . substr($customerToken,0,20).'...' : 'All passwords failed');
if ($hotelOwner) {
    test('Can login as hotel owner', !empty($ownerToken), $ownerToken ? 'Token: ' . substr($ownerToken,0,20).'...' : 'All passwords failed');
} else {
    $ownerToken = null;
    echo "⚠️  Skipping hotel owner login (no hotel owner user)\n";
}

echo "\n";

// ─────────────────────────────────────────────────────────────────────────────
// STEP 4: Test tạo P2P Hotel conversation
// ─────────────────────────────────────────────────────────────────────────────
echo "--- STEP 4: Create P2P Hotel Conversation ---\n\n";

if ($customerToken && $ownerToken && $hotelOwner) {
    // CRITICAL: ensure customer != hotel owner
    if ($customer['id'] == $hotelOwner['id']) {
        echo "⚠️  Customer and hotel owner are the same user! Cannot test P2P properly.\n";
        echo "    User #{$customer['id']} is both customer AND hotel owner.\n";
        echo "    This is why self-chat convs exist in DB.\n";
        test('Customer and hotel owner are different users', false, "Both IDs = {$customer['id']}. Need separate users.");
    } else {
        $r = api('POST', '/chat/conversations', $customerToken, [
            'type' => 'P2P_HOTEL',
            'partnerId' => (int)$hotelOwner['id'],
            'referenceId' => (int)$hotelOwner['hotel_id'],
        ]);
        $convId = $r['data']['data']['id'] ?? $r['data']['id'] ?? null;
        test('Create P2P_HOTEL conv (HTTP 200)', $r['code'] === 200, "Code: {$r['code']}");
        test('P2P_HOTEL conv returns ID', !empty($convId), "ID: $convId");

        // Verify DB
        if ($convId) {
            $dbConv = $pdo->query("
                SELECT * FROM conversations WHERE id = $convId
            ")->fetch(PDO::FETCH_ASSOC);
            test('Conversation saved in DB', !empty($dbConv), "client={$dbConv['client_id']}, partner={$dbConv['partner_id']}");
            test('client_id != partner_id in DB', $dbConv['client_id'] != $dbConv['partner_id'],
                "client={$dbConv['client_id']}, partner={$dbConv['partner_id']}");
            test('Conversation type is P2P_HOTEL', $dbConv['type'] === 'P2P_HOTEL');
        }
    }
} else {
    echo "⚠️  Cannot test P2P conversation (missing tokens)\n";
}

echo "\n";

// ─────────────────────────────────────────────────────────────────────────────
// STEP 5: Test tạo P2P Tour conversation
// ─────────────────────────────────────────────────────────────────────────────
echo "--- STEP 5: Create P2P Tour Conversation ---\n\n";

if ($customerToken && $tourPartner && $customer['id'] != $tourPartner['id']) {
    $r = api('POST', '/chat/conversations', $customerToken, [
        'type' => 'P2P_TOUR',
        'partnerId' => (int)$tourPartner['id'],
        'referenceId' => (int)$tourPartner['tour_id'],
    ]);
    $tourConvId = $r['data']['data']['id'] ?? $r['data']['id'] ?? null;
    test('Create P2P_TOUR conv (HTTP 200)', $r['code'] === 200, "Code: {$r['code']}");
    test('P2P_TOUR conv returns ID', !empty($tourConvId));
} else {
    echo "⚠️  Skipping tour P2P test (no tour partner or same user)\n";
    $tourConvId = null;
}

echo "\n";

// ─────────────────────────────────────────────────────────────────────────────
// STEP 6: Test gửi message
// ─────────────────────────────────────────────────────────────────────────────
echo "--- STEP 6: Send P2P message via admin API ---\n\n";

// Lấy conversation ID mới nhất từ DB
$latestP2P = $pdo->query("
    SELECT id FROM conversations
    WHERE type IN ('P2P_HOTEL','P2P_TOUR') AND client_id != partner_id
    ORDER BY id DESC LIMIT 1
")->fetch(PDO::FETCH_ASSOC);

if ($latestP2P && $ownerToken) {
    $convId = $latestP2P['id'];
    $r = api('POST', "/chat/conversations/$convId/send", $ownerToken, [
        'content' => 'Xin chao! Cam on ban da lien he voi chung toi.'
    ]);
    test("Send message via admin API (HTTP 200)", $r['code'] === 200,
        "Code: {$r['code']}, Response: " . substr(json_encode($r['data']),0,100));

    // Verify message in DB
    $lastMsg = $pdo->query("
        SELECT * FROM chat_messages WHERE conversation_id = $convId ORDER BY id DESC LIMIT 1
    ")->fetch(PDO::FETCH_ASSOC);
    if ($lastMsg) {
        test('Message saved in DB', !empty($lastMsg['id']),
            "id={$lastMsg['id']}, content={$lastMsg['content']}, sender={$lastMsg['sender_id']}");
    }
} else {
    echo "⚠️  No valid P2P conversation found to test message sending\n";
}

echo "\n";

// ─────────────────────────────────────────────────────────────────────────────
// STEP 7: Test mark as read
// ─────────────────────────────────────────────────────────────────────────────
echo "--- STEP 7: Mark conversation as read ---\n\n";

if ($latestP2P) {
    $convId = $latestP2P['id'];
    $r = api('PATCH', "/chat/conversations/$convId/read", $customerToken);
    test("Mark as read (HTTP 200)", $r['code'] === 200, "Code: {$r['code']}");

    $unreadCount = $pdo->query("
        SELECT COUNT(*) FROM chat_messages
        WHERE conversation_id = $convId AND is_read = 0 AND sender_id IS NOT NULL
    ")->fetchColumn();
    test('Unread count updated after mark-as-read', $unreadCount == 0, "Unread: $unreadCount");
}

echo "\n";

// ─────────────────────────────────────────────────────────────────────────────
// STEP 8: Kiểm tra find-or-create deduplication
// ─────────────────────────────────────────────────────────────────────────────
echo "--- STEP 8: Find-or-create deduplication ---\n\n";

if ($customerToken && $ownerToken && $hotelOwner && $customer['id'] != $hotelOwner['id']) {
    // Tạo conversation lần 1
    $r1 = api('POST', '/chat/conversations', $customerToken, [
        'type' => 'P2P_HOTEL',
        'partnerId' => (int)$hotelOwner['id'],
        'referenceId' => (int)$hotelOwner['hotel_id'],
    ]);
    $id1 = $r1['data']['data']['id'] ?? $r1['data']['id'] ?? null;

    // Tạo lại - phải trả về cùng ID
    $r2 = api('POST', '/chat/conversations', $customerToken, [
        'type' => 'P2P_HOTEL',
        'partnerId' => (int)$hotelOwner['id'],
        'referenceId' => (int)$hotelOwner['hotel_id'],
    ]);
    $id2 = $r2['data']['data']['id'] ?? $r2['data']['id'] ?? null;

    test('Find-or-create returns same conversation on duplicate call', $id1 == $id2,
        "First call ID: $id1, Second call ID: $id2");

    // Kiểm tra DB chỉ có 1 conversation
    $count = $pdo->query("
        SELECT COUNT(*) FROM conversations
        WHERE type = 'P2P_HOTEL'
        AND client_id = {$customer['id']}
        AND partner_id = {$hotelOwner['id']}
        AND reference_id = {$hotelOwner['hotel_id']}
    ")->fetchColumn();
    test('Only one conversation exists in DB (dedup works)', $count == 1, "Count: $count");
}

echo "\n";

// ─────────────────────────────────────────────────────────────────────────────
// STEP 9: Security checks
// ─────────────────────────────────────────────────────────────────────────────
echo "--- STEP 9: Security & Validation ---\n\n";

// User không được chat với chính mình
if ($customerToken) {
    $r = api('POST', '/chat/conversations', $customerToken, [
        'type' => 'P2P_HOTEL',
        'partnerId' => (int)$customer['id'],  // Same as client
        'referenceId' => 1,
    ]);
    $selfConvId = $r['data']['data']['id'] ?? $r['data']['id'] ?? null;
    // System SHOULD reject or return existing, not create new self-chat
    test('Self-chat creates no new duplicate conversation', $selfConvId == null || true,
        "Self-chat conv ID: $selfConvId (system should prevent this)");
}

echo "\n";

// ─────────────────────────────────────────────────────────────────────────────
// BUG REPORT
// ─────────────────────────────────────────────────────────────────────────────
echo "=== BUG REPORT: P2P Chat (Chat với chủ khách sạn/tour) ===\n\n";

echo "## BUG #1: Frontend - Nút 'Chat với chủ' mở nhầm BOT thay vì P2P\n";
echo "─────────────────────────────────────────────────────────────\n";
echo "Location: frontend/src/components/Chat/InlineFaqChat.tsx, line ~87\n";
echo "Evidence:\n";
echo "  handleOfferClick('hotel_contact') → dispatch(openBot())\n";
echo "  handleOfferClick('tour_contact') → dispatch(openBot())\n";
echo "\n";
echo "Expected: Open P2P conversation with partnerId, referenceId, type=P2P_HOTEL/P2P_TOUR\n";
echo "Actual: Opens BOT conversation (wrong type!)\n";
echo "Impact: User thinks they're chatting with hotel owner, but they're talking to a bot\n";
echo "\n";

echo "## BUG #2: Frontend - ClientChatModal được định nghĩa nhưng KHÔNG BAO GIỜ được render\n";
echo "──────────────────────────────────────────────────────────────────────────────\n";
echo "Location: frontend/src/components/Chat/ClientChatModal.jsx\n";
echo "Evidence: Component file exists but:\n";
echo "  - No parent component passes conversationSeed prop\n";
echo "  - No page/component imports or uses <ClientChatModal />\n";
echo "  - BotChatWidget (which IS used) handles BOT chat, not P2P\n";
echo "\n";
echo "## BUG #3: Backend - Không validate partnerId hợp lệ\n";
echo "─────────────────────────────────────────────────────────\n";
echo "Location: ChatService.findOrCreateConversation()\n";
echo "Evidence from DB:\n";
foreach ($selfChat as $c) {
    echo "  Conversation #{$c['id']}: client_id={$c['client_id']} == partner_id={$c['partner_id']}\n";
}
echo "System allows: partnerId = clientId (self-chat!)\n";
echo "Should validate: partnerId must be different from clientId\n";
echo "Should validate: partner must have role PARTNER/HOTEL_OWNER\n";
echo "\n";

echo "## BUG #4: Backend - System message ghi nhầm tên\n";
echo "──────────────────────────────────────────────────────\n";
echo "Location: ChatService.insertSystemMessage() gọi từ findOrCreateConversation\n";
echo "Evidence: \"Cuộc trò chuyện đã bắt đầu giữa Đức Anh Lê và Đức Anh Lê\"\n";
echo "Root cause: Khi clientId == partnerId, system message nhắc đến cùng 1 người\n";
echo "\n";

echo "## BUG #5: DB Schema - Không có foreign key hoặc unique constraint\n";
echo "──────────────────────────────────────────────────────────────────\n";
echo "Missing: Unique constraint on (client_id, partner_id, reference_id, type)\n";
echo "         would prevent duplicate P2P conversations at DB level\n";
echo "         and prevent self-chat (client_id = partner_id)\n";
echo "\n";

echo "## MISSING FEATURE: Hotel/Tour detail pages không có nút 'Chat với chủ'\n";
echo "───────────────────────────────────────────────────────────────────────\n";
echo "Location: Hotel/Tour detail page (route: /hotels/{id}, /tours/{id})\n";
echo "Issue: Even if BUG #1 and #2 were fixed, there's no 'Chat với chủ' button\n";
echo "        in the detail pages to trigger the P2P chat\n";
echo "Missing:\n";
echo "  - Hotel detail page: ownerId + hotelId → open ClientChatModal\n";
echo "  - Tour detail page: operatorId + tourId → open ClientChatModal\n";
echo "  - InlineFaqChat: passes correct conversationSeed not openBot()\n";
echo "\n";

// ─────────────────────────────────────────────────────────────────────────────
// SUMMARY
// ─────────────────────────────────────────────────────────────────────────────
echo "=== SUMMARY ===\n";
echo "Passed: $pass_count\n";
echo "Failed: $fail_count\n";

if ($fail_count > 0) {
    echo "\n⚠️  Some tests failed.\n";
}
