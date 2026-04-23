-- ============================================================
-- THÊM CITIES THIẾU CHO IMPORT HOTELS CSV
-- ============================================================

USE tourista;

-- Thêm cities mới (nếu chưa tồn tại)
INSERT IGNORE INTO cities (country_id, name_vi, name_en, slug, is_popular) VALUES
(1, 'Đà Lạt',    'Da Lat',    'da-lat',    TRUE),
(1, 'Vũng Tàu',  'Vung Tau',  'vung-tau',  TRUE),
(1, 'Huế',        'Hue',       'hue',        TRUE);

-- Verify: Kiểm tra tất cả cities
SELECT id, name_vi, name_en, slug FROM cities ORDER BY name_vi;
