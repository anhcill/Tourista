-- ============================================================
-- TOURISTA - FULL TOUR SEED DATA
-- Seeds all tours for every Vietnamese tourist city
-- Run via phpMyAdmin or mysql command line
-- ============================================================

START TRANSACTION;

-- ============================================================
-- TOUR CATEGORIES: Ensure all 8 categories exist
-- ============================================================

INSERT IGNORE INTO tour_categories (name_vi, name_en, slug, description, icon) VALUES
('Van hoa & Di san', 'Culture & Heritage', 'culture-heritage', 'Khám phá di san van hoa, lich su va kien truc noi tieng.', 'fa-landmark'),
('Thien nhien & Adventure', 'Nature & Adventure', 'nature-adventure', 'Trai nghiem phieu luu, leo nui, trekking va khám pha thinh nhien hoang da.', 'fa-mountain'),
('Bien & Dao', 'Beach & Island', 'beach-island', 'Nghi duong bien dao, tam nang va cac mon the thao duoi nuoc.', 'fa-umbrella-beach'),
('Am thuc', 'Food & Culinary', 'food-culinary', 'Hanh trinh kham pha am thuc dia phuong dac sac.', 'fa-utensils'),
('Gia dinh', 'Family', 'family', 'Cac tour phu hop cho gia dinh co con nho.', 'fa-users'),
('Lang nghe', 'Workshop & Experience', 'workshop', 'Hoc hoi nghe truyen thong, lam do thu cong.', 'fa-palette'),
('Nghi duong', 'Relaxation & Wellness', 'relaxation', 'Nghi duong, wellness, yoga retreat.', 'fa-spa'),
('Sinh Thai', 'Eco & Nature', 'eco-tour', 'Du lich sinh thai, bao ton thinh nhien.', 'fa-leaf');

-- ============================================================
-- HA NOI TOURS (6 tours - diverse categories)
-- ============================================================

INSERT INTO tours (category_id, city_id, operator_id, title, slug, description, highlights, includes, excludes, duration_days, duration_nights, max_group_size, min_group_size, difficulty, price_per_adult, price_per_child, avg_rating, review_count, is_featured, is_active)
SELECT tc.id, c.id, NULL,
'Ha Noi city tour - Old Quarter & Ho Chi Minh complex',
'ha-noi-city-tour-old-quarter',
'Kham pha long Ha Noi: Pho co, Khu pho cổ, Khu di tich Ho Chi Minh, Den Mot Cot va Van Mieu.',
'["Pho co Ha Noi", "Khu di tich Ho Chi Minh", "Den Mot Cot", "Van Mieu"]',
'["Xe du lich", "Huong dan vien", "Bua trua", "Ve tham quan"]',
'["Chi phi ca nhan", "Tips", "Hoa don VAT"]',
1, 0, 20, 1, 'EASY', 850000, 650000, 4.75, 210, TRUE, TRUE
FROM tour_categories tc JOIN cities c ON c.slug = 'ha-noi'
WHERE tc.slug = 'culture-heritage'
  AND NOT EXISTS (SELECT 1 FROM tours t WHERE t.slug = 'ha-noi-city-tour-old-quarter');

INSERT INTO tours (category_id, city_id, operator_id, title, slug, description, highlights, includes, excludes, duration_days, duration_nights, max_group_size, min_group_size, difficulty, price_per_adult, price_per_child, avg_rating, review_count, is_featured, is_active)
SELECT tc.id, c.id, NULL,
'Ha Noi - Ninh Binh day trip: Trang An & Hoa Lu',
'ha-noi-ninh-binh-trang-an',
'Tham quan Hang Trang An bằng thuyền, kinh do cổ Hoa Lu và chùa Bai Dinh trong một ngày.',
'["Hang Trang An", "Kinh do Hoa Lu", "Chua Bai Dinh", "Bua trua"]',
'["Xe du Ha Noi", "Huong dan", "Bua trua", "Phi thuyen"]',
'["Chi phi ca nhan", "Tips", "VAT"]',
1, 0, 18, 1, 'MEDIUM', 1150000, 890000, 4.85, 178, TRUE, TRUE
FROM tour_categories tc JOIN cities c ON c.slug = 'ha-noi'
WHERE tc.slug = 'nature-adventure'
  AND NOT EXISTS (SELECT 1 FROM tours t WHERE t.slug = 'ha-noi-ninh-binh-trang-an');

INSERT INTO tours (category_id, city_id, operator_id, title, slug, description, highlights, includes, excludes, duration_days, duration_nights, max_group_size, min_group_size, difficulty, price_per_adult, price_per_child, avg_rating, review_count, is_featured, is_active)
SELECT tc.id, c.id, NULL,
'Ha Noi street food walking tour - Old Quarter',
'ha-noi-street-food-tour',
'Hanh trinh am thuc Ha Noi qua cac tuyen pho cu với huong dan. Thưởng thức pho, banh cuon, cha ca va ca phe trứng.',
'["Pho bo Ha Noi", "Banh cuon", "Cha ca La Vong", "Ca phe trung"]',
'["Huong dan", "Am thuc (10+ mon)", "Nuoc uong"]',
'["Do uong co con", "Mua sam", "VAT"]',
1, 0, 10, 1, 'EASY', 750000, 0, 4.90, 305, TRUE, TRUE
FROM tour_categories tc JOIN cities c ON c.slug = 'ha-noi'
WHERE tc.slug = 'food-culinary'
  AND NOT EXISTS (SELECT 1 FROM tours t WHERE t.slug = 'ha-noi-street-food-tour');

INSERT INTO tours (category_id, city_id, operator_id, title, slug, description, highlights, includes, excludes, duration_days, duration_nights, max_group_size, min_group_size, difficulty, price_per_adult, price_per_child, avg_rating, review_count, is_featured, is_active)
SELECT tc.id, c.id, NULL,
'Ha Noi - Sapa 2 days 1 night - Fansipan peak',
'ha-noi-sapa-fansipan-adventure',
'Khám phá Sapa và đỉnh Fansipan huyền thoại. Trekking ruộng bậc thang, thăm bản làng Hmong và Dao.',
'["Dinh Fansipan", "Ruong bac thang Mu Cang Chai", "Lang bac Hoang Lien", "Trekking"]',
'["Xe limousine", "Khach san", "Bua sang", "Huong dan"]',
'["Bua trua ngay 2", "Tips", "VAT"]',
2, 1, 12, 1, 'HARD', 2450000, 1850000, 4.70, 142, TRUE, TRUE
FROM tour_categories tc JOIN cities c ON c.slug = 'ha-noi'
WHERE tc.slug = 'nature-adventure'
  AND NOT EXISTS (SELECT 1 FROM tours t WHERE t.slug = 'ha-noi-sapa-fansipan-adventure');

INSERT INTO tours (category_id, city_id, operator_id, title, slug, description, highlights, includes, excludes, duration_days, duration_nights, max_group_size, min_group_size, difficulty, price_per_adult, price_per_child, avg_rating, review_count, is_featured, is_active)
SELECT tc.id, c.id, NULL,
'Ha Noi cooking class - Traditional Vietnamese cuisine',
'ha-noi-cooking-class',
'Học nấu 5 món ăn Việt Nam truyền thống với đầu bếp bản địa. Thăm chợ, làm bánh mì và nấu phở.',
'["Lam pho bo", "Lam banh mi", "Tham cho Dong Xuan", "Certificate"]',
'["Nguyen lieu", "Cong thuc", "Bua trua", "Tra cuu"]',
'["Do uong", "Mua sam", "VAT"]',
1, 0, 8, 1, 'EASY', 1250000, 850000, 4.95, 88, FALSE, TRUE
FROM tour_categories tc JOIN cities c ON c.slug = 'ha-noi'
WHERE tc.slug = 'workshop'
  AND NOT EXISTS (SELECT 1 FROM tours t WHERE t.slug = 'ha-noi-cooking-class');

INSERT INTO tours (category_id, city_id, operator_id, title, slug, description, highlights, includes, excludes, duration_days, duration_nights, max_group_size, min_group_size, difficulty, price_per_adult, price_per_child, avg_rating, review_count, is_featured, is_active)
SELECT tc.id, c.id, NULL,
'Ha Noi water puppet show & Thang Long citadel',
'ha-noi-water-puppet-thang-long',
'Trải nghiệm múa rối nước truyền thống và tham quan Hoàng thành Thăng Long.',
'["Mua rối nước", "Hoang thành Thăng Long", "Nha hát Long Biên", "Pho co"]',
'["Ve vao", "Guide", "Nước"]',
'["Do uong", "Mua sam", "VAT"]',
1, 0, 15, 1, 'EASY', 650000, 450000, 4.60, 95, FALSE, TRUE
FROM tour_categories tc JOIN cities c ON c.slug = 'ha-noi'
WHERE tc.slug = 'culture-heritage'
  AND NOT EXISTS (SELECT 1 FROM tours t WHERE t.slug = 'ha-noi-water-puppet-thang-long');

-- ============================================================
-- DA NANG TOURS (6 tours)
-- ============================================================

INSERT INTO tours (category_id, city_id, operator_id, title, slug, description, highlights, includes, excludes, duration_days, duration_nights, max_group_size, min_group_size, difficulty, price_per_adult, price_per_child, avg_rating, review_count, is_featured, is_active)
SELECT tc.id, c.id, NULL,
'Da Nang - Ba Na Hills day trip - Golden Bridge',
'da-nang-ba-na-hills-day-trip',
'Khám phá Ba Na Hills, Cầu Vàng, Làng Pháp và cáp treo núi trong một ngày từ Da Nang.',
'["Cầu Vàng check-in", "Cáp treo Ba Na", "Làng Pháp", "Le Jardin d''Amour"]',
'["Xe đưa đón", "Huong dan TA", "Buffet trua", "Bao hiem"]',
'["Chi phi ca nhan", "Hoa don VAT", "Tips"]',
1, 0, 25, 1, 'EASY', 1290000, 990000, 4.80, 186, TRUE, TRUE
FROM tour_categories tc JOIN cities c ON c.slug = 'da-nang'
WHERE tc.slug = 'culture-heritage'
  AND NOT EXISTS (SELECT 1 FROM tours t WHERE t.slug = 'da-nang-ba-na-hills-day-trip');

INSERT INTO tours (category_id, city_id, operator_id, title, slug, description, highlights, includes, excludes, duration_days, duration_nights, max_group_size, min_group_size, difficulty, price_per_adult, price_per_child, avg_rating, review_count, is_featured, is_active)
SELECT tc.id, c.id, NULL,
'Da Nang - Son Tra - Marble Mountain - Hoi An by night',
'da-nang-son-tra-marble-mountain-hoi-an',
'Tour kết hợp thành phố cho khách lần đầu: Bán đảo Sơn Trà, Ngũ Hành Sơn và Hội An về đêm.',
'["Chùa Linh Ung", "Núi Ngũ Hành", "Phố cổ Hội An", "Chợ đêm"]',
'["Xe", "Huong dan", "Ve Hoi An", "Bua toi set menu"]',
'["Mua sam", "Tau thuyen", "VAT"]',
1, 0, 20, 1, 'EASY', 990000, 790000, 4.70, 142, TRUE, TRUE
FROM tour_categories tc JOIN cities c ON c.slug = 'da-nang'
WHERE tc.slug = 'culture-heritage'
  AND NOT EXISTS (SELECT 1 FROM tours t WHERE t.slug = 'da-nang-son-tra-marble-mountain-hoi-an');

INSERT INTO tours (category_id, city_id, operator_id, title, slug, description, highlights, includes, excludes, duration_days, duration_nights, max_group_size, min_group_size, difficulty, price_per_adult, price_per_child, avg_rating, review_count, is_featured, is_active)
SELECT tc.id, c.id, NULL,
'Da Nang - Cu Lao Cham island snorkeling adventure',
'da-nang-cu-lao-cham-snorkeling',
'Tàu cao tốc ra Cù Lao Chàm với lặn snorkel và bữa trưa hải sản tươi sống.',
'["Tàu cao tốc", "Snorkel", "Rạn san hô", "Bua trua hải sản"]',
'["Tàu", "Huong dan", "Dụng cụ snorkel", "Bua trua"]',
'["Goi san ho", "Do uong", "VAT"]',
1, 0, 18, 1, 'MEDIUM', 1150000, 920000, 4.60, 97, FALSE, TRUE
FROM tour_categories tc JOIN cities c ON c.slug = 'da-nang'
WHERE tc.slug = 'beach-island'
  AND NOT EXISTS (SELECT 1 FROM tours t WHERE t.slug = 'da-nang-cu-lao-cham-snorkeling');

INSERT INTO tours (category_id, city_id, operator_id, title, slug, description, highlights, includes, excludes, duration_days, duration_nights, max_group_size, min_group_size, difficulty, price_per_adult, price_per_child, avg_rating, review_count, is_featured, is_active)
SELECT tc.id, c.id, NULL,
'Da Nang street food tour by night',
'da-nang-food-tour-by-night',
'Khám phá ẩm thực đường phố với các món đặc trưng và các con hẻm khuất trong lòng Đà Nẵng.',
'["Các quán ăn địa phương", "Tuyến phố đêm", "Bờ sông Hàn", "Nhóm nhỏ"]',
'["Thử đồ ăn", "Huong dan", "Nuoc", "Đón khach"]',
'["Đồ gọi thêm", "Do uong", "VAT"]',
1, 0, 12, 1, 'EASY', 690000, 550000, 4.50, 76, FALSE, TRUE
FROM tour_categories tc JOIN cities c ON c.slug = 'da-nang'
WHERE tc.slug = 'food-culinary'
  AND NOT EXISTS (SELECT 1 FROM tours t WHERE t.slug = 'da-nang-food-tour-by-night');

INSERT INTO tours (category_id, city_id, operator_id, title, slug, description, highlights, includes, excludes, duration_days, duration_nights, max_group_size, min_group_size, difficulty, price_per_adult, price_per_child, avg_rating, review_count, is_featured, is_active)
SELECT tc.id, c.id, NULL,
'Da Nang - Hai Van Pass - Lang Co - Lagoon day trip',
'da-nang-hai-van-pass-lang-co',
'Vượt đèo Hải Vân huyền thoại, ngắm đầm Lập Đình và bãi biển Lăng Cô.',
'["Đèo Hải Vân", "Đầm Lập Đình", "Bãi Lăng Cô", "Hồ Chí Minh trail"]',
'["Xe", "Guide", "Bua trua", "Ve tham quan"]',
'["Chi phi ca nhan", "Tips", "VAT"]',
1, 0, 15, 1, 'MEDIUM', 890000, 690000, 4.40, 54, FALSE, TRUE
FROM tour_categories tc JOIN cities c ON c.slug = 'da-nang'
WHERE tc.slug = 'nature-adventure'
  AND NOT EXISTS (SELECT 1 FROM tours t WHERE t.slug = 'da-nang-hai-van-pass-lang-co');

INSERT INTO tours (category_id, city_id, operator_id, title, slug, description, highlights, includes, excludes, duration_days, duration_nights, max_group_size, min_group_size, difficulty, price_per_adult, price_per_child, avg_rating, review_count, is_featured, is_active)
SELECT tc.id, c.id, NULL,
'Da Nang family day - Water park & Beach fun',
'da-nang-family-water-park-beach',
'Ngày vui cho gia đình với công viên nước Asia Park và bãi biển Mỹ Khê.',
'["Asia Park", "Bãi Mỹ Khê", "Dragon Bridge", "Han River cruise"]',
'["Xe", "Ve Asia Park", "Guide", "Bua trua"]',
'["Chi phi ca nhan", "VAT"]',
1, 0, 20, 1, 'EASY', 980000, 780000, 4.55, 63, TRUE, TRUE
FROM tour_categories tc JOIN cities c ON c.slug = 'da-nang'
WHERE tc.slug = 'family'
  AND NOT EXISTS (SELECT 1 FROM tours t WHERE t.slug = 'da-nang-family-water-park-beach');

-- ============================================================
-- NHA TRANG TOURS (5 tours)
-- ============================================================

INSERT INTO tours (category_id, city_id, operator_id, title, slug, description, highlights, includes, excludes, duration_days, duration_nights, max_group_size, min_group_size, difficulty, price_per_adult, price_per_child, avg_rating, review_count, is_featured, is_active)
SELECT tc.id, c.id, NULL,
'Nha Trang - Con Se Tre island hopping 4 islands',
'nha-trang-con-se-tre-island-hopping',
'Tham quan 4 đảo xung quanh Nha Trang: Hòn Mun, Hòn Một, Hòn Tranh và làng chài.',
'["Snorkel Hon Mun", "Thuyền đáy kính", "Bua trua hải sản", "Thể thao nước"]',
'["Tàu cao tốc", "Huong dan", "Bua trua", "Dung cu snorkel"]',
'["Phí thể thao", "Chi phi ca nhan", "VAT"]',
1, 0, 25, 1, 'EASY', 990000, 790000, 4.65, 134, TRUE, TRUE
FROM tour_categories tc JOIN cities c ON c.slug = 'nha-trang'
WHERE tc.slug = 'beach-island'
  AND NOT EXISTS (SELECT 1 FROM tours t WHERE t.slug = 'nha-trang-con-se-tre-island-hopping');

