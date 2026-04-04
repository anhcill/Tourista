"""
TOURISTA - Import CSV hotels/reviews vào bảng staging
======================================================
Chạy: python import_csv_to_staging.py

Cài thư viện (nếu chưa có):
    pip install pymysql
"""

import csv
import pymysql
import sys
import os

# ─────────────────────────────────────────────
#  CẤU HÌNH - chỉnh cho khớp với máy bạn
# ─────────────────────────────────────────────
DB_HOST     = "localhost"
DB_PORT     = 3306
DB_USER     = "root"
DB_PASSWORD = "28072003"          # << đổi nếu khác
DB_NAME     = "tourista"

# Đường dẫn file CSV
CSV_PATH = r"C:\Users\ducan\Downloads\hotels_users_ratings.csv"

# Encoding của file CSV (thử utf-8 trước, nếu lỗi đổi thành utf-8-sig hoặc latin-1)
CSV_ENCODING = "utf-8"
# ─────────────────────────────────────────────


def connect():
    return pymysql.connect(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME,
        charset="utf8mb4",
        autocommit=False,
    )


def recreate_staging(conn):
    with conn.cursor() as cur:
        cur.execute("DROP TABLE IF EXISTS stg_hotels_reviews_csv")
        cur.execute("""
            CREATE TABLE stg_hotels_reviews_csv (
                row_no            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
                url_hotel         VARCHAR(800),
                location_raw      VARCHAR(200),
                hotel_source_id   BIGINT,
                hotel_name        VARCHAR(255),
                hotel_description TEXT,
                hotel_address     VARCHAR(500),
                user_source_id    BIGINT,
                user_name         VARCHAR(150),
                rating_raw        DECIMAL(4,2),
                PRIMARY KEY (row_no),
                INDEX idx_hotel_src (hotel_source_id),
                INDEX idx_user_src  (user_source_id),
                INDEX idx_location  (location_raw(100))
            ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
        """)
    conn.commit()
    print("✅ Đã tạo bảng staging stg_hotels_reviews_csv")


def to_int(val):
    """Chuyển chuỗi → int, trả None nếu rỗng/lỗi."""
    try:
        return int(str(val).strip()) if str(val).strip() else None
    except (ValueError, TypeError):
        return None


def to_float(val):
    """Chuyển chuỗi → float, trả None nếu rỗng/lỗi."""
    try:
        return float(str(val).strip()) if str(val).strip() else None
    except (ValueError, TypeError):
        return None


def clean(val):
    """Trim whitespace, trả None nếu rỗng."""
    v = str(val).strip() if val is not None else ""
    return v if v else None


