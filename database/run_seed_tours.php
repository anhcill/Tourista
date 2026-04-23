<?php
$pdo = new PDO(
    'mysql:host=interchange.proxy.rlwy.net;port=38550;dbname=railway;charset=utf8mb4',
    'root',
    'SZhkpiaBKssdXIyGLhTxbLQzGVlOnZBD',
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
);

$pdo->exec("SET FOREIGN_KEY_CHECKS = 0");

$now = date('Y-m-d H:i:s');

// ============================================================
// 1. TOUR CATEGORIES
// ============================================================
$cats = [
    ['Van hoa & Di san', 'Culture & Heritage', 'culture-heritage', 'fa-landmark'],
    ['Thien nhien & Adventure', 'Nature & Adventure', 'nature-adventure', 'fa-mountain'],
    ['Bien & Dao', 'Beach & Island', 'beach-island', 'fa-umbrella-beach'],
    ['Am thuc', 'Food & Culinary', 'food-culinary', 'fa-utensils'],
    ['Gia dinh', 'Family', 'family', 'fa-users'],
    ['Lang nghe', 'Workshop & Experience', 'workshop', 'fa-palette'],
    ['Nghi duong', 'Relaxation & Wellness', 'relaxation', 'fa-spa'],
    ['Sinh Thai', 'Eco & Nature', 'eco-tour', 'fa-leaf'],
];
foreach ($cats as $cat) {
    $pdo->prepare("INSERT IGNORE INTO tour_categories (name_vi, name_en, slug, icon) VALUES (?,?,?,?)")->execute($cat);
}
echo "Categories done.\n";

// ============================================================
// 2. Helper: get city ID by slug
// ============================================================
function getCityId($pdo, $slug) {
    $stmt = $pdo->prepare("SELECT id FROM cities WHERE slug = ?");
    $stmt->execute([$slug]);
    return $stmt->fetchColumn();
}
function getCategoryId($pdo, $slug) {
    $stmt = $pdo->prepare("SELECT id FROM tour_categories WHERE slug = ?");
    $stmt->execute([$slug]);
    return $stmt->fetchColumn();
}