INSERT INTO tours (category_id, city_id, operator_id, title, slug, description, highlights, includes, excludes, duration_days, duration_nights, max_group_size, min_group_size, difficulty, price_per_adult, price_per_child, avg_rating, review_count, is_featured, is_active)
SELECT tc.id, c.id, NULL,
'Nha Trang snorkeling & diving day trip - Hon Mun',
'nha-trang-snorkeling-diving',
'Khám phá rạn san hô và đời sống biển tại Hòn Mún với huấn luyện viên lặn chuyên nghiệp.',
'["2 điểm snorkel", "Vườn san hô", "Đời sống biển", "Anh duoi nuoc"]',
'["Xe", "Huong dan", "Bua trua", "Thue dung cu"]',
'["May anh duoi nuoc", "Chi phi ca nhan", "VAT"]',
1, 0, 15, 1, 'MEDIUM', 1350000, 1050000, 4.70, 88, FALSE, TRUE
FROM tour_categories tc JOIN cities c ON c.slug = 'nha-trang'
WHERE tc.slug = 'beach-island'
  AND NOT EXISTS (SELECT 1 FROM tours t WHERE t.slug = 'nha-trang-snorkeling-diving');

INSERT INTO tours (category_id, city_id, operator_id, title, slug, description, highlights, includes, excludes, duration_days, duration_nights, max_group_size, min_group_size, difficulty, price_per_adult, price_per_child, avg_rating, review_count, is_featured, is_active)
SELECT tc.id, c.id, NULL,
'Nha Trang - Ba Ho waterfall & hiking adventure',
'nha-trang-ba-ho-waterfall-hiking',
'Trekking tới thác Ba Ho và khám phá rừng nhiệt đới xung quanh Nha Trang.',
'["Thác Ba Ho", "Trekking rừng", "Bơi suối", "Viewpoint"]',
'["Xe", "Guide", "Bua trua", "Bao hiem"]',
'["Dồ uống", "Chi phi ca nhan", "VAT"]',
1, 0, 12, 1, 'MEDIUM', 950000, 750000, 4.55, 65, FALSE, TRUE
FROM tour_categories tc JOIN cities c ON c.slug = 'nha-trang'
WHERE tc.slug = 'nature-adventure'
  AND NOT EXISTS (SELECT 1 FROM tours t WHERE t.slug = 'nha-trang-ba-ho-waterfall-hiking');

INSERT INTO tours (category_id, city_id, operator_id, title, slug, description, highlights, includes, excludes, duration_days, duration_nights, max_group_size, min_group_size, difficulty, price_per_adult, price_per_child, avg_rating, review_count, is_featured, is_active)
SELECT tc.id, c.id, NULL,
'Nha Trang mud bath & thermal spring relaxation',
'nha-trang-mud-bath-relaxation',
'Trải nghiệm tắm bùn và suối nước nóng tại Nha Trang. Thư giãn và làm đẹp da.',
'["Tắm bùn khoáng", "Suối nước nóng", "Massage", "Bể bơi"]',
'["Xe đưa đón", "Ve mud bath", "Bua trua", "Khăn tắm"]',
'["Massage them", "Chi phi ca nhan", "VAT"]',
1, 0, 15, 1, 'EASY', 1200000, 900000, 4.80, 110, TRUE, TRUE
FROM tour_categories tc JOIN cities c ON c.slug = 'nha-trang'
WHERE tc.slug = 'relaxation'
  AND NOT EXISTS (SELECT 1 FROM tours t WHERE t.slug = 'nha-trang-mud-bath-relaxation');

INSERT INTO tours (category_id, city_id, operator_id, title, slug, description, highlights, includes, excludes, duration_days, duration_nights, max_group_size, min_group_size, difficulty, price_per_adult, price_per_child, avg_rating, review_count, is_featured, is_active)
SELECT tc.id, c.id, NULL,
'Nha Trang fish market & cooking class',
'nha-trang-fish-market-cooking',
'Đi chợ hải sản từ sáng sớm và học nấu các món hải sản Nha Trang đặc trưng.',
'["Chợ hải sản", "Nấu 5 món", "Bun cha ca", "Tasting"]',
'["Nguyen lieu", "Huong dan", "Bua trua voi mon da nau", "Tra cuu"]',
'["Do uong", "Mua sam", "VAT"]',
1, 0, 10, 1, 'EASY', 1100000, 800000, 4.75, 72, FALSE, TRUE
FROM tour_categories tc JOIN cities c ON c.slug = 'nha-trang'
WHERE tc.slug = 'food-culinary'
  AND NOT EXISTS (SELECT 1 FROM tours t WHERE t.slug = 'nha-trang-fish-market-cooking');

-- ============================================================
-- PHU QUOC TOURS (4 tours)
-- ============================================================

INSERT INTO tours (category_id, city_id, operator_id, title, slug, description, highlights, includes, excludes, duration_days, duration_nights, max_group_size, min_group_size, difficulty, price_per_adult, price_per_child, avg_rating, review_count, is_featured, is_active)
SELECT tc.id, c.id, NULL,
'Phu Quoc - 3 islands snorkeling tour with sunset',
'phu-quoc-3-islands-snorkeling',
'Thăm 3 đảo Hòn Gầm Gửi, Hòn Mây Rút và Hòn Thơm với lặn snorkel và câu cá hoàng hôn.',
'["Snorkel 3 điểm", "Cáp treo Hòn Thơm", "Câu cá hoàng hôn", "Bua trua hải sản"]',
'["Tàu cao tốc", "Huong dan", "Bua trua", "Dung cu"]',
'["Phi cáp treo", "Chi phi ca nhan", "VAT"]',
1, 0, 20, 1, 'EASY', 1100000, 880000, 4.70, 112, TRUE, TRUE
FROM tour_categories tc JOIN cities c ON c.slug = 'phu-quoc'
WHERE tc.slug = 'beach-island'
  AND NOT EXISTS (SELECT 1 FROM tours t WHERE t.slug = 'phu-quoc-3-islands-snorkeling');

INSERT INTO tours (category_id, city_id, operator_id, title, slug, description, highlights, includes, excludes, duration_days, duration_nights, max_group_size, min_group_size, difficulty, price_per_adult, price_per_child, avg_rating, review_count, is_featured, is_active)
SELECT tc.id, c.id, NULL,
'Phu Quoc island exploration by motorbike',
'phu-quoc-island-exploration',
'Khám phá Phú Quốc bằng xe máy: Vinpearl Safari, Nhà máy tiêu, Xí nghiệp nước mắm và bãi biển.',
'["Vinpearl Safari", "Truong tiêu", "Xí nghiệp nước mắm", "Bãi Sao"]',
'["Xe", "Huong dan", "Bua trua", "Ve Safari"]',
'["Chi phi ca nhan", "Tips", "VAT"]',
1, 0, 15, 1, 'EASY', 1350000, 1050000, 4.55, 78, FALSE, TRUE
FROM tour_categories tc JOIN cities c ON c.slug = 'phu-quoc'
WHERE tc.slug = 'nature-adventure'
  AND NOT EXISTS (SELECT 1 FROM tours t WHERE t.slug = 'phu-quoc-island-exploration');

INSERT INTO tours (category_id, city_id, operator_id, title, slug, description, highlights, includes, excludes, duration_days, duration_nights, max_group_size, min_group_size, difficulty, price_per_adult, price_per_child, avg_rating, review_count, is_featured, is_active)
SELECT tc.id, c.id, NULL,
'Phu Quoc night market food tour',
'phu-quoc-night-market-food-tour',
'Đi bộ khám phá chợ đêm Phú Quốc - thiên đường hải sản giá rẻ với đủ loại đặc sản đảo.',
'["Chợ đêm Dinh Cậu", "Hải sản tươi sống", "Nước mắm Phú Quốc", "Bánh flan"]',
'["Guide", "Thử đồ ăn (8+ món)", "Nuoc", "Đón khách"]',
'["Đồ gọi thêm", "Mua mang về", "VAT"]',
1, 0, 12, 1, 'EASY', 550000, 0, 4.65, 90, FALSE, TRUE
FROM tour_categories tc JOIN cities c ON c.slug = 'phu-quoc'
WHERE tc.slug = 'food-culinary'
  AND NOT EXISTS (SELECT 1 FROM tours t WHERE t.slug = 'phu-quoc-night-market-food-tour');

INSERT INTO tours (category_id, city_id, operator_id, title, slug, description, highlights, includes, excludes, duration_days, duration_nights, max_group_size, min_group_size, difficulty, price_per_adult, price_per_child, avg_rating, review_count, is_featured, is_active)
SELECT tc.id, c.id, NULL,
'Phu Quoc sunset romantic boat cruise',
'phu-quoc-sunset-romantic-cruise',
'Tàu thuyền ngắm hoàng hôn lãng mạn trên biển Phú Quốc với champagne và hải sản nướng.',
'["Ngắm hoàng hôn", "Champagne", "Hải sản nướng trên tàu", "Câu mực"]',
'["Tàu", "Champagne", "Bua trua hải sản", "Guide"]',
'["Đồ uống thêm", "Chi phi ca nhan", "VAT"]',
1, 0, 8, 1, 'EASY', 1850000, 1450000, 4.85, 58, FALSE, TRUE
FROM tour_categories tc JOIN cities c ON c.slug = 'phu-quoc'
WHERE tc.slug = 'relaxation'
  AND NOT EXISTS (SELECT 1 FROM tours t WHERE t.slug = 'phu-quoc-sunset-romantic-cruise');

-- ============================================================
-- HO CHI MINH TOURS (5 tours)
-- ============================================================

INSERT INTO tours (category_id, city_id, operator_id, title, slug, description, highlights, includes, excludes, duration_days, duration_nights, max_group_size, min_group_size, difficulty, price_per_adult, price_per_child, avg_rating, review_count, is_featured, is_active)
SELECT tc.id, c.id, NULL,
'Ho Chi Minh - Cu Chi tunnels half day',
'hcm-cu-chi-tunnels-half-day',
'Khám phá mạng lưới đường hầm Cu Chi nổi tiếng thời chiến tranh Việt Nam.',
'["Đường hầm Cu Chi", "Triển lãm bẫy chuột", "Bắn súng", "Khoai lang nướng"]',
'["Xe", "Huong dan", "Ve vào", "Nuoc"]',
'["Phí bắn súng", "Chi phi ca nhan", "VAT"]',
1, 0, 20, 1, 'EASY', 750000, 550000, 4.60, 245, TRUE, TRUE
FROM tour_categories tc JOIN cities c ON c.slug = 'ho-chi-minh'
WHERE tc.slug = 'culture-heritage'
  AND NOT EXISTS (SELECT 1 FROM tours t WHERE t.slug = 'hcm-cu-chi-tunnels-half-day');

INSERT INTO tours (category_id, city_id, operator_id, title, slug, description, highlights, includes, excludes, duration_days, duration_nights, max_group_size, min_group_size, difficulty, price_per_adult, price_per_child, avg_rating, review_count, is_featured, is_active)
SELECT tc.id, c.id, NULL,
'Mekong Delta 2 days 1 night from Ho Chi Minh',
'mekong-delta-2-days-1-night',
'Khám phá miền Tây sông nước: Bến Tre, chợ nổi Cần Thơ và làng quê miền Tây.',
'["Xưởng kẹo dừa", "Thuyền chèo", "Chợ nổi", "Trải nghiệm homestay"]',
'["Xe", "Huong dan", "Bua an", "Khach san"]',
'["Chi phi ca nhan", "Tips", "VAT"]',
2, 1, 15, 1, 'EASY', 1890000, 1490000, 4.75, 167, TRUE, TRUE
FROM tour_categories tc JOIN cities c ON c.slug = 'ho-chi-minh'
WHERE tc.slug = 'nature-adventure'
  AND NOT EXISTS (SELECT 1 FROM tours t WHERE t.slug = 'mekong-delta-2-days-1-night');

INSERT INTO tours (category_id, city_id, operator_id, title, slug, description, highlights, includes, excludes, duration_days, duration_nights, max_group_size, min_group_size, difficulty, price_per_adult, price_per_child, avg_rating, review_count, is_featured, is_active)
SELECT tc.id, c.id, NULL,
'Ho Chi Minh street food tour by night',
'hcm-street-food-tour-by-night',
'Khám phá đời sống ẩm thực sôi động Sài Gòn: từ bánh mì đến cơm tấm, tất cả bằng đi bộ.',
'["Bánh mì thịt", "Cơm tấm", "Bún thịt nướng", "Sinh tố hoa quả"]',
'["Guide", "Thử đồ ăn (8 món)", "Nuoc", "Đi bộ"]',
'["Đồ uống có cồn", "Đồ gọi thêm", "VAT"]',
1, 0, 12, 1, 'EASY', 650000, 0, 4.80, 198, TRUE, TRUE
FROM tour_categories tc JOIN cities c ON c.slug = 'ho-chi-minh'
WHERE tc.slug = 'food-culinary'
  AND NOT EXISTS (SELECT 1 FROM tours t WHERE t.slug = 'hcm-street-food-tour-by-night');

INSERT INTO tours (category_id, city_id, operator_id, title, slug, description, highlights, includes, excludes, duration_days, duration_nights, max_group_size, min_group_size, difficulty, price_per_adult, price_per_child, avg_rating, review_count, is_featured, is_active)
SELECT tc.id, c.id, NULL,
'Ho Chi Minh city tour - Notre Dame & War Remnants',
'hcm-city-tour-notre-dame-war-remnants',
'Khám phá Sài Gòn hiện đại: Nhà thờ Đức Bà, Bảo tàng Chứng tích chiến tranh và phố đi bộ Nguyễn Huệ.',
'["Nhà thờ Đức Bà", "Bưu điện Sài Gòn", "Bảo tàng Chứng tích", "Phố đi bộ"]',
'["Xe", "Guide", "Ve bảo tàng", "Nuoc"]',
'["Chi phi ca nhan", "Mua sam", "VAT"]',
1, 0, 18, 1, 'EASY', 550000, 400000, 4.55, 132, FALSE, TRUE
FROM tour_categories tc JOIN cities c ON c.slug = 'ho-chi-minh'
WHERE tc.slug = 'culture-heritage'
  AND NOT EXISTS (SELECT 1 FROM tours t WHERE t.slug = 'hcm-city-tour-notre-dame-war-remnants');

INSERT INTO tours (category_id, city_id, operator_id, title, slug, description, highlights, includes, excludes, duration_days, duration_nights, max_group_size, min_group_size, difficulty, price_per_adult, price_per_child, avg_rating, review_count, is_featured, is_active)
SELECT tc.id, c.id, NULL,
'Mekong Delta day trip - Ben Tre coconut canals',
'mekong-delta-day-trip-ben-tre',
'Trải nghiệm miền Tây trong ngày: xưởng kẹo dừa, thuyền chèo kênh và thưởng thức trái cây miền Tây.',
'["Xưởng kẹo dừa", "Thuyền chèo kênh", "Thiền đường", "Trái cây miền Tây"]',
'["Xe", "Thuyền", "Bua trua", "Guide"]',
'["Mua đặc sản", "Chi phi ca nhan", "VAT"]',
1, 0, 15, 1, 'EASY', 950000, 750000, 4.65, 105, FALSE, TRUE
FROM tour_categories tc JOIN cities c ON c.slug = 'ho-chi-minh'
WHERE tc.slug = 'family'
  AND NOT EXISTS (SELECT 1 FROM tours t WHERE t.slug = 'mekong-delta-day-trip-ben-tre');

-- ============================================================
-- DA LAT TOURS (4 tours)
-- ============================================================

INSERT INTO tours (category_id, city_id, operator_id, title, slug, description, highlights, includes, excludes, duration_days, duration_nights, max_group_size, min_group_size, difficulty, price_per_adult, price_per_child, avg_rating, review_count, is_featured, is_active)
SELECT tc.id, c.id, NULL,
'Da Lat city tour - Valley, Crazy House & Waterfall',
'da-lat-city-tour-valley-pagoda',
'Khám phá Đà Lạt: Thung lũng, Crazy House, chùa Linh Phước và thác Datanla.',
'["Điểm view thung lũng", "Crazy House", "Chùa Linh Phước", "Thác Datanla"]',
'["Xe", "Guide", "Ve tham quan", "Bua trua"]',
'["Chi phi ca nhan", "Tips", "VAT"]',
1, 0, 18, 1, 'EASY', 850000, 650000, 4.70, 145, TRUE, TRUE
FROM tour_categories tc JOIN cities c ON c.slug = 'da-lat'
WHERE tc.slug = 'nature-adventure'
  AND NOT EXISTS (SELECT 1 FROM tours t WHERE t.slug = 'da-lat-city-tour-valley-pagoda');

