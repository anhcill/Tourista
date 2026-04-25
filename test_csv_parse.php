<?php
// Test CSV parsing logic giống hệt backend
$file = 'C:\Users\ducan\Downloads\data01.csv';

if (!file_exists($file)) {
    echo "File not found: $file\n";
    exit(1);
}

$content = file_get_contents($file);
echo "File size: " . strlen($content) . " bytes\n";

// Check BOM
if (substr($content, 0, 3) === "\xEF\xBB\xBF") {
    $content = substr($content, 3);
    echo "UTF-8 BOM stripped!\n";
} else {
    $firstChar = substr($content, 0, 1);
    echo "No BOM. First char: " . ord($firstChar) . " ('$firstChar')\n";
}

// Split lines
$lines = preg_split('/\r\n|\n|\r/', $content);
$lines = array_filter($lines, fn($l) => trim($l) !== '');
echo "Total lines: " . count($lines) . "\n";

if (count($lines) === 0) {
    echo "ERROR: No lines found!\n";
    exit(1);
}

// Header
$header = $lines[0];
$headers = str_getcsv($header);
echo "Header fields count: " . count($headers) . "\n";

// Create header map
$headerMap = [];
foreach ($headers as $i => $h) {
    $headerMap[strtolower(trim($h))] = $i;
}
echo "Header keys: " . implode(', ', array_keys($headerMap)) . "\n";

// Parse data rows
echo "\n=== Parsing rows ===\n";
$success = 0;
for ($i = 1; $i < count($lines); $i++) {
    $values = str_getcsv($lines[$i]);
    
    $titleIdx = $headerMap['title'] ?? null;
    $latIdx = $headerMap['latitude'] ?? null;
    
    $title = ($titleIdx !== null && isset($values[$titleIdx])) ? trim($values[$titleIdx]) : '';
    $lat = ($latIdx !== null && isset($values[$latIdx])) ? trim($values[$latIdx]) : '';
    
    echo "Row $i: fields=" . count($values) . ", title='$title', lat='$lat'\n";
    if (!empty($title)) $success++;
}

echo "\n=== RESULT ===\n";
echo "Total data rows: " . (count($lines) - 1) . "\n";
echo "Rows with title: $success\n";

if ($success === 0) {
    echo "\nERROR: No rows parsed! Checking header match...\n";
    echo "Expected 'title' in header map: " . (isset($headerMap['title']) ? 'YES' : 'NO') . "\n";
    echo "Expected 'latitude' in header map: " . (isset($headerMap['latitude']) ? 'YES' : 'NO') . "\n";
}
