<?php
// Script nay de replace DB connection trong cac file PHP

$oldHost = 'interchange.proxy.rlwy.net';
$oldPort = '44405';
$oldPass = 'SZhkpiaBKssdXIyGLhTxbLQzGVlOnZBD';

$newHost = 'interchange.proxy.rlwy.net';
$newPort = '38550';
$newPass = 'SZhkpiaBKssdXIyGLhTxbLQzGVlOnZBD';

$dir = __DIR__;
$files = glob("$dir/*.php");

if (!$files) {
    echo "Khong tim thay file PHP nao!\n";
    exit;
}

$updated = 0;
$skipped = 0;

foreach ($files as $file) {
    $content = file_get_contents($file);

    // Chi replace neu co DB cu
    if (strpos($content, $oldHost) === false && strpos($content, $oldPass) === false) {
        $skipped++;
        continue;
    }

    // Replace
    $new = str_replace($oldHost, $newHost, $content);
    $new = str_replace("port=$oldPort", "port=$newPort", $new);
    $new = str_replace("P$oldPort", "P$newPort", $new);
    $new = str_replace($oldPass, $newPass, $new);

    file_put_contents($file, $new);
    $updated++;
    echo basename($file) . "\n";
}

// Also fix SQL files
$sqlFiles = glob("$dir/*.sql");
foreach ($sqlFiles as $file) {
    $content = file_get_contents($file);
    if (strpos($content, $oldHost) === false && strpos($content, $oldPass) === false) {
        continue;
    }
    $new = str_replace($oldHost, $newHost, $content);
    $new = str_replace("-P $oldPort", "-P $newPort", $new);
    $new = str_replace($oldPass, $newPass, $new);
    file_put_contents($file, $new);
    echo basename($file) . " (SQL)\n";
}

echo "\nDa cap nhat: $updated file PHP\n";
echo "Bo qua: $skipped file\n";