INSERT INTO tours (category_id, city_id, operator_id, title, slug, description, highlights, includes, excludes, duration_days, duration_nights, max_group_size, min_group_size, difficulty, price_per_adult, price_per_child, avg_rating, review_count, is_featured, is_active)
SELECT tc.id, c.id, NULL,
'Da Lat coffee & tea workshop experience',
'da-lat-coffee-tea-workshop',
'Học về sản xuất cà phê và trà Đà Lạt với workshop thực hành và thưởng thức.',
'["Hái cà phê", "Trình diễn rang", "Làm bánh mì Pháp", "Thưởng trà"]',
'["Xe", "Workshop", "Thưởng thức", "Bua trua"]',
'["Mua mang về", "Tips", "VAT"]',
1, 0, 12, 1, 'EASY', 950000, 750000, 4.85, 92, FALSE, TRUE
FROM tour_categories tc JOIN cities c ON c.slug = 'da-lat'
WHERE tc.slug = 'workshop'
  AND NOT EXISTS (SELECT 1 FROM tours t WHERE t.slug = 'da-lat-coffee-tea-workshop');

INSERT INTO tours (category_id, city_id, operator_id, title, slug, description, highlights, includes, excludes, duration_days, duration_nights, max_group_size, min_group_size, difficulty, price_per_adult, price_per_child, avg_rating, review_count, is_featured, is_active)
SELECT tc.id, c.id, NULL,
'Da Lat sunrise at Lang Biang mountain trek',
'da-lat-lang-biang-sunrise-trek',
'Trekking đỉnh Lang Biang để ngắm bình minh và view toàn cảnh Đà Lạt từ trên cao.',
'["Bình minh trên đỉnh", "Trekking rừng thông", "Viewpoint 360", "Đỉnh Lang Biang"]',
'["Xe đón", "Guide", "Bua sang", "Bao hiem"]',
'["Bua trua", "Chi phi ca nhan", "VAT"]',
1, 0, 10, 1, 'HARD', 750000, 550000, 4.60, 68, FALSE, TRUE
FROM tour_categories tc JOIN cities c ON c.slug = 'da-lat'
WHERE tc.slug = 'nature-adventure'
  AND NOT EXISTS (SELECT 1 FROM tours t WHERE t.slug = 'da-lat-lang-biang-sunrise-trek');

INSERT INTO tours (category_id, city_id, operator_id, title, slug, description, highlights, includes, excludes, duration_days, duration_nights, max_group_size, min_group_size, difficulty, price_per_adult, price_per_child, avg_rating, review_count, is_featured, is_active)
SELECT tc.id, c.id, NULL,
'Da Lat flower garden & tea plantation day tour',
'da-lat-flower-tea-plantation',
'Thăm vườn hoa và trà Đà Lạt nổi tiếng. Khám phá vẻ đẹp lãng mạn của thành phố ngàn hoa.',
'["Vườn hoa", "Trà Mộc Lan", "Hồ Tuyền Lâm", "Thung lũng tình yêu"]',
'["Xe", "Guide", "Ve vườn hoa", "Bua trua"]',
'["Mua hoa", "Chi phi ca nhan", "VAT"]',
1, 0, 15, 1, 'EASY', 650000, 500000, 4.75, 80, FALSE, TRUE
FROM tour_categories tc JOIN cities c ON c.slug = 'da-lat'
WHERE tc.slug = 'family'
  AND NOT EXISTS (SELECT 1 FROM tours t WHERE t.slug = 'da-lat-flower-tea-plantation');

-- ============================================================
-- HOI AN TOURS (4 tours)
-- ============================================================

INSERT INTO tours (category_id, city_id, operator_id, title, slug, description, highlights, includes, excludes, duration_days, duration_nights, max_group_size, min_group_size, difficulty, price_per_adult, price_per_child, avg_rating, review_count, is_featured, is_active)
SELECT tc.id, c.id, NULL,
'Hoi An ancient town walking tour - Lantern & History',
'hoi-an-ancient-town-walking-tour',
'Khám phá Hội An về đêm với đèn lồng rực rỡ, phố cổ yên bình và các di tích lịch sử.',
'["Phố cổ Hội An", "Chùa Cầu", "Hội quán Phước Kiểu", "Đèn lồng"]',
'["Guide", "Ve tham quan", "Bua toi set menu", "Đón khách"]',
'["Mua sam", "Chi phi ca nhan", "VAT"]',
1, 0, 15, 1, 'EASY', 750000, 550000, 4.85, 215, TRUE, TRUE
FROM tour_categories tc JOIN cities c ON c.slug = 'hoi-an'
WHERE tc.slug = 'culture-heritage'
  AND NOT EXISTS (SELECT 1 FROM tours t WHERE t.slug = 'hoi-an-ancient-town-walking-tour');

INSERT INTO tours (category_id, city_id, operator_id, title, slug, description, highlights, includes, excludes, duration_days, duration_nights, max_group_size, min_group_size, difficulty, price_per_adult, price_per_child, avg_rating, review_count, is_featured, is_active)
SELECT tc.id, c.id, NULL,
'Hoi An cooking class - Traditional Vietnamese dishes',
'hoi-an-cooking-class',
'Học nấu 5 món ăn Việt Nam đặc trưng tại Hội An. Đi chợ, làm bánh xèo và phở.',
'["Đi chợ Hội An", "Làm bánh xèo", "Nấu phở", "Certificate"]',
'["Nguyen lieu", "Ve chợ", "Bua trua với món đã nấu", "Tra cuu cong thuc"]',
'["Do uong", "Mua sam", "VAT"]',
1, 0, 10, 1, 'EASY', 1150000, 850000, 4.90, 130, FALSE, TRUE
FROM tour_categories tc JOIN cities c ON c.slug = 'hoi-an'
WHERE tc.slug = 'workshop'
  AND NOT EXISTS (SELECT 1 FROM tours t WHERE t.slug = 'hoi-an-cooking-class');

INSERT INTO tours (category_id, city_id, operator_id, title, slug, description, highlights, includes, excludes, duration_days, duration_nights, max_group_size, min_group_size, difficulty, price_per_adult, price_per_child, avg_rating, review_count, is_featured, is_active)
SELECT tc.id, c.id, NULL,
'Hoi An - My Son sanctuary half day',
'hoi-an-my-son-sanctuary',
'Thăm quần thể đền tháp My Son - di sản văn hóa Chăm Pa được UNESCO công nhận.',
'["Quần thể My Son", "Tháp Chăm", "Trình diễn âm nhạc", "Lịch sử Chăm Pa"]',
'["Xe", "Guide", "Ve tham quan", "Nuoc"]',
'["Chi phi ca nhan", "Tips", "VAT"]',
1, 0, 18, 1, 'EASY', 850000, 650000, 4.75, 165, TRUE, TRUE
FROM tour_categories tc JOIN cities c ON c.slug = 'hoi-an'
WHERE tc.slug = 'culture-heritage'
  AND NOT EXISTS (SELECT 1 FROM tours t WHERE t.slug = 'hoi-an-my-son-sanctuary');

INSERT INTO tours (category_id, city_id, operator_id, title, slug, description, highlights, includes, excludes, duration_days, duration_nights, max_group_size, min_group_size, difficulty, price_per_adult, price_per_child, avg_rating, review_count, is_featured, is_active)
SELECT tc.id, c.id, NULL,
'Hoi An fishing & lantern making experience',
'hoi-an-fishing-lantern-making',
'Trải nghiệm đánh cá theo phong cách ngư dân và làm đèn lồng giấy truyền thống Hội An.',
'["Đánh cá", "Làm đèn lồng giấy", "Thuyền thúng", "Thưởng trà"]',
'["Dụng cụ", "Nguyen lieu", "Guide", "Đèn lồng mang ve"]',
'["Chi phi ca nhan", "Tips", "VAT"]',
1, 0, 10, 1, 'EASY', 950000, 750000, 4.80, 95, FALSE, TRUE
FROM tour_categories tc JOIN cities c ON c.slug = 'hoi-an'
WHERE tc.slug = 'workshop'
  AND NOT EXISTS (SELECT 1 FROM tours t WHERE t.slug = 'hoi-an-fishing-lantern-making');

-- ============================================================
-- HUE TOURS (4 tours)
-- ============================================================

INSERT INTO tours (category_id, city_id, operator_id, title, slug, description, highlights, includes, excludes, duration_days, duration_nights, max_group_size, min_group_size, difficulty, price_per_adult, price_per_child, avg_rating, review_count, is_featured, is_active)
SELECT tc.id, c.id, NULL,
'Hue imperial citadel full day tour',
'hue-imperial-citadel-full-day',
'Khám phá Đại Nội Huế, chùa Thiên Mụ, lăng Tự Đức và lăng Khải Định trong một ngày.',
'["Đại Nội Huế", "Chùa Thiên Mụ", "Lăng Tự Đức", "Lăng Khải Định"]',
'["Xe", "Guide", "Bua trua", "Tat ca ve tham quan"]',
'["Chi phi ca nhan", "Tips", "VAT"]',
1, 0, 18, 1, 'EASY', 1050000, 820000, 4.75, 168, TRUE, TRUE
FROM tour_categories tc JOIN cities c ON c.slug = 'hue'
WHERE tc.slug = 'culture-heritage'
  AND NOT EXISTS (SELECT 1 FROM tours t WHERE t.slug = 'hue-imperial-citadel-full-day');

INSERT INTO tours (category_id, city_id, operator_id, title, slug, description, highlights, includes, excludes, duration_days, duration_nights, max_group_size, min_group_size, difficulty, price_per_adult, price_per_child, avg_rating, review_count, is_featured, is_active)
SELECT tc.id, c.id, NULL,
'Hue - DMZ day trip (Vinh Moc tunnels & Khe Sanh)',
'hue-dmz-day-trip',
'Thăm vùng phi quân sự: đường hầm Vĩnh Mốc, căn cứ Khe Sanh và đèo Hải Vân.',
'["Đường hầm Vĩnh Mốc", "Căn cứ Khe Sanh", "Đèo Hải Vân", "Sông Bến Hải"]',
'["Xe", "Guide", "Bua trua"]',
'["Chi phi ca nhan", "Tips", "VAT"]',
1, 0, 15, 1, 'MEDIUM', 1250000, 990000, 4.65, 95, FALSE, TRUE
FROM tour_categories tc JOIN cities c ON c.slug = 'hue'
WHERE tc.slug = 'culture-heritage'
  AND NOT EXISTS (SELECT 1 FROM tours t WHERE t.slug = 'hue-dmz-day-trip');

INSERT INTO tours (category_id, city_id, operator_id, title, slug, description, highlights, includes, excludes, duration_days, duration_nights, max_group_size, min_group_size, difficulty, price_per_adult, price_per_child, avg_rating, review_count, is_featured, is_active)
SELECT tc.id, c.id, NULL,
'Hue garden house & Perfume River boat tour',
'hue-garden-house-perfume-river',
'Khám phá các biệt thự vườn Huế độc đáo và thuyền trên sông Hương ngắm cảnh.',
'["Biệt thự vườn", "Thuyền sông Hương", "Chùa Thiên Mụ", "Chợ Đông Ba"]',
'["Thuyền", "Guide", "Bua trua", "Ve tham quan"]',
'["Chi phi ca nhan", "Mua sam", "VAT"]',
1, 0, 12, 1, 'EASY', 850000, 650000, 4.70, 75, FALSE, TRUE
FROM tour_categories tc JOIN cities c ON c.slug = 'hue'
WHERE tc.slug = 'culture-heritage'
  AND NOT EXISTS (SELECT 1 FROM tours t WHERE t.slug = 'hue-garden-house-perfume-river');

INSERT INTO tours (category_id, city_id, operator_id, title, slug, description, highlights, includes, excludes, duration_days, duration_nights, max_group_size, min_group_size, difficulty, price_per_adult, price_per_child, avg_rating, review_count, is_featured, is_active)
SELECT tc.id, c.id, NULL,
'Hue royal cuisine & conical hat making tour',
'hue-royal-cuisine-conical-hat',
'Thưởng thức ẩm thực cung đình Huế và học làm nón lá truyền thống.',
'["Bún bò Huế", "Ẩm thực cung đình", "Làm nón lá", "Chợ Tết"]',
'["Guide", "Thử đồ ăn", "Làm nón", "Ve mang ve"]',
'["Do uong", "Mua sam", "VAT"]',
1, 0, 10, 1, 'EASY', 950000, 750000, 4.80, 58, FALSE, TRUE
FROM tour_categories tc JOIN cities c ON c.slug = 'hue'
WHERE tc.slug = 'food-culinary'
  AND NOT EXISTS (SELECT 1 FROM tours t WHERE t.slug = 'hue-royal-cuisine-conical-hat');

-- ============================================================
-- VUNG TAU TOURS (4 tours)
-- ============================================================

INSERT INTO tours (category_id, city_id, operator_id, title, slug, description, highlights, includes, excludes, duration_days, duration_nights, max_group_size, min_group_size, difficulty, price_per_adult, price_per_child, avg_rating, review_count, is_featured, is_active)
SELECT tc.id, c.id, NULL,
'Vung Tau beach resort day trip from Ho Chi Minh',
'vung-tau-beach-day-trip',
'Nghỉ dưỡng biển Vũng Tàu - Bãi Sau xinh đẹp, tháp sắt và núi Nhỏ.',
'["Bãi Sau", "Tháp sắt", "Núi Nhỏ", "Tượng Chúa Giang Tay"]',
'["Xe đưa đón", "Guide", "Ve tham quan", "Bua trua"]',
'["Chi phi ca nhan", "Tips", "VAT"]',
1, 0, 20, 1, 'EASY', 750000, 550000, 4.50, 120, TRUE, TRUE
FROM tour_categories tc JOIN cities c ON c.slug = 'vung-tau'
WHERE tc.slug = 'beach-island'
  AND NOT EXISTS (SELECT 1 FROM tours t WHERE t.slug = 'vung-tau-beach-day-trip');

INSERT INTO tours (category_id, city_id, operator_id, title, slug, description, highlights, includes, excludes, duration_days, duration_nights, max_group_size, min_group_size, difficulty, price_per_adult, price_per_child, avg_rating, review_count, is_featured, is_active)
SELECT tc.id, c.id, NULL,
'Vung Tau - Con Dao island day trip by speedboat',
'vung-tau-con-dao-speedboat',
'Tàu cao tốc ra Côn Đảo - "Địa ngục trần gian" xưa và vẻ đẹp hoang sơ hiện tại.',
'["Côn Đảo", "Nhà tù Côn Đảo", "Bãi Nhạn", "Mộ liệt sĩ"]',
'["Tàu cao tốc", "Xe", "Guide", "Ve tham quan"]',
'["Bua trua", "Chi phi ca nhan", "VAT"]',
1, 0, 15, 1, 'EASY', 1850000, 1450000, 4.70, 65, FALSE, TRUE
FROM tour_categories tc JOIN cities c ON c.slug = 'vung-tau'
WHERE tc.slug = 'culture-heritage'
  AND NOT EXISTS (SELECT 1 FROM tours t WHERE t.slug = 'vung-tau-con-dao-speedboat');

INSERT INTO tours (category_id, city_id, operator_id, title, slug, description, highlights, includes, excludes, duration_days, duration_nights, max_group_size, min_group_size, difficulty, price_per_adult, price_per_child, avg_rating, review_count, is_featured, is_active)
SELECT tc.id, c.id, NULL,
'Vung Tau seafood & lighthouse walking tour',
'vung-tau-seafood-lighthouse-tour',
'Khám phá ẩm thực hải sản Vũng Tàu và thăm ngọn hải đăng nổi tiếng.',
'["Hải sản tươi sống", "Ngọn hải đăng", "Phố cổ", "Bãi Trước"]',
'["Guide", "Thử đồ ăn (8 món)", "Ve hải đăng", "Đón khách"]',
'["Do uong", "Mua sam", "VAT"]',
1, 0, 12, 1, 'EASY', 650000, 450000, 4.55, 85, FALSE, TRUE
FROM tour_categories tc JOIN cities c ON c.slug = 'vung-tau'
WHERE tc.slug = 'food-culinary'
  AND NOT EXISTS (SELECT 1 FROM tours t WHERE t.slug = 'vung-tau-seafood-lighthouse-tour');

INSERT INTO tours (category_id, city_id, operator_id, title, slug, description, highlights, includes, excludes, duration_days, duration_nights, max_group_size, min_group_size, difficulty, price_per_adult, price_per_child, avg_rating, review_count, is_featured, is_active)
SELECT tc.id, c.id, NULL,
'Vung Tau sunset & beach relaxation day',
'vung-tau-sunset-relaxation',
'Thư giãn tại bãi biển Vũng Tàu, ngắm hoàng hôn trên bờ biển và tận hưởng spa biển.',
'["Bãi Sau", "Ngắm hoàng hôn", "Massage biển", "Hải sản tươi"]',
'["Xe", "Guide", "Ve bãi biển", "Bua trua"]',
'["Spa them", "Chi phi ca nhan", "VAT"]',
1, 0, 15, 1, 'EASY', 850000, 650000, 4.60, 70, FALSE, TRUE
FROM tour_categories tc JOIN cities c ON c.slug = 'vung-tau'
WHERE tc.slug = 'relaxation'
  AND NOT EXISTS (SELECT 1 FROM tours t WHERE t.slug = 'vung-tau-sunset-relaxation');

-- ============================================================
-- HA LONG TOURS (4 tours)
-- ============================================================

