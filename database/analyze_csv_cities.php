<?php
/**
 * Analyze unique cities in the CSV file
 */
$file = 'C:/Users/ducan/Downloads/archive/hotels_users_ratings.csv';

echo "=== Analyzing hotels_users_ratings.csv ===\n\n";

$handle = fopen($file, 'r');
if (!$handle) {
    die("Cannot open file\n");
}

// Get header
$header = fgetcsv($handle);
echo "Columns: " . implode(', ', $header) . "\n\n";

// Find Location column index
$locationIdx = -1;
foreach ($header as $i => $col) {
    if (strcasecmp(trim($col), 'Location') === 0) {
        $locationIdx = $i;
    }
}
if ($locationIdx === -1) {
    die("Location column not found\n");
}
echo "Location column index: $locationIdx\n\n";

// Count by location
$locations = [];
$hotelsByCity = []; // city => [unique hotels]
$totalRows = 0;
$totalHotels = 0;

while (($row = fgetcsv($handle)) !== false) {
    $totalRows++;
    $location = isset($row[$locationIdx]) ? trim($row[$locationIdx]) : '';
    if (empty($location)) continue;

    $totalHotels++;
    $hotelId = isset($row[2]) ? $row[2] : ''; // HotelID column

    if (!isset($locations[$location])) {
        $locations[$location] = 0;
        $hotelsByCity[$location] = [];
    }
    $locations[$location]++;
    $hotelsByCity[$location][$hotelId] = true;
}
fclose($handle);

echo "Total rows: $totalRows\n";
echo "Total entries with location: $totalHotels\n";
echo "\n=== Unique cities and hotel counts ===\n";
printf("%-30s | %s\n", "City", "Hotels");
echo str_repeat('-', 45) . "\n";
ksort($locations);
foreach ($locations as $city => $count) {
    $uniqueHotels = count($hotelsByCity[$city]);
    printf("%-30s | %s (%s unique)\n", $city, $count, $uniqueHotels);
}

echo "\n=== Top 15 cities by unique hotels ===\n";
$byUnique = [];
foreach ($hotelsByCity as $city => $hotels) {
    $byUnique[$city] = count($hotels);
}
arsort($byUnique);
printf("%-30s | %s\n", "City", "Unique Hotels");
echo str_repeat('-', 45) . "\n";
$i = 0;
foreach ($byUnique as $city => $count) {
    printf("%-30s | %s\n", $city, $count);
    $i++;
    if ($i >= 15) break;
}

echo "\nDone!\n";
