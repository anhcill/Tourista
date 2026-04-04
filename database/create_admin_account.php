<?php

$host = '127.0.0.1';
$user = 'root';
$pass = '28072003';
$dbName = 'tourista';

$adminEmail = 'admin@tourista.vn';
$adminPassword = 'Admin@12345';
$adminFullName = 'Admin Tourista';

$mysqli = new mysqli($host, $user, $pass, $dbName);
if ($mysqli->connect_errno) {
    fwrite(STDERR, 'connect_error: ' . $mysqli->connect_error . PHP_EOL);
    exit(1);
}

$mysqli->set_charset('utf8mb4');

$roleId = null;
$roleResult = $mysqli->query("SELECT id FROM roles WHERE name = 'ADMIN' LIMIT 1");
if ($roleResult && ($roleRow = $roleResult->fetch_assoc())) {
    $roleId = (int) $roleRow['id'];
}

if (!$roleId) {
    $createdRole = $mysqli->query("INSERT INTO roles (name, description) VALUES ('ADMIN', 'Quan tri vien he thong')");
    if (!$createdRole) {
        fwrite(STDERR, 'insert_role_error: ' . $mysqli->error . PHP_EOL);
        exit(1);
    }

    $roleId = (int) $mysqli->insert_id;
}

$hashedPassword = password_hash($adminPassword, PASSWORD_BCRYPT);

$sql = "
    INSERT INTO users (
        email,
        password_hash,
        full_name,
        role_id,
        status,
        is_email_verified,
        email_verified_at,
        failed_attempts,
        locked_until,
        auth_provider,
        provider_id
    ) VALUES (?, ?, ?, ?, 'ACTIVE', 1, NOW(), 0, NULL, 'LOCAL', NULL)
    ON DUPLICATE KEY UPDATE
        password_hash = VALUES(password_hash),
        full_name = VALUES(full_name),
        role_id = VALUES(role_id),
        status = 'ACTIVE',
        is_email_verified = 1,
        email_verified_at = NOW(),
        failed_attempts = 0,
        locked_until = NULL,
        auth_provider = 'LOCAL',
        provider_id = NULL
";

$stmt = $mysqli->prepare($sql);
if (!$stmt) {
    fwrite(STDERR, 'prepare_error: ' . $mysqli->error . PHP_EOL);
    exit(1);
}

$stmt->bind_param('sssi', $adminEmail, $hashedPassword, $adminFullName, $roleId);

if (!$stmt->execute()) {
    fwrite(STDERR, 'execute_error: ' . $stmt->error . PHP_EOL);
    exit(1);
}

$verifyQuery = "
    SELECT u.email, u.full_name, r.name AS role_name, u.status, u.is_email_verified
    FROM users u
    JOIN roles r ON r.id = u.role_id
    WHERE u.email = ?
    LIMIT 1
";

$verifyStmt = $mysqli->prepare($verifyQuery);
$verifyStmt->bind_param('s', $adminEmail);
$verifyStmt->execute();
$verifyResult = $verifyStmt->get_result();
$adminRow = $verifyResult ? $verifyResult->fetch_assoc() : null;

echo 'done' . PHP_EOL;
echo 'admin_email=' . $adminEmail . PHP_EOL;
echo 'admin_password=' . $adminPassword . PHP_EOL;
if ($adminRow) {
    echo 'role=' . $adminRow['role_name'] . PHP_EOL;
    echo 'status=' . $adminRow['status'] . PHP_EOL;
    echo 'verified=' . $adminRow['is_email_verified'] . PHP_EOL;
}

$verifyStmt->close();
$stmt->close();
$mysqli->close();