INSERT INTO tours (category_id, city_id, operator_id, title, slug, description, highlights, includes, excludes, duration_days, duration_nights, max_group_size, min_group_size, difficulty, price_per_adult, price_per_child, avg_rating, review_count, is_featured, is_active)
SELECT tc.id, c.id, NULL,
'Ha Long Bay 2 days 1 night luxury cruise',
'ha-long-bay-2d1n-cruise',
'Tàu du ngoạn qua Vịnh Hạ Long qua đêm với kayak, khám hang và tiệc hoàng hôn.',
'["Du ngoạn Vịnh Hạ Long", "Hang Sung Sửa", "Kayak", "Tiệc hoàng hôn", "Câu mực"]',
'["Cabin tau", "Bua an", "Kayak", "Guide"]',
'["Do uong", "Chi phi ca nhan", "Tips", "VAT"]',
2, 1, 30, 1, 'EASY', 2500000, 1900000, 4.90, 320, TRUE, TRUE
FROM tour_categories tc JOIN cities c ON c.slug = 'ha-long'
WHERE tc.slug = 'nature-adventure'
  AND NOT EXISTS (SELECT 1 FROM tours t WHERE t.slug = 'ha-long-bay-2d1n-cruise');

INSERT INTO tours (category_id, city_id, operator_id, title, slug, description, highlights, includes, excludes, duration_days, duration_nights, max_group_size, min_group_size, difficulty, price_per_adult, price_per_child, avg_rating, review_count, is_featured, is_active)
SELECT tc.id, c.id, NULL,
'Ha Long Bay - Tuan Chau island & kayaking day trip',
'ha-long-bay-kayaking-day-trip',
'Tour trong ngày với kayak qua hang, tắm biển và khám phá đảo Tuần Châu.',
'["Kayak qua hang", "Tắm biển", "Đảo Tuần Châu", "Bua trua hải sản"]',
'["Xe Ha Noi", "Tàu", "Kayak", "Bua trua"]',
'["Chi phi ca nhan", "Tips", "VAT"]',
1, 0, 20, 1, 'EASY', 1850000, 1450000, 4.75, 195, TRUE, TRUE
FROM tour_categories tc JOIN cities c ON c.slug = 'ha-long'
WHERE tc.slug = 'nature-adventure'
  AND NOT EXISTS (SELECT 1 FROM tours t WHERE t.slug = 'ha-long-bay-kayaking-day-trip');

INSERT INTO tours (category_id, city_id, operator_id, title, slug, description, highlights, includes, excludes, duration_days, duration_nights, max_group_size, min_group_size, difficulty, price_per_adult, price_per_child, avg_rating, review_count, is_featured, is_active)
SELECT tc.id, c.id, NULL,
'Ha Long Bay 3 days 2 nights premium cruise experience',
'ha-long-bay-3d2n-premium-cruise',
'Trải nghiệm đẳng cấp 3 ngày 2 đêm trên vịnh Hạ Long với đầy đủ hoạt động và ẩm thực.',
'["Hang Sung Sửa", "Kayak", "Tiệc hoàng hôn", "Tai chi", "Câu mực"]',
'["Cabin premium", "Tat ca bua an", "Kayak", "Guide"]',
'["Do uong", "Chi phi ca nhan", "Tips", "VAT"]',
3, 2, 20, 1, 'EASY', 4200000, 3200000, 4.95, 88, TRUE, TRUE
FROM tour_categories tc JOIN cities c ON c.slug = 'ha-long'
WHERE tc.slug = 'nature-adventure'
  AND NOT EXISTS (SELECT 1 FROM tours t WHERE t.slug = 'ha-long-bay-3d2n-premium-cruise');

INSERT INTO tours (category_id, city_id, operator_id, title, slug, description, highlights, includes, excludes, duration_days, duration_nights, max_group_size, min_group_size, difficulty, price_per_adult, price_per_child, avg_rating, review_count, is_featured, is_active)
SELECT tc.id, c.id, NULL,
'Ha Long - Yen Tu mountain Buddhist pilgrimage',
'ha-long-yen-tu-pilgrimage',
'Hành hương núi Yên Tử - chiều cao linh thiêng và chùa vàng trên đỉnh núi.',
'["Núi Yên Tử", "Chùa vàng", "Cáp treo lên đỉnh", "Thiền định"]',
'["Xe Ha Long", "Cáp treo", "Guide", "Bua trua chay"]',
'["Chi phi ca nhan", "Tips", "VAT"]',
1, 0, 15, 1, 'MEDIUM', 1650000, 1250000, 4.65, 55, FALSE, TRUE
FROM tour_categories tc JOIN cities c ON c.slug = 'ha-long'
WHERE tc.slug = 'culture-heritage'
  AND NOT EXISTS (SELECT 1 FROM tours t WHERE t.slug = 'ha-long-yen-tu-pilgrimage');

-- ============================================================
-- CAN THO TOURS (4 tours)
-- ============================================================

INSERT INTO tours (category_id, city_id, operator_id, title, slug, description, highlights, includes, excludes, duration_days, duration_nights, max_group_size, min_group_size, difficulty, price_per_adult, price_per_child, avg_rating, review_count, is_featured, is_active)
SELECT tc.id, c.id, NULL,
'Can Tho - Cai Rang floating market & Mekong exploration',
'can-tho-cai-rang-floating-market',
'Khám phá chợ nổi Cai Rang từ sáng sớm và trải nghiệm cuộc sống sông nước miền Tây.',
'["Chợ nổi Cai Rang", "Thuyền thúng", "Vườn trái cây", "Làng nghề"]',
'["Thuyền", "Guide", "Bua sang", "Trái cây"]',
'["Chi phi ca nhan", "Mua đặc sản", "VAT"]',
1, 0, 15, 1, 'EASY', 850000, 650000, 4.70, 145, TRUE, TRUE
FROM tour_categories tc JOIN cities c ON c.slug = 'can-tho'
WHERE tc.slug = 'nature-adventure'
  AND NOT EXISTS (SELECT 1 FROM tours t WHERE t.slug = 'can-tho-cai-rang-floating-market');

INSERT INTO tours (category_id, city_id, operator_id, title, slug, description, highlights, includes, excludes, duration_days, duration_nights, max_group_size, min_group_size, difficulty, price_per_adult, price_per_child, avg_rating, review_count, is_featured, is_active)
SELECT tc.id, c.id, NULL,
'Can Tho - Eco garden & fruit farm experience',
'can-tho-eco-garden-fruit-farm',
'Thăm vườn sinh thái và trang trại trái cây miền Tây. Hái trái cây và thưởng thức tại chỗ.',
'["Vườn sinh thái", "Hái trái cây", "Thuyền chèo", "Bua trua"]',
'["Xe", "Thuyền", "Guide", "Bua trua"]',
'["Mua trái cây", "Chi phi ca nhan", "VAT"]',
1, 0, 12, 1, 'EASY', 750000, 550000, 4.60, 88, FALSE, TRUE
FROM tour_categories tc JOIN cities c ON c.slug = 'can-tho'
WHERE tc.slug = 'eco-tour'
  AND NOT EXISTS (SELECT 1 FROM tours t WHERE t.slug = 'can-tho-eco-garden-fruit-farm');

INSERT INTO tours (category_id, city_id, operator_id, title, slug, description, highlights, includes, excludes, duration_days, duration_nights, max_group_size, min_group_size, difficulty, price_per_adult, price_per_child, avg_rating, review_count, is_featured, is_active)
SELECT tc.id, c.id, NULL,
'Can Tho - Cai Rang & Phong Dien floating market 2 days',
'can-tho-2d1n-floating-market',
'2 ngày khám phá nhiều chợ nổi: Cai Rang, Phong Điền và cuộc sống sông nước đích thực.',
'["Chợ nổi Cai Rang", "Chợ nổi Phong Điền", "Làng nghề", "Homestay"]',
'["Xe", "Thuyền", "Bua an", "Homestay"]',
'["Chi phi ca nhan", "Mua đặc sản", "VAT"]',
2, 1, 12, 1, 'EASY', 1450000, 1100000, 4.80, 68, FALSE, TRUE
FROM tour_categories tc JOIN cities c ON c.slug = 'can-tho'
WHERE tc.slug = 'nature-adventure'
  AND NOT EXISTS (SELECT 1 FROM tours t WHERE t.slug = 'can-tho-2d1n-floating-market');

INSERT INTO tours (category_id, city_id, operator_id, title, slug, description, highlights, includes, excludes, duration_days, duration_nights, max_group_size, min_group_size, difficulty, price_per_adult, price_per_child, avg_rating, review_count, is_featured, is_active)
SELECT tc.id, c.id, NULL,
'Can Tho - Tra Cuong rice paper village & cooking',
'can-tho-tra-cuong-cooking',
'Học làm bánh tráng và nấu các món miền Tây tại làng nghề Trà Cồ.',
'["Làng nghề bánh tráng", "Làm bánh tráng", "Nấu món miền Tây", "Ăn uống"]',
'["Nguyen lieu", "Guide", "Bua trua voi mon da nau", "Ve mang ve"]',
'["Mua bánh tráng", "Chi phi ca nhan", "VAT"]',
1, 0, 10, 1, 'EASY', 950000, 750000, 4.75, 52, FALSE, TRUE
FROM tour_categories tc JOIN cities c ON c.slug = 'can-tho'
WHERE tc.slug = 'food-culinary'
  AND NOT EXISTS (SELECT 1 FROM tours t WHERE t.slug = 'can-tho-tra-cuong-cooking');

-- ============================================================
-- SAPA TOURS (4 tours)
-- ============================================================

INSERT INTO tours (category_id, city_id, operator_id, title, slug, description, highlights, includes, excludes, duration_days, duration_nights, max_group_size, min_group_size, difficulty, price_per_adult, price_per_child, avg_rating, review_count, is_featured, is_active)
SELECT tc.id, c.id, NULL,
'Sapa trekking - Mu Cang Chai rice terraces 2 days',
'sapa-mu-cang-chai-rice-terraces',
'Trekking qua ruộng bậc thang Mù Cang Chải nổi tiếng và làng bản Hmong, Dao.',
'["Ruộng bậc thang Mù Cang Chải", "Làng bản Hmong", "Trekking", "Hoàng gia trà"]',
'["Xe limousine", "Khach san", "Bua sang", "Guide"]',
'["Bua trua", "Chi phi ca nhan", "VAT"]',
2, 1, 10, 1, 'HARD', 2200000, 1700000, 4.85, 158, TRUE, TRUE
FROM tour_categories tc JOIN cities c ON c.slug = 'sapa'
WHERE tc.slug = 'nature-adventure'
  AND NOT EXISTS (SELECT 1 FROM tours t WHERE t.slug = 'sapa-mu-cang-chai-rice-terraces');

INSERT INTO tours (category_id, city_id, operator_id, title, slug, description, highlights, includes, excludes, duration_days, duration_nights, max_group_size, min_group_size, difficulty, price_per_adult, price_per_child, avg_rating, review_count, is_featured, is_active)
SELECT tc.id, c.id, NULL,
'Sapa - Fansipan summit cable car adventure',
'sapa-fansipan-cable-car',
'Lên đỉnh Fansipan - nóc nhà Đông Dương bằng cáp treo hiện đại và leo bậc thang cuối cùng.',
'["Cáp treo Fansipan", "Đỉnh Fansipan 3143m", "Chùa vàng", "Viewpoint"]',
'["Cáp treo", "Guide", "Ve tham quan", "Bua trua"]',
'["Chi phi ca nhan", "Tips", "VAT"]',
1, 0, 15, 1, 'MEDIUM', 1850000, 1450000, 4.80, 210, TRUE, TRUE
FROM tour_categories tc JOIN cities c ON c.slug = 'sapa'
WHERE tc.slug = 'nature-adventure'
  AND NOT EXISTS (SELECT 1 FROM tours t WHERE t.slug = 'sapa-fansipan-cable-car');

INSERT INTO tours (category_id, city_id, operator_id, title, slug, description, highlights, includes, excludes, duration_days, duration_nights, max_group_size, min_group_size, difficulty, price_per_adult, price_per_child, avg_rating, review_count, is_featured, is_active)
SELECT tc.id, c.id, NULL,
'Sapa - Cat Cat & Ta Phin village homestay experience',
'sapa-cat-cat-ta-phin-homestay',
'Ở homestay tại bản Cát Cát và Tả Phìn, học dệt vải và thưởng thức ẩm thực núi rừng.',
'["Bản Cát Cát", "Bản Tả Phìn", "Homestay", "Học dệt vải"]',
'["Xe", "Homestay", "Bua an", "Guide"]',
'["Mua đặc sản", "Chi phi ca nhan", "VAT"]',
2, 1, 10, 1, 'EASY', 1650000, 1250000, 4.75, 95, FALSE, TRUE
FROM tour_categories tc JOIN cities c ON c.slug = 'sapa'
WHERE tc.slug = 'family'
  AND NOT EXISTS (SELECT 1 FROM tours t WHERE t.slug = 'sapa-cat-cat-ta-phin-homestay');

INSERT INTO tours (category_id, city_id, operator_id, title, slug, description, highlights, includes, excludes, duration_days, duration_nights, max_group_size, min_group_size, difficulty, price_per_adult, price_per_child, avg_rating, review_count, is_featured, is_active)
SELECT tc.id, c.id, NULL,
'Sapa - Tea hill & ethnic minority market tour',
'sapa-tea-hill-ethnic-market',
'Thăm đồi chè Sapa và chợ phiên của đồng bào dân tộc Hmong, Dao mỗi cuối tuần.',
'["Đồi chè Sapa", "Chợ phiên", "Thác Bạc", "Thung lũng Mường Hoa"]',
'["Xe", "Guide", "Bua trua", "Ve tham quan"]',
'["Mua đặc sản", "Chi phi ca nhan", "VAT"]',
1, 0, 12, 1, 'EASY', 950000, 750000, 4.70, 72, FALSE, TRUE
FROM tour_categories tc JOIN cities c ON c.slug = 'sapa'
WHERE tc.slug = 'culture-heritage'
  AND NOT EXISTS (SELECT 1 FROM tours t WHERE t.slug = 'sapa-tea-hill-ethnic-market');

-- ============================================================
-- TOUR IMAGES: Cover images for ALL tours
-- ============================================================

-- Ha Noi
INSERT INTO tour_images (tour_id, url, alt_text, is_cover, sort_order)
SELECT t.id, 'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=1600&q=80', 'Old Quarter Hanoi', TRUE, 1
FROM tours t WHERE t.slug = 'ha-noi-city-tour-old-quarter'
  AND NOT EXISTS (SELECT 1 FROM tour_images ti WHERE ti.tour_id = t.id AND ti.is_cover = TRUE);

INSERT INTO tour_images (tour_id, url, alt_text, is_cover, sort_order)
SELECT t.id, 'https://images.unsplash.com/photo-1509002236388-990aab93d798?w=1600&q=80', 'Trang An boats', TRUE, 1
FROM tours t WHERE t.slug = 'ha-noi-ninh-binh-trang-an'
  AND NOT EXISTS (SELECT 1 FROM tour_images ti WHERE ti.tour_id = t.id AND ti.is_cover = TRUE);

INSERT INTO tour_images (tour_id, url, alt_text, is_cover, sort_order)
SELECT t.id, 'https://images.unsplash.com/photo-1583394964284-8dd09d3f6e9e?w=1600&q=80', 'Hanoi pho', TRUE, 1
FROM tours t WHERE t.slug = 'ha-noi-street-food-tour'
  AND NOT EXISTS (SELECT 1 FROM tour_images ti WHERE ti.tour_id = t.id AND ti.is_cover = TRUE);

INSERT INTO tour_images (tour_id, url, alt_text, is_cover, sort_order)
SELECT t.id, 'https://images.unsplash.com/photo-1596659868923-d1e0e5d5a0a9?w=1600&q=80', 'Sapa terraces', TRUE, 1
FROM tours t WHERE t.slug = 'ha-noi-sapa-fansipan-adventure'
  AND NOT EXISTS (SELECT 1 FROM tour_images ti WHERE ti.tour_id = t.id AND ti.is_cover = TRUE);

INSERT INTO tour_images (tour_id, url, alt_text, is_cover, sort_order)
SELECT t.id, 'https://images.unsplash.com/photo-1555126634-323283e090fa?w=1600&q=80', 'Vietnamese cooking', TRUE, 1
FROM tours t WHERE t.slug = 'ha-noi-cooking-class'
  AND NOT EXISTS (SELECT 1 FROM tour_images ti WHERE ti.tour_id = t.id AND ti.is_cover = TRUE);

INSERT INTO tour_images (tour_id, url, alt_text, is_cover, sort_order)
SELECT t.id, 'https://images.unsplash.com/photo-1559893083-5e1b3e7e17c9?w=1600&q=80', 'Water puppet Hanoi', TRUE, 1
FROM tours t WHERE t.slug = 'ha-noi-water-puppet-thang-long'
  AND NOT EXISTS (SELECT 1 FROM tour_images ti WHERE ti.tour_id = t.id AND ti.is_cover = TRUE);

-- Da Nang
INSERT INTO tour_images (tour_id, url, alt_text, is_cover, sort_order)
SELECT t.id, 'https://images.unsplash.com/photo-1528127269322-539801943592?w=1600&q=80', 'Ba Na Hills Golden Bridge', TRUE, 1
FROM tours t WHERE t.slug = 'da-nang-ba-na-hills-day-trip'
  AND NOT EXISTS (SELECT 1 FROM tour_images ti WHERE ti.tour_id = t.id AND ti.is_cover = TRUE);

