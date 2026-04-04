-- ============================================================
-- TOURISTA - Thêm các thành phố Việt Nam còn thiếu
-- Chạy file này TRƯỚC khi import CSV
-- ============================================================

USE tourista;
SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Thêm thành phố còn thiếu (INSERT IGNORE để không lỗi nếu đã có)
INSERT IGNORE INTO cities (country_id, name_vi, name_en, slug, is_popular) VALUES
-- Việt Nam (country_id = 1)
(1, 'Đà Lạt',       'Da Lat',       'da-lat',       TRUE),
(1, 'Vũng Tàu',     'Vung Tau',     'vung-tau',     TRUE),
(1, 'Huế',          'Hue',          'hue',          TRUE),
(1, 'Cần Thơ',      'Can Tho',      'can-tho',      FALSE),
(1, 'Hạ Long',      'Ha Long',      'ha-long',      TRUE),
(1, 'Quy Nhơn',     'Quy Nhon',     'quy-nhon',     FALSE),
(1, 'Phan Thiết',   'Phan Thiet',   'phan-thiet',   FALSE),
(1, 'Buôn Ma Thuột','Buon Ma Thuot','buon-ma-thuot', FALSE),
(1, 'Hải Phòng',    'Hai Phong',    'hai-phong',    FALSE),
(1, 'Ninh Bình',    'Ninh Binh',    'ninh-binh',    FALSE),
(1, 'Mũi Né',       'Mui Ne',       'mui-ne',       FALSE),
(1, 'Côn Đảo',      'Con Dao',      'con-dao',      FALSE),
(1, 'Phong Nha',    'Phong Nha',    'phong-nha',    FALSE),
(1, 'Tam Cốc',      'Tam Coc',      'tam-coc',      FALSE),
(1, 'Bình Định',    'Binh Dinh',    'binh-dinh',    FALSE);

-- Kiểm tra kết quả
SELECT id, name_vi, name_en, slug FROM cities WHERE country_id = 1 ORDER BY id;