def import_csv(conn, csv_path):
    """Đọc CSV và bulk-insert theo batch 500 dòng."""
    SQL = """
        INSERT INTO stg_hotels_reviews_csv
            (url_hotel, location_raw, hotel_source_id, hotel_name,
             hotel_description, hotel_address, user_source_id, user_name, rating_raw)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
    """

    if not os.path.exists(csv_path):
        print(f"❌ Không tìm thấy file CSV: {csv_path}")
        sys.exit(1)

    total   = 0
    errors  = 0
    batch   = []
    BATCH_SIZE = 500

    print(f"📂 Đang đọc: {csv_path}")

    # Thử utf-8, nếu lỗi tự động fallback sang utf-8-sig rồi latin-1
    encodings = [CSV_ENCODING, "utf-8-sig", "latin-1", "cp1252"]
    f = None
    used_encoding = None

    for enc in encodings:
        try:
            f = open(csv_path, encoding=enc, errors="strict", newline="")
            # Đọc thử 1 dòng để kiểm tra encoding
            f.readline()
            f.seek(0)
            used_encoding = enc
            break
        except (UnicodeDecodeError, LookupError):
            if f:
                f.close()
            f = None

    if f is None:
        # Fallback cuối: ignore lỗi ký tự
        f = open(csv_path, encoding="utf-8", errors="replace", newline="")
        used_encoding = "utf-8 (replace errors)"

    print(f"🔤 Encoding dùng: {used_encoding}")

    reader = csv.DictReader(f)

    # In tên cột để debug
    print(f"📋 Cột trong CSV: {reader.fieldnames}")

    # Map tên cột linh hoạt (tránh lỗi khoảng trắng / hoa thường)
    col_map = {}
    field_lower = {c.lower().strip(): c for c in (reader.fieldnames or [])}

    mappings = {
        "url_hotel":         ["url hotel", "url_hotel", "url"],
        "location_raw":      ["location"],
        "hotel_source_id":   ["hotelid", "hotel_id", "hotel id"],
        "hotel_name":        ["name hotel", "hotel_name", "name"],
        "hotel_description": ["descriptions", "description"],
        "hotel_address":     ["address"],
        "user_source_id":    ["userid", "user_id", "user id"],
        "user_name":         ["user", "user_name", "username"],
        "rating_raw":        ["rating"],
    }

    for target, candidates in mappings.items():
        for cand in candidates:
            if cand in field_lower:
                col_map[target] = field_lower[cand]
                break

    missing = [t for t in mappings if t not in col_map]
    if missing:
        print(f"⚠️  Không map được cột: {missing}")
        print("   Kiểm tra lại tên cột trong CSV và chỉnh mappings trong script")

    print(f"🗂️  Map cột: {col_map}\n")

    with conn.cursor() as cur:
        for i, row in enumerate(reader, start=1):
            try:
                record = (
                    clean(row.get(col_map.get("url_hotel", ""), "")),
                    clean(row.get(col_map.get("location_raw", ""), "")),
                    to_int(row.get(col_map.get("hotel_source_id", ""), "")),
                    clean(row.get(col_map.get("hotel_name", ""), "")),
                    clean(row.get(col_map.get("hotel_description", ""), "")),
                    clean(row.get(col_map.get("hotel_address", ""), "")),
                    to_int(row.get(col_map.get("user_source_id", ""), "")),
                    clean(row.get(col_map.get("user_name", ""), "")),
                    to_float(row.get(col_map.get("rating_raw", ""), "")),
                )
                batch.append(record)
                total += 1
            except Exception as e:
                errors += 1
                if errors <= 5:
                    print(f"  ⚠️  Dòng {i} lỗi: {e} | data={dict(row)}")
                continue

            if len(batch) >= BATCH_SIZE:
                cur.executemany(SQL, batch)
                conn.commit()
                batch = []
                print(f"  ... đã insert {total} dòng", end="\r")

        # Insert batch cuối
        if batch:
            cur.executemany(SQL, batch)
            conn.commit()

    f.close()
    print(f"\n✅ Import xong! Tổng: {total} dòng | Lỗi bỏ qua: {errors} dòng")
    return total


def verify(conn):
    with conn.cursor() as cur:
        cur.execute("SELECT COUNT(*) FROM stg_hotels_reviews_csv")
        count = cur.fetchone()[0]
        print(f"🔍 Kiểm tra: stg_hotels_reviews_csv có {count} dòng")

        cur.execute("SELECT * FROM stg_hotels_reviews_csv LIMIT 3")
        rows = cur.fetchall()
        print("📄 Mẫu 3 dòng đầu:")
        for r in rows:
            print(" ", r)

        cur.execute("""
            SELECT DISTINCT location_raw, COUNT(*) AS n
            FROM stg_hotels_reviews_csv
            GROUP BY location_raw
            ORDER BY n DESC
            LIMIT 10
        """)
        locs = cur.fetchall()
        print("\n📍 Top 10 location trong CSV:")
        for loc, n in locs:
            print(f"   {loc!r:30s} → {n} dòng")


if __name__ == "__main__":
    print("=" * 55)
    print("  TOURISTA - Import CSV vào staging")
    print("=" * 55)

    conn = None
    try:
        conn = connect()
        print(f"🔗 Đã kết nối MySQL: {DB_HOST}:{DB_PORT}/{DB_NAME}\n")

        recreate_staging(conn)
        count = import_csv(conn, CSV_PATH)

        if count > 0:
            verify(conn)
            print("\n✅ XONG! Giờ chạy tiếp import_hotels_reviews_fixed.sql")
            print("   từ 'BƯỚC 4: Chuẩn hóa dữ liệu' trở đi.")
        else:
            print("❌ Không có dòng nào được import!")

    except pymysql.err.OperationalError as e:
        print(f"❌ Lỗi kết nối MySQL: {e}")
        print("   Kiểm tra DB_HOST, DB_PORT, DB_USER, DB_PASSWORD trong script")
    except Exception as e:
        print(f"❌ Lỗi: {e}")
        import traceback
        traceback.print_exc()
    finally:
        if conn:
            conn.close()