INSERT INTO tour_images (tour_id, url, alt_text, is_cover, sort_order)
SELECT t.id, 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=1600&q=80', 'Hoi An night', TRUE, 1
FROM tours t WHERE t.slug = 'da-nang-son-tra-marble-mountain-hoi-an'
  AND NOT EXISTS (SELECT 1 FROM tour_images ti WHERE ti.tour_id = t.id AND ti.is_cover = TRUE);

INSERT INTO tour_images (tour_id, url, alt_text, is_cover, sort_order)
SELECT t.id, 'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?w=1600&q=80', 'Cu Lao Cham sea', TRUE, 1
FROM tours t WHERE t.slug = 'da-nang-cu-lao-cham-snorkeling'
  AND NOT EXISTS (SELECT 1 FROM tour_images ti WHERE ti.tour_id = t.id AND ti.is_cover = TRUE);

INSERT INTO tour_images (tour_id, url, alt_text, is_cover, sort_order)
SELECT t.id, 'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=1600&q=80', 'Da Nang food', TRUE, 1
FROM tours t WHERE t.slug = 'da-nang-food-tour-by-night'
  AND NOT EXISTS (SELECT 1 FROM tour_images ti WHERE ti.tour_id = t.id AND ti.is_cover = TRUE);

INSERT INTO tour_images (tour_id, url, alt_text, is_cover, sort_order)
SELECT t.id, 'https://images.unsplash.com/photo-1506665531195-3566af2b4dfa?w=1600&q=80', 'Hai Van Pass', TRUE, 1
FROM tours t WHERE t.slug = 'da-nang-hai-van-pass-lang-co'
  AND NOT EXISTS (SELECT 1 FROM tour_images ti WHERE ti.tour_id = t.id AND ti.is_cover = TRUE);

INSERT INTO tour_images (tour_id, url, alt_text, is_cover, sort_order)
SELECT t.id, 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&q=80', 'Da Nang beach', TRUE, 1
FROM tours t WHERE t.slug = 'da-nang-family-water-park-beach'
  AND NOT EXISTS (SELECT 1 FROM tour_images ti WHERE ti.tour_id = t.id AND ti.is_cover = TRUE);

-- Nha Trang
INSERT INTO tour_images (tour_id, url, alt_text, is_cover, sort_order)
SELECT t.id, 'https://images.unsplash.com/photo-1559599238-308793637427?w=1600&q=80', 'Nha Trang islands', TRUE, 1
FROM tours t WHERE t.slug = 'nha-trang-con-se-tre-island-hopping'
  AND NOT EXISTS (SELECT 1 FROM tour_images ti WHERE ti.tour_id = t.id AND ti.is_cover = TRUE);

INSERT INTO tour_images (tour_id, url, alt_text, is_cover, sort_order)
SELECT t.id, 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1600&q=80', 'Nha Trang diving', TRUE, 1
FROM tours t WHERE t.slug = 'nha-trang-snorkeling-diving'
  AND NOT EXISTS (SELECT 1 FROM tour_images ti WHERE ti.tour_id = t.id AND ti.is_cover = TRUE);

INSERT INTO tour_images (tour_id, url, alt_text, is_cover, sort_order)
SELECT t.id, 'https://images.unsplash.com/photo-1512100356356-de1b84283e18?w=1600&q=80', 'Ba Ho waterfall', TRUE, 1
FROM tours t WHERE t.slug = 'nha-trang-ba-ho-waterfall-hiking'
  AND NOT EXISTS (SELECT 1 FROM tour_images ti WHERE ti.tour_id = t.id AND ti.is_cover = TRUE);

INSERT INTO tour_images (tour_id, url, alt_text, is_cover, sort_order)
SELECT t.id, 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=1600&q=80', 'Mud bath relaxation', TRUE, 1
FROM tours t WHERE t.slug = 'nha-trang-mud-bath-relaxation'
  AND NOT EXISTS (SELECT 1 FROM tour_images ti WHERE ti.tour_id = t.id AND ti.is_cover = TRUE);

INSERT INTO tour_images (tour_id, url, alt_text, is_cover, sort_order)
SELECT t.id, 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1600&q=80', 'Nha Trang seafood', TRUE, 1
FROM tours t WHERE t.slug = 'nha-trang-fish-market-cooking'
  AND NOT EXISTS (SELECT 1 FROM tour_images ti WHERE ti.tour_id = t.id AND ti.is_cover = TRUE);

-- Phu Quoc
INSERT INTO tour_images (tour_id, url, alt_text, is_cover, sort_order)
SELECT t.id, 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&q=80', 'Phu Quoc islands', TRUE, 1
FROM tours t WHERE t.slug = 'phu-quoc-3-islands-snorkeling'
  AND NOT EXISTS (SELECT 1 FROM tour_images ti WHERE ti.tour_id = t.id AND ti.is_cover = TRUE);

INSERT INTO tour_images (tour_id, url, alt_text, is_cover, sort_order)
SELECT t.id, 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=1600&q=80', 'Phu Quoc exploration', TRUE, 1
FROM tours t WHERE t.slug = 'phu-quoc-island-exploration'
  AND NOT EXISTS (SELECT 1 FROM tour_images ti WHERE ti.tour_id = t.id AND ti.is_cover = TRUE);

INSERT INTO tour_images (tour_id, url, alt_text, is_cover, sort_order)
SELECT t.id, 'https://images.unsplash.com/photo-1559525839-8d53f07e5e67?w=1600&q=80', 'Phu Quoc night market', TRUE, 1
FROM tours t WHERE t.slug = 'phu-quoc-night-market-food-tour'
  AND NOT EXISTS (SELECT 1 FROM tour_images ti WHERE ti.tour_id = t.id AND ti.is_cover = TRUE);

INSERT INTO tour_images (tour_id, url, alt_text, is_cover, sort_order)
SELECT t.id, 'https://images.unsplash.com/photo-1507499739999-097706ad8914?w=1600&q=80', 'Phu Quoc sunset cruise', TRUE, 1
FROM tours t WHERE t.slug = 'phu-quoc-sunset-romantic-cruise'
  AND NOT EXISTS (SELECT 1 FROM tour_images ti WHERE ti.tour_id = t.id AND ti.is_cover = TRUE);

-- Ho Chi Minh
INSERT INTO tour_images (tour_id, url, alt_text, is_cover, sort_order)
SELECT t.id, 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=1600&q=80', 'Cu Chi tunnels', TRUE, 1
FROM tours t WHERE t.slug = 'hcm-cu-chi-tunnels-half-day'
  AND NOT EXISTS (SELECT 1 FROM tour_images ti WHERE ti.tour_id = t.id AND ti.is_cover = TRUE);

INSERT INTO tour_images (tour_id, url, alt_text, is_cover, sort_order)
SELECT t.id, 'https://images.unsplash.com/photo-1528164344705-47542687000d?w=1600&q=80', 'Mekong Delta', TRUE, 1
FROM tours t WHERE t.slug = 'mekong-delta-2-days-1-night'
  AND NOT EXISTS (SELECT 1 FROM tour_images ti WHERE ti.tour_id = t.id AND ti.is_cover = TRUE);

INSERT INTO tour_images (tour_id, url, alt_text, is_cover, sort_order)
SELECT t.id, 'https://images.unsplash.com/photo-1555126634-323283e090fa?w=1600&q=80', 'Saigon street food', TRUE, 1
FROM tours t WHERE t.slug = 'hcm-street-food-tour-by-night'
  AND NOT EXISTS (SELECT 1 FROM tour_images ti WHERE ti.tour_id = t.id AND ti.is_cover = TRUE);

INSERT INTO tour_images (tour_id, url, alt_text, is_cover, sort_order)
SELECT t.id, 'https://images.unsplash.com/photo-1555652736-e92021d28a56?w=1600&q=80', 'Notre Dame Saigon', TRUE, 1
FROM tours t WHERE t.slug = 'hcm-city-tour-notre-dame-war-remnants'
  AND NOT EXISTS (SELECT 1 FROM tour_images ti WHERE ti.tour_id = t.id AND ti.is_cover = TRUE);

INSERT INTO tour_images (tour_id, url, alt_text, is_cover, sort_order)
SELECT t.id, 'https://images.unsplash.com/photo-1590106916587-e0bf6c1e7c33?w=1600&q=80', 'Mekong canals', TRUE, 1
FROM tours t WHERE t.slug = 'mekong-delta-day-trip-ben-tre'
  AND NOT EXISTS (SELECT 1 FROM tour_images ti WHERE ti.tour_id = t.id AND ti.is_cover = TRUE);

-- Da Lat
INSERT INTO tour_images (tour_id, url, alt_text, is_cover, sort_order)
SELECT t.id, 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1600&q=80', 'Da Lat landscape', TRUE, 1
FROM tours t WHERE t.slug = 'da-lat-city-tour-valley-pagoda'
  AND NOT EXISTS (SELECT 1 FROM tour_images ti WHERE ti.tour_id = t.id AND ti.is_cover = TRUE);

INSERT INTO tour_images (tour_id, url, alt_text, is_cover, sort_order)
SELECT t.id, 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1600&q=80', 'Da Lat coffee', TRUE, 1
FROM tours t WHERE t.slug = 'da-lat-coffee-tea-workshop'
  AND NOT EXISTS (SELECT 1 FROM tour_images ti WHERE ti.tour_id = t.id AND ti.is_cover = TRUE);

INSERT INTO tour_images (tour_id, url, alt_text, is_cover, sort_order)
SELECT t.id, 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&q=80', 'Lang Biang sunrise', TRUE, 1
FROM tours t WHERE t.slug = 'da-lat-lang-biang-sunrise-trek'
  AND NOT EXISTS (SELECT 1 FROM tour_images ti WHERE ti.tour_id = t.id AND ti.is_cover = TRUE);

INSERT INTO tour_images (tour_id, url, alt_text, is_cover, sort_order)
SELECT t.id, 'https://images.unsplash.com/photo-1528823872057-9c018a7a7553?w=1600&q=80', 'Da Lat flowers', TRUE, 1
FROM tours t WHERE t.slug = 'da-lat-flower-tea-plantation'
  AND NOT EXISTS (SELECT 1 FROM tour_images ti WHERE ti.tour_id = t.id AND ti.is_cover = TRUE);

-- Hoi An
INSERT INTO tour_images (tour_id, url, alt_text, is_cover, sort_order)
SELECT t.id, 'https://images.unsplash.com/photo-1528164344705-e71d3c0e7d33?w=1600&q=80', 'Hoi An lanterns', TRUE, 1
FROM tours t WHERE t.slug = 'hoi-an-ancient-town-walking-tour'
  AND NOT EXISTS (SELECT 1 FROM tour_images ti WHERE ti.tour_id = t.id AND ti.is_cover = TRUE);

INSERT INTO tour_images (tour_id, url, alt_text, is_cover, sort_order)
SELECT t.id, 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=1600&q=80', 'Hoi An cooking', TRUE, 1
FROM tours t WHERE t.slug = 'hoi-an-cooking-class'
  AND NOT EXISTS (SELECT 1 FROM tour_images ti WHERE ti.tour_id = t.id AND ti.is_cover = TRUE);

INSERT INTO tour_images (tour_id, url, alt_text, is_cover, sort_order)
SELECT t.id, 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=1600&q=80', 'My Son sanctuary', TRUE, 1
FROM tours t WHERE t.slug = 'hoi-an-my-son-sanctuary'
  AND NOT EXISTS (SELECT 1 FROM tour_images ti WHERE ti.tour_id = t.id AND ti.is_cover = TRUE);

INSERT INTO tour_images (tour_id, url, alt_text, is_cover, sort_order)
SELECT t.id, 'https://images.unsplash.com/photo-1563771148872-50643a8b63e6?w=1600&q=80', 'Hoi An lantern making', TRUE, 1
FROM tours t WHERE t.slug = 'hoi-an-fishing-lantern-making'
  AND NOT EXISTS (SELECT 1 FROM tour_images ti WHERE ti.tour_id = t.id AND ti.is_cover = TRUE);

-- Hue
INSERT INTO tour_images (tour_id, url, alt_text, is_cover, sort_order)
SELECT t.id, 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=1600&q=80', 'Hue Imperial City', TRUE, 1
FROM tours t WHERE t.slug = 'hue-imperial-citadel-full-day'
  AND NOT EXISTS (SELECT 1 FROM tour_images ti WHERE ti.tour_id = t.id AND ti.is_cover = TRUE);

INSERT INTO tour_images (tour_id, url, alt_text, is_cover, sort_order)
SELECT t.id, 'https://images.unsplash.com/photo-1584976781699-48db8c1c8744?w=1600&q=80', 'Vinh Moc tunnels', TRUE, 1
FROM tours t WHERE t.slug = 'hue-dmz-day-trip'
  AND NOT EXISTS (SELECT 1 FROM tour_images ti WHERE ti.tour_id = t.id AND ti.is_cover = TRUE);

INSERT INTO tour_images (tour_id, url, alt_text, is_cover, sort_order)
SELECT t.id, 'https://images.unsplash.com/photo-1553522991-71439aa5765e?w=1600&q=80', 'Perfume River Hue', TRUE, 1
FROM tours t WHERE t.slug = 'hue-garden-house-perfume-river'
  AND NOT EXISTS (SELECT 1 FROM tour_images ti WHERE ti.tour_id = t.id AND ti.is_cover = TRUE);

INSERT INTO tour_images (tour_id, url, alt_text, is_cover, sort_order)
SELECT t.id, 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1600&q=80', 'Hue royal cuisine', TRUE, 1
FROM tours t WHERE t.slug = 'hue-royal-cuisine-conical-hat'
  AND NOT EXISTS (SELECT 1 FROM tour_images ti WHERE ti.tour_id = t.id AND ti.is_cover = TRUE);

-- Vung Tau
INSERT INTO tour_images (tour_id, url, alt_text, is_cover, sort_order)
SELECT t.id, 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&q=80', 'Vung Tau beach', TRUE, 1
FROM tours t WHERE t.slug = 'vung-tau-beach-day-trip'
  AND NOT EXISTS (SELECT 1 FROM tour_images ti WHERE ti.tour_id = t.id AND ti.is_cover = TRUE);

INSERT INTO tour_images (tour_id, url, alt_text, is_cover, sort_order)
SELECT t.id, 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1600&q=80', 'Con Dao islands', TRUE, 1
FROM tours t WHERE t.slug = 'vung-tau-con-dao-speedboat'
  AND NOT EXISTS (SELECT 1 FROM tour_images ti WHERE ti.tour_id = t.id AND ti.is_cover = TRUE);

INSERT INTO tour_images (tour_id, url, alt_text, is_cover, sort_order)
SELECT t.id, 'https://images.unsplash.com/photo-1562625782-6c4a4f0a0b45?w=1600&q=80', 'Vung Tau lighthouse', TRUE, 1
FROM tours t WHERE t.slug = 'vung-tau-seafood-lighthouse-tour'
  AND NOT EXISTS (SELECT 1 FROM tour_images ti WHERE ti.tour_id = t.id AND ti.is_cover = TRUE);

INSERT INTO tour_images (tour_id, url, alt_text, is_cover, sort_order)
SELECT t.id, 'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?w=1600&q=80', 'Vung Tau sunset', TRUE, 1
FROM tours t WHERE t.slug = 'vung-tau-sunset-relaxation'
  AND NOT EXISTS (SELECT 1 FROM tour_images ti WHERE ti.tour_id = t.id AND ti.is_cover = TRUE);

-- Ha Long
INSERT INTO tour_images (tour_id, url, alt_text, is_cover, sort_order)
SELECT t.id, 'https://images.unsplash.com/photo-1502175353174-a7a70e73b362?w=1600&q=80', 'Ha Long Bay', TRUE, 1
FROM tours t WHERE t.slug = 'ha-long-bay-2d1n-cruise'
  AND NOT EXISTS (SELECT 1 FROM tour_images ti WHERE ti.tour_id = t.id AND ti.is_cover = TRUE);

INSERT INTO tour_images (tour_id, url, alt_text, is_cover, sort_order)
SELECT t.id, 'https://images.unsplash.com/photo-1520699049698-acd2fccb8cc8?w=1600&q=80', 'Ha Long kayaking', TRUE, 1
FROM tours t WHERE t.slug = 'ha-long-bay-kayaking-day-trip'
  AND NOT EXISTS (SELECT 1 FROM tour_images ti WHERE ti.tour_id = t.id AND ti.is_cover = TRUE);

INSERT INTO tour_images (tour_id, url, alt_text, is_cover, sort_order)
SELECT t.id, 'https://images.unsplash.com/photo-1573354441014-9a0886c1bf3f?w=1600&q=80', 'Ha Long premium cruise', TRUE, 1
FROM tours t WHERE t.slug = 'ha-long-bay-3d2n-premium-cruise'
  AND NOT EXISTS (SELECT 1 FROM tour_images ti WHERE ti.tour_id = t.id AND ti.is_cover = TRUE);

