-- ============================================================
-- Seed tours for Da Nang area
-- Usage:
--   mysql -u <user> -p <db_name> < database/seed_tours_da_nang.sql
-- ============================================================

-- Chon database mac dinh truoc khi seed.
-- Neu ban dung ten DB khac, doi 'tourista' thanh ten DB cua ban.
USE tourista;

START TRANSACTION;

-- 1) Base tour records (idempotent by slug)
INSERT INTO tours (
    category_id,
    city_id,
    operator_id,
    title,
    slug,
    description,
    highlights,
    includes,
    excludes,
    duration_days,
    duration_nights,
    max_group_size,
    min_group_size,
    difficulty,
    price_per_adult,
    price_per_child,
    avg_rating,
    review_count,
    is_featured,
    is_active
)
SELECT
    tc.id,
    c.id,
    NULL,
    'Da Nang - Ba Na Hills day trip',
    'da-nang-ba-na-hills-day-trip',
    'Explore Ba Na Hills, Golden Bridge, French Village, and mountain cable car in one full day from Da Nang.',
    '["Golden Bridge check-in", "Ba Na cable car", "French Village", "Le Jardin d\'Amour"]',
    '["Round-trip transfer", "English speaking guide", "Buffet lunch", "Travel insurance"]',
    '["Personal expenses", "VAT invoice", "Tips"]',
    1,
    0,
    25,
    1,
    'EASY',
    1290000,
    990000,
    4.80,
    186,
    TRUE,
    TRUE
FROM tour_categories tc
JOIN cities c ON c.slug = 'da-nang'
WHERE tc.slug = 'culture-heritage'
  AND NOT EXISTS (SELECT 1 FROM tours t WHERE t.slug = 'da-nang-ba-na-hills-day-trip');

INSERT INTO tours (
    category_id, city_id, operator_id, title, slug, description,
    highlights, includes, excludes,
    duration_days, duration_nights, max_group_size, min_group_size,
    difficulty, price_per_adult, price_per_child,
    avg_rating, review_count, is_featured, is_active
)
SELECT
    tc.id,
    c.id,
    NULL,
    'Da Nang - Son Tra - Marble Mountain - Hoi An',
    'da-nang-son-tra-marble-mountain-hoi-an',
    'City combo route for first-time visitors: Son Tra Peninsula, Marble Mountain, and Hoi An Ancient Town by evening.',
    '["Linh Ung pagoda", "Marble Mountain caves", "Hoi An lantern street", "Night market"]',
    '["Transport", "Guide", "Hoi An entry ticket", "Dinner set menu"]',
    '["Personal shopping", "Optional boat ticket", "VAT invoice"]',
    1,
    0,
    20,
    1,
    'EASY',
    990000,
    790000,
    4.70,
    142,
    TRUE,
    TRUE
FROM tour_categories tc
JOIN cities c ON c.slug = 'da-nang'
WHERE tc.slug = 'culture-heritage'
  AND NOT EXISTS (SELECT 1 FROM tours t WHERE t.slug = 'da-nang-son-tra-marble-mountain-hoi-an');

INSERT INTO tours (
    category_id, city_id, operator_id, title, slug, description,
    highlights, includes, excludes,
    duration_days, duration_nights, max_group_size, min_group_size,
    difficulty, price_per_adult, price_per_child,
    avg_rating, review_count, is_featured, is_active
)
SELECT
    tc.id,
    c.id,
    NULL,
    'Da Nang - Cu Lao Cham island snorkeling',
    'da-nang-cu-lao-cham-snorkeling',
    'High-speed boat to Cu Lao Cham with snorkeling spots and fresh seafood lunch.',
    '["Speedboat round-trip", "Snorkeling", "Coral reef spot", "Island seafood lunch"]',
    '["Boat transfer", "Guide", "Snorkeling gear", "Lunch"]',
    '["Sea-walking package", "Personal drinks", "VAT invoice"]',
    1,
    0,
    18,
    1,
    'MEDIUM',
    1150000,
    920000,
    4.60,
    97,
    FALSE,
    TRUE