// ============================================================
// 3. TOURS
// ============================================================
$tours = [
    // HA NOI
    ['Ha Noi city tour - Old Quarter & Ho Chi Minh complex', 'ha-noi-city-tour-old-quarter',
     'Kham pha long Ha Noi: Pho co, Khu pho cu, Khu di tich Ho Chi Minh, Den Mot Cot va Van Mieu.',
     'Golden Bridge check-in, Ba Na cable car, French Village, Le Jardin d\'Amour',
     'Round-trip transfer, English speaking guide, Buffet lunch, Travel insurance',
     'Personal expenses, Tips, VAT invoice',
     1, 0, 20, 1, 'EASY', 850000, 650000, 4.75, 210, 1, 1, 'ha-noi', 'culture-heritage'],
    ['Ha Noi - Ninh Binh day trip: Trang An & Hoa Lu', 'ha-noi-ninh-binh-trang-an',
     'Tham quan Hang Trang An bang thuyen, kinh do Hoa Lu va chua Bai Dinh trong mot ngay.',
     'Trang An boat ride, Hoa Lu ancient capital, Bai Dinh pagoda, Vietnamese lunch',
     'Transport from Hanoi, Guide, Lunch, Boat fee',
     'Personal expenses, Tips, VAT invoice',
     1, 0, 18, 1, 'MEDIUM', 1150000, 890000, 4.85, 178, 1, 1, 'ha-noi', 'nature-adventure'],
    ['Ha Noi street food walking tour - Old Quarter', 'ha-noi-street-food-tour',
     'Hanh trinh am thuc Ha Noi qua cac tuyen pho cu voi huong dan. Thuong thuc pho, banh cuon, cha ca va ca phe trung.',
     'Pho bo Ha Noi, Banh cuon, Cha ca La Vong, Ca phe trung',
     'Guide, Food tasting (10+ dishes), Water',
     'Alcoholic drinks, Personal shopping, VAT invoice',
     1, 0, 10, 1, 'EASY', 750000, 0, 4.90, 305, 1, 1, 'ha-noi', 'food-culinary'],
    ['Ha Noi - Sapa 2 days 1 night - Fansipan peak', 'ha-noi-sapa-fansipan-adventure',
     'Kham pha Sapa va dinh Fansipan huyen thoai. Trekking ruong bac thang, tham ban lang Hmong va Dao.',
     'Dinh Fansipan, Ruong bac thang Mu Cang Chai, Lang bac Hoang Lien, Trekking',
     'Limousine, Hotel, Breakfast, Guide',
     'Lunch day 2, Tips, VAT invoice',
     2, 1, 12, 1, 'HARD', 2450000, 1850000, 4.70, 142, 1, 1, 'ha-noi', 'nature-adventure'],
    ['Ha Noi cooking class - Traditional Vietnamese cuisine', 'ha-noi-cooking-class',
     'Hoc nau 5 mon an Viet Nam truyen thong voi dau be ban dia. Tham cho, lam banh mi va pho.',
     'Lam pho bo, Lam banh mi, Tham cho Dong Xuan, Certificate',
     'Ingredients, Recipes, Lunch, Tea tasting',
     'Drinks, Shopping, VAT invoice',
     1, 0, 8, 1, 'EASY', 1250000, 850000, 4.95, 88, 0, 1, 'ha-noi', 'workshop'],
    ['Ha Noi water puppet show & Thang Long citadel', 'ha-noi-water-puppet-thang-long',
     'Trai nghiem mua roi nuoc truyen thong va tham quan Hoang thanh Thang Long.',
     'Mua roi nuoc, Hoang thanh Thang Long, Nha hát Long Bien, Pho co',
     'Tickets, Guide, Water',
     'Drinks, Shopping, VAT invoice',
     1, 0, 15, 1, 'EASY', 650000, 450000, 4.60, 95, 0, 1, 'ha-noi', 'culture-heritage'],

    // DA NANG
    ['Da Nang - Ba Na Hills day trip - Golden Bridge', 'da-nang-ba-na-hills-day-trip',
     'Kham pha Ba Na Hills, Cau Vang, Lang Phap va cap treo nui trong mot ngay tu Da Nang.',
     'Cau Vang check-in, Cap treo Ba Na, Lang Phap, Le Jardin d\'Amour',
     'Xe dua don, Huong dan TA, Buffet trua, Bao hiem',
     'Chi phi ca nhan, Hoa don VAT, Tips',
     1, 0, 25, 1, 'EASY', 1290000, 990000, 4.80, 186, 1, 1, 'da-nang', 'culture-heritage'],
    ['Da Nang - Son Tra - Marble Mountain - Hoi An by night', 'da-nang-son-tra-marble-mountain-hoi-an',
     'Tour ket hop thanh pho cho khach lan dau: Ban dao Son Tra, Ngu Hanh Son va Hoi An ve dem.',
     'Chua Linh Ung, Nui Ngu Hanh, Pho co Hoi An, Cho dem',
     'Xe, Huong dan, Ve Hoi An, Bua toi set menu',
     'Mua sam, Tau thuyen, VAT',
     1, 0, 20, 1, 'EASY', 990000, 790000, 4.70, 142, 1, 1, 'da-nang', 'culture-heritage'],
    ['Da Nang - Cu Lao Cham island snorkeling adventure', 'da-nang-cu-lao-cham-snorkeling',
     'Tau cao toc ra Cu Lao Cham voi lop snorkel va bua trua hai san tuoi song.',
     'Tau cao toc, Snorkel, Ran san ho, Bua trua hai san',
     'Tau, Huong dan, Dung cu snorkel, Bua trua',
     'Goi san ho, Do uong, VAT',
     1, 0, 18, 1, 'MEDIUM', 1150000, 920000, 4.60, 97, 0, 1, 'da-nang', 'beach-island'],
    ['Da Nang street food tour by night', 'da-nang-food-tour-by-night',
     'Kham pha am thuc duong pho voi cac mon dac trung va cac con hem khu trong long Da Nang.',
     'Cac quan an dia phuong, Tuyen pho dem, Bo song Han, Nhom nho',
     'Thu do an, Huong dan, Nuoc, Don khach',
     'Do goi them, Do uong, VAT',
     1, 0, 12, 1, 'EASY', 690000, 550000, 4.50, 76, 0, 1, 'da-nang', 'food-culinary'],
    ['Da Nang - Hai Van Pass - Lang Co - Lagoon day trip', 'da-nang-hai-van-pass-lang-co',
     'Vuot deo Hai Van huyen thoai, ngam dam Lap Dinh va bai bien Lang Co.',
     'Deo Hai Van, Dam Lap Dinh, Bai Lang Co, Ho Chi Minh trail',
     'Xe, Guide, Bua trua, Ve tham quan',
     'Chi phi ca nhan, Tips, VAT',
     1, 0, 15, 1, 'MEDIUM', 890000, 690000, 4.40, 54, 0, 1, 'da-nang', 'nature-adventure'],
    ['Da Nang family day - Water park & Beach fun', 'da-nang-family-water-park-beach',
     'Ngay voi cho gia dinh voi cong vien nuoc Asia Park va bai bien My Khe.',
     'Asia Park, Bai My Khe, Cau Rong, Han River cruise',
     'Xe, Ve Asia Park, Guide, Bua trua',
     'Chi phi ca nhan, VAT',
     1, 0, 20, 1, 'EASY', 980000, 780000, 4.55, 63, 1, 1, 'da-nang', 'family'],

    // NHA TRANG
    ['Nha Trang - Con Se Tre island hopping 4 islands', 'nha-trang-con-se-tre-island-hopping',
     'Tham quan 4 dao xung quanh Nha Trang: Hon Mun, Hon Mot, Hon Tranh va lang chai.',
     'Snorkel Hon Mun, Thuyen day kinh, Bua trua hai san, The thao nuoc',
     'Tau cao toc, Huong dan, Bua trua, Dung cu snorkel',
     'Phi the thao, Chi phi ca nhan, VAT',
     1, 0, 25, 1, 'EASY', 990000, 790000, 4.65, 134, 1, 1, 'nha-trang', 'beach-island'],
    ['Nha Trang snorkeling & diving day trip - Hon Mun', 'nha-trang-snorkeling-diving',
     'Kham pha ran san ho va doi song bien tai Hon Mun voi huan luyen vien lop chuyen nghiep.',
     '2 diem snorkel, Vuon san ho, Doi song bien, Anh duoi nuoc',
     'Xe, Huong dan, Bua trua, Thue dung cu',
     'May anh duoi nuoc, Chi phi ca nhan, VAT',
     1, 0, 15, 1, 'MEDIUM', 1350000, 1050000, 4.70, 88, 0, 1, 'nha-trang', 'beach-island'],
    ['Nha Trang - Ba Ho waterfall & hiking adventure', 'nha-trang-ba-ho-waterfall-hiking',
     'Trekking toi thac Ba Ho va kham pha rung nhiet doi xung quanh Nha Trang.',
     'Thac Ba Ho, Trekking rung, Boi suoi, Viewpoint',
     'Xe, Guide, Bua trua, Bao hiem',
     'Do uong, Chi phi ca nhan, VAT',
     1, 0, 12, 1, 'MEDIUM', 950000, 750000, 4.55, 65, 0, 1, 'nha-trang', 'nature-adventure'],
    ['Nha Trang mud bath & thermal spring relaxation', 'nha-trang-mud-bath-relaxation',
     'Trai nghiem tam bun va suoi nuoc nong tai Nha Trang. Thu gian va lam dep da.',
     'Tam bun khoang, Suoi nuoc nong, Massage, Be boi',
     'Xe dua don, Ve mud bath, Bua trua, Khan tam',
     'Massage them, Chi phi ca nhan, VAT',
     1, 0, 15, 1, 'EASY', 1200000, 900000, 4.80, 110, 1, 1, 'nha-trang', 'relaxation'],
    ['Nha Trang fish market & cooking class', 'nha-trang-fish-market-cooking',
     'Di cho hai san tu sang som va hoc nau cac mon hai san Nha Trang dac trung.',
     'Cho hai san, Nau 5 mon, Bun cha ca, Tasting',
     'Nguyen lieu, Huong dan, Bua trua voi mon da nau, Tra cuu',
     'Do uong, Mua sam, VAT',
     1, 0, 10, 1, 'EASY', 1100000, 800000, 4.75, 72, 0, 1, 'nha-trang', 'food-culinary'],

    // PHU QUOC
    ['Phu Quoc - 3 islands snorkeling tour with sunset', 'phu-quoc-3-islands-snorkeling',
     'Tham 3 dao Hon Gamala, Hon May Rut va Hon Thom voi lop snorkel va cau ca hoang hon.',
     'Snorkel 3 diem, Cap treo Hon Thom, Cau ca hoang hon, Bua trua hai san',
     'Tau cao toc, Huong dan, Bua trua, Dung cu',
     'Phi cap treo, Chi phi ca nhan, VAT',
     1, 0, 20, 1, 'EASY', 1100000, 880000, 4.70, 112, 1, 1, 'phu-quoc', 'beach-island'],
    ['Phu Quoc island exploration by motorbike', 'phu-quoc-island-exploration',
     'Kham pha Phu Quoc bang xe may: Vinpearl Safari, Nha may tieu, Xi nghiep nuoc mam va bai bien.',
     'Vinpearl Safari, Truong tieu, Xi nghiep nuoc mam, Bai Sao',
     'Xe, Huong dan, Bua trua, Ve Safari',
     'Chi phi ca nhan, Tips, VAT',
     1, 0, 15, 1, 'EASY', 1350000, 1050000, 4.55, 78, 0, 1, 'phu-quoc', 'nature-adventure'],
    ['Phu Quoc night market food tour', 'phu-quoc-night-market-food-tour',
     'Di bo kham pha cho dem Phu Quoc - thien duong hai san gia re voi du loai dac sac dao.',
     'Cho dem Dinh Cau, Hai san tuoi song, Nuoc mam Phu Quoc, Banh flan',
     'Guide, Thu do an (8+ mon), Nuoc, Don khach',
     'Do goi them, Mua mang ve, VAT',
     1, 0, 12, 1, 'EASY', 550000, 0, 4.65, 90, 0, 1, 'phu-quoc', 'food-culinary'],
    ['Phu Quoc sunset romantic boat cruise', 'phu-quoc-sunset-romantic-cruise',
     'Tau thuyen ngam hoang hon lang man tren bien Phu Quoc voi champagne va hai san nuong.',
     'Ngam hoang hon, Champagne, Hai san nuong tren tau, Cau muc',
     'Tau, Champagne, Bua trua hai san, Guide',
     'Do uong them, Chi phi ca nhan, VAT',
     1, 0, 8, 1, 'EASY', 1850000, 1450000, 4.85, 58, 0, 1, 'phu-quoc', 'relaxation'],

    // HO CHI MINH
    ['Ho Chi Minh - Cu Chi tunnels half day', 'hcm-cu-chi-tunnels-half-day',
     'Kham pha mang luoi duong ham Cu Chi noi tieng thoi chien tranh Viet Nam.',
     'Duong ham Cu Chi, Trien lam bay chuot, Ban sung, Khoai lang nuong',
     'Xe, Huong dan, Ve vao, Nuoc',
     'Phi ban sung, Chi phi ca nhan, VAT',
     1, 0, 20, 1, 'EASY', 750000, 550000, 4.60, 245, 1, 1, 'ho-chi-minh', 'culture-heritage'],
    ['Mekong Delta 2 days 1 night from Ho Chi Minh', 'mekong-delta-2-days-1-night',
     'Kham pha mien Tay song nuoc: Ben Tre, cho noi Can Tho va lang que mien Tay.',
     'Xuong keo dua, Thuyen cheo, Cho noi, Trai nghiem homestay',
     'Xe, Huong dan, Bua an, Khach san',
     'Chi phi ca nhan, Tips, VAT',
     2, 1, 15, 1, 'EASY', 1890000, 1490000, 4.75, 167, 1, 1, 'ho-chi-minh', 'nature-adventure'],
    ['Ho Chi Minh street food tour by night', 'hcm-street-food-tour-by-night',
     'Kham pha doi song am thuc soi dong Sai Gon: tu banh mi den com tam, tat ca bang di bo.',
     'Banh mi thit, Com tam, Bun thit nuong, Sinh to hoa quá',
     'Guide, Thu do an (8 mon), Nuoc, Di bo',
     'Do uong co con, Do goi them, VAT',
     1, 0, 12, 1, 'EASY', 650000, 0, 4.80, 198, 1, 1, 'ho-chi-minh', 'food-culinary'],
    ['Ho Chi Minh city tour - Notre Dame & War Remnants', 'hcm-city-tour-notre-dame-war-remnants',
     'Kham pha Sai Gon hien dai: Nha thu Duc Ba, Bao tang Chung tich chien tranh va pho di bo Nguyen Hue.',
     'Nha thu Duc Ba, Buu dien Sai Gon, Bao tang Chung tich, Pho di bo',
     'Xe, Guide, Ve bao tang, Nuoc',
     'Chi phi ca nhan, Mua sam, VAT',
     1, 0, 18, 1, 'EASY', 550000, 400000, 4.55, 132, 0, 1, 'ho-chi-minh', 'culture-heritage'],
    ['Mekong Delta day trip - Ben Tre coconut canals', 'mekong-delta-day-trip-ben-tre',
     'Trai nghiem mien Tay trong ngay: xuong keo dua, thuyen cheo kenh va thuong thuc trai cay mien Tay.',
     'Xuong keo dua, Thuyen cheo kenh, Thien duong, Trai cay mien Tay',
     'Xe, Thuyen, Bua trua, Guide',
     'Mua dac sac, Chi phi ca nhan, VAT',
     1, 0, 15, 1, 'EASY', 950000, 750000, 4.65, 105, 0, 1, 'ho-chi-minh', 'family'],

    // DA LAT
    ['Da Lat city tour - Valley, Crazy House & Waterfall', 'da-lat-city-tour-valley-pagoda',
     'Kham pha Da Lat: Thung lung, Crazy House, chua Linh Phuoc va thac Datanla.',
     'Diem view thung lung, Crazy House, Chua Linh Phuoc, Thac Datanla',
     'Xe, Guide, Ve tham quan, Bua trua',
     'Chi phi ca nhan, Tips, VAT',
     1, 0, 18, 1, 'EASY', 850000, 650000, 4.70, 145, 1, 1, 'da-lat', 'nature-adventure'],
    ['Da Lat coffee & tea workshop experience', 'da-lat-coffee-tea-workshop',
     'Hoc ve san xuat ca phe va tra Da Lat voi workshop thuc hanh va thuong thuc.',
     'Hai ca phe, Trinh dien rang, Lam banh mi Phap, Thuong tra',
     'Xe, Workshop, Thuong thuc, Bua trua',
     'Mua mang ve, Tips, VAT',
     1, 0, 12, 1, 'EASY', 950000, 750000, 4.85, 92, 0, 1, 'da-lat', 'workshop'],
    ['Da Lat sunrise at Lang Biang mountain trek', 'da-lat-lang-biang-sunrise-trek',
     'Trekking dinh Lang Biang de ngam binh minh va view toan canh Da Lat tu tren cao.',
     'Binh minh tren dinh, Trekking rung thong, Viewpoint 360, Dinh Lang Biang',
     'Xe don, Guide, Bua sang, Bao hiem',
     'Bua trua, Chi phi ca nhan, VAT',
     1, 0, 10, 1, 'HARD', 750000, 550000, 4.60, 68, 0, 1, 'da-lat', 'nature-adventure'],
    ['Da Lat flower garden & tea plantation day tour', 'da-lat-flower-tea-plantation',
     'Tham vuon hoa va tra Da Lat noi tieng. Kham pha ve dep lang man cua thanh pho ngan hoa.',
     'Vuon hoa, Tra Moc Lan, Ho Tuyen Lam, Thung lung tinh yeu',
     'Xe, Guide, Ve vuon hoa, Bua trua',
     'Mua hoa, Chi phi ca nhan, VAT',
     1, 0, 15, 1, 'EASY', 650000, 500000, 4.75, 80, 0, 1, 'da-lat', 'family'],

    // HOI AN
    ['Hoi An ancient town walking tour - Lantern & History', 'hoi-an-ancient-town-walking-tour',
     'Kham pha Hoi An ve dem voi den long rue ro, pho cu yeu bình va cac di tich lich su.',
     'Pho co Hoi An, Chua Cau, Hoi quan Phuoc Kieu, Den long',
     'Guide, Ve tham quan, Bua toi set menu, Don khach',
     'Mua sam, Chi phi ca nhan, VAT',
     1, 0, 15, 1, 'EASY', 750000, 550000, 4.85, 215, 1, 1, 'hoi-an', 'culture-heritage'],
    ['Hoi An cooking class - Traditional Vietnamese dishes', 'hoi-an-cooking-class',
     'Hoc nau 5 mon an Viet Nam dac trung tai Hoi An. Di cho, lam banh xeo va pho.',
     'Di cho Hoi An, Lam banh xeo, Nau pho, Certificate',
     'Nguyen lieu, Ve cho, Bua trua voi mon da nau, Tra cuu cong thuc',
     'Do uong, Mua sam, VAT',
     1, 0, 10, 1, 'EASY', 1150000, 850000, 4.90, 130, 0, 1, 'hoi-an', 'workshop'],
    ['Hoi An - My Son sanctuary half day', 'hoi-an-my-son-sanctuary',
     'Tham quan the di tich den thap My Son - di san van hoa Cham Pa duoc UNESCO cong nhan.',
     'Quan the My Son, Thap Cham, Trinh dien am nhac, Lich su Cham Pa',
     'Xe, Guide, Ve tham quan, Nuoc',
     'Chi phi ca nhan, Tips, VAT',
     1, 0, 18, 1, 'EASY', 850000, 650000, 4.75, 165, 1, 1, 'hoi-an', 'culture-heritage'],
    ['Hoi An fishing & lantern making experience', 'hoi-an-fishing-lantern-making',
     'Trai nghiem danh ca theo phong cach ngu dan va lam den long giay truyen thong Hoi An.',
     'Danh ca, Lam den long giay, Thuyen thung, Thuong tra',
     'Dung cu, Nguyen lieu, Guide, Den long mang ve',
     'Chi phi ca nhan, Tips, VAT',
     1, 0, 10, 1, 'EASY', 950000, 750000, 4.80, 95, 0, 1, 'hoi-an', 'workshop'],

    // HUE
    ['Hue imperial citadel full day tour', 'hue-imperial-citadel-full-day',
     'Kham pha Dai Noi Hue, chua Thien Mu, lang Tu Duc va lang Khai Dinh trong mot ngay.',
     'Dai Noi Hue, Chua Thien Mu, Lang Tu Duc, Lang Khai Dinh',
     'Xe, Guide, Bua trua, Tat ca ve tham quan',
     'Chi phi ca nhan, Tips, VAT',
     1, 0, 18, 1, 'EASY', 1050000, 820000, 4.75, 168, 1, 1, 'hue', 'culture-heritage'],
    ['Hue - DMZ day trip (Vinh Moc tunnels & Khe Sanh)', 'hue-dmz-day-trip',
     'Tham vung phi quan su: duong ham Vinh Moc, can cu Khe Sanh va deo Hai Van.',
     'Duong ham Vinh Moc, Can cu Khe Sanh, Deo Hai Van, Song Ben Hai',
     'Xe, Guide, Bua trua',
     'Chi phi ca nhan, Tips, VAT',
     1, 0, 15, 1, 'MEDIUM', 1250000, 990000, 4.65, 95, 0, 1, 'hue', 'culture-heritage'],
    ['Hue garden house & Perfume River boat tour', 'hue-garden-house-perfume-river',
     'Kham pha cac biet thu vuon Hue doc dao va thuyen tren song Huong ngam canh.',
     'Biet thu vuon, Thuyen song Huong, Chua Thien Mu, Cho Dong Ba',
     'Thuyen, Guide, Bua trua, Ve tham quan',
     'Chi phi ca nhan, Mua sam, VAT',
     1, 0, 12, 1, 'EASY', 850000, 650000, 4.70, 75, 0, 1, 'hue', 'culture-heritage'],
    ['Hue royal cuisine & conical hat making tour', 'hue-royal-cuisine-conical-hat',
     'Thuong thuc am thuc cung dinh Hue va hoc lam non la truyen thong.',
     'Bun bo Hue, Am thuc cung dinh, Lam non la, Cho Tet',
     'Guide, Thu do an, Lam non, Ve mang ve',
     'Do uong, Mua sam, VAT',
     1, 0, 10, 1, 'EASY', 950000, 750000, 4.80, 58, 0, 1, 'hue', 'food-culinary'],

    // VUNG TAU
    ['Vung Tau beach resort day trip from Ho Chi Minh', 'vung-tau-beach-day-trip',
     'Nghi duong bien Vung Tau - Bai Sau xinh dep, thap sat va nui Nho.',
     'Bai Sau, Thap sat, Nui Nho, Tuong Chua Giang Tay',
     'Xe dua don, Guide, Ve tham quan, Bua trua',
     'Chi phi ca nhan, Tips, VAT',
     1, 0, 20, 1, 'EASY', 750000, 550000, 4.50, 120, 1, 1, 'vung-tau', 'beach-island'],
    ['Vung Tau - Con Dao island day trip by speedboat', 'vung-tau-con-dao-speedboat',
     'Tau cao toc ra Con Dao - Dia nguc tran gian xua va ve dep hoang so hien tai.',
     'Con Dao, Nha tu Con Dao, Bai Nhan, Mo liet si',
     'Tau cao toc, Xe, Guide, Ve tham quan',
     'Bua trua, Chi phi ca nhan, VAT',
     1, 0, 15, 1, 'EASY', 1850000, 1450000, 4.70, 65, 0, 1, 'vung-tau', 'culture-heritage'],
    ['Vung Tau seafood & lighthouse walking tour', 'vung-tau-seafood-lighthouse-tour',
     'Kham pha am thuc hai san Vung Tau va tham ngoan hai dang noi tieng.',
     'Hai san tuoi song, Ngoan hai dang, Pho cu, Bai Truoc',
     'Guide, Thu do an (8 mon), Ve hai dang, Don khach',
     'Do uong, Mua sam, VAT',
     1, 0, 12, 1, 'EASY', 650000, 450000, 4.55, 85, 0, 1, 'vung-tau', 'food-culinary'],
    ['Vung Tau sunset & beach relaxation day', 'vung-tau-sunset-relaxation',
     'Thu gian tai bai bien Vung Tau, ngam hoang hon tren bo bien va tan huong spa bien.',
     'Bai Sau, Ngam hoang hon, Massage bien, Hai san tuoi',
     'Xe, Guide, Ve bai bien, Bua trua',
     'Spa them, Chi phi ca nhan, VAT',
     1, 0, 15, 1, 'EASY', 850000, 650000, 4.60, 70, 0, 1, 'vung-tau', 'relaxation'],

    // HA LONG
    ['Ha Long Bay 2 days 1 night luxury cruise', 'ha-long-bay-2d1n-cruise',
     'Tau du ngoan qua Vịnh Ha Long qua dem voi kayak, kham hang va tiet hoang hon.',
     'Du ngoan Vinh Ha Long, Hang Sung Sua, Kayak, Tiet hoang hon, Cau muc',
     'Cabin tau, Bua an, Kayak, Guide',
     'Do uong, Chi phi ca nhan, Tips, VAT',
     2, 1, 30, 1, 'EASY', 2500000, 1900000, 4.90, 320, 1, 1, 'ha-long', 'nature-adventure'],
    ['Ha Long Bay - Tuan Chau island & kayaking day trip', 'ha-long-bay-kayaking-day-trip',
     'Tour trong ngay voi kayak qua hang, tam bien va kham pha dao Tuan Chau.',
     'Kayak qua hang, Tam bien, Dao Tuan Chau, Bua trua hai san',
     'Xe Ha Noi, Tau, Kayak, Bua trua',
     'Chi phi ca nhan, Tips, VAT',
     1, 0, 20, 1, 'EASY', 1850000, 1450000, 4.75, 195, 1, 1, 'ha-long', 'nature-adventure'],
    ['Ha Long Bay 3 days 2 nights premium cruise experience', 'ha-long-bay-3d2n-premium-cruise',
     'Trai nghiem dang cap 3 ngay 2 dem tren vịnh Ha Long voi day du hoat dong va am thuc.',
     'Hang Sung Sua, Kayak, Tiet hoang hon, Tai chi, Cau muc',
     'Cabin premium, Tat ca bua an, Kayak, Guide',
     'Do uong, Chi phi ca nhan, Tips, VAT',
     3, 2, 20, 1, 'EASY', 4200000, 3200000, 4.95, 88, 1, 1, 'ha-long', 'nature-adventure'],
    ['Ha Long - Yen Tu mountain Buddhist pilgrimage', 'ha-long-yen-tu-pilgrimage',
     'Hanh huong nui Yen Tu - chieu cao linh thien va chua vang tren dinh nui.',
     'Nui Yen Tu, Chua vang, Cap treo len dinh, Thien dinh',
     'Xe Ha Long, Cap treo, Guide, Bua trua chay',
     'Chi phi ca nhan, Tips, VAT',
     1, 0, 15, 1, 'MEDIUM', 1650000, 1250000, 4.65, 55, 0, 1, 'ha-long', 'culture-heritage'],

    // CAN THO
    ['Can Tho - Cai Rang floating market & Mekong exploration', 'can-tho-cai-rang-floating-market',
     'Kham pha cho noi Cai Rang tu sang som va trai nghiem cuoc song song nuoc mien Tay.',
     'Cho noi Cai Rang, Thuyen thung, Vuon trai cay, Lang nghe',
     'Thuyen, Guide, Bua sang, Trai cay',
     'Chi phi ca nhan, Mua dac sac, VAT',
     1, 0, 15, 1, 'EASY', 850000, 650000, 4.70, 145, 1, 1, 'can-tho', 'nature-adventure'],
    ['Can Tho - Eco garden & fruit farm experience', 'can-tho-eco-garden-fruit-farm',
     'Tham vuon sinh thai va trang trai trai cay mien Tay. Hai trai cay va thuong thuc tai cho.',
     'Vuon sinh thai, Hai trai cay, Thuyen cheo, Bua trua',
     'Xe, Thuyen, Guide, Bua trua',
     'Mua trai cay, Chi phi ca nhan, VAT',
     1, 0, 12, 1, 'EASY', 750000, 550000, 4.60, 88, 0, 1, 'can-tho', 'eco-tour'],
    ['Can Tho - Cai Rang & Phong Dien floating market 2 days', 'can-tho-2d1n-floating-market',
     '2 ngay kham pha nhieu cho noi: Cai Rang, Phong Dien va cuoc song song nuoc dich thuc.',
     'Cho noi Cai Rang, Cho noi Phong Dien, Lang nghe, Homestay',
     'Xe, Thuyen, Bua an, Homestay',
     'Chi phi ca nhan, Mua dac sac, VAT',
     2, 1, 12, 1, 'EASY', 1450000, 1100000, 4.80, 68, 0, 1, 'can-tho', 'nature-adventure'],
    ['Can Tho - Tra Cuong rice paper village & cooking', 'can-tho-tra-cuong-cooking',
     'Hoc lam banh trang va nau cac mon mien Tay tai lang nghe Tra Cuong.',
     'Lang nghe banh trang, Lam banh trang, Nau mon mien Tay, An uong',
     'Nguyen lieu, Guide, Bua trua voi mon da nau, Ve mang ve',
     'Mua banh trang, Chi phi ca nhan, VAT',
     1, 0, 10, 1, 'EASY', 950000, 750000, 4.75, 52, 0, 1, 'can-tho', 'food-culinary'],

    // SAPA
    ['Sapa trekking - Mu Cang Chai rice terraces 2 days', 'sapa-mu-cang-chai-rice-terraces',
     'Trekking qua ruong bac thang Mu Cang Chai noi tieng va lang ban Hmong, Dao.',
     'Ruong bac thang Mu Cang Chai, Lang ban Hmong, Trekking, Hoang gia tra',
     'Xe limousine, Khach san, Bua sang, Guide',
     'Bua trua, Chi phi ca nhan, VAT',
     2, 1, 10, 1, 'HARD', 2200000, 1700000, 4.85, 158, 1, 1, 'sapa', 'nature-adventure'],
    ['Sapa - Fansipan summit cable car adventure', 'sapa-fansipan-cable-car',
     'Len dinh Fansipan - noc nha Dong Duong bang cap treo hien dai va leo bac thang cuoi cung.',
     'Cap treo Fansipan, Dinh Fansipan 3143m, Chua vang, Viewpoint',
     'Cap treo, Guide, Ve tham quan, Bua trua',
     'Chi phi ca nhan, Tips, VAT',
     1, 0, 15, 1, 'MEDIUM', 1850000, 1450000, 4.80, 210, 1, 1, 'sapa', 'nature-adventure'],
    ['Sapa - Cat Cat & Ta Phin village homestay experience', 'sapa-cat-cat-ta-phin-homestay',
     'O homestay tai ban Cat Cat va Ta Phin, hoc det vai va thuong thuc am thuc nui rung.',
     'Ban Cat Cat, Ban Ta Phin, Homestay, Hoc det vai',
     'Xe, Homestay, Bua an, Guide',
     'Mua dac sac, Chi phi ca nhan, VAT',
     2, 1, 10, 1, 'EASY', 1650000, 1250000, 4.75, 95, 0, 1, 'sapa', 'family'],
    ['Sapa - Tea hill & ethnic minority market tour', 'sapa-tea-hill-ethnic-market',
     'Tham doi che Sapa va cho phien cua dong bao dan toc Hmong, Dao moi cuoi tuan.',
     'Doi che Sapa, Cho phien, Thac Bac, Thung lung Muong Hoa',
     'Xe, Guide, Bua trua, Ve tham quan',
     'Mua dac sac, Chi phi ca nhan, VAT',
     1, 0, 12, 1, 'EASY', 950000, 750000, 4.70, 72, 0, 1, 'sapa', 'culture-heritage'],
];