INSERT INTO tour_images (tour_id, url, alt_text, is_cover, sort_order)
SELECT t.id, 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&q=80', 'Yen Tu mountain', TRUE, 1
FROM tours t WHERE t.slug = 'ha-long-yen-tu-pilgrimage'
  AND NOT EXISTS (SELECT 1 FROM tour_images ti WHERE ti.tour_id = t.id AND ti.is_cover = TRUE);

-- Can Tho
INSERT INTO tour_images (tour_id, url, alt_text, is_cover, sort_order)
SELECT t.id, 'https://images.unsplash.com/photo-1590106916587-e0bf6c1e7c33?w=1600&q=80', 'Cai Rang floating market', TRUE, 1
FROM tours t WHERE t.slug = 'can-tho-cai-rang-floating-market'
  AND NOT EXISTS (SELECT 1 FROM tour_images ti WHERE ti.tour_id = t.id AND ti.is_cover = TRUE);

INSERT INTO tour_images (tour_id, url, alt_text, is_cover, sort_order)
SELECT t.id, 'https://images.unsplash.com/photo-1555597673-b21d5c935865?w=1600&q=80', 'Mekong fruit farm', TRUE, 1
FROM tours t WHERE t.slug = 'can-tho-eco-garden-fruit-farm'
  AND NOT EXISTS (SELECT 1 FROM tour_images ti WHERE ti.tour_id = t.id AND ti.is_cover = TRUE);

INSERT INTO tour_images (tour_id, url, alt_text, is_cover, sort_order)
SELECT t.id, 'https://images.unsplash.com/photo-1528164344705-47542687000d?w=1600&q=80', 'Can Tho floating market', TRUE, 1
FROM tours t WHERE t.slug = 'can-tho-2d1n-floating-market'
  AND NOT EXISTS (SELECT 1 FROM tour_images ti WHERE ti.tour_id = t.id AND ti.is_cover = TRUE);

INSERT INTO tour_images (tour_id, url, alt_text, is_cover, sort_order)
SELECT t.id, 'https://images.unsplash.com/photo-1563771148872-50643a8b63e6?w=1600&q=80', 'Rice paper making', TRUE, 1
FROM tours t WHERE t.slug = 'can-tho-tra-cuong-cooking'
  AND NOT EXISTS (SELECT 1 FROM tour_images ti WHERE ti.tour_id = t.id AND ti.is_cover = TRUE);

-- Sapa
INSERT INTO tour_images (tour_id, url, alt_text, is_cover, sort_order)
SELECT t.id, 'https://images.unsplash.com/photo-1596659868923-d1e0e5d5a0a9?w=1600&q=80', 'Mu Cang Chai terraces', TRUE, 1
FROM tours t WHERE t.slug = 'sapa-mu-cang-chai-rice-terraces'
  AND NOT EXISTS (SELECT 1 FROM tour_images ti WHERE ti.tour_id = t.id AND ti.is_cover = TRUE);

INSERT INTO tour_images (tour_id, url, alt_text, is_cover, sort_order)
SELECT t.id, 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&q=80', 'Fansipan summit', TRUE, 1
FROM tours t WHERE t.slug = 'sapa-fansipan-cable-car'
  AND NOT EXISTS (SELECT 1 FROM tour_images ti WHERE ti.tour_id = t.id AND ti.is_cover = TRUE);

INSERT INTO tour_images (tour_id, url, alt_text, is_cover, sort_order)
SELECT t.id, 'https://images.unsplash.com/photo-1551703599-1df74b0141d5?w=1600&q=80', 'Sapa village homestay', TRUE, 1
FROM tours t WHERE t.slug = 'sapa-cat-cat-ta-phin-homestay'
  AND NOT EXISTS (SELECT 1 FROM tour_images ti WHERE ti.tour_id = t.id AND ti.is_cover = TRUE);

INSERT INTO tour_images (tour_id, url, alt_text, is_cover, sort_order)
SELECT t.id, 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1600&q=80', 'Sapa tea hill', TRUE, 1
FROM tours t WHERE t.slug = 'sapa-tea-hill-ethnic-market'
  AND NOT EXISTS (SELECT 1 FROM tour_images ti WHERE ti.tour_id = t.id AND ti.is_cover = TRUE);

-- ============================================================
-- TOUR ITINERARY: Day-by-day itinerary for ALL tours
-- ============================================================

-- Ha Noi - Old Quarter
INSERT INTO tour_itinerary (tour_id, day_number, title, description)
SELECT t.id, 1, 'Hanoi Old Quarter walking', 'Sáng đi bộ qua các phố cổ Hà Nội, thăm chợ, thưởng thức phở và các đặc sản đường phố.'
FROM tours t WHERE t.slug = 'ha-noi-city-tour-old-quarter'
  AND NOT EXISTS (SELECT 1 FROM tour_itinerary i WHERE i.tour_id = t.id AND i.day_number = 1);

INSERT INTO tour_itinerary (tour_id, day_number, title, description)
SELECT t.id, 1, 'Ho Chi Minh Complex & One Pillar Pagoda', 'Thăm Khu di tích Chủ tịch Hồ Chí Minh, Bảo tàng và Đền Ngọc Sơn buổi chiều.'
FROM tours t WHERE t.slug = 'ha-noi-city-tour-old-quarter'
  AND NOT EXISTS (SELECT 1 FROM tour_itinerary i WHERE i.tour_id = t.id AND i.day_number = 1 AND i.title LIKE '%Ho Chi Minh%');

-- Ha Noi - Ninh Binh
INSERT INTO tour_itinerary (tour_id, day_number, title, description)
SELECT t.id, 1, 'Trang An boat ride', 'Thuyền nhỏ chèo qua hang động Trang An, ngắm cảnh núi non hùng vĩ.'
FROM tours t WHERE t.slug = 'ha-noi-ninh-binh-trang-an'
  AND NOT EXISTS (SELECT 1 FROM tour_itinerary i WHERE i.tour_id = t.id AND i.day_number = 1);

INSERT INTO tour_itinerary (tour_id, day_number, title, description)
SELECT t.id, 2, 'Hoa Lu ancient capital & Bai Dinh pagoda', 'Thăm Kinh đô cổ Hoa Lu và chùa Bái Đính - ngôi chùa có nhiều kỷ lục nhất Việt Nam.'
FROM tours t WHERE t.slug = 'ha-noi-ninh-binh-trang-an'
  AND NOT EXISTS (SELECT 1 FROM tour_itinerary i WHERE i.tour_id = t.id AND i.day_number = 2);

-- Ha Noi - Street Food
INSERT INTO tour_itinerary (tour_id, day_number, title, description)
SELECT t.id, 1, 'Pho and Old Quarter food stops', 'Bắt đầu bằng phở bò sáng sớm, đi bộ qua các con hẻm, thử bánh cuốn và cà phê trứng.'
FROM tours t WHERE t.slug = 'ha-noi-street-food-tour'
  AND NOT EXISTS (SELECT 1 FROM tour_itinerary i WHERE i.tour_id = t.id AND i.day_number = 1);

-- Ha Noi - Sapa
INSERT INTO tour_itinerary (tour_id, day_number, title, description)
SELECT t.id, 1, 'Limousine to Sapa & Village walk', 'Xe limousine từ Hà Nội đến Sapa, đi bộ thăm bản làng Hmong và Dao.'
FROM tours t WHERE t.slug = 'ha-noi-sapa-fansipan-adventure'
  AND NOT EXISTS (SELECT 1 FROM tour_itinerary i WHERE i.tour_id = t.id AND i.day_number = 1);

INSERT INTO tour_itinerary (tour_id, day_number, title, description)
SELECT t.id, 2, 'Fansipan summit trek', 'Trekking đỉnh Fansipan 3143m, ngắm view toàn cảnh dãy Hoàng Liên Sơn.'
FROM tours t WHERE t.slug = 'ha-noi-sapa-fansipan-adventure'
  AND NOT EXISTS (SELECT 1 FROM tour_itinerary i WHERE i.tour_id = t.id AND i.day_number = 2);

-- Ha Noi - Cooking
INSERT INTO tour_itinerary (tour_id, day_number, title, description)
SELECT t.id, 1, 'Market visit & cooking 5 dishes', 'Đi chợ Đồng Xuân, học nấu 5 món ăn Việt Nam truyền thống với đầu bếp bản địa.'
FROM tours t WHERE t.slug = 'ha-noi-cooking-class'
  AND NOT EXISTS (SELECT 1 FROM tour_itinerary i WHERE i.tour_id = t.id AND i.day_number = 1);

-- Ha Noi - Water puppet
INSERT INTO tour_itinerary (tour_id, day_number, title, description)
SELECT t.id, 1, 'Water puppet show & Thang Long citadel', 'Xem múa rối nước truyền thống và tham quan Hoàng thành Thăng Long.'
FROM tours t WHERE t.slug = 'ha-noi-water-puppet-thang-long'
  AND NOT EXISTS (SELECT 1 FROM tour_itinerary i WHERE i.tour_id = t.id AND i.day_number = 1);

-- Da Nang - Ba Na
INSERT INTO tour_itinerary (tour_id, day_number, title, description)
SELECT t.id, 1, 'Ba Na Hills & Golden Bridge', 'Đi cáp treo lên Ba Na, check-in Cầu Vàng, thăm Làng Pháp và vườn hoa Le Jardin d''Amour.'
FROM tours t WHERE t.slug = 'da-nang-ba-na-hills-day-trip'
  AND NOT EXISTS (SELECT 1 FROM tour_itinerary i WHERE i.tour_id = t.id AND i.day_number = 1);

-- Da Nang - Son Tra - Hoi An
INSERT INTO tour_itinerary (tour_id, day_number, title, description)
SELECT t.id, 1, 'Son Tra - Marble Mountain - Hoi An', 'Sáng thăm Sơn Trà và Ngũ Hành Sơn, chiều đến Hội An ngắm đèn lồng về đêm.'
FROM tours t WHERE t.slug = 'da-nang-son-tra-marble-mountain-hoi-an'
  AND NOT EXISTS (SELECT 1 FROM tour_itinerary i WHERE i.tour_id = t.id AND i.day_number = 1);

-- Da Nang - Cu Lao Cham
INSERT INTO tour_itinerary (tour_id, day_number, title, description)
SELECT t.id, 1, 'Speedboat & snorkeling session', 'Tàu cao tốc ra Cù Lao Chàm, lặn snorkel tại rạn san hô và bữa trưa hải sản.'
FROM tours t WHERE t.slug = 'da-nang-cu-lao-cham-snorkeling'
  AND NOT EXISTS (SELECT 1 FROM tour_itinerary i WHERE i.tour_id = t.id AND i.day_number = 1);

-- Da Nang - Food tour
INSERT INTO tour_itinerary (tour_id, day_number, title, description)
SELECT t.id, 1, 'Night food route in city center', 'Đi bộ qua các con hẻm, thưởng thức các món đặc trưng Đà Nẵng với guide địa phương.'
FROM tours t WHERE t.slug = 'da-nang-food-tour-by-night'
  AND NOT EXISTS (SELECT 1 FROM tour_itinerary i WHERE i.tour_id = t.id AND i.day_number = 1);

-- Da Nang - Hai Van
INSERT INTO tour_itinerary (tour_id, day_number, title, description)
SELECT t.id, 1, 'Hai Van Pass & Lang Co Lagoon', 'Vượt đèo Hải Vân, ngắm đầm Lập Đình và bãi biển Lăng Cô.'
FROM tours t WHERE t.slug = 'da-nang-hai-van-pass-lang-co'
  AND NOT EXISTS (SELECT 1 FROM tour_itinerary i WHERE i.tour_id = t.id AND i.day_number = 1);

-- Da Nang - Family
INSERT INTO tour_itinerary (tour_id, day_number, title, description)
SELECT t.id, 1, 'Asia Park & Beach fun', 'Sáng chơi Asia Park công viên nước, chiều tắm biển Mỹ Khê.'
FROM tours t WHERE t.slug = 'da-nang-family-water-park-beach'
  AND NOT EXISTS (SELECT 1 FROM tour_itinerary i WHERE i.tour_id = t.id AND i.day_number = 1);

-- Nha Trang - Island hopping
INSERT INTO tour_itinerary (tour_id, day_number, title, description)
SELECT t.id, 1, 'Island hopping by speedboat', 'Thăm 4 đảo: Hòn Mun snorkel, Hòn Một bơi, Hòn Tranh thư giãn.'
FROM tours t WHERE t.slug = 'nha-trang-con-se-tre-island-hopping'
  AND NOT EXISTS (SELECT 1 FROM tour_itinerary i WHERE i.tour_id = t.id AND i.day_number = 1);

-- Nha Trang - Snorkeling
INSERT INTO tour_itinerary (tour_id, day_number, title, description)
SELECT t.id, 1, 'Snorkeling and diving at Hon Mun', 'Hai điểm lặn snorkel với huấn luyện viên chuyên nghiệp. Chụp ảnh dưới nước.'
FROM tours t WHERE t.slug = 'nha-trang-snorkeling-diving'
  AND NOT EXISTS (SELECT 1 FROM tour_itinerary i WHERE i.tour_id = t.id AND i.day_number = 1);

-- Nha Trang - Waterfall
INSERT INTO tour_itinerary (tour_id, day_number, title, description)
SELECT t.id, 1, 'Ba Ho waterfall trekking', 'Trekking qua rừng nhiệt đới, bơi suối và ngắm thác Ba Ho 3 tầng.'
FROM tours t WHERE t.slug = 'nha-trang-ba-ho-waterfall-hiking'
  AND NOT EXISTS (SELECT 1 FROM tour_itinerary i WHERE i.tour_id = t.id AND i.day_number = 1);

-- Nha Trang - Mud bath
INSERT INTO tour_itinerary (tour_id, day_number, title, description)
SELECT t.id, 1, 'Mud bath & thermal spring', 'Tắm bùn khoáng, thư giãn suối nước nóng và massage spa.'
FROM tours t WHERE t.slug = 'nha-trang-mud-bath-relaxation'
  AND NOT EXISTS (SELECT 1 FROM tour_itinerary i WHERE i.tour_id = t.id AND i.day_number = 1);

-- Nha Trang - Cooking
INSERT INTO tour_itinerary (tour_id, day_number, title, description)
SELECT t.id, 1, 'Fish market & cooking class', 'Đi chợ hải sản từ sáng sớm, học nấu các món hải sản Nha Trang đặc trưng.'
FROM tours t WHERE t.slug = 'nha-trang-fish-market-cooking'
  AND NOT EXISTS (SELECT 1 FROM tour_itinerary i WHERE i.tour_id = t.id AND i.day_number = 1);

-- Phu Quoc - 3 islands
INSERT INTO tour_itinerary (tour_id, day_number, title, description)
SELECT t.id, 1, '3 islands by speedboat', 'Thăm Hòn Gầm Gửi lặn snorkel, Hòn Mây Rút bơi, Hòn Thơm câu cá hoàng hôn.'
FROM tours t WHERE t.slug = 'phu-quoc-3-islands-snorkeling'
  AND NOT EXISTS (SELECT 1 FROM tour_itinerary i WHERE i.tour_id = t.id AND i.day_number = 1);

-- Phu Quoc - Exploration
INSERT INTO tour_itinerary (tour_id, day_number, title, description)
SELECT t.id, 1, 'Phu Quoc by motorbike', 'Tour xe máy cả ngày: Safari, trường tiêu, xí nghiệp nước mắm và bãi Sao.'
FROM tours t WHERE t.slug = 'phu-quoc-island-exploration'
  AND NOT EXISTS (SELECT 1 FROM tour_itinerary i WHERE i.tour_id = t.id AND i.day_number = 1);

-- Phu Quoc - Night market
INSERT INTO tour_itinerary (tour_id, day_number, title, description)
SELECT t.id, 1, 'Night market food walk', 'Đi bộ khám phá chợ đêm Dinh Cậu với đủ loại hải sản tươi sống.'
FROM tours t WHERE t.slug = 'phu-quoc-night-market-food-tour'
  AND NOT EXISTS (SELECT 1 FROM tour_itinerary i WHERE i.tour_id = t.id AND i.day_number = 1);

-- Phu Quoc - Sunset cruise
INSERT INTO tour_itinerary (tour_id, day_number, title, description)
SELECT t.id, 1, 'Sunset cruise with champagne', 'Tàu ra biển ngắm hoàng hôn với champagne và hải sản nướng trên tàu.'
FROM tours t WHERE t.slug = 'phu-quoc-sunset-romantic-cruise'
  AND NOT EXISTS (SELECT 1 FROM tour_itinerary i WHERE i.tour_id = t.id AND i.day_number = 1);

-- HCM - Cu Chi
INSERT INTO tour_itinerary (tour_id, day_number, title, description)
SELECT t.id, 1, 'Cu Chi tunnels exploration', 'Thăm đường hầm Cu Chi, học về chiến tranh và bò qua các đoạn đường hầm.'
FROM tours t WHERE t.slug = 'hcm-cu-chi-tunnels-half-day'
  AND NOT EXISTS (SELECT 1 FROM tour_itinerary i WHERE i.tour_id = t.id AND i.day_number = 1);

