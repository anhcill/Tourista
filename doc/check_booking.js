// Test tra cứu booking TRS-20260506-50188
// Chạy: node check_booking.js <access_token>

const TOKEN = process.argv[2];
const API_BASE = "https://tourista-production.up.railway.app";

async function test() {
    if (!TOKEN) {
        console.log("Usage: node check_booking.js <access_token>");
        console.log("\nLấy token từ localStorage của browser (key: accessToken)");
        return;
    }

    console.log("=== Test tra cứu booking TRS-20260506-50188 ===\n");

    // 1. Test /api/chat/message endpoint
    console.log("1. Gọi POST /api/chat/message...");
    try {
        const res = await fetch(`${API_BASE}/api/chat/message`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${TOKEN}`
            },
            body: JSON.stringify({
                message: "tra cứu TRS-20260506-50188"
            })
        });
        const data = await res.json();
        console.log("Status:", res.status);
        console.log("Response:", JSON.stringify(data, null, 2));
    } catch (e) {
        console.log("Error:", e.message);
    }

    console.log("\n---\n");

    // 2. Test /api/chat/booking endpoint trực tiếp
    console.log("2. Gọi GET /api/chat/booking?code=TRS-20260506-50188...");
    try {
        const res = await fetch(`${API_BASE}/api/chat/booking?code=TRS-20260506-50188`, {
            headers: {
                "Authorization": `Bearer ${TOKEN}`
            }
        });
        const data = await res.json();
        console.log("Status:", res.status);
        console.log("Response:", JSON.stringify(data, null, 2));
    } catch (e) {
        console.log("Error:", e.message);
    }

    console.log("\n---\n");

    // 3. Test auth/me để kiểm tra token có valid không
    console.log("3. Gọi GET /api/auth/me để kiểm tra token...");
    try {
        const res = await fetch(`${API_BASE}/api/auth/me`, {
            headers: {
                "Authorization": `Bearer ${TOKEN}`
            }
        });
        const data = await res.json();
        console.log("Status:", res.status);
        console.log("Response:", JSON.stringify(data, null, 2));
    } catch (e) {
        console.log("Error:", e.message);
    }
}

test();