FROM tour_categories tc
JOIN cities c ON c.slug = 'da-nang'
WHERE tc.slug = 'beach-island'
  AND NOT EXISTS (SELECT 1 FROM tours t WHERE t.slug = 'da-nang-cu-lao-cham-snorkeling');

INSERT INTO tours (
    category_id, city_id, operator_id, title, slug, description,
    highlights, includes, excludes,
    duration_days, duration_nights, max_group_size, min_group_size,
    difficulty, price_per_adult, price_per_child,
    avg_rating, review_count, is_featured, is_active
)
SELECT
    tc.id,
    c.id,
    NULL,
    'Da Nang food tour by night',
    'da-nang-food-tour-by-night',
    'Street food discovery route with local dishes and hidden lanes in central Da Nang.',
    '["Local food stops", "Night city route", "Han river viewpoint", "Small group experience"]',
    '["Food tasting", "Guide", "Water", "Hotel pickup in center"]',
    '["Personal orders", "Extra drinks", "VAT invoice"]',
    1,
    0,
    12,
    1,
    'EASY',
    690000,
    550000,
    4.50,
    76,
    FALSE,
    TRUE
FROM tour_categories tc
JOIN cities c ON c.slug = 'da-nang'
WHERE tc.slug = 'food-culinary'
  AND NOT EXISTS (SELECT 1 FROM tours t WHERE t.slug = 'da-nang-food-tour-by-night');

INSERT INTO tours (
    category_id, city_id, operator_id, title, slug, description,
    highlights, includes, excludes,
    duration_days, duration_nights, max_group_size, min_group_size,
    difficulty, price_per_adult, price_per_child,
    avg_rating, review_count, is_featured, is_active
)
SELECT
    tc.id,
    c.id,
    NULL,
    'Da Nang - Hai Van Pass - Lang Co lagoon',
    'da-nang-hai-van-pass-lang-co-lagoon',
    'Scenic route from Da Nang through Hai Van Pass to Lang Co for photo stops and light trekking.',
    '["Hai Van pass view", "Lang Co lagoon", "Coastal photo stops", "Light trekking"]',
    '["Transport", "Guide", "Entrance tickets", "Lunch"]',
    '["Personal expenses", "Coffee break", "VAT invoice"]',
    1,
    0,
    16,
    1,
    'MEDIUM',
    890000,
    720000,
    4.40,
    54,
    FALSE,
    TRUE
FROM tour_categories tc
JOIN cities c ON c.slug = 'da-nang'
WHERE tc.slug = 'adventure'
  AND NOT EXISTS (SELECT 1 FROM tours t WHERE t.slug = 'da-nang-hai-van-pass-lang-co-lagoon');

INSERT INTO tours (
    category_id, city_id, operator_id, title, slug, description,
    highlights, includes, excludes,
    duration_days, duration_nights, max_group_size, min_group_size,
    difficulty, price_per_adult, price_per_child,
    avg_rating, review_count, is_featured, is_active
)
SELECT
    tc.id,
    c.id,
    NULL,
    'Da Nang family day: water park and beach',
    'da-nang-family-day-water-park-beach',
    'Family-friendly day with indoor water park, beach chill time, and flexible kid-friendly schedule.',
    '["Family itinerary", "Water park", "Beach free time", "Kid-friendly menu"]',
    '["Transport", "Guide", "Tickets", "Lunch"]',
    '["Personal expenses", "Locker fee", "VAT invoice"]',
    1,
    0,
    20,
    1,
    'EASY',
    980000,
    780000,
    4.55,
    63,
    TRUE,
    TRUE
FROM tour_categories tc
JOIN cities c ON c.slug = 'da-nang'
WHERE tc.slug = 'family'
  AND NOT EXISTS (SELECT 1 FROM tours t WHERE t.slug = 'da-nang-family-day-water-park-beach');

-- 2) Tour images (cover + gallery)
INSERT INTO tour_images (tour_id, url, alt_text, is_cover, sort_order)
SELECT t.id, 'https://images.unsplash.com/photo-1528127269322-539801943592?w=1600&q=80', 'Ba Na Hills', TRUE, 1
FROM tours t
WHERE t.slug = 'da-nang-ba-na-hills-day-trip'
  AND NOT EXISTS (SELECT 1 FROM tour_images ti WHERE ti.tour_id = t.id AND ti.sort_order = 1);