-- HCM - Mekong 2 days
INSERT INTO tour_itinerary (tour_id, day_number, title, description)
SELECT t.id, 1, 'Ben Tre - Coconut candy workshop', 'Sáng thăm xưởng kẹo dừa, thuyền chèo kênh, thăm gia đình địa phương.'
FROM tours t WHERE t.slug = 'mekong-delta-2-days-1-night'
  AND NOT EXISTS (SELECT 1 FROM tour_itinerary i WHERE i.tour_id = t.id AND i.day_number = 1);

INSERT INTO tour_itinerary (tour_id, day_number, title, description)
SELECT t.id, 2, 'Can Tho floating market', 'Sáng thăm chợ nổi Cai Rang, thưởng thức trái cây nhiệt đới, về HCM buổi chiều.'
FROM tours t WHERE t.slug = 'mekong-delta-2-days-1-night'
  AND NOT EXISTS (SELECT 1 FROM tour_itinerary i WHERE i.tour_id = t.id AND i.day_number = 2);

-- HCM - Street food
INSERT INTO tour_itinerary (tour_id, day_number, title, description)
SELECT t.id, 1, 'Saigon evening food walk', 'Đi bộ tối qua Quận 1, thử bánh mì, cơm tấm, bún thịt nướng và sinh tố.'
FROM tours t WHERE t.slug = 'hcm-street-food-tour-by-night'
  AND NOT EXISTS (SELECT 1 FROM tour_itinerary i WHERE i.tour_id = t.id AND i.day_number = 1);

-- HCM - City tour
INSERT INTO tour_itinerary (tour_id, day_number, title, description)
SELECT t.id, 1, 'HCMC highlights tour', 'Thăm Nhà thờ Đức Bà, Bưu điện Sài Gòn, Bảo tàng Chứng tích chiến tranh.'
FROM tours t WHERE t.slug = 'hcm-city-tour-notre-dame-war-remnants'
  AND NOT EXISTS (SELECT 1 FROM tour_itinerary i WHERE i.tour_id = t.id AND i.day_number = 1);

-- HCM - Mekong day
INSERT INTO tour_itinerary (tour_id, day_number, title, description)
SELECT t.id, 1, 'Ben Tre coconut canals', 'Thuyền chèo qua kênh dừa Bến Tre, thăm làng nghề và thưởng thức trái cây miền Tây.'
FROM tours t WHERE t.slug = 'mekong-delta-day-trip-ben-tre'
  AND NOT EXISTS (SELECT 1 FROM tour_itinerary i WHERE i.tour_id = t.id AND i.day_number = 1);

-- Da Lat - City tour
INSERT INTO tour_itinerary (tour_id, day_number, title, description)
SELECT t.id, 1, 'Da Lat highlights tour', 'Thăm điểm view thung lũng, Crazy House, chùa Linh Phước và thác Datanla.'
FROM tours t WHERE t.slug = 'da-lat-city-tour-valley-pagoda'
  AND NOT EXISTS (SELECT 1 FROM tour_itinerary i WHERE i.tour_id = t.id AND i.day_number = 1);

-- Da Lat - Coffee
INSERT INTO tour_itinerary (tour_id, day_number, title, description)
SELECT t.id, 1, 'Coffee and tea workshop', 'Hái cà phê, xem rang cà phê, làm bánh mì Pháp và thưởng trà Đà Lạt.'
FROM tours t WHERE t.slug = 'da-lat-coffee-tea-workshop'
  AND NOT EXISTS (SELECT 1 FROM tour_itinerary i WHERE i.tour_id = t.id AND i.day_number = 1);

-- Da Lat - Lang Biang
INSERT INTO tour_itinerary (tour_id, day_number, title, description)
SELECT t.id, 1, 'Lang Biang sunrise trek', 'Khởi hành lúc 3h sáng, trek lên đỉnh Lang Biang ngắm bình minh toàn cảnh Đà Lạt.'
FROM tours t WHERE t.slug = 'da-lat-lang-biang-sunrise-trek'
  AND NOT EXISTS (SELECT 1 FROM tour_itinerary i WHERE i.tour_id = t.id AND i.day_number = 1);

-- Da Lat - Flowers
INSERT INTO tour_itinerary (tour_id, day_number, title, description)
SELECT t.id, 1, 'Flower garden & tea plantation', 'Thăm vườn hoa đầy màu sắc, trà Mộc Lan và hồ Tuyền Lâm.'
FROM tours t WHERE t.slug = 'da-lat-flower-tea-plantation'
  AND NOT EXISTS (SELECT 1 FROM tour_itinerary i WHERE i.tour_id = t.id AND i.day_number = 1);

-- Hoi An - Walking
INSERT INTO tour_itinerary (tour_id, day_number, title, description)
SELECT t.id, 1, 'Hoi An ancient town night walk', 'Đi bộ phố cổ Hội An về đêm với đèn lồng rực rỡ, thăm chùa Cầu và hội quán.'
FROM tours t WHERE t.slug = 'hoi-an-ancient-town-walking-tour'
  AND NOT EXISTS (SELECT 1 FROM tour_itinerary i WHERE i.tour_id = t.id AND i.day_number = 1);

-- Hoi An - Cooking
INSERT INTO tour_itinerary (tour_id, day_number, title, description)
SELECT t.id, 1, 'Market visit & cooking class', 'Đi chợ Hội An, học làm bánh xèo, nấu phở và 3 món đặc trưng khác.'
FROM tours t WHERE t.slug = 'hoi-an-cooking-class'
  AND NOT EXISTS (SELECT 1 FROM tour_itinerary i WHERE i.tour_id = t.id AND i.day_number = 1);

-- Hoi An - My Son
INSERT INTO tour_itinerary (tour_id, day_number, title, description)
SELECT t.id, 1, 'My Son sanctuary', 'Thăm quần thể đền tháp Chăm Pa My Son, xem trình diễn âm nhạc truyền thống.'
FROM tours t WHERE t.slug = 'hoi-an-my-son-sanctuary'
  AND NOT EXISTS (SELECT 1 FROM tour_itinerary i WHERE i.tour_id = t.id AND i.day_number = 1);

-- Hoi An - Fishing
INSERT INTO tour_itinerary (tour_id, day_number, title, description)
SELECT t.id, 1, 'Fishing & lantern making', 'Trải nghiệm đánh cá kiểu ngư dân, làm đèn lồng giấy truyền thống và thuyền thúng.'
FROM tours t WHERE t.slug = 'hoi-an-fishing-lantern-making'
  AND NOT EXISTS (SELECT 1 FROM tour_itinerary i WHERE i.tour_id = t.id AND i.day_number = 1);

-- Hue - Imperial
INSERT INTO tour_itinerary (tour_id, day_number, title, description)
SELECT t.id, 1, 'Imperial City and royal tombs', 'Sáng thăm Đại Nội Huế, trưa chùa Thiên Mụ, chiều lăng Tự Đức và Khải Định.'
FROM tours t WHERE t.slug = 'hue-imperial-citadel-full-day'
  AND NOT EXISTS (SELECT 1 FROM tour_itinerary i WHERE i.tour_id = t.id AND i.day_number = 1);

-- Hue - DMZ
INSERT INTO tour_itinerary (tour_id, day_number, title, description)
SELECT t.id, 1, 'DMZ historical route', 'Thăm đường hầm Vĩnh Mốc, căn cứ Khe Sanh, đèo Hải Vân và sông Bến Hải.'
FROM tours t WHERE t.slug = 'hue-dmz-day-trip'
  AND NOT EXISTS (SELECT 1 FROM tour_itinerary i WHERE i.tour_id = t.id AND i.day_number = 1);

-- Hue - Garden house
INSERT INTO tour_itinerary (tour_id, day_number, title, description)
SELECT t.id, 1, 'Garden houses & Perfume River', 'Thăm các biệt thự vườn Huế độc đáo, thuyền trên sông Hương và chợ Đông Ba.'
FROM tours t WHERE t.slug = 'hue-garden-house-perfume-river'
  AND NOT EXISTS (SELECT 1 FROM tour_itinerary i WHERE i.tour_id = t.id AND i.day_number = 1);

-- Hue - Cuisine
INSERT INTO tour_itinerary (tour_id, day_number, title, description)
SELECT t.id, 1, 'Royal cuisine & conical hat', 'Thưởng thức ẩm thực cung đình Huế, học làm nón lá truyền thống.'
FROM tours t WHERE t.slug = 'hue-royal-cuisine-conical-hat'
  AND NOT EXISTS (SELECT 1 FROM tour_itinerary i WHERE i.tour_id = t.id AND i.day_number = 1);

-- Vung Tau - Beach
INSERT INTO tour_itinerary (tour_id, day_number, title, description)
SELECT t.id, 1, 'Vung Tau beach & sightseeing', 'Thăm bãi Sau, tháp sắt, núi Nhỏ và tượng Chúa giáng tay.'
FROM tours t WHERE t.slug = 'vung-tau-beach-day-trip'
  AND NOT EXISTS (SELECT 1 FROM tour_itinerary i WHERE i.tour_id = t.id AND i.day_number = 1);

-- Vung Tau - Con Dao
INSERT INTO tour_itinerary (tour_id, day_number, title, description)
SELECT t.id, 1, 'Con Dao speedboat & history', 'Tàu cao tốc ra Côn Đảo, thăm nhà tù và mộ liệt sĩ trên đảo.'
FROM tours t WHERE t.slug = 'vung-tau-con-dao-speedboat'
  AND NOT EXISTS (SELECT 1 FROM tour_itinerary i WHERE i.tour_id = t.id AND i.day_number = 1);

-- Vung Tau - Seafood
INSERT INTO tour_itinerary (tour_id, day_number, title, description)
SELECT t.id, 1, 'Seafood & lighthouse walk', 'Thưởng thức hải sản tươi sống và thăm ngọn hải đăng nổi tiếng Vũng Tàu.'
FROM tours t WHERE t.slug = 'vung-tau-seafood-lighthouse-tour'
  AND NOT EXISTS (SELECT 1 FROM tour_itinerary i WHERE i.tour_id = t.id AND i.day_number = 1);

-- Vung Tau - Sunset
INSERT INTO tour_itinerary (tour_id, day_number, title, description)
SELECT t.id, 1, 'Sunset & beach relaxation', 'Nghỉ dưỡng tại bãi biển, ngắm hoàng hôn và tận hưởng massage biển.'
FROM tours t WHERE t.slug = 'vung-tau-sunset-relaxation'
  AND NOT EXISTS (SELECT 1 FROM tour_itinerary i WHERE i.tour_id = t.id AND i.day_number = 1);

-- Ha Long - 2D1N
INSERT INTO tour_itinerary (tour_id, day_number, title, description)
SELECT t.id, 1, 'Ha Long Bay cruise boarding', 'Lên tàu, bữa trưa buffet, thăm hang Sung Sửa, kayak tại hang Luồn.'
FROM tours t WHERE t.slug = 'ha-long-bay-2d1n-cruise'
  AND NOT EXISTS (SELECT 1 FROM tour_itinerary i WHERE i.tour_id = t.id AND i.day_number = 1);

INSERT INTO tour_itinerary (tour_id, day_number, title, description)
SELECT t.id, 2, 'Tai Chi and kayaking', 'Tập thái cực sáng, kayak đảo Ti Top, ăn trưa, về Hà Nội.'
FROM tours t WHERE t.slug = 'ha-long-bay-2d1n-cruise'
  AND NOT EXISTS (SELECT 1 FROM tour_itinerary i WHERE i.tour_id = t.id AND i.day_number = 2);

-- Ha Long - Kayaking day
INSERT INTO tour_itinerary (tour_id, day_number, title, description)
SELECT t.id, 1, 'Ha Long kayaking & island visit', 'Kayak qua hang, tắm biển và thăm đảo Tuần Châu.'
FROM tours t WHERE t.slug = 'ha-long-bay-kayaking-day-trip'
  AND NOT EXISTS (SELECT 1 FROM tour_itinerary i WHERE i.tour_id = t.id AND i.day_number = 1);

-- Ha Long - 3D2N
INSERT INTO tour_itinerary (tour_id, day_number, title, description)
SELECT t.id, 1, 'Ha Long Bay - Day 1', 'Lên tàu, bữa trưa, thăm hang Sung Sửa, kayak, tiệc hoàng hôn, câu mực đêm.'
FROM tours t WHERE t.slug = 'ha-long-bay-3d2n-premium-cruise'
  AND NOT EXISTS (SELECT 1 FROM tour_itinerary i WHERE i.tour_id = t.id AND i.day_number = 1);

INSERT INTO tour_itinerary (tour_id, day_number, title, description)
SELECT t.id, 2, 'Ha Long Bay - Day 2', 'Tập thái cực, kayak, thăm làng chài, bơi biển, câu mực đêm.'
FROM tours t WHERE t.slug = 'ha-long-bay-3d2n-premium-cruise'
  AND NOT EXISTS (SELECT 1 FROM tour_itinerary i WHERE i.tour_id = t.id AND i.day_number = 2);

INSERT INTO tour_itinerary (tour_id, day_number, title, description)
SELECT t.id, 3, 'Ha Long Bay - Day 3', 'Tập thái cực buổi sáng, ăn trưa, về Hà Nội buổi chiều.'
FROM tours t WHERE t.slug = 'ha-long-bay-3d2n-premium-cruise'
  AND NOT EXISTS (SELECT 1 FROM tour_itinerary i WHERE i.tour_id = t.id AND i.day_number = 3);

-- Ha Long - Yen Tu
INSERT INTO tour_itinerary (tour_id, day_number, title, description)
SELECT t.id, 1, 'Yen Tu Buddhist pilgrimage', 'Cáp treo lên núi Yên Tử, thăm chùa vàng, ngắm view và thiền định.'
FROM tours t WHERE t.slug = 'ha-long-yen-tu-pilgrimage'
  AND NOT EXISTS (SELECT 1 FROM tour_itinerary i WHERE i.tour_id = t.id AND i.day_number = 1);

-- Can Tho - Cai Rang
INSERT INTO tour_itinerary (tour_id, day_number, title, description)
SELECT t.id, 1, 'Cai Rang floating market', 'Khởi hành sớm 5h, thuyền thúng qua chợ nổi Cai Rang, thưởng thức bữa sáng trên thuyền.'
FROM tours t WHERE t.slug = 'can-tho-cai-rang-floating-market'
  AND NOT EXISTS (SELECT 1 FROM tour_itinerary i WHERE i.tour_id = t.id AND i.day_number = 1);

-- Can Tho - Eco
INSERT INTO tour_itinerary (tour_id, day_number, title, description)
SELECT t.id, 1, 'Eco garden & fruit farm', 'Thăm vườn sinh thái, hái trái cây nhiệt đới và thuyền chèo qua kênh.'
FROM tours t WHERE t.slug = 'can-tho-eco-garden-fruit-farm'
  AND NOT EXISTS (SELECT 1 FROM tour_itinerary i WHERE i.tour_id = t.id AND i.day_number = 1);

-- Can Tho - 2D1N
INSERT INTO tour_itinerary (tour_id, day_number, title, description)
SELECT t.id, 1, 'Cai Rang & village crafts', 'Thăm chợ nổi Cai Rang, làng nghề truyền thống và homestay miền Tây.'
FROM tours t WHERE t.slug = 'can-tho-2d1n-floating-market'
  AND NOT EXISTS (SELECT 1 FROM tour_itinerary i WHERE i.tour_id = t.id AND i.day_number = 1);

INSERT INTO tour_itinerary (tour_id, day_number, title, description)
SELECT t.id, 2, 'Phong Dien floating market', 'Thăm chợ nổi Phong Điền, vườn trái cây và về Cần Thơ.'
FROM tours t WHERE t.slug = 'can-tho-2d1n-floating-market'
  AND NOT EXISTS (SELECT 1 FROM tour_itinerary i WHERE i.tour_id = t.id AND i.day_number = 2);

-- Can Tho - Cooking
INSERT INTO tour_itinerary (tour_id, day_number, title, description)
SELECT t.id, 1, 'Tra Cuong rice paper & cooking', 'Thăm làng nghề bánh tráng Trà Cồ, học làm bánh tráng và nấu món miền Tây.'
FROM tours t WHERE t.slug = 'can-tho-tra-cuong-cooking'
  AND NOT EXISTS (SELECT 1 FROM tour_itinerary i WHERE i.tour_id = t.id AND i.day_number = 1);

-- Sapa - Rice terraces
INSERT INTO tour_itinerary (tour_id, day_number, title, description)
SELECT t.id, 1, 'Limousine to Sapa & village trek', 'Xe limousine Hà Nội - Sapa, đi bộ thăm bản làng Hmong, ngắm ruộng bậc thang.'
FROM tours t WHERE t.slug = 'sapa-mu-cang-chai-rice-terraces'
  AND NOT EXISTS (SELECT 1 FROM tour_itinerary i WHERE i.tour_id = t.id AND i.day_number = 1);

INSERT INTO tour_itinerary (tour_id, day_number, title, description)
SELECT t.id, 2, 'Mu Cang Chai rice terraces trek', 'Trekking qua ruộng bậc thang Mù Cang Chải, thăm bản người Hmong và Dao, về Hà Nội.'
FROM tours t WHERE t.slug = 'sapa-mu-cang-chai-rice-terraces'
  AND NOT EXISTS (SELECT 1 FROM tour_itinerary i WHERE i.tour_id = t.id AND i.day_number = 2);

