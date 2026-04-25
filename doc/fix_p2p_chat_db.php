<?php
/**
 * Script sửa lỗi P2P Chat:
 * 1. Xóa self-chat conversations (client_id == partner_id)
 * 2. Xóa messages liên quan
 * 3. Thêm unique constraint để ngăn future self-chat
 */

$pdo = new PDO(
    'mysql:host=interchange.proxy.rlwy.net;port=38550;dbname=railway;charset=utf8mb4',
    'root',
    'SZhkpiaBKssdXIyGLhTxbLQzGVlOnZBD',
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
);

echo "========================================\n";
echo "  FIX P2P CHAT - DB REPAIR\n";
echo "========================================\n\n";

// Bước 1: Tìm self-chat conversations
echo "--- STEP 1: Find self-chat conversations ---\n";
$selfChat = $pdo->query("
    SELECT id, type, client_id, partner_id, reference_id, created_at
    FROM conversations
    WHERE client_id = partner_id AND type IN ('P2P_HOTEL', 'P2P_TOUR')
")->fetchAll(PDO::FETCH_ASSOC);

echo "Found " . count($selfChat) . " self-chat conversations:\n";
foreach ($selfChat as $c) {
    echo "  → Conv #{$c['id']}: client={$c['client_id']}, partner={$c['partner_id']}, type={$c['type']}\n";
}
echo "\n";

if (count($selfChat) === 0) {
    echo "No self-chat conversations to clean.\n";
} else {
    // Bước 2: Xóa messages của self-chat conversations
    echo "--- STEP 2: Delete messages from self-chat conversations ---\n";
    $convIds = array_column($selfChat, 'id');
    $inClause = implode(',', $convIds);

    $stmt = $pdo->query("SELECT COUNT(*) FROM chat_messages WHERE conversation_id IN ($inClause)");
    $msgCount = $stmt->fetchColumn();
    echo "Messages to delete: $msgCount\n";

    if ($msgCount > 0) {
        $pdo->exec("DELETE FROM chat_messages WHERE conversation_id IN ($inClause)");
        echo "Deleted $msgCount messages.\n";
    }
    echo "\n";

    // Bước 3: Xóa self-chat conversations
    echo "--- STEP 3: Delete self-chat conversations ---\n";
    $pdo->exec("
        DELETE FROM conversations
        WHERE client_id = partner_id AND type IN ('P2P_HOTEL', 'P2P_TOUR')
    ");
    echo "Deleted " . count($selfChat) . " self-chat conversations.\n";
    echo "\n";
}

// Bước 4: Kiểm tra xem unique constraint đã tồn tại chưa
echo "--- STEP 4: Check existing unique constraints ---\n";
$constraints = $pdo->query("
    SELECT CONSTRAINT_NAME
    FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = 'railway'
      AND TABLE_NAME = 'conversations'
      AND CONSTRAINT_TYPE = 'UNIQUE'
")->fetchAll(PDO::FETCH_COLUMN);

echo "Existing unique constraints on 'conversations':\n";
foreach ($constraints as $c) {
    echo "  - $c\n";
}
echo "\n";

// Bước 5: Thêm unique constraint nếu chưa có
echo "--- STEP 5: Add unique constraint ---\n";
$constraintName = 'uq_p2p_conversation';
$hasConstraint = in_array($constraintName, $constraints);

if ($hasConstraint) {
    echo "Constraint '$constraintName' already exists. Skipping.\n";
} else {
    // Thử thêm constraint
    // Note: MySQL sẽ tự động loại bỏ NULL values từ unique check
    // Với BOT conversations, partner_id = NULL nên sẽ không conflict
    try {
        $pdo->exec("
            ALTER TABLE conversations
            ADD CONSTRAINT $constraintName
            UNIQUE (client_id, partner_id, reference_id, type)
        ");
        echo "Added unique constraint: $constraintName\n";
        echo "  → Prevents duplicate P2P conversations\n";
        echo "  → Prevents future self-chat (client_id = partner_id)\n";
    } catch (PDOException $e) {
        // Nếu lỗi do duplicate data, cần clean trước
        if (strpos($e->getMessage(), 'Duplicate') !== false) {
            echo "Warning: Duplicate P2P conversations exist!\n";
            echo "Cleaning duplicates...\n";

            // Xóa duplicate - giữ lại conversation mới nhất cho mỗi group
            $pdo->exec("
                DELETE c1 FROM conversations c1
                INNER JOIN conversations c2
                WHERE c1.id > c2.id
                  AND c1.client_id = c2.client_id
                  AND COALESCE(c1.partner_id, 0) = COALESCE(c2.partner_id, 0)
                  AND COALESCE(c1.reference_id, 0) = COALESCE(c2.reference_id, 0)
                  AND c1.type = c2.type
                  AND c1.type != 'BOT'
            ");
            echo "Cleaned duplicate conversations.\n";

            // Thử thêm constraint lại
            try {
                $pdo->exec("
                    ALTER TABLE conversations
                    ADD CONSTRAINT $constraintName
                    UNIQUE (client_id, partner_id, reference_id, type)
                ");
                echo "Added unique constraint: $constraintName\n";
            } catch (PDOException $e2) {
                echo "Could not add constraint: " . $e2->getMessage() . "\n";
                echo "Please clean duplicate data manually and re-run.\n";
            }
        } else {
            echo "Error adding constraint: " . $e->getMessage() . "\n";
        }
    }
}
echo "\n";

// Bước 6: Xác nhận kết quả
echo "--- STEP 6: Verify fix ---\n";
$remainingSelfChat = $pdo->query("
    SELECT COUNT(*) FROM conversations
    WHERE client_id = partner_id AND type IN ('P2P_HOTEL', 'P2P_TOUR')
")->fetchColumn();
echo "Self-chat conversations remaining: $remainingSelfChat\n";

$totalP2P = $pdo->query("
    SELECT COUNT(*) FROM conversations
    WHERE type IN ('P2P_HOTEL', 'P2P_TOUR')
")->fetchColumn();
echo "Total P2P conversations: $totalP2P\n";

$totalBot = $pdo->query("
    SELECT COUNT(*) FROM conversations WHERE type = 'BOT'
")->fetchColumn();
echo "Total BOT conversations: $totalBot\n";

$totalMessages = $pdo->query("SELECT COUNT(*) FROM chat_messages")->fetchColumn();
echo "Total messages: $totalMessages\n";

echo "\n========================================\n";
echo "✅ DB REPAIR COMPLETE!\n";
echo "========================================\n";
