<?php
/**
 * Fix: add missing tours with correct category slugs
 */

$pdo = new PDO('mysql:host=interchange.proxy.rlwy.net;port=38550;dbname=railway;charset=utf8mb4', 'root', 'SZhkpiaBKssdXIyGLhTxbLQzGVlOnZBD', [PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);

$existingSlugs = $pdo->query("SELECT slug FROM tours")->fetchAll(PDO::FETCH_COLUMN);

// Map: slug => (category_slug, city_slug, data...)
$tours = [
    // Ha Noi
    ['ha-noi-city-tour-old-quarter', 'culture-heritage', 'ha-noi',
     'Ha Noi city tour - Old Quarter & Ho Chi Minh complex',
     'Explore the heart of Hanoi: Old Quarter, Ho Chi Minh Mausoleum, One Pillar Pagoda, and Temple of Literature.',
     '["Old Quarter walking", "Ho Chi Minh complex", "One Pillar Pagoda", "Temple of Literature"]',
     '["Transport", "English guide", "Lunch", "All entrance fees"]', '["Personal expenses", "Tips", "VAT invoice"]',
     1, 0, 20, 1, 'EASY', 850000, 650000, 4.75, 210, TRUE, TRUE],
    ['ha-noi-ninh-binh-trang-an', 'adventure', 'ha-noi',
     'Ha Noi - Ninh Binh day trip: Trang An & Hoa Lu',
     'Visit Trang An Grottoes by boat, ancient Hoa Lu capital, and Bai Dinh pagoda in one day.',
     '["Trang An boat ride", "Hoa Lu ancient capital", "Bai Dinh pagoda", "Vietnamese lunch"]',
     '["Transport from Hanoi", "Guide", "Lunch", "Boat fee"]', '["Personal expenses", "Tips", "VAT invoice"]',
     1, 0, 18, 1, 'MEDIUM', 1150000, 890000, 4.85, 178, TRUE, TRUE],
    ['ha-noi-street-food-tour', 'food-culinary', 'ha-noi',
     'Ha Noi street food walking tour',
     'Night food walk through Hanois Old Quarter with local guide. Taste pho, banh cuon, cha ca and more.',
     '["Pho bo Ha Noi", "Banh cuon", "Cha ca La Vong", "Egg coffee"]',
     '["Guide", "Food tasting (10+ dishes)", "Water"]', '["Alcoholic drinks", "Personal shopping", "VAT invoice"]',
     1, 0, 10, 1, 'EASY', 750000, 0, 4.90, 305, TRUE, TRUE],
    // Nha Trang
    ['nha-trang-con-se-tre-island-hopping', 'beach-island', 'nha-trang',
     'Nha Trang - Con Se Tre island hopping',
     'Visit 4 islands around Nha Trang: Mun Island, Mot Island, Tranh Island, and fishing village.',
     '["Snorkeling at Mun Island", "Glass-bottom boat", "Seafood lunch", "Water sports"]',
     '["Speedboat", "Guide", "Lunch", "Snorkeling gear"]', '["Water sports fee", "Personal expenses", "VAT invoice"]',
     1, 0, 25, 1, 'EASY', 990000, 790000, 4.65, 134, TRUE, TRUE],
    ['nha-trang-snorkeling-diving', 'beach-island', 'nha-trang',
     'Nha Trang snorkeling & diving day trip',
     'Explore coral reefs and marine life at Hon Mun with professional diving instructors.',
     '["2 snorkeling spots", "Coral garden", "Marine life", "Underwater photos"]',
     '["Transport", "Guide", "Lunch", "Gear rental"]', '["Underwater camera", "Personal expenses", "VAT invoice"]',
     1, 0, 15, 1, 'MEDIUM', 1350000, 1050000, 4.70, 88, FALSE, TRUE],
    // Ho Chi Minh
    ['hcm-cu-chi-tunnels-half-day', 'culture-heritage', 'ho-chi-minh',
     'Ho Chi Minh - Cu Chi tunnels half day',
     'Explore the famous Cu Chi underground tunnel network used during the Vietnam War.',
     '["Cu Chi tunnels", "Booby trap exhibition", "Gun firing range", "Cassava snack"]',
     '["Transport", "Guide", "Entrance fee", "Water"]', '["Gun firing fee", "Personal expenses", "VAT invoice"]',
     1, 0, 20, 1, 'EASY', 750000, 550000, 4.60, 245, TRUE, TRUE],
    ['mekong-delta-2-days-1-night', 'adventure', 'ho-chi-minh',
     'Mekong Delta 2 days 1 night from HCM',
     'Explore the waterways of Mekong Delta: Ben Tre, Can Tho floating market, and local villages.',
     '["Coconut candy workshop", "Rowing boat", "Floating market", "Homestay experience"]',
     '["Transport", "Guide", "Meals", "Homestay accommodation"]', '["Personal expenses", "Tips", "VAT invoice"]',
     2, 1, 15, 1, 'EASY', 1890000, 1490000, 4.75, 167, TRUE, TRUE],
    ['hcm-street-food-tour-by-night', 'food-culinary', 'ho-chi-minh',
     'Ho Chi Minh street food tour by night',
     'Discover Saigons vibrant food scene: from banh mi to broken rice, all on foot with a local.',
     '["Banh mi thit", "Com tam", "Bun thit nuong", "Fresh fruit shake"]',
     '["Guide", "Food tasting (8 dishes)", "Water", "Walking"]', '["Alcoholic drinks", "Personal orders", "VAT invoice"]',
     1, 0, 12, 1, 'EASY', 650000, 0, 4.80, 198, TRUE, TRUE],
    // Phu Quoc
    ['phu-quoc-3-islands-snorkeling', 'beach-island', 'phu-quoc',
     'Phu Quoc - 3 islands snorkeling tour',
     'Visit Hon Gamala, Hon May Rut, and Hon Thom with snorkeling and sunset fishing.',
     '["Snorkeling at 3 spots", "Hon Thom cable car", "Sunset fishing", "Seafood lunch"]',
     '["Speedboat", "Guide", "Lunch", "Gear"]', '["Cable car fee", "Personal expenses", "VAT invoice"]',
     1, 0, 20, 1, 'EASY', 1100000, 880000, 4.70, 112, TRUE, TRUE],
    ['phu-quoc-island-exploration', 'adventure', 'phu-quoc',
     'Phu Quoc island exploration day trip',
     'Explore Phu Quoc by motorbike: Vinpearl Safari, Pepper Farm, Fish Sauce Factory, and Beach.',
     '["Vinpearl Safari", "Pepper farm", "Fish sauce factory", "Beach time"]',
     '["Transport", "Guide", "Lunch", "Safari entrance"]', '["Personal expenses", "Tips", "VAT invoice"]',
     1, 0, 15, 1, 'EASY', 1350000, 1050000, 4.55, 78, FALSE, TRUE],
    // Ha Long
    ['ha-long-bay-2d1n-cruise', 'adventure', 'ha-long',
     'Ha Long Bay 2 days 1 night on cruise',
     'Overnight cruise on Ha Long Bay with kayaking, cave exploration, and sunset party.',
     '["Ha Long Bay cruise", "Sung Sot cave", "Kayaking", "Sunset party", "Squid fishing"]',
     '["Cruise cabin", "Meals", "Kayak", "Guide"]', '["Drinks", "Personal expenses", "Tips", "VAT invoice"]',
     2, 1, 30, 1, 'EASY', 2500000, 1900000, 4.90, 320, TRUE, TRUE],
    // Da Lat
    ['da-lat-city-tour-valley-pagoda', 'adventure', 'da-lat',
     'Da Lat city tour - Valley, Pagoda & Waterfall',
     'Explore Da Lat highlights: Valley, Crazy House, Linh Phuoc Pagoda, and Datanla Waterfall.',
     '["Valley viewpoint", "Crazy House", "Linh Phuoc Pagoda", "Datanla waterfall"]',
     '["Transport", "Guide", "Entrance fees", "Lunch"]', '["Personal expenses", "Tips", "VAT invoice"]',
     1, 0, 18, 1, 'EASY', 850000, 650000, 4.70, 145, TRUE, TRUE],
    ['da-lat-coffee-tea-workshop', 'food-culinary', 'da-lat',
     'Da Lat coffee & tea workshop experience',
     'Learn about Da Lat coffee and tea production with hands-on workshop and tasting.',
     '["Coffee picking", "Roasting demo", "French bread making", "Tea tasting"]',
     '["Transport", "Workshop", "Tasting session", "Lunch"]', '["Personal shopping", "Tips", "VAT invoice"]',
     1, 0, 12, 1, 'EASY', 950000, 750000, 4.85, 92, FALSE, TRUE],
    // Hue
    ['hue-imperial-citadel-full-day', 'culture-heritage', 'hue',
     'Hue imperial citadel full day tour',
     'Explore Hue Imperial City, Thien Mu Pagoda, Tu Duc Tomb, and Khai Dinh Tomb in one day.',
     '["Imperial citadel", "Thien Mu pagoda", "Tu Duc tomb", "Khai Dinh tomb"]',
     '["Transport", "Guide", "Lunch", "All entrance fees"]', '["Personal expenses", "Tips", "VAT invoice"]',
     1, 0, 18, 1, 'EASY', 1050000, 820000, 4.75, 168, TRUE, TRUE],
    ['hue-dmz-day-trip', 'culture-heritage', 'hue',
     'Hue - DMZ day trip (Vinh Moc tunnels)',
     'Visit the Demilitarized Zone: Vinh Moc tunnels, Khe Sanh base, and Hai Van Pass.',
     '["Vinh Moc tunnels", "Khe Sanh base", "Hai Van Pass", "Ben Hai River"]',
     '["Transport", "Guide", "Lunch"]', '["Personal expenses", "Tips", "VAT invoice"]',
     1, 0, 15, 1, 'MEDIUM', 1250000, 990000, 4.65, 95, FALSE, TRUE],
];

$images = [
    'ha-noi-city-tour-old-quarter' => 'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=1600&q=80',
    'ha-noi-ninh-binh-trang-an' => 'https://images.unsplash.com/photo-1509002236388-990aab93d798?w=1600&q=80',
    'ha-noi-street-food-tour' => 'https://images.unsplash.com/photo-1583394964284-8dd09d3f6e9e?w=1600&q=80',
    'nha-trang-con-se-tre-island-hopping' => 'https://images.unsplash.com/photo-1559599238-308793637427?w=1600&q=80',
    'nha-trang-snorkeling-diving' => 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1600&q=80',
    'hcm-cu-chi-tunnels-half-day' => 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=1600&q=80',
    'mekong-delta-2-days-1-night' => 'https://images.unsplash.com/photo-1528164344705-47542687000d?w=1600&q=80',
    'hcm-street-food-tour-by-night' => 'https://images.unsplash.com/photo-1555126634-323283e090fa?w=1600&q=80',
    'phu-quoc-3-islands-snorkeling' => 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&q=80',
    'phu-quoc-island-exploration' => 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=1600&q=80',
    'ha-long-bay-2d1n-cruise' => 'https://images.unsplash.com/photo-1502175353174-a7a70e73b362?w=1600&q=80',
    'da-lat-city-tour-valley-pagoda' => 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1600&q=80',
    'da-lat-coffee-tea-workshop' => 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1600&q=80',
    'hue-imperial-citadel-full-day' => 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=1600&q=80',
    'hue-dmz-day-trip' => 'https://images.unsplash.com/photo-1584976781699-48db8c1c8744?w=1600&q=80',
];

$itinerary = [
    'ha-noi-city-tour-old-quarter' => [['Hanoi Old Quarter walking', 'Morning walk through Old Quarter narrow streets, exploring local markets and street food.']],
    'ha-noi-ninh-binh-trang-an' => [
        ['Trang An boat ride', 'Explore the Trang An Grottoes by small rowing boat through caves and temples.'],
        ['Hoa Lu ancient capital', 'Visit the ancient capital of Hoa Lu, the first capital of Vietnam in the 10th century.'],
    ],
    'ha-noi-street-food-tour' => [['Pho and Old Quarter food stops', 'Start with early morning pho, walk through hidden alleys, taste banh cuon and egg coffee.']],
    'nha-trang-con-se-tre-island-hopping' => [['Island hopping by speedboat', 'Visit 4 islands: Mun Island for snorkeling, Mot Island for swimming, Tranh Island for relaxation.']],
    'nha-trang-snorkeling-diving' => [['Snorkeling and diving at Hon Mun', 'Two snorkeling spots with professional instructors. Underwater photos and coral garden.']],
    'hcm-cu-chi-tunnels-half-day' => [['Cu Chi tunnels exploration', 'Morning visit to Cu Chi tunnels, learn about guerrilla warfare and crawl through sections of the tunnel.']],
    'mekong-delta-2-days-1-night' => [
        ['Ben Tre - Coconut candy workshop', 'Morning: visit coconut candy workshop, rowing boat through canals, visit local family.'],
        ['Can Tho floating market', 'Morning visit to Cai Rang floating market, sample tropical fruits, return to HCM by afternoon.'],
    ],
    'hcm-street-food-tour-by-night' => [['Saigon evening food walk', 'Evening walk through District 1, taste banh mi, com tam, bun thit nuong and fresh fruit shakes.']],
    'phu-quoc-3-islands-snorkeling' => [['3 islands by speedboat', 'Visit Hon Gamala for snorkeling, Hon May Rut for swimming, Hon Thom for sunset fishing.']],
    'phu-quoc-island-exploration' => [['Phu Quoc by motorbike', 'Full day motorbike tour: Vinpearl Safari, Pepper Farm, Fish Sauce Factory, and Bai Sao beach.']],
    'ha-long-bay-2d1n-cruise' => [
        ['Ha Long Bay cruise boarding', 'Morning departure from Hanoi. Board cruise, welcome lunch, visit Sung Sot cave, kayak at Luon Cave.'],
        ['Tai Chi and kayaking', 'Morning tai chi on sundeck, kayak at Ti Top island, brunch, return to Hanoi by noon.'],
    ],
    'da-lat-city-tour-valley-pagoda' => [['Da Lat highlights tour', 'Visit Valley viewpoint, Crazy House architecture, Linh Phuoc Pagoda, and Datanla waterfall.']],
    'da-lat-coffee-tea-workshop' => [['Coffee and tea workshop', 'Hands-on coffee picking, roasting demonstration, French bread making, and tea tasting session.']],
    'hue-imperial-citadel-full-day' => [['Hue Imperial City and tombs', 'Full day: Imperial citadel in morning, Thien Mu pagoda at noon, Tu Duc and Khai Dinh tombs in afternoon.']],
    'hue-dmz-day-trip' => [['DMZ historical route', 'Visit Vinh Moc tunnels, Khe Sanh base, Hai Van Pass, and Ben Hai River with historical commentary.']],
];

$departures = [
    'ha-noi-city-tour-old-quarter' => [
        [3, 15, null], [8, 13, null],
    ],
    'ha-noi-ninh-binh-trang-an' => [
        [5, 12, null], [12, 10, 1100000],
    ],
    'ha-noi-street-food-tour' => [
        [1, 8, null], [4, 7, null],
    ],
    'nha-trang-con-se-tre-island-hopping' => [
        [2, 18, null], [6, 15, null],
    ],
    'nha-trang-snorkeling-diving' => [
        [4, 10, null], [9, 8, 1300000],
    ],
    'hcm-cu-chi-tunnels-half-day' => [
        [2, 15, null], [5, 12, null],
    ],
    'mekong-delta-2-days-1-night' => [
        [3, 10, null], [8, 8, 1850000],
    ],
    'hcm-street-food-tour-by-night' => [
        [1, 10, null], [4, 8, null],
    ],
    'phu-quoc-3-islands-snorkeling' => [
        [3, 14, null], [7, 12, null],
    ],
    'phu-quoc-island-exploration' => [
        [5, 10, null], [11, 8, 1300000],
    ],
    'ha-long-bay-2d1n-cruise' => [
        [4, 20, null], [9, 18, 2450000],
    ],
    'da-lat-city-tour-valley-pagoda' => [
        [2, 12, null], [6, 10, null],
    ],
    'da-lat-coffee-tea-workshop' => [
        [3, 8, null], [7, 6, 920000],
    ],
    'hue-imperial-citadel-full-day' => [
        [4, 12, null], [9, 10, null],
    ],
    'hue-dmz-day-trip' => [
        [5, 10, null], [10, 8, 1200000],
    ],
];

$pdo->beginTransaction();
$inserted = 0;

foreach ($tours as $t) {
    if (in_array($t[0], $existingSlugs)) {
        echo "SKIP: {$t[0]} already exists\n";
        continue;
    }

    // Insert with explicit ID (no AUTO_INCREMENT on Railway)
    $maxId = (int)$pdo->query("SELECT COALESCE(MAX(id), 0) FROM tours")->fetchColumn();
    $newId = $maxId + 1;
    $now = date('Y-m-d H:i:s');
    $sql = "INSERT INTO tours (id, category_id, city_id, operator_id, title, slug, description, highlights, includes, excludes, duration_days, duration_nights, max_group_size, min_group_size, difficulty, price_per_adult, price_per_child, avg_rating, review_count, is_featured, is_active, created_at, updated_at)
            SELECT :id, tc.id, c.id, NULL, :title, :slug, :desc, :high, :incl, :excl, :dd, :dn, :mgs, :mns, :diff, :ppa, :ppc, :avg, :rc, :feat, :act, :now, :now
            FROM tour_categories tc JOIN cities c ON c.slug = :city
            WHERE tc.slug = :cat";
    try {
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':id' => $newId,
            ':title' => $t[3], ':slug' => $t[0], ':desc' => substr($t[4], 0, 255),
            ':high' => substr($t[5], 0, 255), ':incl' => substr($t[6], 0, 255), ':excl' => substr($t[7], 0, 255),
            ':dd' => (int)$t[8], ':dn' => (int)$t[9], ':mgs' => (int)$t[10], ':mns' => (int)$t[11],
            ':diff' => $t[12], ':ppa' => (float)$t[13], ':ppc' => (float)$t[14],
            ':avg' => (float)$t[15], ':rc' => (int)$t[16], ':feat' => (int)(bool)$t[17], ':act' => (int)(bool)$t[18],
            ':city' => $t[2], ':cat' => $t[1],
            ':now' => $now,
        ]);
        $stmt->closeCursor();
        $inserted++;
        echo "INSERTED: {$t[0]} (ID: $newId)\n";
        $tourId = $newId;

        // Insert image
        if (isset($images[$t[0]])) {
            try {
                $maxImg = (int)$pdo->query("SELECT COALESCE(MAX(id), 0) FROM tour_images")->fetchColumn() + 1;
                $pdo->prepare("INSERT INTO tour_images (id, tour_id, url, alt_text, is_cover, sort_order) VALUES (?, ?, ?, ?, TRUE, 1)")
                    ->execute([$maxImg, $tourId, $images[$t[0]], $t[3]]);
            } catch (Exception $e) {}
        }

        // Insert itinerary
        if (isset($itinerary[$t[0]])) {
            $day = 1;
            foreach ($itinerary[$t[0]] as $item) {
                try {
                    $maxItin = (int)$pdo->query("SELECT COALESCE(MAX(id), 0) FROM tour_itinerary")->fetchColumn() + 1;
                    $pdo->prepare("INSERT INTO tour_itinerary (id, tour_id, day_number, title, description) VALUES (?, ?, ?, ?, ?)")
                        ->execute([$maxItin, $tourId, $day++, $item[0], $item[1]]);
                } catch (Exception $e) {}
            }
        }

        // Insert departures
        if (isset($departures[$t[0]])) {
            foreach ($departures[$t[0]] as $dep) {
                $date = date('Y-m-d', strtotime("+{$dep[0]} days"));
                try {
                    $maxDep = (int)$pdo->query("SELECT COALESCE(MAX(id), 0) FROM tour_departures")->fetchColumn() + 1;
                    $pdo->prepare("INSERT INTO tour_departures (id, tour_id, departure_date, available_slots, price_override) VALUES (?, ?, ?, ?, ?)")
                        ->execute([$maxDep, $tourId, $date, $dep[1], $dep[2]]);
                } catch (Exception $e) {}
            }
        }
    } catch (Exception $e) {
        echo "ERROR {$t[0]}: " . substr($e->getMessage(), 0, 100) . "\n";
    }
}

$pdo->commit();

echo "\nDone. Inserted $inserted new tours.\n";
echo "Total tours: " . $pdo->query("SELECT COUNT(*) FROM tours")->fetchColumn() . "\n";
echo "Total tour_images: " . $pdo->query("SELECT COUNT(*) FROM tour_images")->fetchColumn() . "\n";
echo "Total tour_itinerary: " . $pdo->query("SELECT COUNT(*) FROM tour_itinerary")->fetchColumn() . "\n";
echo "Total tour_departures: " . $pdo->query("SELECT COUNT(*) FROM tour_departures")->fetchColumn() . "\n";