-- Sapa - Fansipan
INSERT INTO tour_itinerary (tour_id, day_number, title, description)
SELECT t.id, 1, 'Fansipan cable car summit', 'Cáp treo lên đỉnh Fansipan, leo bậc thang cuối cùng, chùa vàng và view đỉnh núi.'
FROM tours t WHERE t.slug = 'sapa-fansipan-cable-car'
  AND NOT EXISTS (SELECT 1 FROM tour_itinerary i WHERE i.tour_id = t.id AND i.day_number = 1);

-- Sapa - Homestay
INSERT INTO tour_itinerary (tour_id, day_number, title, description)
SELECT t.id, 1, 'Cat Cat & Ta Phin village', 'Thăm bản Cát Cát và Tả Phìn, học dệt vải, ở homestay và thưởng thức ẩm thực núi rừng.'
FROM tours t WHERE t.slug = 'sapa-cat-cat-ta-phin-homestay'
  AND NOT EXISTS (SELECT 1 FROM tour_itinerary i WHERE i.tour_id = t.id AND i.day_number = 1);

INSERT INTO tour_itinerary (tour_id, day_number, title, description)
SELECT t.id, 2, 'Ta Phin cave & hot spring', 'Thăm hang Tả Phìn, tắm suối nước nóng và về Sapa.'
FROM tours t WHERE t.slug = 'sapa-cat-cat-ta-phin-homestay'
  AND NOT EXISTS (SELECT 1 FROM tour_itinerary i WHERE i.tour_id = t.id AND i.day_number = 2);

-- Sapa - Tea hill
INSERT INTO tour_itinerary (tour_id, day_number, title, description)
SELECT t.id, 1, 'Tea hill & ethnic market', 'Thăm đồi chè Sapa, thác Bạc, thung lũng Mường Hoa và chợ phiên cuối tuần.'
FROM tours t WHERE t.slug = 'sapa-tea-hill-ethnic-market'
  AND NOT EXISTS (SELECT 1 FROM tour_itinerary i WHERE i.tour_id = t.id AND i.day_number = 1);

-- ============================================================
-- TOUR DEPARTURES: 2 upcoming departures per tour
-- ============================================================

-- Helper: inserts 2 departures for a tour by slug
-- We use DATE_ADD(CURDATE(), INTERVAL N DAY) for flexible future dates

-- HA NOI
INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 3 DAY), 15, NULL
FROM tours t WHERE t.slug = 'ha-noi-city-tour-old-quarter'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 3 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 8 DAY), 13, NULL
FROM tours t WHERE t.slug = 'ha-noi-city-tour-old-quarter'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 8 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 5 DAY), 12, NULL
FROM tours t WHERE t.slug = 'ha-noi-ninh-binh-trang-an'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 5 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 12 DAY), 10, 1100000
FROM tours t WHERE t.slug = 'ha-noi-ninh-binh-trang-an'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 12 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 1 DAY), 8, NULL
FROM tours t WHERE t.slug = 'ha-noi-street-food-tour'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 1 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 4 DAY), 7, NULL
FROM tours t WHERE t.slug = 'ha-noi-street-food-tour'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 4 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 7 DAY), 8, NULL
FROM tours t WHERE t.slug = 'ha-noi-sapa-fansipan-adventure'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 7 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 14 DAY), 6, 2400000
FROM tours t WHERE t.slug = 'ha-noi-sapa-fansipan-adventure'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 14 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 2 DAY), 6, NULL
FROM tours t WHERE t.slug = 'ha-noi-cooking-class'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 2 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 6 DAY), 5, 1200000
FROM tours t WHERE t.slug = 'ha-noi-cooking-class'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 6 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 3 DAY), 10, NULL
FROM tours t WHERE t.slug = 'ha-noi-water-puppet-thang-long'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 3 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 7 DAY), 8, NULL
FROM tours t WHERE t.slug = 'ha-noi-water-puppet-thang-long'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 7 DAY));

-- DA NANG
INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 3 DAY), 18, NULL
FROM tours t WHERE t.slug = 'da-nang-ba-na-hills-day-trip'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 3 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 7 DAY), 16, 1250000
FROM tours t WHERE t.slug = 'da-nang-ba-na-hills-day-trip'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 7 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 5 DAY), 14, NULL
FROM tours t WHERE t.slug = 'da-nang-son-tra-marble-mountain-hoi-an'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 5 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 9 DAY), 12, NULL
FROM tours t WHERE t.slug = 'da-nang-son-tra-marble-mountain-hoi-an'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 9 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 4 DAY), 10, NULL
FROM tours t WHERE t.slug = 'da-nang-cu-lao-cham-snorkeling'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 4 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 11 DAY), 8, 1090000
FROM tours t WHERE t.slug = 'da-nang-cu-lao-cham-snorkeling'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 11 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 2 DAY), 12, NULL
FROM tours t WHERE t.slug = 'da-nang-food-tour-by-night'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 2 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 6 DAY), 10, NULL
FROM tours t WHERE t.slug = 'da-nang-food-tour-by-night'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 6 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 5 DAY), 10, NULL
FROM tours t WHERE t.slug = 'da-nang-hai-van-pass-lang-co'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 5 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 12 DAY), 8, NULL
FROM tours t WHERE t.slug = 'da-nang-hai-van-pass-lang-co'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 12 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 3 DAY), 14, NULL
FROM tours t WHERE t.slug = 'da-nang-family-water-park-beach'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 3 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 8 DAY), 12, NULL
FROM tours t WHERE t.slug = 'da-nang-family-water-park-beach'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 8 DAY));

-- NHA TRANG
INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 2 DAY), 18, NULL
FROM tours t WHERE t.slug = 'nha-trang-con-se-tre-island-hopping'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 2 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 6 DAY), 15, NULL
FROM tours t WHERE t.slug = 'nha-trang-con-se-tre-island-hopping'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 6 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 4 DAY), 10, NULL
FROM tours t WHERE t.slug = 'nha-trang-snorkeling-diving'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 4 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 9 DAY), 8, 1300000
FROM tours t WHERE t.slug = 'nha-trang-snorkeling-diving'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 9 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 3 DAY), 8, NULL
FROM tours t WHERE t.slug = 'nha-trang-ba-ho-waterfall-hiking'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 3 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 8 DAY), 6, NULL
FROM tours t WHERE t.slug = 'nha-trang-ba-ho-waterfall-hiking'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 8 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 2 DAY), 10, NULL
FROM tours t WHERE t.slug = 'nha-trang-mud-bath-relaxation'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 2 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 5 DAY), 8, 1150000
FROM tours t WHERE t.slug = 'nha-trang-mud-bath-relaxation'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 5 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 3 DAY), 8, NULL
FROM tours t WHERE t.slug = 'nha-trang-fish-market-cooking'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 3 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 7 DAY), 6, NULL
FROM tours t WHERE t.slug = 'nha-trang-fish-market-cooking'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 7 DAY));

-- PHU QUOC
INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 3 DAY), 14, NULL
FROM tours t WHERE t.slug = 'phu-quoc-3-islands-snorkeling'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 3 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 7 DAY), 12, NULL
FROM tours t WHERE t.slug = 'phu-quoc-3-islands-snorkeling'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 7 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 5 DAY), 10, NULL
FROM tours t WHERE t.slug = 'phu-quoc-island-exploration'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 5 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 11 DAY), 8, 1300000
FROM tours t WHERE t.slug = 'phu-quoc-island-exploration'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 11 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 1 DAY), 10, NULL
FROM tours t WHERE t.slug = 'phu-quoc-night-market-food-tour'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 1 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 4 DAY), 8, NULL
FROM tours t WHERE t.slug = 'phu-quoc-night-market-food-tour'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 4 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 2 DAY), 6, NULL
FROM tours t WHERE t.slug = 'phu-quoc-sunset-romantic-cruise'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 2 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 6 DAY), 5, 1800000
FROM tours t WHERE t.slug = 'phu-quoc-sunset-romantic-cruise'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 6 DAY));

-- HO CHI MINH
INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 2 DAY), 15, NULL
FROM tours t WHERE t.slug = 'hcm-cu-chi-tunnels-half-day'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 2 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 5 DAY), 12, NULL
FROM tours t WHERE t.slug = 'hcm-cu-chi-tunnels-half-day'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 5 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 3 DAY), 10, NULL
FROM tours t WHERE t.slug = 'mekong-delta-2-days-1-night'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 3 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 8 DAY), 8, 1850000
FROM tours t WHERE t.slug = 'mekong-delta-2-days-1-night'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 8 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 1 DAY), 10, NULL
FROM tours t WHERE t.slug = 'hcm-street-food-tour-by-night'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 1 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 4 DAY), 8, NULL
FROM tours t WHERE t.slug = 'hcm-street-food-tour-by-night'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 4 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 3 DAY), 12, NULL
FROM tours t WHERE t.slug = 'hcm-city-tour-notre-dame-war-remnants'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 3 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 7 DAY), 10, NULL
FROM tours t WHERE t.slug = 'hcm-city-tour-notre-dame-war-remnants'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 7 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 2 DAY), 10, NULL
FROM tours t WHERE t.slug = 'mekong-delta-day-trip-ben-tre'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 2 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 6 DAY), 8, NULL
FROM tours t WHERE t.slug = 'mekong-delta-day-trip-ben-tre'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 6 DAY));

-- DA LAT
INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 2 DAY), 12, NULL
FROM tours t WHERE t.slug = 'da-lat-city-tour-valley-pagoda'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 2 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 6 DAY), 10, NULL
FROM tours t WHERE t.slug = 'da-lat-city-tour-valley-pagoda'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 6 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 3 DAY), 8, NULL
FROM tours t WHERE t.slug = 'da-lat-coffee-tea-workshop'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 3 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 7 DAY), 6, 920000
FROM tours t WHERE t.slug = 'da-lat-coffee-tea-workshop'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 7 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 4 DAY), 6, NULL
FROM tours t WHERE t.slug = 'da-lat-lang-biang-sunrise-trek'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 4 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 9 DAY), 5, NULL
FROM tours t WHERE t.slug = 'da-lat-lang-biang-sunrise-trek'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 9 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 3 DAY), 10, NULL
FROM tours t WHERE t.slug = 'da-lat-flower-tea-plantation'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 3 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 8 DAY), 8, NULL
FROM tours t WHERE t.slug = 'da-lat-flower-tea-plantation'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 8 DAY));

-- HOI AN
INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 1 DAY), 10, NULL
FROM tours t WHERE t.slug = 'hoi-an-ancient-town-walking-tour'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 1 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 4 DAY), 8, NULL
FROM tours t WHERE t.slug = 'hoi-an-ancient-town-walking-tour'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 4 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 2 DAY), 8, NULL
FROM tours t WHERE t.slug = 'hoi-an-cooking-class'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 2 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 6 DAY), 6, 1100000
FROM tours t WHERE t.slug = 'hoi-an-cooking-class'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 6 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 3 DAY), 12, NULL
FROM tours t WHERE t.slug = 'hoi-an-my-son-sanctuary'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 3 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 7 DAY), 10, NULL
FROM tours t WHERE t.slug = 'hoi-an-my-son-sanctuary'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 7 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 2 DAY), 8, NULL
FROM tours t WHERE t.slug = 'hoi-an-fishing-lantern-making'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 2 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 5 DAY), 6, NULL
FROM tours t WHERE t.slug = 'hoi-an-fishing-lantern-making'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 5 DAY));

-- HUE
INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 4 DAY), 12, NULL
FROM tours t WHERE t.slug = 'hue-imperial-citadel-full-day'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 4 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 9 DAY), 10, NULL
FROM tours t WHERE t.slug = 'hue-imperial-citadel-full-day'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 9 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 5 DAY), 10, NULL
FROM tours t WHERE t.slug = 'hue-dmz-day-trip'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 5 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 10 DAY), 8, 1200000
FROM tours t WHERE t.slug = 'hue-dmz-day-trip'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 10 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 3 DAY), 8, NULL
FROM tours t WHERE t.slug = 'hue-garden-house-perfume-river'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 3 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 7 DAY), 6, NULL
FROM tours t WHERE t.slug = 'hue-garden-house-perfume-river'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 7 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 4 DAY), 6, NULL
FROM tours t WHERE t.slug = 'hue-royal-cuisine-conical-hat'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 4 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 8 DAY), 5, NULL
FROM tours t WHERE t.slug = 'hue-royal-cuisine-conical-hat'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 8 DAY));

-- VUNG TAU
INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 2 DAY), 15, NULL
FROM tours t WHERE t.slug = 'vung-tau-beach-day-trip'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 2 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 5 DAY), 12, NULL
FROM tours t WHERE t.slug = 'vung-tau-beach-day-trip'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 5 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 7 DAY), 10, NULL
FROM tours t WHERE t.slug = 'vung-tau-con-dao-speedboat'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 7 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 14 DAY), 8, 1800000
FROM tours t WHERE t.slug = 'vung-tau-con-dao-speedboat'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 14 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 1 DAY), 10, NULL
FROM tours t WHERE t.slug = 'vung-tau-seafood-lighthouse-tour'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 1 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 4 DAY), 8, NULL
FROM tours t WHERE t.slug = 'vung-tau-seafood-lighthouse-tour'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 4 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 3 DAY), 10, NULL
FROM tours t WHERE t.slug = 'vung-tau-sunset-relaxation'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 3 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 6 DAY), 8, NULL
FROM tours t WHERE t.slug = 'vung-tau-sunset-relaxation'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 6 DAY));

-- HA LONG
INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 4 DAY), 20, NULL
FROM tours t WHERE t.slug = 'ha-long-bay-2d1n-cruise'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 4 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 9 DAY), 18, 2450000
FROM tours t WHERE t.slug = 'ha-long-bay-2d1n-cruise'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 9 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 3 DAY), 15, NULL
FROM tours t WHERE t.slug = 'ha-long-bay-kayaking-day-trip'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 3 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 8 DAY), 12, 1800000
FROM tours t WHERE t.slug = 'ha-long-bay-kayaking-day-trip'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 8 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 5 DAY), 15, NULL
FROM tours t WHERE t.slug = 'ha-long-bay-3d2n-premium-cruise'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 5 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 12 DAY), 12, 4100000
FROM tours t WHERE t.slug = 'ha-long-bay-3d2n-premium-cruise'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 12 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 4 DAY), 10, NULL
FROM tours t WHERE t.slug = 'ha-long-yen-tu-pilgrimage'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 4 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 9 DAY), 8, NULL
FROM tours t WHERE t.slug = 'ha-long-yen-tu-pilgrimage'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 9 DAY));

-- CAN THO
INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 2 DAY), 10, NULL
FROM tours t WHERE t.slug = 'can-tho-cai-rang-floating-market'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 2 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 5 DAY), 8, NULL
FROM tours t WHERE t.slug = 'can-tho-cai-rang-floating-market'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 5 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 3 DAY), 8, NULL
FROM tours t WHERE t.slug = 'can-tho-eco-garden-fruit-farm'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 3 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 7 DAY), 6, NULL
FROM tours t WHERE t.slug = 'can-tho-eco-garden-fruit-farm'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 7 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 4 DAY), 8, NULL
FROM tours t WHERE t.slug = 'can-tho-2d1n-floating-market'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 4 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 9 DAY), 6, 1400000
FROM tours t WHERE t.slug = 'can-tho-2d1n-floating-market'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 9 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 3 DAY), 8, NULL
FROM tours t WHERE t.slug = 'can-tho-tra-cuong-cooking'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 3 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 6 DAY), 6, NULL
FROM tours t WHERE t.slug = 'can-tho-tra-cuong-cooking'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 6 DAY));

-- SAPA
INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 7 DAY), 6, NULL
FROM tours t WHERE t.slug = 'sapa-mu-cang-chai-rice-terraces'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 7 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 14 DAY), 5, 2150000
FROM tours t WHERE t.slug = 'sapa-mu-cang-chai-rice-terraces'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 14 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 3 DAY), 10, NULL
FROM tours t WHERE t.slug = 'sapa-fansipan-cable-car'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 3 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 8 DAY), 8, 1800000
FROM tours t WHERE t.slug = 'sapa-fansipan-cable-car'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 8 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 5 DAY), 6, NULL
FROM tours t WHERE t.slug = 'sapa-cat-cat-ta-phin-homestay'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 5 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 12 DAY), 5, NULL
FROM tours t WHERE t.slug = 'sapa-cat-cat-ta-phin-homestay'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 12 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 4 DAY), 8, NULL
FROM tours t WHERE t.slug = 'sapa-tea-hill-ethnic-market'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 4 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 10 DAY), 6, NULL
FROM tours t WHERE t.slug = 'sapa-tea-hill-ethnic-market'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 10 DAY));

COMMIT;

-- Verify counts
SELECT CONCAT('Tours: ', COUNT(*)) AS result FROM tours WHERE is_active = TRUE;
SELECT CONCAT('Tour images: ', COUNT(*)) AS result FROM tour_images;
SELECT CONCAT('Tour itinerary items: ', COUNT(*)) AS result FROM tour_itinerary;
SELECT CONCAT('Tour departures: ', COUNT(*)) AS result FROM tour_departures;