INSERT INTO tour_images (tour_id, url, alt_text, is_cover, sort_order)
SELECT t.id, 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=1600&q=80', 'Hoi An at night', TRUE, 1
FROM tours t
WHERE t.slug = 'da-nang-son-tra-marble-mountain-hoi-an'
  AND NOT EXISTS (SELECT 1 FROM tour_images ti WHERE ti.tour_id = t.id AND ti.sort_order = 1);

INSERT INTO tour_images (tour_id, url, alt_text, is_cover, sort_order)
SELECT t.id, 'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?w=1600&q=80', 'Cu Lao Cham sea', TRUE, 1
FROM tours t
WHERE t.slug = 'da-nang-cu-lao-cham-snorkeling'
  AND NOT EXISTS (SELECT 1 FROM tour_images ti WHERE ti.tour_id = t.id AND ti.sort_order = 1);

INSERT INTO tour_images (tour_id, url, alt_text, is_cover, sort_order)
SELECT t.id, 'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=1600&q=80', 'Da Nang food tour', TRUE, 1
FROM tours t
WHERE t.slug = 'da-nang-food-tour-by-night'
  AND NOT EXISTS (SELECT 1 FROM tour_images ti WHERE ti.tour_id = t.id AND ti.sort_order = 1);

INSERT INTO tour_images (tour_id, url, alt_text, is_cover, sort_order)
SELECT t.id, 'https://images.unsplash.com/photo-1493244040629-496f6d136cc3?w=1600&q=80', 'Hai Van pass route', TRUE, 1
FROM tours t
WHERE t.slug = 'da-nang-hai-van-pass-lang-co-lagoon'
  AND NOT EXISTS (SELECT 1 FROM tour_images ti WHERE ti.tour_id = t.id AND ti.sort_order = 1);

INSERT INTO tour_images (tour_id, url, alt_text, is_cover, sort_order)
SELECT t.id, 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&q=80', 'Family beach day', TRUE, 1
FROM tours t
WHERE t.slug = 'da-nang-family-day-water-park-beach'
  AND NOT EXISTS (SELECT 1 FROM tour_images ti WHERE ti.tour_id = t.id AND ti.sort_order = 1);

-- 3) Basic itinerary (day 1 for each tour)
INSERT INTO tour_itinerary (tour_id, day_number, title, description)
SELECT t.id, 1, 'Depart from Da Nang center', 'Morning pickup, route briefing, and start of activities according to tour plan.'
FROM tours t
WHERE t.slug = 'da-nang-ba-na-hills-day-trip'
  AND NOT EXISTS (SELECT 1 FROM tour_itinerary i WHERE i.tour_id = t.id AND i.day_number = 1);

INSERT INTO tour_itinerary (tour_id, day_number, title, description)
SELECT t.id, 1, 'Son Tra - Marble Mountain - Hoi An route', 'Visit Son Tra peninsula in the morning, continue to Marble Mountain, and end with Hoi An by evening.'
FROM tours t
WHERE t.slug = 'da-nang-son-tra-marble-mountain-hoi-an'
  AND NOT EXISTS (SELECT 1 FROM tour_itinerary i WHERE i.tour_id = t.id AND i.day_number = 1);

INSERT INTO tour_itinerary (tour_id, day_number, title, description)
SELECT t.id, 1, 'Speedboat and snorkeling session', 'Transfer to island by speedboat, snorkeling at coral spots, and lunch before return.'
FROM tours t
WHERE t.slug = 'da-nang-cu-lao-cham-snorkeling'
  AND NOT EXISTS (SELECT 1 FROM tour_itinerary i WHERE i.tour_id = t.id AND i.day_number = 1);

INSERT INTO tour_itinerary (tour_id, day_number, title, description)
SELECT t.id, 1, 'Night food route in city center', 'Walk through local lanes and enjoy signature dishes with cultural context from the guide.'
FROM tours t
WHERE t.slug = 'da-nang-food-tour-by-night'
  AND NOT EXISTS (SELECT 1 FROM tour_itinerary i WHERE i.tour_id = t.id AND i.day_number = 1);