$insertTour = $pdo->prepare("
    INSERT IGNORE INTO tours (category_id, city_id, operator_id, title, slug, description, highlights, includes, excludes, duration_days, duration_nights, max_group_size, min_group_size, difficulty, price_per_adult, price_per_child, avg_rating, review_count, is_featured, is_active, created_at, updated_at)
    VALUES (?,?,NULL,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
");

$tourIdBySlug = [];

foreach ($tours as $t) {
    list($title, $slug, $desc, $highlights, $includes, $excludes, $durDays, $durNights, $maxGs, $minGs, $diff, $priceA, $priceC, $rating, $reviews, $featured, $active, $citySlug, $catSlug) = $t;

    $catId = getCategoryId($pdo, $catSlug);
    $cityId = getCityId($pdo, $citySlug);

    if (!$catId || !$cityId) {
        echo "SKIP $slug - missing cat/city\n";
        continue;
    }

    try {
        $insertTour->execute([
            $catId, $cityId, $title, $slug, $desc, $highlights, $includes, $excludes,
            $durDays, $durNights, $maxGs, $minGs, $diff, $priceA, $priceC,
            $rating, $reviews, $featured, $active, $now, $now
        ]);

        $id = $pdo->lastInsertId();
        if ($id) {
            $tourIdBySlug[$slug] = $id;
            echo "Tour: $slug (ID: $id)\n";
        }
    } catch (Exception $e) {
        // might already exist
    }
}

// ============================================================
// 4. TOUR IMAGES
// ============================================================
$tourImages = [
    'ha-noi-city-tour-old-quarter' => 'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=1600&q=80',
    'ha-noi-ninh-binh-trang-an' => 'https://images.unsplash.com/photo-1509002236388-990aab93d798?w=1600&q=80',
    'ha-noi-street-food-tour' => 'https://images.unsplash.com/photo-1583394964284-8dd09d3f6e9e?w=1600&q=80',
    'ha-noi-sapa-fansipan-adventure' => 'https://images.unsplash.com/photo-1596659868923-d1e0e5d5a0a9?w=1600&q=80',
    'ha-noi-cooking-class' => 'https://images.unsplash.com/photo-1555126634-323283e090fa?w=1600&q=80',
    'ha-noi-water-puppet-thang-long' => 'https://images.unsplash.com/photo-1559893083-5e1b3e7e17c9?w=1600&q=80',
    'da-nang-ba-na-hills-day-trip' => 'https://images.unsplash.com/photo-1528127269322-539801943592?w=1600&q=80',
    'da-nang-son-tra-marble-mountain-hoi-an' => 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=1600&q=80',
    'da-nang-cu-lao-cham-snorkeling' => 'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?w=1600&q=80',
    'da-nang-food-tour-by-night' => 'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=1600&q=80',
    'da-nang-hai-van-pass-lang-co' => 'https://images.unsplash.com/photo-1506665531195-3566af2b4dfa?w=1600&q=80',
    'da-nang-family-water-park-beach' => 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&q=80',
    'nha-trang-con-se-tre-island-hopping' => 'https://images.unsplash.com/photo-1559599238-308793637427?w=1600&q=80',
    'nha-trang-snorkeling-diving' => 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1600&q=80',
    'nha-trang-ba-ho-waterfall-hiking' => 'https://images.unsplash.com/photo-1512100356356-de1b84283e18?w=1600&q=80',
    'nha-trang-mud-bath-relaxation' => 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=1600&q=80',
    'nha-trang-fish-market-cooking' => 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1600&q=80',
    'phu-quoc-3-islands-snorkeling' => 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&q=80',
    'phu-quoc-island-exploration' => 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=1600&q=80',
    'phu-quoc-night-market-food-tour' => 'https://images.unsplash.com/photo-1559525839-8d53f07e5e67?w=1600&q=80',
    'phu-quoc-sunset-romantic-cruise' => 'https://images.unsplash.com/photo-1507499739999-097706ad8914?w=1600&q=80',
    'hcm-cu-chi-tunnels-half-day' => 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=1600&q=80',
    'mekong-delta-2-days-1-night' => 'https://images.unsplash.com/photo-1528164344705-47542687000d?w=1600&q=80',
    'hcm-street-food-tour-by-night' => 'https://images.unsplash.com/photo-1555126634-323283e090fa?w=1600&q=80',
    'hcm-city-tour-notre-dame-war-remnants' => 'https://images.unsplash.com/photo-1555652736-e92021d28a56?w=1600&q=80',
    'mekong-delta-day-trip-ben-tre' => 'https://images.unsplash.com/photo-1590106916587-e0bf6c1e7c33?w=1600&q=80',
    'da-lat-city-tour-valley-pagoda' => 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1600&q=80',
    'da-lat-coffee-tea-workshop' => 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1600&q=80',
    'da-lat-lang-biang-sunrise-trek' => 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&q=80',
    'da-lat-flower-tea-plantation' => 'https://images.unsplash.com/photo-1528823872057-9c018a7a7553?w=1600&q=80',
    'hoi-an-ancient-town-walking-tour' => 'https://images.unsplash.com/photo-1528164344705-e71d3c0e7d33?w=1600&q=80',
    'hoi-an-cooking-class' => 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=1600&q=80',
    'hoi-an-my-son-sanctuary' => 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=1600&q=80',
    'hoi-an-fishing-lantern-making' => 'https://images.unsplash.com/photo-1563771148872-50643a8b63e6?w=1600&q=80',
    'hue-imperial-citadel-full-day' => 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=1600&q=80',
    'hue-dmz-day-trip' => 'https://images.unsplash.com/photo-1584976781699-48db8c1c8744?w=1600&q=80',
    'hue-garden-house-perfume-river' => 'https://images.unsplash.com/photo-1553522991-71439aa5765e?w=1600&q=80',
    'hue-royal-cuisine-conical-hat' => 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1600&q=80',
    'vung-tau-beach-day-trip' => 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&q=80',
    'vung-tau-con-dao-speedboat' => 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1600&q=80',
    'vung-tau-seafood-lighthouse-tour' => 'https://images.unsplash.com/photo-1562625782-6c4a4f0a0b45?w=1600&q=80',
    'vung-tau-sunset-relaxation' => 'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?w=1600&q=80',
    'ha-long-bay-2d1n-cruise' => 'https://images.unsplash.com/photo-1502175353174-a7a70e73b362?w=1600&q=80',
    'ha-long-bay-kayaking-day-trip' => 'https://images.unsplash.com/photo-1520699049698-acd2fccb8cc8?w=1600&q=80',
    'ha-long-bay-3d2n-premium-cruise' => 'https://images.unsplash.com/photo-1573354441014-9a0886c1bf3f?w=1600&q=80',
    'ha-long-yen-tu-pilgrimage' => 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&q=80',
    'can-tho-cai-rang-floating-market' => 'https://images.unsplash.com/photo-1590106916587-e0bf6c1e7c33?w=1600&q=80',
    'can-tho-eco-garden-fruit-farm' => 'https://images.unsplash.com/photo-1555597673-b21d5c935865?w=1600&q=80',
    'can-tho-2d1n-floating-market' => 'https://images.unsplash.com/photo-1528164344705-47542687000d?w=1600&q=80',
    'can-tho-tra-cuong-cooking' => 'https://images.unsplash.com/photo-1563771148872-50643a8b63e6?w=1600&q=80',
    'sapa-mu-cang-chai-rice-terraces' => 'https://images.unsplash.com/photo-1596659868923-d1e0e5d5a0a9?w=1600&q=80',
    'sapa-fansipan-cable-car' => 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&q=80',
    'sapa-cat-cat-ta-phin-homestay' => 'https://images.unsplash.com/photo-1551703599-1df74b0141d5?w=1600&q=80',
    'sapa-tea-hill-ethnic-market' => 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1600&q=80',
];

$insertImg = $pdo->prepare("INSERT IGNORE INTO tour_images (tour_id, url, alt_text, is_cover, sort_order) VALUES (?,?,?,1,1)");
foreach ($tourImages as $slug => $url) {
    if (!isset($tourIdBySlug[$slug])) continue;
    $tourId = $tourIdBySlug[$slug];
    try {
        $insertImg->execute([$tourId, $url, $slug]);
        echo "Image: $slug\n";
    } catch (Exception $e) {}
}

// ============================================================
// 5. TOUR ITINERARY
// ============================================================
$itineraries = [
    'ha-noi-city-tour-old-quarter' => [
        [1, 'Hanoi Old Quarter walking', 'Sang di bo qua cac pho cu Ha Noi, tham cho, thuong thuc pho va cac dac sac duong pho.'],
        [1, 'Ho Chi Minh Complex & One Pillar Pagoda', 'Tham Khu di tich Chu tich Ho Chi Minh, Bao tang va Den Mot Cot buoi chieu.'],
    ],
    'ha-noi-ninh-binh-trang-an' => [
        [1, 'Trang An boat ride', 'Thuyen nho cheo qua hang dong Trang An, ngam canh nui non hung vi.'],
        [2, 'Hoa Lu ancient capital & Bai Dinh pagoda', 'Tham Kinh do cu Hoa Lu va chua Bai Dinh - ngoi chua co nhieu ky luc nhat Viet Nam.'],
    ],
    'ha-noi-street-food-tour' => [
        [1, 'Pho and Old Quarter food stops', 'Bat dau bang pho bo sang som, di bo qua cac con hem, thu banh cuon va ca phe trung.'],
    ],
    'ha-noi-sapa-fansipan-adventure' => [
        [1, 'Limousine to Sapa & Village walk', 'Xe limousine tu Ha Noi den Sapa, di bo tham ban lang Hmong va Dao.'],
        [2, 'Fansipan summit trek', 'Trekking dinh Fansipan 3143m, ngam view toan canh dai Hoang Lien Son.'],
    ],
    'ha-noi-cooking-class' => [
        [1, 'Market visit & cooking 5 dishes', 'Di cho Dong Xuan, hoc nau 5 mon an Viet Nam truyen thong voi dau be ban dia.'],
    ],
    'ha-noi-water-puppet-thang-long' => [
        [1, 'Water puppet show & Thang Long citadel', 'Xem mua roi nuoc truyen thong va tham quan Hoang thanh Thang Long.'],
    ],
    'da-nang-ba-na-hills-day-trip' => [
        [1, 'Ba Na Hills & Golden Bridge', 'Di cap treo len Ba Na, check-in Cau Vang, tham Lang Phap va vuon hoa Le Jardin d\'Amour.'],
    ],
    'da-nang-son-tra-marble-mountain-hoi-an' => [
        [1, 'Son Tra - Marble Mountain - Hoi An', 'Sang tham Son Tra va Ngu Hanh Son, chieu den Hoi An ngam den long ve dem.'],
    ],
    'da-nang-cu-lao-cham-snorkeling' => [
        [1, 'Speedboat & snorkeling session', 'Tau cao toc ra Cu Lao Cham, lop snorkel tai ran san ho va bua trua hai san.'],
    ],
    'da-nang-food-tour-by-night' => [
        [1, 'Night food route in city center', 'Di bo qua cac con hem, thuong thuc cac mon dac trung Da Nang voi guide dia phuong.'],
    ],
    'da-nang-hai-van-pass-lang-co' => [
        [1, 'Hai Van Pass & Lang Co Lagoon', 'Vuot deo Hai Van, ngam dam Lap Dinh va bai bien Lang Co.'],
    ],
    'da-nang-family-water-park-beach' => [
        [1, 'Asia Park & Beach fun', 'Sang choi Asia Park cong vien nuoc, chieu tam bien My Khe.'],
    ],
    'nha-trang-con-se-tre-island-hopping' => [
        [1, 'Island hopping by speedboat', 'Tham 4 dao: Hon Mun snorkel, Hon Mot boi, Hon Tranh thu gian.'],
    ],
    'nha-trang-snorkeling-diving' => [
        [1, 'Snorkeling and diving at Hon Mun', 'Hai diem lop snorkel voi huan luyen vien chuyen nghiep. Chup anh duoi nuoc.'],
    ],
    'nha-trang-ba-ho-waterfall-hiking' => [
        [1, 'Ba Ho waterfall trekking', 'Trekking qua rung nhiet doi, boi suoi va ngam thac Ba Ho 3 tang.'],
    ],
    'nha-trang-mud-bath-relaxation' => [
        [1, 'Mud bath & thermal spring', 'Tam bun khoang, thu gian suoi nuoc nong va massage spa.'],
    ],
    'nha-trang-fish-market-cooking' => [
        [1, 'Fish market & cooking class', 'Di cho hai san tu sang som, hoc nau cac mon hai san Nha Trang dac trung.'],
    ],
    'phu-quoc-3-islands-snorkeling' => [
        [1, '3 islands by speedboat', 'Tham Hon Gammala lop snorkel, Hon May Rut boi, Hon Thom cau ca hoang hon.'],
    ],
    'phu-quoc-island-exploration' => [
        [1, 'Phu Quoc by motorbike', 'Tour xe may ca ngay: Safari, truong tieu, xi nghiep nuoc mam va bai Sao.'],
    ],
    'phu-quoc-night-market-food-tour' => [
        [1, 'Night market food walk', 'Di bo kham pha cho dem Dinh Cau voi du loai hai san tuoi song.'],
    ],
    'phu-quoc-sunset-romantic-cruise' => [
        [1, 'Sunset cruise with champagne', 'Tau ra bien ngam hoang hon voi champagne va hai san nuong tren tau.'],
    ],
    'hcm-cu-chi-tunnels-half-day' => [
        [1, 'Cu Chi tunnels exploration', 'Tham duong ham Cu Chi, hoc ve chien tranh va bo qua cac doan duong ham.'],
    ],
    'mekong-delta-2-days-1-night' => [
        [1, 'Ben Tre - Coconut candy workshop', 'Sang tham xuong keo dua, thuyen cheo kenh, tham gia dinh dia phuong.'],
        [2, 'Can Tho floating market', 'Sang tham cho noi Cai Rang, thuong thuc trai cay nhiet doi, ve HCM buoi chieu.'],
    ],
    'hcm-street-food-tour-by-night' => [
        [1, 'Saigon evening food walk', 'Di bo toi qua Quan 1, thu banh mi, com tam, bun thit nuong va sinh to.'],
    ],
    'hcm-city-tour-notre-dame-war-remnants' => [
        [1, 'HCMC highlights tour', 'Tham Nha thu Duc Ba, Buu dien Sai Gon, Bao tang Chung tich chien tranh.'],
    ],
    'mekong-delta-day-trip-ben-tre' => [
        [1, 'Ben Tre coconut canals', 'Thuyen cheo qua kenh dua Ben Tre, tham lang nghe va thuong thuc trai cay mien Tay.'],
    ],
    'da-lat-city-tour-valley-pagoda' => [
        [1, 'Da Lat highlights tour', 'Tham diem view thung lung, Crazy House, chua Linh Phuoc va thac Datanla.'],
    ],
    'da-lat-coffee-tea-workshop' => [
        [1, 'Coffee and tea workshop', 'Hai ca phe, xem rang ca phe, lam banh mi Phap va thuong tra Da Lat.'],
    ],
    'da-lat-lang-biang-sunrise-trek' => [
        [1, 'Lang Biang sunrise trek', 'Khoi hanh luc 3h sang, trek len dinh Lang Biang ngam binh minh toan canh Da Lat.'],
    ],
    'da-lat-flower-tea-plantation' => [
        [1, 'Flower garden & tea plantation', 'Tham vuon hoa day mau sac, tra Moc Lan va ho Tuyen Lam.'],
    ],
    'hoi-an-ancient-town-walking-tour' => [
        [1, 'Hoi An ancient town night walk', 'Di bo pho cu Hoi An ve dem voi den long rue ro, tham chua Cau va hoi quan.'],
    ],
    'hoi-an-cooking-class' => [
        [1, 'Market visit & cooking class', 'Di cho Hoi An, hoc lam banh xeo, nau pho va 3 mon dac trung khac.'],
    ],
    'hoi-an-my-son-sanctuary' => [
        [1, 'My Son sanctuary', 'Tham quan the di tich Cham Pa My Son, xem trinh dien am nhac truyen thong.'],
    ],
    'hoi-an-fishing-lantern-making' => [
        [1, 'Fishing & lantern making', 'Trai nghiem danh ca kieu ngu dan, lam den long giay truyen thong va thuyen thung.'],
    ],
    'hue-imperial-citadel-full-day' => [
        [1, 'Imperial City and royal tombs', 'Sang tham Dai Noi Hue, truong chua Thien Mu, chieu lang Tu Duc va Khai Dinh.'],
    ],
    'hue-dmz-day-trip' => [
        [1, 'DMZ historical route', 'Tham duong ham Vinh Moc, can cu Khe Sanh, deo Hai Van va song Ben Hai.'],
    ],
    'hue-garden-house-perfume-river' => [
        [1, 'Garden houses & Perfume River', 'Tham cac biet thu vuon Hue doc dao, thuyen tren song Huong va cho Dong Ba.'],
    ],
    'hue-royal-cuisine-conical-hat' => [
        [1, 'Royal cuisine & conical hat', 'Thuong thuc am thuc cung dinh Hue, hoc lam non la truyen thong.'],
    ],
    'vung-tau-beach-day-trip' => [
        [1, 'Vung Tau beach & sightseeing', 'Tham bai Sau, thap sat, nui Nho va tuong Chua giang tay.'],
    ],
    'vung-tau-con-dao-speedboat' => [
        [1, 'Con Dao speedboat & history', 'Tau cao toc ra Con Dao, tham nha tu va mo liet si tren dao.'],
    ],
    'vung-tau-seafood-lighthouse-tour' => [
        [1, 'Seafood & lighthouse walk', 'Thuong thuc hai san tuoi song va tham ngoan hai dang noi tieng Vung Tau.'],
    ],
    'vung-tau-sunset-relaxation' => [
        [1, 'Sunset & beach relaxation', 'Nghi duong tai bai bien, ngam hoang hon va tan huong massage bien.'],
    ],
    'ha-long-bay-2d1n-cruise' => [
        [1, 'Ha Long Bay cruise boarding', 'Len tau, bua trua buffet, tham hang Sung Sua, kayak tai hang Luong.'],
        [2, 'Tai Chi and kayaking', 'Tap thai cuc sang, kayak dao Ti Top, an trua, ve Ha Noi.'],
    ],
    'ha-long-bay-kayaking-day-trip' => [
        [1, 'Ha Long kayaking & island visit', 'Kayak qua hang, tam bien va tham dao Tuan Chau.'],
    ],
    'ha-long-bay-3d2n-premium-cruise' => [
        [1, 'Ha Long Bay - Day 1', 'Len tau, bua trua, tham hang Sung Sua, kayak, tiet hoang hon, cau muc dem.'],
        [2, 'Ha Long Bay - Day 2', 'Tap thai cuc, kayak, tham lang chai, boi bien, cau muc dem.'],
        [3, 'Ha Long Bay - Day 3', 'Tap thai cuc buoi sang, an trua, ve Ha Noi buoi chieu.'],
    ],
    'ha-long-yen-tu-pilgrimage' => [
        [1, 'Yen Tu Buddhist pilgrimage', 'Cap treo len nui Yen Tu, tham chua vang, ngam view va thien dinh.'],
    ],
    'can-tho-cai-rang-floating-market' => [
        [1, 'Cai Rang floating market', 'Khoi hanh som 5h, thuyen thung qua cho noi Cai Rang, thuong thuc bua sang tren thuyen.'],
    ],
    'can-tho-eco-garden-fruit-farm' => [
        [1, 'Eco garden & fruit farm', 'Tham vuon sinh thai, hai trai cay nhiet doi va thuyen cheo qua kenh.'],
    ],
    'can-tho-2d1n-floating-market' => [
        [1, 'Cai Rang & village crafts', 'Tham cho noi Cai Rang, lang nghe truyen thong va homestay mien Tay.'],
        [2, 'Phong Dien floating market', 'Tham cho noi Phong Dien, vuon trai cay va ve Can Tho.'],
    ],
    'can-tho-tra-cuong-cooking' => [
        [1, 'Tra Cuong rice paper & cooking', 'Tham lang nghe banh trang Tra Cuong, hoc lam banh trang va nau mon mien Tay.'],
    ],
    'sapa-mu-cang-chai-rice-terraces' => [
        [1, 'Limousine to Sapa & village trek', 'Xe limousine Ha Noi - Sapa, di bo tham ban lang Hmong, ngam ruong bac thang.'],
        [2, 'Mu Cang Chai rice terraces trek', 'Trekking qua ruong bac thang Mu Cang Chai, tham ban nguoi Hmong va Dao, ve Ha Noi.'],
    ],
    'sapa-fansipan-cable-car' => [
        [1, 'Fansipan cable car summit', 'Cap treo len dinh Fansipan, leo bac thang cuoi cung, chua vang va view dinh nui.'],
    ],
    'sapa-cat-cat-ta-phin-homestay' => [
        [1, 'Cat Cat & Ta Phin village', 'Tham ban Cat Cat va Ta Phin, hoc det vai, o homestay va thuong thuc am thuc nui rung.'],
        [2, 'Ta Phin cave & hot spring', 'Tham hang Ta Phin, tam suoi nuoc nong va ve Sapa.'],
    ],
    'sapa-tea-hill-ethnic-market' => [
        [1, 'Tea hill & ethnic market', 'Tham doi che Sapa, thac Bac, thung lung Muong Hoa va cho phien cuoi tuan.'],
    ],
];

$maxItinId = (int)$pdo->query("SELECT COALESCE(MAX(id), 0) FROM tour_itinerary")->fetchColumn();
$insertItin = $pdo->prepare("INSERT IGNORE INTO tour_itinerary (id, tour_id, day_number, title, description) VALUES (?,?,?,?,?)");
foreach ($itineraries as $slug => $items) {
    if (!isset($tourIdBySlug[$slug])) continue;
    $tourId = $tourIdBySlug[$slug];
    foreach ($items as $item) {
        $maxItinId++;
        try {
            $insertItin->execute([$maxItinId, $tourId, $item[0], $item[1], $item[2]]);
        } catch (Exception $e) {}
    }
}
echo "Itinerary done.\n";

// ============================================================
// 6. TOUR DEPARTURES
// ============================================================
$maxDepId = (int)$pdo->query("SELECT COALESCE(MAX(id), 0) FROM tour_departures")->fetchColumn();
$insertDep = $pdo->prepare("INSERT IGNORE INTO tour_departures (id, tour_id, departure_date, available_slots, price_override) VALUES (?,?,?,?,?)");

$departures = [
    // [slug, days_from_now, slots, price_override]
    'ha-noi-city-tour-old-quarter' => [[3, 15, null], [8, 13, null]],
    'ha-noi-ninh-binh-trang-an' => [[5, 12, null], [12, 10, 1100000]],
    'ha-noi-street-food-tour' => [[1, 8, null], [4, 7, null]],
    'ha-noi-sapa-fansipan-adventure' => [[7, 8, null], [14, 6, 2400000]],
    'ha-noi-cooking-class' => [[2, 6, null], [6, 5, 1200000]],
    'ha-noi-water-puppet-thang-long' => [[3, 10, null], [7, 8, null]],
    'da-nang-ba-na-hills-day-trip' => [[3, 18, null], [7, 16, 1250000]],
    'da-nang-son-tra-marble-mountain-hoi-an' => [[5, 14, null], [9, 12, null]],
    'da-nang-cu-lao-cham-snorkeling' => [[4, 10, null], [11, 8, 1090000]],
    'da-nang-food-tour-by-night' => [[2, 12, null], [6, 10, null]],
    'da-nang-hai-van-pass-lang-co' => [[5, 10, null], [12, 8, null]],
    'da-nang-family-water-park-beach' => [[3, 14, null], [8, 12, null]],
    'nha-trang-con-se-tre-island-hopping' => [[2, 18, null], [6, 15, null]],
    'nha-trang-snorkeling-diving' => [[4, 10, null], [9, 8, 1300000]],
    'nha-trang-ba-ho-waterfall-hiking' => [[3, 8, null], [8, 6, null]],
    'nha-trang-mud-bath-relaxation' => [[2, 10, null], [5, 8, 1150000]],
    'nha-trang-fish-market-cooking' => [[3, 8, null], [7, 6, null]],
    'phu-quoc-3-islands-snorkeling' => [[3, 14, null], [7, 12, null]],
    'phu-quoc-island-exploration' => [[5, 10, null], [11, 8, 1300000]],
    'phu-quoc-night-market-food-tour' => [[1, 10, null], [4, 8, null]],
    'phu-quoc-sunset-romantic-cruise' => [[2, 6, null], [6, 5, 1800000]],
    'hcm-cu-chi-tunnels-half-day' => [[2, 15, null], [5, 12, null]],
    'mekong-delta-2-days-1-night' => [[3, 10, null], [8, 8, 1850000]],
    'hcm-street-food-tour-by-night' => [[1, 10, null], [4, 8, null]],
    'hcm-city-tour-notre-dame-war-remnants' => [[3, 12, null], [7, 10, null]],
    'mekong-delta-day-trip-ben-tre' => [[2, 10, null], [6, 8, null]],
    'da-lat-city-tour-valley-pagoda' => [[2, 12, null], [6, 10, null]],
    'da-lat-coffee-tea-workshop' => [[3, 8, null], [7, 6, 920000]],
    'da-lat-lang-biang-sunrise-trek' => [[4, 6, null], [9, 5, null]],
    'da-lat-flower-tea-plantation' => [[3, 10, null], [8, 8, null]],
    'hoi-an-ancient-town-walking-tour' => [[1, 10, null], [4, 8, null]],
    'hoi-an-cooking-class' => [[2, 8, null], [6, 6, 1100000]],
    'hoi-an-my-son-sanctuary' => [[3, 12, null], [7, 10, null]],
    'hoi-an-fishing-lantern-making' => [[2, 8, null], [5, 6, null]],
    'hue-imperial-citadel-full-day' => [[4, 12, null], [9, 10, null]],
    'hue-dmz-day-trip' => [[5, 10, null], [10, 8, 1200000]],
    'hue-garden-house-perfume-river' => [[3, 8, null], [7, 6, null]],
    'hue-royal-cuisine-conical-hat' => [[4, 6, null], [8, 5, null]],
    'vung-tau-beach-day-trip' => [[2, 15, null], [5, 12, null]],
    'vung-tau-con-dao-speedboat' => [[7, 10, null], [14, 8, 1800000]],
    'vung-tau-seafood-lighthouse-tour' => [[1, 10, null], [4, 8, null]],
    'vung-tau-sunset-relaxation' => [[3, 10, null], [6, 8, null]],
    'ha-long-bay-2d1n-cruise' => [[4, 20, null], [9, 18, 2450000]],
    'ha-long-bay-kayaking-day-trip' => [[3, 15, null], [8, 12, 1800000]],
    'ha-long-bay-3d2n-premium-cruise' => [[5, 15, null], [12, 12, 4100000]],
    'ha-long-yen-tu-pilgrimage' => [[4, 10, null], [9, 8, null]],
    'can-tho-cai-rang-floating-market' => [[2, 10, null], [5, 8, null]],
    'can-tho-eco-garden-fruit-farm' => [[3, 8, null], [7, 6, null]],
    'can-tho-2d1n-floating-market' => [[4, 8, null], [9, 6, 1400000]],
    'can-tho-tra-cuong-cooking' => [[3, 8, null], [6, 6, null]],
    'sapa-mu-cang-chai-rice-terraces' => [[7, 6, null], [14, 5, 2150000]],
    'sapa-fansipan-cable-car' => [[3, 10, null], [8, 8, 1800000]],
    'sapa-cat-cat-ta-phin-homestay' => [[5, 6, null], [12, 5, null]],
    'sapa-tea-hill-ethnic-market' => [[4, 8, null], [10, 6, null]],
];

foreach ($departures as $slug => $items) {
    if (!isset($tourIdBySlug[$slug])) continue;
    $tourId = $tourIdBySlug[$slug];
    foreach ($items as $dep) {
        $maxDepId++;
        $depDate = date('Y-m-d', strtotime("+{$dep[0]} days"));
        try {
            $insertDep->execute([$maxDepId, $tourId, $depDate, $dep[1], $dep[2]]);
        } catch (Exception $e) {}
    }
}
echo "Departures done.\n";

$pdo->exec("SET FOREIGN_KEY_CHECKS = 1");

// Final counts
$counts = $pdo->query("
    SELECT 'Tours' as item, COUNT(*) as cnt FROM tours WHERE is_active = TRUE
    UNION ALL SELECT 'Tour Images', COUNT(*) FROM tour_images
    UNION ALL SELECT 'Itinerary Items', COUNT(*) FROM tour_itinerary
    UNION ALL SELECT 'Tour Departures', COUNT(*) FROM tour_departures
")->fetchAll(PDO::FETCH_ASSOC);

echo "\n=== FINAL COUNTS ===\n";
foreach ($counts as $row) {
    echo $row['item'] . ': ' . $row['cnt'] . "\n";
}
echo "\nDONE!\n";