INSERT INTO tour_itinerary (tour_id, day_number, title, description)
SELECT t.id, 1, 'Hai Van scenic and Lang Co stops', 'Coastal route with scenic viewpoints and short trekking around lagoon area.'
FROM tours t
WHERE t.slug = 'da-nang-hai-van-pass-lang-co-lagoon'
  AND NOT EXISTS (SELECT 1 FROM tour_itinerary i WHERE i.tour_id = t.id AND i.day_number = 1);

INSERT INTO tour_itinerary (tour_id, day_number, title, description)
SELECT t.id, 1, 'Family water park and beach schedule', 'Kid-friendly pace with water park access and afternoon free time near beach.'
FROM tours t
WHERE t.slug = 'da-nang-family-day-water-park-beach'
  AND NOT EXISTS (SELECT 1 FROM tour_itinerary i WHERE i.tour_id = t.id AND i.day_number = 1);

-- 4) Upcoming departures (4 dates each, idempotent by (tour_id, departure_date))
INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 3 DAY), 18, NULL
FROM tours t
WHERE t.slug = 'da-nang-ba-na-hills-day-trip'
  AND NOT EXISTS (
      SELECT 1 FROM tour_departures d
      WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 3 DAY)
  );

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 7 DAY), 16, 1250000
FROM tours t
WHERE t.slug = 'da-nang-ba-na-hills-day-trip'
  AND NOT EXISTS (
      SELECT 1 FROM tour_departures d
      WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 7 DAY)
  );

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 5 DAY), 14, NULL
FROM tours t
WHERE t.slug = 'da-nang-son-tra-marble-mountain-hoi-an'
  AND NOT EXISTS (
      SELECT 1 FROM tour_departures d
      WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 5 DAY)
  );

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 9 DAY), 12, NULL
FROM tours t
WHERE t.slug = 'da-nang-son-tra-marble-mountain-hoi-an'
  AND NOT EXISTS (
      SELECT 1 FROM tour_departures d
      WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 9 DAY)
  );

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 4 DAY), 10, NULL
FROM tours t
WHERE t.slug = 'da-nang-cu-lao-cham-snorkeling'
  AND NOT EXISTS (
      SELECT 1 FROM tour_departures d
      WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 4 DAY)
  );

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 11 DAY), 8, 1090000
FROM tours t
WHERE t.slug = 'da-nang-cu-lao-cham-snorkeling'
  AND NOT EXISTS (
      SELECT 1 FROM tour_departures d
      WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 11 DAY)
  );

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 2 DAY), 12, NULL
FROM tours t
WHERE t.slug = 'da-nang-food-tour-by-night'
  AND NOT EXISTS (
      SELECT 1 FROM tour_departures d
      WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 2 DAY)
  );

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 6 DAY), 10, NULL
FROM tours t
WHERE t.slug = 'da-nang-food-tour-by-night'
  AND NOT EXISTS (
      SELECT 1 FROM tour_departures d
      WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 6 DAY)
  );

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 8 DAY), 10, NULL
FROM tours t
WHERE t.slug = 'da-nang-hai-van-pass-lang-co-lagoon'
  AND NOT EXISTS (
      SELECT 1 FROM tour_departures d
      WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 8 DAY)
  );

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 13 DAY), 8, 850000
FROM tours t
WHERE t.slug = 'da-nang-hai-van-pass-lang-co-lagoon'
  AND NOT EXISTS (
      SELECT 1 FROM tour_departures d
      WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 13 DAY)
  );

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 3 DAY), 15, NULL
FROM tours t
WHERE t.slug = 'da-nang-family-day-water-park-beach'
  AND NOT EXISTS (
      SELECT 1 FROM tour_departures d
      WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 3 DAY)
  );

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 10 DAY), 13, NULL
FROM tours t
WHERE t.slug = 'da-nang-family-day-water-park-beach'
  AND NOT EXISTS (
      SELECT 1 FROM tour_departures d
      WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 10 DAY)
  );

COMMIT;
